import type { Medication, StockPrediction } from './types';

// Standard upcoming holidays / bank closure days (month is 0-indexed)
interface KnownHoliday {
  name: string;
  month: number; // 0-11
  day: number;
}

const UPCOMING_HOLIDAYS: KnownHoliday[] = [
  { name: 'Thanksgiving Long Weekend', month: 10, day: 26 },
  { name: 'Christmas Holiday Closure', month: 11, day: 25 },
  { name: 'New Year Bank Holiday', month: 0, day: 1 },
  { name: 'Memorial Day Weekend', month: 4, day: 25 },
  { name: 'Labor Day Weekend', month: 8, day: 7 },
];

/**
 * Predicts stock depletion date and checks for weekend/holiday pharmacy closure risk.
 */
export function predictMedicationStockOut(
  med: Medication,
  referenceDate: Date = new Date()
): StockPrediction {
  const stock = med.stockCount !== undefined ? Math.max(0, med.stockCount) : 30;
  const dailyRate = med.dailyDoseUnits || 1;
  const daysRemaining = Math.floor(stock / Math.max(1, dailyRate));

  // Compute stock-out date
  const targetDate = new Date(referenceDate);
  targetDate.setDate(targetDate.getDate() + daysRemaining);

  const month = targetDate.getMonth();
  const dateNum = targetDate.getDate();
  const dayOfWeekNum = targetDate.getDay(); // 0 = Sun, 6 = Sat

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeekStr = daysOfWeek[dayOfWeekNum];
  const dateStr = targetDate.toISOString().split('T')[0];

  // 1. Weekend risk check: runs out on Saturday or Sunday, or Friday evening
  const isWeekendStockOut = dayOfWeekNum === 0 || dayOfWeekNum === 6;

  // Check if upcoming weekend occurs right before depletion
  const refDayOfWeek = referenceDate.getDay();
  const daysToSaturday = (6 - refDayOfWeek + 7) % 7;
  const approachingWeekend = daysRemaining <= daysToSaturday + 1 && daysRemaining <= 5;

  // 2. Holiday risk check
  let isHolidayStockOut = false;
  let holidayName: string | undefined;

  for (const hol of UPCOMING_HOLIDAYS) {
    if (hol.month === month && Math.abs(hol.day - dateNum) <= 2) {
      isHolidayStockOut = true;
      holidayName = hol.name;
      break;
    }
  }

  // 3. Determine Refill Nudge & Severity
  let needsRefillNudge = false;
  let nudgeReason: string | undefined;
  let severity: 'urgent' | 'warning' | 'comfortable' = 'comfortable';

  if (daysRemaining <= 3) {
    needsRefillNudge = true;
    severity = 'urgent';
    if (isWeekendStockOut || approachingWeekend) {
      nudgeReason = `Urgent Refill Nudge: Only ${daysRemaining} days left! Stock will deplete on ${dayOfWeekStr} when your pharmacy has reduced or closed hours. Refill today.`;
    } else if (isHolidayStockOut) {
      nudgeReason = `Urgent Refill Nudge: Only ${daysRemaining} days remaining! Depletion coincides with ${holidayName}. Order refill immediately.`;
    } else {
      nudgeReason = `Urgent Refill Nudge: Only ${daysRemaining} days remaining (${stock} pills left). Request refill now.`;
    }
  } else if (daysRemaining <= 6 && (isWeekendStockOut || approachingWeekend || isHolidayStockOut)) {
    needsRefillNudge = true;
    severity = 'warning';
    if (isWeekendStockOut || approachingWeekend) {
      nudgeReason = `Weekend Refill Nudge: Stock runs out on ${dayOfWeekStr} (${dateStr}). Refill before Friday 5:00 PM to avoid weekend stock-out gaps.`;
    } else {
      nudgeReason = `Holiday Refill Nudge: Approaching ${holidayName}. Order refill ahead of clinic and courier holiday closures.`;
    }
  } else if (daysRemaining <= 7) {
    needsRefillNudge = true;
    severity = 'warning';
    nudgeReason = `Routine Nudge: 1 week of medication remaining (${stock} pills left). Consider refilling this week.`;
  } else {
    severity = 'comfortable';
    needsRefillNudge = false;
  }

  return {
    medicationId: med.id,
    medicationName: med.name,
    friendlyName: med.friendlyName || med.name,
    currentStock: stock,
    dailyRate,
    daysRemaining,
    stockOutDateStr: dateStr,
    stockOutDayOfWeek: dayOfWeekStr,
    isWeekendStockOut: isWeekendStockOut || approachingWeekend,
    isHolidayStockOut,
    holidayName,
    needsRefillNudge,
    nudgeReason,
    severity,
  };
}

/**
 * Predicts stock-out metrics across Arthur's entire active regimen.
 */
export function predictRegimenStockOuts(
  medications: Medication[],
  referenceDate: Date = new Date()
): StockPrediction[] {
  return medications
    .filter((m) => m.isActive)
    .map((med) => predictMedicationStockOut(med, referenceDate))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Returns only medications that require a proactive refill nudge.
 */
export function getActiveRefillNudges(predictions: StockPrediction[]): StockPrediction[] {
  return predictions.filter((p) => p.needsRefillNudge);
}
