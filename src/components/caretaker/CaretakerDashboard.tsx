import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { Medication } from '../../lib/types';
import { MEAL_ANCHORS } from '../../lib/types';
import { PrescriptionScanner } from './PrescriptionScanner';
import { PostVisitVoiceModal } from './PostVisitVoiceModal';
import { BaselineDeviationView } from './BaselineDeviationView';
import { StockPredictionView } from './StockPredictionView';
import { AuditLogView } from './AuditLogView';
import { CaregiverDigestModal } from './CaregiverDigestModal';
import { PreVisitBriefModal } from './PreVisitBriefModal';
import { ScheduleEditor } from './ScheduleEditor';
import {
  Camera,
  Mail,
  Stethoscope,
  Plus,
  Sparkles,
  Clock,
  UserCheck,
  Volume2,
} from 'lucide-react';

export const CaretakerDashboard: React.FC = () => {
  const { profile, medications, aiProposals } = useAdept();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  const pendingProposals = aiProposals.filter((p) => p.status === 'pending_elder_confirmation');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner / Hero Summary */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <UserCheck className="w-4 h-4 text-[#047857]" />
              Care Coordinator Portal • Sarah Davies
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {profile.name}’s Care Routine
            </h1>
            <p className="text-slate-600 text-base mt-1">
              Physician: <strong>{profile.doctorName}</strong> ({profile.doctorPhone}) • Age: {profile.age}
            </p>
          </div>

          {/* Quick Hero Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setScannerOpen(true)}
              className="bg-[#064e3b] hover:bg-[#043d2e] text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Prescription (Gemini OCR)</span>
            </button>

            <button
              onClick={() => setBriefOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <Stethoscope className="w-4 h-4 text-emerald-700" />
              <span>Pre-Visit Brief (PDF)</span>
            </button>

            <button
              onClick={() => setVoiceModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <Volume2 className="w-4 h-4 text-emerald-700" />
              <span>Post-Visit Voice Note</span>
            </button>

            <button
              onClick={() => setDigestOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-all"
            >
              <Mail className="w-4 h-4 text-emerald-700" />
              <span>Daily Digest (Resend)</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Proposals Pending Elder Confirmation */}
      {pendingProposals.length > 0 && (
        <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-700" />
            Active AI Proposal Awaiting {profile.name.split(' ')[0]}'s Decision
          </div>
          {pendingProposals.map((prop) => (
            <div
              key={prop.id}
              className="bg-white p-5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div>
                <h4 className="text-xl font-bold text-slate-900">{prop.title}</h4>
                <p className="text-slate-700 text-sm mt-1">{prop.summary}</p>
                <p className="text-xs text-amber-800 font-semibold mt-2">
                  Design Law: Elder confirms before this touches the active schedule.
                </p>
              </div>
              <span className="bg-amber-100 text-amber-900 font-bold px-3 py-1.5 rounded-full text-xs shrink-0">
                Awaiting {profile.name.split(' ')[0]}'s Yes/No
              </span>
            </div>
          ))}
        </div>
      )}

      {/* HERO FEATURE 2: BASELINE DEVIATIONS & TRENDS */}
      <BaselineDeviationView onOpenDigest={() => setDigestOpen(true)} />

      {/* ACTIVE REGIMEN & SCHEDULE WINDOWS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              Active Regimen & Dose Windows
            </h3>
            <p className="text-slate-500 text-sm mt-0.5">
              Meal anchors provide flexible comfort windows instead of strict minute-by-minute alarms.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingMed(null);
              setScheduleEditorOpen(true);
            }}
            className="bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        </div>

        {/* Group by Meal Anchors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medications.map((med) => {
            const anchor = MEAL_ANCHORS[med.mealAnchor];
            return (
              <div
                key={med.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                      {anchor?.label || med.mealAnchor} ({anchor?.windowLabel})
                    </span>
                    <button
                      onClick={() => {
                        setEditingMed(med);
                        setScheduleEditorOpen(true);
                      }}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-xl font-bold text-slate-900">{med.friendlyName}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Clinical: {med.name} ({med.dosage})
                  </p>
                  <p className="text-sm text-slate-700 mt-2">{med.instructions}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                  <span>Purpose: {med.purpose}</span>
                  <span className="font-semibold text-emerald-700">Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHARMACY INVENTORY & STOCK-OUT PREDICTIONS WITH REFILL NUDGES */}
      <StockPredictionView />

      {/* HOUSEHOLD GOVERNANCE & AUDIT LEDGER WITH ELDER VETO */}
      <AuditLogView />

      {/* Modals */}
      {scannerOpen && <PrescriptionScanner onClose={() => setScannerOpen(false)} />}
      {voiceModalOpen && <PostVisitVoiceModal onClose={() => setVoiceModalOpen(false)} />}
      {digestOpen && <CaregiverDigestModal onClose={() => setDigestOpen(false)} />}
      {briefOpen && <PreVisitBriefModal onClose={() => setBriefOpen(false)} />}
      {scheduleEditorOpen && (
        <ScheduleEditor
          onClose={() => {
            setScheduleEditorOpen(false);
            setEditingMed(null);
          }}
          editingMed={editingMed}
        />
      )}
    </div>
  );
};
