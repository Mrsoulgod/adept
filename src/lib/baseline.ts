import type { DoseLog, Medication, MealAnchor } from './types';
import { MEAL_ANCHORS } from './types';

export interface MedicationBaseline {
  medicationId: string;
  medicationName: string;
  mealAnchor: MealAnchor;
  usualTimeString: string;     // e.g. "08:15 AM"
  usualTimeMinutes: number;    // e.g. 495 (8 * 60 + 15)
  normalRangeStartString: string; // e.g. "07:45 AM"
  normalRangeEndString: string;   // e.g. "08:45 AM"
  windowLabel: string;
  sampleSize: number;
  adherencePercentage: number;
  consecutiveSkips: number;
}

export type DeviationClassification = 'normal_for_dad' | 'unusual';

export interface TimelineDoseEvent {
  id: string;
  medicationId: string;
  medicationName: string;
  mealAnchor: MealAnchor;
  dateStr: string;
  actualTimeString?: string;
  actualTimeMinutes?: number;
  usualTimeString: string;
  classification: DeviationClassification;
  deviationReason?: string;
  status: 'taken' | 'deferred' | 'skipped_comfortably' | 'pending';
  comfortNote?: string;
  notes?: string;
}

/**
 * Parses ISO timestamp or time string into minutes from midnight (0 to 1439).
 * Preserves the elder's local recorded wall-clock time in ISO strings (e.g. 08:25)
 * regardless of host machine timezone.
 */
export function timeStringToMinutes(timeOrIso: string): number {
  if (!timeOrIso) return 0;
  if (timeOrIso.includes('T')) {
    const timePart = timeOrIso.split('T')[1];
    const parts = timePart.split(':');
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    return hours * 60 + mins;
  }
  const parts = timeOrIso.split(':');
  const hours = parseInt(parts[0], 10);
  const mins = parseInt(parts[1], 10);
  return hours * 60 + mins;
}

/**
 * Formats minutes from midnight into 12-hour AM/PM string
 */
