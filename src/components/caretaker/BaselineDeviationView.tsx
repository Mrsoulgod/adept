import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { MealAnchor } from '../../lib/types';
import { MEAL_ANCHORS } from '../../lib/types';
import { ShieldCheck, AlertCircle, Send, CheckCircle2, Sparkles } from 'lucide-react';

interface BaselineDeviationViewProps {
  onOpenDigest: () => void;
}

export const BaselineDeviationView: React.FC<BaselineDeviationViewProps> = ({ onOpenDigest }) => {
  const { doseLogs, triggerDeviationAlert } = useAdept();
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSentNotice, setAlertSentNotice] = useState<string | null>(null);

  // Calculate baseline metrics across all logs
  const totalLogs = doseLogs.length || 1;
  const takenLogs = doseLogs.filter((l) => l.status === 'taken').length;
  const adherence = Math.min(100, Math.round((takenLogs / totalLogs) * 100));

  // Anchor stats
  const anchors: MealAnchor[] = ['morning_breakfast', 'after_lunch', 'evening_dinner', 'before_bedtime'];
  const anchorStats = anchors.map((a) => {
    const logsForAnchor = doseLogs.filter((l) => l.mealAnchor === a);
    const taken = logsForAnchor.filter((l) => l.status === 'taken').length;
    const total = logsForAnchor.length || 1;
    const rate = Math.round((taken / total) * 100);
    return {
      anchor: a,
      config: MEAL_ANCHORS[a],
      rate: Math.min(100, rate),
      totalLogs: logsForAnchor.length,
    };
  });

  const handleSendAmberAlert = async (anchor: MealAnchor) => {
    setSendingAlert(true);
    try {
      const res = await triggerDeviationAlert(anchor);
      setAlertSentNotice(
        `Warm-amber alert dispatched to ${res.recipient} (${res.mode === 'live_resend' ? 'Live via Resend' : 'Simulated Resend API'}).`
      );
    } catch (err: any) {
      setAlertSentNotice('Failed to send alert: ' + err.message);
    } finally {
      setSendingAlert(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calm Status Overview */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              Calm Baseline Engine
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              Routine Adherence & Baseline
            </h3>
            <p className="text-slate-600 text-sm mt-1">
              Tracking window adherence without clock-time anxiety. Calm by default: green unless an anchor deviates.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-2xl">
            <div className="text-3xl font-extrabold text-[#064e3b]">{adherence}%</div>
            <div className="text-xs font-semibold text-emerald-800 leading-tight">
              30-Day Routine<br />Consistency
            </div>
          </div>
        </div>

        {/* Anchor Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {anchorStats.map((item) => (
            <div
              key={item.anchor}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  <span>{item.config.label.split(' ')[0]}</span>
                  <span className="text-emerald-700 font-extrabold">{item.rate}%</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{item.config.label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{item.config.windowLabel}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Status</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stable
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Feature 2: Baseline Deviation Alert Box (Warm Amber, Never Shame) */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-200 text-amber-900 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-7 h-7 text-amber-800" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-200 text-amber-950 font-bold px-3 py-0.5 rounded-full text-xs uppercase tracking-wide">
                Gentle Deviation Detection
              </span>
              <span className="text-xs text-amber-800 font-semibold">
                No Shame • Warm Amber
              </span>
            </div>

            <h4 className="text-xl font-bold text-amber-950">
              Midday Window (After Lunch) Check-In
            </h4>
            <p className="text-amber-900 text-sm mt-1 leading-relaxed">
              Arthur typically completes his lunch routine between 12:00 PM and 1:30 PM. Today, it’s 2:15 PM and the midday joint capsule has not been logged.
            </p>

            <div className="mt-3 bg-white/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-950">
              <strong>Calm Care Protocol:</strong> No urgent alarms or red flashing banners. Arthur may be on a longer walk or resting. Sarah or family can dispatch a gentle warm-amber notification or trigger the daily digest.
            </div>

            {/* Alert Notification Toast */}
            {alertSentNotice && (
              <div className="mt-3 bg-emerald-100 border border-emerald-300 p-3 rounded-xl text-emerald-950 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{alertSentNotice}</span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => handleSendAmberAlert('after_lunch')}
                disabled={sendingAlert}
                className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm active:scale-98 transition-all disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{sendingAlert ? 'Sending Email...' : '1-Tap Dispatch Warm Amber Email (Resend)'}</span>
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
    </div>
  );
};
