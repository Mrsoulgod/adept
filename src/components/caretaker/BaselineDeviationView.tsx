import React, { useState, useMemo } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { MealAnchor } from '../../lib/types';
import { MEAL_ANCHORS } from '../../lib/types';
import {
  computePersonalBaselines,
  buildCaretakerTimeline,
} from '../../lib/baseline';
import {
  ShieldCheck,
  AlertCircle,
  Send,
  CheckCircle2,
  Sparkles,
  Clock,
  Calendar,
} from 'lucide-react';

interface BaselineDeviationViewProps {
  onOpenDigest: () => void;
}

export const BaselineDeviationView: React.FC<BaselineDeviationViewProps> = ({ onOpenDigest }) => {
  const { profile, activeElder, medications, doseLogs, triggerDeviationAlert, triggerCaregiverDigest } = useAdept();
  const [sendingAlert, setSendingAlert] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'normal' | 'unusual'>('all');

  // 1. Compute personal baseline per medication from dose_logs
  const baselines = useMemo(() => {
    return computePersonalBaselines(medications, doseLogs);
  }, [medications, doseLogs]);

  // 2. Build full Caretaker timeline with "Normal for Dad" vs "Unusual" classifications
  const timelineEvents = useMemo(() => {
    return buildCaretakerTimeline(medications, doseLogs, baselines, activeElder.name.split(' ')[0]);
  }, [medications, doseLogs, baselines, activeElder.name]);

  // 3. Filter timeline events
  const filteredEvents = useMemo(() => {
    if (filterMode === 'normal') {
      return timelineEvents.filter((e) => e.classification === 'normal_for_dad');
    }
    if (filterMode === 'unusual') {
      return timelineEvents.filter((e) => e.classification === 'unusual');
    }
    return timelineEvents;
  }, [timelineEvents, filterMode]);

  // 4. Overall metrics
  const totalLogs = doseLogs.length || 1;
  const takenLogs = doseLogs.filter((l) => l.status === 'taken').length;
  const adherence = Math.min(100, Math.round((takenLogs / totalLogs) * 100));

  // 5. Active Deviation Detection (Check recent events or current deviations)
  const recentDeviations = timelineEvents.filter((e) => e.classification === 'unusual');
  const hasActiveDeviation = recentDeviations.length > 0;
  const latestDeviation = recentDeviations[0];

  const handleSendAmberAlert = async (anchor: MealAnchor) => {
    setSendingAlert(true);
    setNoticeMessage(null);
    try {
      const res = await triggerDeviationAlert(anchor);
      setNoticeMessage(
        `Warm-amber alert dispatched to ${res.recipient} (${res.mode === 'live_resend' ? 'Live via Resend' : 'Simulated Resend API'}).`
      );
    } catch (err: any) {
      setNoticeMessage('Failed to send alert: ' + err.message);
    } finally {
      setSendingAlert(false);
    }
  };

  const handleSendDigest = async () => {
    setSendingDigest(true);
    setNoticeMessage(null);
    try {
      const res = await triggerCaregiverDigest();
      setNoticeMessage(
        `Calm daily digest dispatched to ${res.recipient} (${res.mode === 'live_resend' ? 'Live via Resend' : 'Simulated Resend API'}).`
      );
    } catch (err: any) {
      setNoticeMessage('Failed to send digest: ' + err.message);
    } finally {
      setSendingDigest(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. TOP OVERVIEW: Calm Baseline Engine */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              Personal Baseline Engine
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeElder.name.split(' ')[0]}'s Learned Routine & Deviations
            </h3>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              Adept computes {activeElder.name}’s personal usual dose-time from historical logs. 
              Caretakers are alerted <strong>only</strong> when behaviour truly deviates (late by &gt;60m, no response, or 2+ consecutive skips). Calm by default: green unless an anchor deviates.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 px-5 py-4 rounded-2xl shrink-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#064e3b]">{adherence}%</div>
            <div className="text-xs font-semibold text-emerald-900 leading-tight">
              7-Day Routine<br />Consistency
            </div>
          </div>
        </div>

        {/* Medication Personal Baselines Grid */}
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-700" />
            Computed Personal Usual Times (Learned from Dose History)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {medications.map((med) => {
              const b = baselines[med.id];
              const anchorConfig = MEAL_ANCHORS[med.mealAnchor];

              return (
                <div
                  key={med.id}
                  className="bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all rounded-2xl p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      <span>{anchorConfig?.label?.split(' ')[0] || 'Dose'}</span>
                      <span className="text-emerald-700 font-extrabold">{b?.adherencePercentage || 100}%</span>
                    </div>

                    <h5 className="font-bold text-slate-900 text-base leading-snug">
                      {med.friendlyName}
                    </h5>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Clinical: {med.name} ({med.dosage})
                    </p>

                    <div className="mt-3 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{activeElder.name.split(' ')[0]}'s Usual:</span>
                        <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {b?.usualTimeString || '8:15 AM'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Normal Band:</span>
                        <span className="font-medium text-slate-700">
                          {b?.normalRangeStartString} – {b?.normalRangeEndString}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Window: {anchorConfig?.windowLabel}</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Stable
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC ALERT / CALM DIGEST STATE */}
      {hasActiveDeviation ? (
        /* HERO FEATURE: Baseline Deviation Alert Box (Warm Amber, Never Shame) */
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-200 text-amber-900 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-7 h-7 text-amber-800" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="bg-amber-200 text-amber-950 font-bold px-3 py-0.5 rounded-full text-xs uppercase tracking-wide">
                  Gentle Deviation Detected
                </span>
                <span className="text-xs text-amber-800 font-semibold">
                  Rule: Alert only when behaviour deviates from baseline • Warm Amber • No Shame
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-bold text-amber-950">
                {latestDeviation?.medicationName} — Timing Deviation
              </h4>
              <p className="text-amber-900 text-sm sm:text-base mt-1 leading-relaxed">
                {latestDeviation?.deviationReason}
              </p>

              {latestDeviation?.comfortNote && (
                <div className="mt-2 bg-amber-100/60 p-2.5 rounded-xl text-xs text-amber-900 font-medium">
                  <strong>{activeElder.name.split(' ')[0]}'s comfort note:</strong> "{latestDeviation.comfortNote}"
                </div>
              )}

              <div className="mt-4 bg-white/80 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                <div><strong>Calm Care Protocol:</strong> No sirens, no red shame flags. {activeElder.name.split(' ')[0]} may be enjoying a longer walk or napping.</div>
                <div>Alerting caretaker ({profile.caretakerEmail}) only because this event exceeds natural variance buffer.</div>
              </div>

              {/* Toast */}
              {noticeMessage && (
                <div className="mt-3 bg-emerald-100 border border-emerald-300 p-3 rounded-xl text-emerald-950 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{noticeMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => handleSendAmberAlert(latestDeviation.mealAnchor)}
                  disabled={sendingAlert}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm active:scale-98 transition-all disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingAlert ? 'Sending Email...' : '1-Tap Dispatch Warm Amber Alert (Resend)'}</span>
                </button>

                <button
                  onClick={onOpenDigest}
                  className="bg-white hover:bg-amber-100 text-amber-950 border border-amber-400 font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Open Full Daily Digest Preview</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CALM BY DEFAULT STATE: Everything within rhythm */
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-200 text-[#064e3b] rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-[#047857]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-200 text-[#064e3b] font-bold px-3 py-0.5 rounded-full text-xs uppercase tracking-wide">
                  Calm by Default
                </span>
                <span className="text-xs text-emerald-800 font-semibold">
                  Zero Alerts Necessary
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-bold text-[#064e3b]">
                {activeElder.name.split(' ')[0]} is Within Their Natural Baseline Rhythm
              </h4>
              <p className="text-emerald-900 text-sm mt-1 leading-relaxed">
                All medications are being taken within {activeElder.name.split(' ')[0]}'s customary windows. No urgent interruptions will be sent to caregivers. A quiet daily digest will be delivered at the conclusion of the day.
              </p>

              {noticeMessage && (
                <div className="mt-3 bg-white border border-emerald-300 p-3 rounded-xl text-emerald-950 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{noticeMessage}</span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleSendDigest}
                  disabled={sendingDigest}
                  className="bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm active:scale-98 transition-all disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingDigest ? 'Sending...' : 'Send Calm Daily Digest Now (Resend)'}</span>
                </button>

                <button
                  onClick={onOpenDigest}
                  className="bg-white hover:bg-emerald-100 text-[#064e3b] border border-emerald-300 font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>Preview Daily Digest</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. HERO TIMELINE: "normal for Dad" vs "unusual" labels */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Caretaker Timeline
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Intake History & Personal Rhythm Labels
            </h3>
            <p className="text-slate-500 text-sm mt-0.5">
              Every dose is evaluated against {activeElder.name.split(' ')[0]}'s baseline. Normal variances are quiet; deviations are marked with care.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({timelineEvents.length})
            </button>
            <button
              onClick={() => setFilterMode('normal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterMode === 'normal'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 hover:bg-emerald-100/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Normal for Dad ({timelineEvents.filter((e) => e.classification === 'normal_for_dad').length})
            </button>
            <button
              onClick={() => setFilterMode('unusual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterMode === 'unusual'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-900 hover:bg-amber-100/60'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Unusual ({timelineEvents.filter((e) => e.classification === 'unusual').length})
            </button>
          </div>
        </div>

        {/* Timeline Events List */}
        <div className="space-y-3.5">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-sm">
              No dose events match this filter.
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isNormal = event.classification === 'normal_for_dad';
              const anchorConfig = MEAL_ANCHORS[event.mealAnchor];

              return (
                <div
                  key={event.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isNormal
                      ? 'bg-white border-slate-200 hover:border-emerald-200'
                      : 'bg-amber-50/50 border-amber-300 hover:border-amber-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {event.dateStr}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {anchorConfig?.label || event.mealAnchor}
                      </span>
                      {event.status === 'taken' && (
                        <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                          Taken at {event.actualTimeString || 'Logged'}
                        </span>
                      )}
                      {event.status === 'skipped_comfortably' && (
                        <span className="text-xs text-amber-900 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-md font-semibold">
                          Skipped comfortably
                        </span>
                      )}
                    </div>

                    <h5 className="text-lg font-bold text-slate-900">
                      {event.medicationName}
                    </h5>

                    <p className="text-xs text-slate-600">
                      {event.deviationReason}
                    </p>

                    {event.comfortNote && (
                      <p className="text-xs text-amber-900 bg-amber-100/40 px-2.5 py-1 rounded-lg inline-block mt-1">
                        💭 Note: {event.comfortNote}
                      </p>
                    )}
                  </div>

                  {/* Classification Badge: "normal for Dad" vs "unusual" */}
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right text-xs hidden md:block">
                      <div className="text-slate-400">Dad's Usual</div>
                      <div className="font-bold text-slate-700">{event.usualTimeString}</div>
                    </div>

                    {isNormal ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-[#064e3b] border border-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
                        <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                        <span>normal for Dad</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-200 text-amber-950 border border-amber-400 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
                        <AlertCircle className="w-4 h-4 text-amber-800" />
                        <span>unusual</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
