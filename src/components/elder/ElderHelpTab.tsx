import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { ShieldAlert, Check, Stethoscope, AlertOctagon, Undo2, Play, Pill } from 'lucide-react';
import { PracticeModeModal } from '../walkthrough/WalkthroughTour';

export const ElderHelpTab: React.FC = () => {
  const { profile, auditLogs, elderVetoAction, elderApproveAuditAction, startWalkthroughTour, language } = useAdept();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);

  // Filter actions that Arthur can review/veto
  const vetoableItems = auditLogs.filter((a) => a.canElderVeto);

  const handleVeto = (id: string, actionName: string) => {
    elderVetoAction(id);
    setFeedback(`✓ You undo-ed: "${actionName}". Schedule restored!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleApprove = (id: string, actionName: string) => {
    elderApproveAuditAction(id);
    setFeedback(`✓ You approved keeping: "${actionName}".`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="px-5 py-6 space-y-6 font-sans">
      {/* Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
          <span>Help & Emergency</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Help & Your Decisions
        </h1>
        <p className="text-sm text-slate-600">
          Reach your doctor or reverse any recent changes you disagree with.
        </p>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3.5 rounded-2xl text-sm font-bold text-center animate-in fade-in">
          {feedback}
        </div>
      )}

      {/* Emergency & Doctor Contact Buttons (56px max touch target) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Emergency & Doctor
        </h2>

        {/* 911 Emergency Button */}
        <a
          href="tel:911"
          className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl px-4 flex items-center justify-between font-black shadow-md active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black">Emergency Medical Services</div>
              <div className="text-xs text-red-100 font-bold">Dial 911 (Immediate Assistance)</div>
            </div>
          </div>
          <span className="text-xs bg-white text-red-700 px-3 py-1 rounded-full font-black">
            Call 911
          </span>
        </a>

        {/* Dr. Evelyn Vance */}
        <a
          href={`tel:${profile.doctorPhone || '555-234-5678'}`}
          className="w-full h-14 bg-white hover:bg-emerald-50 border-2 border-emerald-600/40 rounded-2xl px-4 flex items-center justify-between text-slate-900 font-bold shadow-xs active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black">{profile.doctorName || 'Dr. Evelyn Vance'}</div>
              <div className="text-xs text-slate-500">{profile.doctorPhone || '(555) 234-5678'} • Physician</div>
            </div>
          </div>
          <span className="text-xs bg-emerald-100 text-[#064e3b] px-3 py-1 rounded-full font-black">
            Call
          </span>
        </a>
      </div>

      {/* App Walkthrough & Hands-on Practice Mode (Prompt 6) */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {language === 'hi' ? 'ऐप का परिचय और अभ्यास' : 'App Tour & Practice'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'hi' ? 'सीखें या सुरक्षित रूप से अभ्यास करें' : 'Learn or practice safely'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full">
            Prompt 6
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {language === 'hi'
            ? 'अपनी गति से ऐप को समझें। अभ्यास मोड में "Taken" बटन दबाकर देखें — यह कोई असली रिकॉर्ड नहीं बदलेगा।'
            : 'Explore Adept at your own pace. Practice tapping "Taken" in a safe sandbox with zero risk to your real records.'}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Practice Mode Button */}
          <button
            type="button"
            onClick={() => setPracticeModalOpen(true)}
            className="h-12 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-300 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
          >
            <Pill className="w-4 h-4 text-[#064e3b]" />
            <span>{language === 'hi' ? 'दवा अभ्यास करें' : 'Practice Mode'}</span>
          </button>

          {/* Replay Tour Button */}
          <button
            type="button"
            onClick={startWalkthroughTour}
            className="h-12 bg-white hover:bg-purple-50 text-purple-950 border-2 border-purple-200 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current text-purple-700" />
            <span>{language === 'hi' ? 'टूर फिर देखें' : 'Replay Tour'}</span>
          </button>
        </div>
      </div>

      {/* Elder Veto Section (Hero Law: Elder is centre of decisions) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Your Decision & Veto Power
          </h2>
          <span className="text-[11px] font-bold text-[#064e3b] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Elder Decides
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Arthur, you have final authority. If Sarah or your doctor changed a pill timing or dosage and you prefer not to take it, tap <strong>Undo / Veto</strong> to roll it back instantly.
        </p>

        {vetoableItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-500">
            No pending schedule changes to review. Your routine is completely steady.
          </div>
        ) : (
          <div className="space-y-3">
            {vetoableItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white border-2 rounded-2xl p-4 space-y-3 transition-all ${
                  item.isVetoed ? 'border-amber-300 bg-amber-50/50 opacity-80' : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {item.actorName} • {item.sourceLabel || 'prescription photo'}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-0.5">
                      {item.action}
                    </h3>
                  </div>
                  {item.isVetoed ? (
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                      Vetoed by Arthur
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-[#064e3b] font-extrabold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.plainEnglishDescription}
                </p>

                {!item.isVetoed && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApprove(item.id, item.action)}
                      className="h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Keep Change</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVeto(item.id, item.action)}
                      className="h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Undo / Veto</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Practice Mode Safe Sandbox Modal */}
      <PracticeModeModal
        isOpen={practiceModalOpen}
        onClose={() => setPracticeModalOpen(false)}
        language={language}
      />
    </div>
  );
};
