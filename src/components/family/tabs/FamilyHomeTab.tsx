import React from 'react';
import { useAdept } from '../../../context/AdeptContext';
import type { DoseLog } from '../../../lib/types';
import { ShieldCheck, Clock, Sun } from 'lucide-react';

export const FamilyHomeTab: React.FC = () => {
  const { doseLogs } = useAdept();

  const todayDate = new Date().toISOString().split('T')[0];
  const todayLogs = doseLogs.filter((l: DoseLog) => l.date === todayDate);
  const morningTaken = todayLogs.some((l: DoseLog) => l.mealAnchor === 'morning_breakfast' && l.status === 'taken');

  return (
    <div className="px-4 py-5 space-y-5 font-sans">
      {/* Calm Reassurance Banner (Hero Law: Calm by default) */}
      <div className="bg-[#064e3b] text-white rounded-3xl p-6 shadow-md space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-emerald-800/90 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span>Peace of Mind</span>
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Dad is resting comfortably.
          </h1>
          <p className="text-emerald-100 text-xs mt-1 leading-relaxed">
            Arthur Davies (78) • Morning breakfast routine completed peacefully. No missed critical medications.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center font-black text-sm">
              ✓
            </div>
            <div>
              <div className="text-xs font-extrabold">Baseline Maintained</div>
              <div className="text-[11px] text-emerald-200">All steady in Bath, UK</div>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
            Quiet State
          </span>
        </div>
      </div>

      {/* Routine Progress */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Today's Routine
        </h2>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Morning Window */}
          <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Morning with Breakfast</h3>
                <p className="text-xs text-slate-500">
                  {morningTaken ? 'Taken at 8:25 AM with toast & tea' : 'Completed as scheduled'}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
              Taken
            </span>
          </div>

          {/* Midday Window */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Midday after Lunch</h3>
                <p className="text-xs text-slate-500">Window: 12:00 PM – 2:30 PM</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Scheduled
            </span>
          </div>

          {/* Evening Window */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Evening with Dinner</h3>
                <p className="text-xs text-slate-500">Window: 6:00 PM – 8:30 PM</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Upcoming
            </span>
          </div>
        </div>
      </div>

      {/* Arthur's Feeling Check-in Summary */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Arthur's Self-Reported Feeling
          </h2>
          <span className="text-xs font-extrabold text-[#064e3b]">Steady</span>
        </div>

        <div className="flex items-center gap-3 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/60">
          <span className="text-3xl">🙂</span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">"Steady & rested this morning"</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Arthur tapped the steady face after breakfast. No discomfort flagged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
