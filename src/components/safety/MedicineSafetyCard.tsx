import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck, Stethoscope } from 'lucide-react';
import type { MedicineSafetyReport } from '../../lib/types';

interface MedicineSafetyCardProps {
  report: MedicineSafetyReport;
  onApprove: () => void;
  onCancel: () => void;
}

export const MedicineSafetyCard: React.FC<MedicineSafetyCardProps> = ({
  report,
  onApprove,
  onCancel,
}) => {
  const isDoctorWarning = report.severity === 'ask_doctor';
  const isCaution = report.severity === 'caution';

  return (
    <div
      className={`rounded-3xl p-5 border-2 space-y-4 font-sans ${
        isDoctorWarning
          ? 'bg-rose-50 border-rose-300 text-rose-950'
          : isCaution
          ? 'bg-amber-50 border-amber-300 text-amber-950'
          : 'bg-emerald-50 border-emerald-300 text-emerald-950'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isDoctorWarning ? (
            <AlertTriangle className="w-5 h-5 text-rose-700 animate-pulse" />
          ) : isCaution ? (
            <AlertCircle className="w-5 h-5 text-amber-700" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          )}
          <span className="text-xs font-black uppercase tracking-wider">
            {isDoctorWarning
              ? 'Physician Confirmation Advised'
              : isCaution
              ? 'Clinical Caution'
              : 'Regimen Compatible'}
          </span>
        </div>

        <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded-full font-mono font-bold">
          Confidence: {Math.round(report.confidence * 100)}%
        </span>
      </div>

      <div>
        <h4 className="text-base font-black">
          Safety Review: {report.medicationName} ({report.dosage})
        </h4>
        <p className="text-xs mt-1 leading-relaxed opacity-90 font-medium">
          {report.reason}
        </p>
      </div>

      {/* Honest Framing Disclaimer (Prompt 11 requirement) */}
      <div className="bg-white/90 p-3 rounded-2xl border border-slate-200 text-[11px] text-slate-600 leading-normal flex items-start gap-2">
        <Stethoscope className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong>AI suggestion, ask your pharmacist:</strong> Gemini is an assistive language model, not a certified drug-interaction database. Please verify any medication addition or dosage change directly with your pharmacist or physician before taking.
        </div>
      </div>

      {/* Decision Actions: Nothing applied silently, elder/caretaker confirms */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onCancel}
          className="h-12 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer active:scale-98 transition-all"
        >
          Cancel Proposal
        </button>
        <button
          onClick={onApprove}
          className={`h-12 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98 transition-all ${
            isDoctorWarning
              ? 'bg-rose-700 hover:bg-rose-800'
              : isCaution
              ? 'bg-amber-800 hover:bg-amber-900'
              : 'bg-[#064e3b] hover:bg-[#043d2e]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Confirm & Proceed</span>
        </button>
      </div>
    </div>
  );
};

