import React, { useState, useEffect } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { generateDoctorBriefWithGemini } from '../../lib/gemini';
import type { DoctorBrief, MealAnchor } from '../../lib/types';
import { MEAL_ANCHORS } from '../../lib/types';
import { Stethoscope, Sparkles, Printer, Copy, X, FileText, HelpCircle } from 'lucide-react';

interface PreVisitBriefModalProps {
  onClose: () => void;
}

export const PreVisitBriefModal: React.FC<PreVisitBriefModalProps> = ({ onClose }) => {
  const { profile, medications, doseLogs, settings } = useAdept();
  const [brief, setBrief] = useState<DoctorBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    generateDoctorBriefWithGemini(profile, medications, doseLogs, 30, settings.geminiApiKey)
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
  }, [profile, medications, doseLogs, settings.geminiApiKey]);

  const handleCopy = () => {
    if (!brief) return;
    const text = `
ADEPT PRE-VISIT CLINICAL BRIEF
Patient: ${brief.elderName} (Age ${brief.age})
Doctor: ${profile.doctorName}
Period: Past ${brief.periodDays} Days
Overall Adherence: ${brief.adherencePercentage}% (${brief.totalDosesTaken}/${brief.totalDosesScheduled} doses taken)

WELLNESS SUMMARY:
${brief.reportedWellnessSummary}

ACTIVE MEDICATIONS:
${brief.activeMedications.map((m) => `- ${m.name}: ${m.mealAnchor} (${m.adherenceRate}% adherence)`).join('\n')}

NOTABLE OBSERVATIONS:
${brief.notableObservations.map((o) => `• ${o}`).join('\n')}

PATIENT QUESTIONS FOR DR. VANCE:
${brief.elderQuestionsForDoctor.map((q, i) => `${i + 1}. ${q}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Stethoscope className="w-4 h-4 text-[#047857]" />
            Doctor Handoff Loop • Pre-Visit Brief
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Clinical Appointment Brief for {profile.doctorName}
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Generated via Gemini 2.5 Flash synthesis. Clean 1-page clinical summary ready for consultation.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
            <p className="text-base font-bold text-[#064e3b]">
              Synthesizing 30 days of adherence and comfort logs...
            </p>
          </div>
        )}

        {/* Content */}
        {!loading && brief && (
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 print:overflow-visible">
            {/* Clinical Header Bar */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Patient: {brief.elderName}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Age: {brief.age} • Primary Physician: {profile.doctorName} • Generated {new Date(brief.generatedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-emerald-800/80 border border-emerald-500/40 px-4 py-2 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-300">
                  {brief.adherencePercentage}%
                </div>
                <div className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">
                  Window Adherence
                </div>
              </div>
            </div>

            {/* Wellness Summary */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Clinical Wellness Summary
              </h4>
              <p className="text-sm text-slate-800 leading-relaxed">
                {brief.reportedWellnessSummary}
              </p>
            </div>

            {/* Active Regimen Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Active Regimen & Anchor Compliance
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Medication</th>
                      <th className="p-3">Meal Anchor</th>
                      <th className="p-3 text-right">Adherence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {brief.activeMedications.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                        <td className="p-3 text-slate-600 text-xs">
                          {MEAL_ANCHORS[m.mealAnchor as MealAnchor]?.label || m.mealAnchor}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          {m.adherenceRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notable Observations */}
            <div className="border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-700" />
                Key Clinical Observations
              </h4>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {brief.notableObservations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prepared Elder Questions */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                Prepared Questions for Dr. Vance
              </h4>
              <ol className="space-y-2 text-sm text-slate-800 list-decimal pl-4">
                {brief.elderQuestionsForDoctor.map((q, idx) => (
                  <li key={idx} className="font-medium">
                    {q}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!loading && (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3 justify-end mt-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Clinical Brief</span>
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
