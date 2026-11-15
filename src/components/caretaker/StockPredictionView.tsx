import React, { useMemo } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { predictRegimenStockOuts, getActiveRefillNudges } from '../../lib/inventory';
import {
  Package,
  AlertTriangle,
  Calendar,
  PlusCircle,
} from 'lucide-react';

export const StockPredictionView: React.FC = () => {
  const { medications, refillMedication } = useAdept();

  const predictions = useMemo(() => {
    return predictRegimenStockOuts(medications);
  }, [medications]);

  const activeNudges = useMemo(() => {
    return getActiveRefillNudges(predictions);
  }, [predictions]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Package className="w-4 h-4 text-[#047857]" />
            Pharmacy Inventory & Stock-Out Predictor
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Stock Depletion Forecast & Weekend Refill Nudges
          </h3>
          <p className="text-slate-600 text-sm mt-0.5 max-w-2xl">
            Adept analyzes Arthur’s daily pill consumption to predict stock-outs in advance. Proactive nudges fire <strong>before weekends and holidays</strong> when pharmacies and delivery services have reduced hours.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl shrink-0">
          <div className="text-2xl sm:text-3xl font-extrabold text-[#064e3b]">
            {activeNudges.length}
          </div>
          <div className="text-xs font-semibold text-slate-700 leading-tight">
            Active Refill<br />Nudges
          </div>
        </div>
      </div>

      {/* ACTIVE REFILL NUDGES (WEEKEND / HOLIDAY WARNING CARDS) */}
      {activeNudges.length > 0 && (
        <div className="space-y-3">
          {activeNudges.map((nudge) => (
            <div
              key={nudge.medicationId}
              className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 bg-amber-200 text-amber-900 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="bg-amber-200 text-amber-950 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
                      {nudge.isWeekendStockOut ? 'Weekend Risk' : 'Holiday Risk'}
                    </span>
                    <span className="text-xs font-bold text-amber-900">
                      {nudge.daysRemaining} days left ({nudge.currentStock} pills remaining)
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-amber-950">
                    {nudge.friendlyName} — Depletion on {nudge.stockOutDayOfWeek} ({nudge.stockOutDateStr})
                  </h4>

                  <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed">
                    {nudge.nudgeReason}
                  </p>
                </div>
              </div>

              {/* Quick 1-Tap Refill Action */}
              <button
                onClick={() => refillMedication(nudge.medicationId, 30, 'Rahul (Caretaker)')}
                className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm active:scale-98 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>1-Tap Mark Refilled (+30 Pills)</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FULL INVENTORY GRID */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-700" />
          Active Regimen Stock Levels & Depletion Dates
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {predictions.map((item) => {
            const isLow = item.severity === 'urgent' || item.severity === 'warning';
            return (
              <div
                key={item.medicationId}
                className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                  isLow
                    ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400'
                    : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Stock
                    </span>
                    {item.isWeekendStockOut ? (
                      <span className="bg-amber-200 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Weekend Risk
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-[#064e3b] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Safe
                      </span>
                    )}
                  </div>

                  <h5 className="font-bold text-slate-900 text-base leading-snug">
                    {item.friendlyName}
                  </h5>
                  <p className="text-xs text-slate-500 font-medium">
                    {item.medicationName}
                  </p>

                  <div className="mt-3 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Remaining:</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {item.currentStock} pills
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Days of Supply:</span>
                      <span
                        className={`font-bold ${
                          item.daysRemaining <= 5 ? 'text-amber-800' : 'text-emerald-700'
                        }`}
                      >
                        {item.daysRemaining} days
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Runs out:</span>
                      <span className="font-semibold text-slate-700">
                        {item.stockOutDayOfWeek.slice(0, 3)}, {item.stockOutDateStr.slice(5)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">1 pill/day</span>
                  <button
                    onClick={() => refillMedication(item.medicationId, 30, 'Rahul (Caretaker)')}
                    className="text-xs font-bold text-[#064e3b] hover:text-[#043d2e] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
                  >
                    +30 Refill
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