export function minutesToTimeString(minutes: number): string {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(norm / 60);
  const mins = norm % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const mStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${h12}:${mStr} ${ampm}`;
}

/**
 * Computes each elder's personal usual dose-time per medication from historical dose_logs
 */
export function computePersonalBaselines(
  medications: Medication[],
  doseLogs: DoseLog[]
): Record<string, MedicationBaseline> {
  const baselines: Record<string, MedicationBaseline> = {};

  for (const med of medications) {
    // Look at logs for this specific medication where status was 'taken'
    const medLogs = doseLogs.filter((l) => l.medicationId === med.id && l.status === 'taken' && l.loggedAt);

    let usualMinutes = 0;
    if (medLogs.length > 0) {
      const totalMinutes = medLogs.reduce((acc, log) => {
        return acc + timeStringToMinutes(log.loggedAt!);
      }, 0);
      usualMinutes = Math.round(totalMinutes / medLogs.length);
    } else {
      // Default to midpoint of meal anchor window
      const anchorConfig = MEAL_ANCHORS[med.mealAnchor];
      const startMin = timeStringToMinutes(anchorConfig.defaultWindowStart);
      const endMin = timeStringToMinutes(anchorConfig.defaultWindowEnd);
      usualMinutes = Math.round((startMin + endMin) / 2);
    }

    // Normal expected personal variance is ±35 minutes around Dad's usual rhythm
    const rangeStart = Math.max(0, usualMinutes - 35);
    const rangeEnd = Math.min(1439, usualMinutes + 35);

    // Check consecutive skips
    const sortedLogs = doseLogs
      .filter((l) => l.medicationId === med.id)
      .sort((a, b) => (b.date > a.date ? 1 : -1));

    let skips = 0;
    for (const log of sortedLogs) {
      if (log.status === 'skipped_comfortably') {
        skips++;
      } else {
        break;
      }
    }

    const takenCount = medLogs.length;
    const totalCount = doseLogs.filter((l) => l.medicationId === med.id).length || 1;

    baselines[med.id] = {
      medicationId: med.id,
      medicationName: med.friendlyName || med.name,
      mealAnchor: med.mealAnchor,
      usualTimeString: minutesToTimeString(usualMinutes),
      usualTimeMinutes: usualMinutes,
      normalRangeStartString: minutesToTimeString(rangeStart),
      normalRangeEndString: minutesToTimeString(rangeEnd),
      windowLabel: MEAL_ANCHORS[med.mealAnchor].windowLabel,
      sampleSize: medLogs.length,
      adherencePercentage: Math.round((takenCount / totalCount) * 100),
      consecutiveSkips: skips,
    };
  }

  return baselines;
}

/**
 * Evaluates whether an event or current state is "Normal for Dad" vs "Unusual"
 * Rule: Alert caretakers ONLY when behaviour deviates from baseline:
 *  1. Late by > 60 minutes beyond personal baseline
 *  2. No response after window has completely elapsed
 *  3. Repeated skips (2+ consecutive skips)
 */
export function classifyDoseBehaviour(params: {
  medication: Medication;
  baseline: MedicationBaseline;
  log?: DoseLog;
  currentHourMinutes?: number;
}): {
  classification: DeviationClassification;
  reason: string;
  shouldAlertCaretaker: boolean;
} {
  const { baseline, log, currentHourMinutes } = params;

  // Case A: A dose was taken
  if (log && log.status === 'taken' && log.loggedAt) {
    const actualMinutes = timeStringToMinutes(log.loggedAt);
    const diffMinutes = Math.abs(actualMinutes - baseline.usualTimeMinutes);

    // If within 60 minutes of Arthur's personal rhythm -> Normal
    if (diffMinutes <= 60) {
      return {
        classification: 'normal_for_dad',
        reason: `Taken at ${minutesToTimeString(actualMinutes)}, within Arthur's typical rhythm (${baseline.usualTimeString} ± 35m).`,
        shouldAlertCaretaker: false,
      };
    } else {
      // Late by > 60 mins -> Unusual
      const delta = actualMinutes - baseline.usualTimeMinutes;
      const isLate = delta > 0;
      return {
        classification: 'unusual',
        reason: isLate
          ? `Taken at ${minutesToTimeString(actualMinutes)} (${Math.abs(delta)} mins later than Arthur's usual ${baseline.usualTimeString}).`
          : `Taken at ${minutesToTimeString(actualMinutes)} (${Math.abs(delta)} mins earlier than Arthur's usual ${baseline.usualTimeString}).`,
        shouldAlertCaretaker: true,
      };
    }
  }

  // Case B: Consecutive skips
  if (baseline.consecutiveSkips >= 2) {
    return {
      classification: 'unusual',
      reason: `Repeated skips detected: ${baseline.consecutiveSkips} consecutive skips across recent days.`,
      shouldAlertCaretaker: true,
    };
  }

  // Case C: Dose is currently pending
  if (currentHourMinutes !== undefined) {
    const minutesPastUsual = currentHourMinutes - baseline.usualTimeMinutes;

    // If > 75 minutes past Arthur's usual personal time without log -> Unusual (no response)
    if (minutesPastUsual > 75) {
      return {
        classification: 'unusual',
        reason: `No confirmation logged. Current time is ${Math.round(minutesPastUsual)} mins past Arthur's personal dose time (${baseline.usualTimeString}).`,
        shouldAlertCaretaker: true,
      };
    }
  }

  return {
    classification: 'normal_for_dad',
    reason: `Within Arthur's expected routine (${baseline.usualTimeString}).`,
    shouldAlertCaretaker: false,
  };
}

/**
 * Builds full historical timeline for Caretaker with "normal for Dad" vs "unusual" labels
 */
export function buildCaretakerTimeline(
  medications: Medication[],
  doseLogs: DoseLog[],
  baselines: Record<string, MedicationBaseline>
): TimelineDoseEvent[] {
  const events: TimelineDoseEvent[] = [];

  // Group logs by date and med
  for (const log of doseLogs) {
    const med = medications.find((m) => m.id === log.medicationId);
    if (!med) continue;

    const baseline = baselines[med.id] || {
      usualTimeString: '8:15 AM',
      usualTimeMinutes: 495,
      normalRangeStartString: '7:40 AM',
      normalRangeEndString: '8:50 AM',
      consecutiveSkips: 0,
    };

    let actualTimeString: string | undefined;
    let actualTimeMinutes: number | undefined;

    if (log.loggedAt) {
      actualTimeMinutes = timeStringToMinutes(log.loggedAt);
      actualTimeString = minutesToTimeString(actualTimeMinutes);
    }

    const evaluation = classifyDoseBehaviour({
      medication: med,
      baseline: baseline as any,
      log,
    });

    events.push({
      id: log.id,
      medicationId: med.id,
      medicationName: med.friendlyName || med.name,
      mealAnchor: med.mealAnchor,
      dateStr: log.date,
      actualTimeString,
      actualTimeMinutes,
      usualTimeString: baseline.usualTimeString,
      classification: evaluation.classification,
      deviationReason: evaluation.reason,
      status: log.status,
      comfortNote: log.comfortNote,
      notes: log.notes,
    });
  }

  // Sort descending by date and time
  return events.sort((a, b) => {
    if (a.dateStr !== b.dateStr) return b.dateStr.localeCompare(a.dateStr);
    return (b.actualTimeMinutes || 0) - (a.actualTimeMinutes || 0);
  });
}
