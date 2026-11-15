import React, { useState, useEffect } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { generateDoctorBriefWithGemini, DOCTOR_CONFIRMATION_SAFETY_NOTE } from '../../lib/gemini';
import type { DoctorBrief, MealAnchor } from '../../lib/types';
import { MEAL_ANCHORS } from '../../lib/types';
import {
  Stethoscope,
  Sparkles,
  Printer,
  Copy,
  X,
  FileText,
  HelpCircle,
  Activity,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
} from 'lucide-react';

interface PreVisitBriefModalProps {
  onClose: () => void;
}

export const PreVisitBriefModal: React.FC<PreVisitBriefModalProps> = ({ onClose }) => {
  const { profile, medications, doseLogs, settings, vitals } = useAdept();
  const [brief, setBrief] = useState<DoctorBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    generateDoctorBriefWithGemini(profile, medications, doseLogs, 30, settings.geminiApiKey, vitals)
      .then((res) => {
        if (mounted) {
          setBrief(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [profile, medications, doseLogs, settings.geminiApiKey, vitals]);

  const handleCopy = () => {
    if (!brief) return;
    const text = `
ADEPT PRE-VISIT CLINICAL BRIEF
Patient: ${brief.elderName} (Age ${brief.age})
Doctor: ${profile.doctorName}
Period: Past ${brief.periodDays} Days
Overall Adherence: ${brief.adherencePercentage}% (${brief.totalDosesTaken}/${brief.totalDosesScheduled} doses taken)

SYMPTOM & WELLNESS TREND:
${brief.reportedWellnessSummary}
Overall Trend: ${brief.symptomTrends?.overallTrend || 'Steady'}
Check-ins: ${brief.symptomTrends?.checkinsRecorded || 28} logged

ACTIVE MEDICATIONS:
${brief.activeMedications.map((m) => `- ${m.name}: ${m.mealAnchor} (${m.adherenceRate}% adherence)`).join('\n')}

NOTABLE OBSERVATIONS:
${brief.notableObservations.map((o) => `• ${o}`).join('\n')}

PATIENT QUESTIONS FOR DR. VANCE:
${brief.elderQuestionsForDoctor.map((q, i) => `${i + 1}. ${q}`).join('\n')}

SAFETY NOTE:
${brief.safetyNote || DOCTOR_CONFIRMATION_SAFETY_NOTE}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-4 sm:my-8 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:p-0 print:m-0 print:border-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors print:hidden cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 print:mb-2">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Stethoscope className="w-4 h-4 text-[#047857]" />
            Doctor Handoff Loop • Pre-Visit Brief
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Clinical Brief for {profile.doctorName}
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5 print:text-xs">
            Synthesized via Gemini from patient intake and symptom check-ins. High-density, 1-page summary.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
            <p className="text-base font-bold text-[#064e3b]">
              Synthesizing 30 days of adherence and symptom logs...
            </p>
          </div>
        )}

        {/* Content */}
        {!loading && brief && (
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4 print:overflow-visible print:space-y-3 text-slate-800">
            {/* Clinical Header Bar */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:bg-slate-900 print:text-white">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Patient: {brief.elderName}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Age: {brief.age} • Physician: {profile.doctorName} • Evaluated: Past {brief.periodDays} Days
                </p>
              </div>

              <div className="bg-emerald-800/90 border border-emerald-500/40 px-4 py-2 rounded-xl text-center shrink-0">
                <div className="text-2xl sm:text-3xl font-black text-emerald-300">
                  {brief.adherencePercentage}%
                </div>
                <div className="text-[10px] text-emerald-100 font-semibold uppercase tracking-wider">
                  Window Adherence
                </div>
              </div>
            </div>

            {/* 1. ADHERENCE & SYMPTOM TREND ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Symptom & Wellness Trend */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-700" />
                    Symptom & Mood Trend
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-800 leading-snug">
                    {brief.reportedWellnessSummary}
                  </p>
                </div>

                {brief.symptomTrends && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-200/60">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                      <span>Daily Check-ins ({brief.symptomTrends.checkinsRecorded})</span>
                      <span className="text-emerald-800 font-bold">{brief.symptomTrends.overallTrend}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                        <Smile className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
                        <span className="font-bold text-slate-800">{brief.symptomTrends.breakdown.great}</span>
                        <span className="block text-[9px] text-slate-500">Great</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                        <Smile className="w-4 h-4 text-teal-600 mx-auto mb-0.5" />
                        <span className="font-bold text-slate-800">{brief.symptomTrends.breakdown.steady}</span>
                        <span className="block text-[9px] text-slate-500">Steady</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                        <Meh className="w-4 h-4 text-amber-600 mx-auto mb-0.5" />
                        <span className="font-bold text-slate-800">{brief.symptomTrends.breakdown.tired}</span>
                        <span className="block text-[9px] text-slate-500">Tired</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                        <Frown className="w-4 h-4 text-rose-500 mx-auto mb-0.5" />
                        <span className="font-bold text-slate-800">{brief.symptomTrends.breakdown.discomfort}</span>
                        <span className="block text-[9px] text-slate-500">Discomfort</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Regimen Summary Table */}
              <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-700" />
                    Regimen Compliance
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Medication</th>
                          <th className="p-2">Anchor</th>
                          <th className="p-2 text-right">Adherence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {brief.activeMedications.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2 font-medium text-slate-900 truncate max-w-[130px]">{m.name}</td>
                            <td className="p-2 text-slate-600 text-[11px]">
                              {MEAL_ANCHORS[m.mealAnchor as MealAnchor]?.label?.split(' ')[0] || m.mealAnchor}
                            </td>
                            <td className="p-2 text-right font-bold text-emerald-700">
                              {m.adherenceRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Total Doses: {brief.totalDosesTaken}/{brief.totalDosesScheduled}</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Calm routine
                  </span>
                </div>
              </div>
            </div>

            {/* 2. OBSERVATIONS & PREPARED QUESTIONS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Notable Observations */}
              <div className="border border-slate-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Key Clinical Observations
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {brief.notableObservations.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prepared Questions for Dr. Vance */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-800" />
                  Prepared Questions for Dr. Vance
                </h4>
                <ol className="space-y-1.5 text-xs text-amber-950 list-decimal pl-4">
                  {brief.elderQuestionsForDoctor.map((q, idx) => (
                    <li key={idx} className="font-medium">
                      {q}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* 3. MANDATORY SAFETY DISCLAIMER */}
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 sm:p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Confirm with your doctor:</strong> {brief.safetyNote || DOCTOR_CONFIRMATION_SAFETY_NOTE}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!loading && (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2.5 justify-end mt-2 print:hidden">
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Export as PDF (1-Page)</span>
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
