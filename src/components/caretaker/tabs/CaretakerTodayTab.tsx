import React, { useState } from 'react';
import { useAdept } from '../../../context/AdeptContext';
import type { Medication, DoseLog, AIProposal } from '../../../lib/types';
import { BaselineDeviationView } from '../BaselineDeviationView';
import { CaregiverDigestModal } from '../CaregiverDigestModal';
import { Sparkles } from 'lucide-react';

export const CaretakerTodayTab: React.FC = () => {
  const { profile, doseLogs, medications, aiProposals } = useAdept();
  const [digestOpen, setDigestOpen] = useState(false);

  const todayDate = new Date().toISOString().split('T')[0];
  const todayLogs = doseLogs.filter((l: DoseLog) => l.date === todayDate);
  const takenCount = todayLogs.filter((l: DoseLog) => l.status === 'taken').length;
  const totalMeds = medications.filter((m: Medication) => m.isActive).length;
  const adherence = totalMeds > 0 ? Math.min(100, Math.round((takenCount / totalMeds) * 100)) : 100;

  const pendingProposals = aiProposals.filter((p: AIProposal) => p.status === 'pending_elder_confirmation');

  return (
    <div className="px-4 py-5 space-y-5 font-sans">
      {/* Title & Care Routine Header */}
      <div id="caretaker-today-header" className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            Care Coordinator • Sarah Davies
          </span>
          <span className="text-xs font-black text-[#064e3b]">
            {adherence}% Adherence
          </span>
        </div>

        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {profile.name}’s Daily Rhythm
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dr. {profile.doctorName} • {profile.conditions.join(', ')}
          </p>
        </div>

        {/* Adherence Mini-progress */}
        <div className="space-y-1">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#064e3b] h-full rounded-full transition-all duration-500"
              style={{ width: `${adherence}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>{takenCount} of {totalMeds} doses confirmed</span>
            <span>Calm Baseline</span>
          </div>
        </div>
      </div>

      {/* Pending Proposal Notice if Any */}
      {pendingProposals.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>AI Proposal Awaiting Arthur's Decision</span>
          </div>
          <p className="text-xs text-amber-800">
            {pendingProposals[0].title}: {pendingProposals[0].summary}
          </p>
        </div>
      )}

      {/* Baseline Deviation View & Timeline with "normal for Dad" labels */}
      <div id="caretaker-timeline-section" className="space-y-3">
        <BaselineDeviationView onOpenDigest={() => setDigestOpen(true)} />
      </div>

      {digestOpen && <CaregiverDigestModal onClose={() => setDigestOpen(false)} />}
    </div>
  );
};
