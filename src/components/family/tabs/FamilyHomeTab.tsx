import React, { useState } from 'react';
import { useAdept } from '../../../context/AdeptContext';
import type { DoseLog, Medication } from '../../../lib/types';
import { ElderSelectorBar } from '../../shared/ElderSelectorBar';
import { ElderPairingModal } from '../ElderPairingModal';
import { CareCircleChatModal } from '../../chat/CareCircleChatModal';
import { FamilyVoiceRecorderModal } from '../FamilyVoiceRecorderModal';
import { VitalsScreen } from '../../vitals/VitalsScreen';
import { CognitiveTrendsSection } from '../../shared/CognitiveTrendsSection';
import {
  ShieldCheck,
  Clock,
  Sun,
  Smartphone,
  MessageCircle,
  AlertOctagon,
  PhoneCall,
  Calendar,
  Mic,
  Activity,
  Sparkles,
} from 'lucide-react';

export const FamilyHomeTab: React.FC = () => {
  const {
    activeElder,
    activeElderId,
    doseLogs,
    medications,
    emergencyAlert,
    resolveEmergencyAlert,
    openAdeptSheet,
  } = useAdept();

  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);

  // Elder's medications
  const elderMeds = medications.filter((m: Medication) =>
    m.elderId ? m.elderId === activeElderId : activeElderId === 'elder-dad'
  );

  const morningMeds = elderMeds.filter((m) => m.mealAnchor === 'morning_breakfast');
  const middayMeds = elderMeds.filter((m) => m.mealAnchor === 'after_lunch');
  const eveningMeds = elderMeds.filter((m) => m.mealAnchor === 'evening_dinner');

  // Today's logs
  const [todayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const todayLogs = doseLogs.filter((l: DoseLog) => l.date === todayDate);

  const morningLog = todayLogs.find((l: DoseLog) => l.mealAnchor === 'morning_breakfast');
  const morningTaken = morningLog?.status === 'taken';

  const isPaired = activeElder.isDevicePaired;

  return (
    <div className="px-4 py-5 space-y-5 font-sans">
      {/* Top Elder Switcher Tabs (Dad, Mom, etc.) */}
      <ElderSelectorBar />

      {/* Urgent Emergency SOS Banner if triggered */}
      {emergencyAlert && emergencyAlert.status === 'active' && (
        <div className="bg-red-600 text-white rounded-3xl p-5 shadow-lg border-2 border-red-700 animate-in zoom-in-95 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Urgent Emergency SOS
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-red-100">
              {emergencyAlert.timestamp ? 'Just now' : 'Active'}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black">
              {emergencyAlert.elderName} activated Emergency SOS!
            </h3>
            <p className="text-xs text-red-100 mt-0.5 leading-relaxed">
              Immediate help was requested. Please reach out to {activeElder.name} directly.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <a
              href={`tel:${activeElder.emergencyContactPhone || '555-345-6789'}`}
              className="flex-1 h-12 bg-white hover:bg-red-50 text-red-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call {activeElder.name.split(' ')[0]} Now</span>
            </a>
            <button
              onClick={() => resolveEmergencyAlert(emergencyAlert.id)}
              className="h-12 px-4 bg-red-800 hover:bg-red-900 text-white rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer active:scale-98 transition-all"
            >
              Mark Resolved
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* HERO SECTION: CONNECTED vs NOT CONNECTED                  */}
      {/* ========================================================= */}
      {!isPaired ? (
        /* UNCONNECTED STATE: Reassuring Amber Card with Set Up Phone CTA */
        <div
          id="family-reassurance-card"
          className="bg-gradient-to-br from-[#fefbf6] to-[#faf3e6] text-amber-950 rounded-3xl p-6 shadow-md border-2 border-amber-300/80 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 bg-amber-200/80 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-900">
              <Smartphone className="w-3.5 h-3.5 text-amber-800" />
              <span>Awaiting Connection</span>
            </div>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
              Setup Needed
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-amber-950">
              {activeElder.name}'s phone is not connected yet.
            </h1>
            <p className="text-amber-800 text-xs mt-1.5 leading-relaxed">
              Once {activeElder.relationship || activeElder.name.split(' ')[0]} enters the 6-digit code on their tablet or phone, live adherence, confirmed meal doses, and daily check-ins will appear here automatically.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => setPairingModalOpen(true)}
              className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
            >
              <Smartphone className="w-5 h-5 text-emerald-300" />
              <span>Set up {activeElder.relationship || activeElder.name.split(' ')[0]}'s Phone (Code & QR)</span>
            </button>

            <button
              onClick={() => setChatModalOpen(true)}
              className="w-full h-12 bg-white hover:bg-amber-50 border border-amber-300/80 text-amber-900 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-emerald-800" />
              <span>Open Care Circle Chat</span>
            </button>
          </div>
        </div>
      ) : (
        /* CONNECTED STATE: Peace of Mind Forest Green Hero Card */
        <div
          id="family-reassurance-card"
          className="bg-[#064e3b] text-white rounded-3xl p-6 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 bg-emerald-800/90 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Peace of Mind • Live Sync</span>
            </div>
            <button
              onClick={() => setPairingModalOpen(true)}
              className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full text-emerald-200 cursor-pointer flex items-center gap-1"
            >
              <Smartphone className="w-3 h-3" />
              <span>Paired</span>
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {activeElder.relationship || activeElder.name.split(' ')[0]} is {activeElder.healthStatus || 'resting comfortably'}.
            </h1>
            <p className="text-emerald-100 text-xs mt-1 leading-relaxed">
              {activeElder.name} ({activeElder.age}) • Routine synced from {activeElder.pairedDeviceName || "tablet"}.
              {morningTaken ? ' Morning breakfast routine completed peacefully.' : ' Morning meal window active.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center font-black text-sm">
                ✓
              </div>
              <div>
                <div className="text-xs font-extrabold">Baseline Maintained</div>
                <div className="text-[11px] text-emerald-200">
                  {morningTaken ? 'Morning doses taken on time' : 'Awaiting breakfast confirmation'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
              Quiet State
            </span>
          </div>

          {/* Quick Chat Action */}
          <button
            onClick={() => setChatModalOpen(true)}
            className="w-full h-11 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
          >
            <MessageCircle className="w-4 h-4 text-emerald-200" />
            <span>Chat with {activeElder.name.split(' ')[0]}</span>
          </button>
        </div>
      )}

      {/* Quick Action Hub: Voice Greeting (Prompt 14), Vitals (Prompt 9), Ask Adept (Prompt 8) */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setVoiceRecorderOpen(true)}
          className="h-12 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#064e3b] rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
        >
          <Mic className="w-4 h-4 text-emerald-800" />
          <span>Voice Greeting</span>
        </button>

        <button
          onClick={() => setVitalsOpen(true)}
          className="h-12 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
        >
          <Activity className="w-4 h-4 text-[#064e3b]" />
          <span>Vitals & BP</span>
        </button>

        <button
          onClick={() => openAdeptSheet({ question: `How was ${activeElder.relationship || activeElder.name.split(' ')[0]}'s week?` })}
          className="h-12 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Ask Adept</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TODAY'S ROUTINE PROGRESS                                   */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Today's Routine for {activeElder.name.split(' ')[0]}
          </h2>
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Today</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Morning Window */}
          <div
            className={`bg-white border rounded-2xl p-4 shadow-xs flex items-center justify-between ${
              morningTaken ? 'border-emerald-200/90' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  morningTaken
                    ? 'bg-emerald-100 text-[#064e3b]'
                    : isPaired
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {morningTaken ? '✓' : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Morning with Breakfast</h3>
                <p className="text-xs text-slate-500">
                  {!isPaired
                    ? 'Awaiting device connection • Scheduled 7:00 AM – 10:00 AM'
                    : morningTaken
                    ? `Taken at ${morningLog?.loggedAt ? new Date(morningLog.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '8:25 AM'} with meal`
                    : `Window open: 7:00 AM – 10:00 AM (${morningMeds.length} meds)`}
                </p>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                morningTaken
                  ? 'text-emerald-800 bg-emerald-50'
                  : isPaired
                  ? 'text-amber-800 bg-amber-50'
                  : 'text-slate-500 bg-slate-100'
              }`}
            >
              {morningTaken ? 'Taken' : isPaired ? 'Pending' : 'Scheduled'}
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
                <p className="text-xs text-slate-500">
                  Window: 12:00 PM – 2:30 PM {middayMeds.length > 0 && `• ${middayMeds[0].friendlyName}`}
                </p>
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
                <p className="text-xs text-slate-500">
                  Window: 6:00 PM – 8:30 PM {eveningMeds.length > 0 && `• ${eveningMeds[0].friendlyName}`}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Upcoming
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ARTHUR'S SELF-REPORTED FEELING CHECK-IN                   */}
      {/* ========================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {activeElder.name.split(' ')[0]}'s Self-Reported Feeling
          </h2>
          <span className="text-xs font-extrabold text-[#064e3b]">
            {isPaired ? activeElder.healthStatus || 'Steady' : 'Waiting for Device'}
          </span>
        </div>

        {!isPaired ? (
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-3xl">⏳</span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Awaiting {activeElder.name.split(' ')[0]}'s first check-in
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {activeElder.name} hasn't checked in yet today. The daily check-in prompt appears on their tablet after breakfast once paired.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/60">
            <span className="text-3xl">🙂</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                "{activeElder.healthStatus || 'Steady & rested this morning'}"
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {activeElder.name.split(' ')[0]} tapped the comfortable face after breakfast. No discomfort flagged.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Prompt 18: Cognitive Trends & Memory Rhythm Section */}
      <CognitiveTrendsSection role="family" />

      {/* Pairing Modal */}
      {pairingModalOpen && (
        <ElderPairingModal onClose={() => setPairingModalOpen(false)} />
      )}

      {/* Care Circle Chat Modal */}
      <CareCircleChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        defaultChannelId="group"
      />

      {/* Prompt 14: Family Voice Recorder Modal */}
      <FamilyVoiceRecorderModal
        isOpen={voiceRecorderOpen}
        onClose={() => setVoiceRecorderOpen(false)}
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
