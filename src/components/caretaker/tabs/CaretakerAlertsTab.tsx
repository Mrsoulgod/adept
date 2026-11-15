import React, { useState } from 'react';
import { useAdept } from '../../../context/AdeptContext';
import { PrescriptionScanner } from '../PrescriptionScanner';
import { PreVisitBriefModal } from '../PreVisitBriefModal';
import { PostVisitVoiceModal } from '../PostVisitVoiceModal';
import { CaregiverDigestModal } from '../CaregiverDigestModal';
import {
  Camera,
  Mail,
  Stethoscope,
  Volume2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const CaretakerAlertsTab: React.FC = () => {
  const { profile, triggerDeviationAlert } = useAdept();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  const handleTestDeviation = async () => {
    try {
      await triggerDeviationAlert('morning_breakfast');
      setAlertFeedback(`✓ Warm-amber alert dispatched to ${profile.caretakerEmail}!`);
      setTimeout(() => setAlertFeedback(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="px-4 py-5 space-y-5 font-sans">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Alerts & Clinical AI Tools
        </h1>
        <p className="text-xs text-slate-500">
          Hero doctor loop • Baseline deviation alerts • Daily digest
        </p>
      </div>

      {alertFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-[#064e3b] p-3 rounded-2xl text-xs font-bold text-center animate-in fade-in">
          {alertFeedback}
        </div>
      )}

      {/* Safety Note Banner (Design Law: Confirm with Doctor) */}
      <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 text-xs text-[#064e3b] flex items-start gap-2.5 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Clinical Safety Law:</strong> Every AI output is a PROPOSAL Arthur confirms. Confirm with your doctor before applying any changes.
        </span>
      </div>

      {/* Hero AI Features Grid (56px max touch target buttons) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Hero Doctor Handoff Loop
        </h2>

        {/* 1. Prescription OCR Scanner */}
        <button
          onClick={() => setScannerOpen(true)}
          className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl px-4 flex items-center justify-between font-bold text-xs shadow-md active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black">Scan Prescription Photo</div>
              <div className="text-[11px] text-emerald-100">Gemini Vision OCR → Proposed Schedule</div>
            </div>
          </div>
          <span className="bg-white/20 text-white px-2.5 py-1 rounded-full text-[10px] font-black">
            Scan
          </span>
        </button>

        {/* 2. Pre-Visit Brief PDF */}
        <button
          onClick={() => setBriefOpen(true)}
          className="w-full h-14 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 flex items-center justify-between font-bold text-xs text-slate-800 shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black">Pre-Visit Brief (PDF)</div>
              <div className="text-[11px] text-slate-500">1-Page Adherence & Symptom Summary</div>
            </div>
          </div>
          <span className="bg-emerald-100 text-[#064e3b] px-2.5 py-1 rounded-full text-[10px] font-black">
            View
          </span>
        </button>

        {/* 3. Post-Visit Voice Note */}
        <button
          onClick={() => setVoiceOpen(true)}
          className="w-full h-14 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 flex items-center justify-between font-bold text-xs text-slate-800 shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black">Post-Visit Voice Note</div>
              <div className="text-[11px] text-slate-500">Dictate Dr. Vance’s Verbal Instructions</div>
            </div>
          </div>
          <span className="bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full text-[10px] font-black">
            Record
          </span>
        </button>
      </div>

      {/* Communications & Alerts */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Resend Email Dispatches
        </h2>

        {/* Daily Digest Modal Trigger */}
        <button
          onClick={() => setDigestOpen(true)}
          className="w-full h-14 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 flex items-center justify-between font-bold text-xs text-slate-800 shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black">Daily Caregiver Digest</div>
              <div className="text-[11px] text-slate-500">Preview & Send Signed One-Tap Email</div>
            </div>
          </div>
          <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-[10px] font-black">
            Send
          </span>
        </button>

        {/* Test Baseline Deviation Alert */}
        <button
          onClick={handleTestDeviation}
          className="w-full h-12 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 rounded-xl px-4 flex items-center justify-center gap-2 font-bold text-xs cursor-pointer transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <span>Trigger Sample Baseline Deviation Email</span>
        </button>
      </div>

      {/* Modals */}
      {scannerOpen && <PrescriptionScanner onClose={() => setScannerOpen(false)} />}
      {briefOpen && <PreVisitBriefModal onClose={() => setBriefOpen(false)} />}
      {voiceOpen && <PostVisitVoiceModal onClose={() => setVoiceOpen(false)} />}
      {digestOpen && <CaregiverDigestModal onClose={() => setDigestOpen(false)} />}
    </div>
  );
};
