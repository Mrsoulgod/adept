import React, { useState } from 'react';
import { useAdept } from '../../../context/AdeptContext';
import type { Medication, DoseLog, AIProposal } from '../../../lib/types';
import { BaselineDeviationView } from '../BaselineDeviationView';
import { CaregiverDigestModal } from '../CaregiverDigestModal';
import { ElderSelectorBar } from '../../shared/ElderSelectorBar';
import { CareCircleChatModal } from '../../chat/CareCircleChatModal';
import { VitalsScreen } from '../../vitals/VitalsScreen';
import { CognitiveTrendsSection } from '../../shared/CognitiveTrendsSection';
import { Sparkles, MessageCircle, AlertOctagon, PhoneCall, Activity } from 'lucide-react';

export const CaretakerTodayTab: React.FC = () => {
  const {
    activeElder,
    activeElderId,
    doseLogs,
    medications,
    aiProposals,
    emergencyAlert,
    resolveEmergencyAlert,
    openAdeptSheet,
  } = useAdept();

  const [digestOpen, setDigestOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);

  // Elder-specific medications
  const elderMeds = medications.filter((m: Medication) =>
    m.elderId ? m.elderId === activeElderId : activeElderId === 'elder-dad'
  );
  const totalMeds = elderMeds.filter((m: Medication) => m.isActive).length;
  const elderMedIds = new Set(elderMeds.map((m) => m.id));

  const todayDate = new Date().toISOString().split('T')[0];
  const todayLogs = doseLogs.filter(
    (l: DoseLog) => l.date === todayDate && elderMedIds.has(l.medicationId)
  );
  const takenCount = todayLogs.filter((l: DoseLog) => l.status === 'taken').length;
  const adherence = totalMeds > 0 ? Math.min(100, Math.round((takenCount / totalMeds) * 100)) : 100;

  const pendingProposals = aiProposals.filter(
    (p: AIProposal) => p.status === 'pending_elder_confirmation'
  );

  return (
    <div className="px-4 py-5 space-y-5 font-sans">
      {/* Elder Selector Bar (Switch between Dad, Mom, etc.) */}
      <ElderSelectorBar />

      {/* Urgent Emergency SOS Alert if triggered */}
      {emergencyAlert && emergencyAlert.status === 'active' && (
        <div className="bg-red-600 text-white rounded-3xl p-5 shadow-lg border-2 border-red-700 animate-in zoom-in-95 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Urgent Emergency Alert
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-red-100">Active</span>
          </div>

          <div>
            <h3 className="text-lg font-black">
              {emergencyAlert.elderName} triggered Emergency SOS!
            </h3>
            <p className="text-xs text-red-100 mt-0.5 leading-relaxed">
              Immediate attention requested: "{emergencyAlert.reason || 'Urgent assistance needed'}".
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={`tel:${activeElder.emergencyContactPhone || '555-345-6789'}`}
              className="flex-1 h-12 bg-white hover:bg-red-50 text-red-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call {activeElder.name.split(' ')[0]}</span>
            </a>
            <button
              onClick={() => resolveEmergencyAlert(emergencyAlert.id)}
              className="h-12 px-4 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer active:scale-98 transition-all"
            >
              Resolve
            </button>
          </div>
        </div>
      )}

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
            {activeElder.name}’s Daily Rhythm
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dr. {activeElder.doctorName} • {activeElder.conditions.join(', ') || 'No conditions listed'}
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
            <span>{activeElder.isDevicePaired ? 'Device Live' : 'Awaiting Device'}</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => setVitalsOpen(true)}
            className="h-11 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98"
          >
            <Activity className="w-4 h-4 text-[#064e3b]" />
            <span>Vitals Log</span>
          </button>
          <button
            onClick={() => setChatOpen(true)}
            className="h-11 bg-slate-100 hover:bg-emerald-50 hover:text-[#064e3b] border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => openAdeptSheet({ question: "What is Dad's 7-day adherence and stock status?" })}
            className="h-11 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Ask Adept</span>
          </button>
        </div>
      </div>

      {/* Pending Proposal Notice if Any */}
      {pendingProposals.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>AI Proposal Awaiting {activeElder.name.split(' ')[0]}'s Decision</span>
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

      {/* Prompt 18: Caretaker Cognitive Trends & Doctor Alert Section */}
      <CognitiveTrendsSection role="caretaker" />

      {digestOpen && <CaregiverDigestModal onClose={() => setDigestOpen(false)} />}

      {/* Care Circle Chat Modal */}
      <CareCircleChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        defaultChannelId="group"
      />

      {/* Prompt 9: Vitals Screen Modal */}
      {vitalsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 overflow-y-auto">
          <div className="bg-[#FAF8F5] rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl p-4">
            <VitalsScreen onClose={() => setVitalsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
