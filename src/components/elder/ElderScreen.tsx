import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { MealAnchor } from '../../lib/types';
import { MEAL_ANCHORS } from '../../lib/types';
import { CheckCircle2, HeartHandshake, ShieldCheck, Sun, Sunrise, Sunset, Sparkles, AlertCircle } from 'lucide-react';

export const ElderScreen: React.FC = () => {
  const {
    profile,
    medications,
    doseLogs,
    activeElderProposal,
    confirmDose,
    deferDoseComfortably,
    elderResolveProposal,
    elderVetoAction,
    auditLogs,
  } = useAdept();

  const [activeView, setActiveView] = useState<'main' | 'wellness' | 'veto'>('main');
  const [comfortFeedback, setComfortFeedback] = useState<string | null>(null);

  // Today's date string
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = doseLogs.filter((l) => l.date === todayStr);

  // Determine current meal anchor window based on current hour
  const currentHour = new Date().getHours();
  let currentAnchor: MealAnchor = 'morning_breakfast';
  if (currentHour >= 11 && currentHour < 16) {
    currentAnchor = 'after_lunch';
  } else if (currentHour >= 16 && currentHour < 21) {
    currentAnchor = 'evening_dinner';
  } else if (currentHour >= 21 || currentHour < 6) {
    currentAnchor = 'before_bedtime';
  }

  // Find medication in current anchor that hasn't been logged today
  const pendingMedInWindow = medications.find((med) => {
    if (!med.isActive) return false;
    if (med.mealAnchor !== currentAnchor) return false;
    const hasLog = todayLogs.some((l) => l.medicationId === med.id && l.status === 'taken');
    return !hasLog;
  });

  // Next pending medication across any anchor
  const nextPendingMed = pendingMedInWindow || medications.find((med) => {
    if (!med.isActive) return false;
    const hasLog = todayLogs.some((l) => l.medicationId === med.id && l.status === 'taken');
    return !hasLog;
  });

  // Recent vetoable items
  const vetoableLogs = auditLogs.filter((l) => l.canElderVeto && !l.isVetoed);

  // -------------------------------------------------------------
  // VIEW: ELDER VETO SCREEN (Elder has ultimate authority)
  // -------------------------------------------------------------
  if (activeView === 'veto') {
    return (
      <div className="min-h-screen bg-[#fcfbfa] text-[#0f172a] p-6 flex flex-col justify-between max-w-xl mx-auto">
        <div>
          {/* Header */}
          <div className="mb-8">
            <span className="inline-block bg-emerald-100 text-[#064e3b] font-bold px-4 py-2 rounded-full text-lg mb-3">
              Elder Veto Authority
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0f172a]">
              Recent Routine Changes
            </h1>
            <p className="text-xl text-slate-700 mt-2">
              You are the centre of every decision. If Sarah or Dr. Vance made a change you don’t want, tap Veto to cancel it.
            </p>
          </div>

          {/* Vetoable list */}
          {vetoableLogs.length === 0 ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center my-6">
              <CheckCircle2 className="w-12 h-12 text-[#047857] mx-auto mb-3" />
              <p className="text-2xl font-bold text-[#064e3b]">No changes need your attention</p>
              <p className="text-xl text-emerald-900 mt-2">
                Your routine is steady and peaceful just the way you like it.
              </p>
            </div>
          ) : (
            <div className="space-y-6 my-4">
              {vetoableLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm"
                >
                  <span className="text-amber-900 text-lg font-semibold block mb-1">
                    Proposed / Added by {log.actorName}
                  </span>
                  <h3 className="text-2xl font-black text-amber-950 mb-2">{log.action}</h3>
                  <p className="text-xl text-slate-800 leading-relaxed mb-6">
                    {log.plainEnglishDescription}
                  </p>

                  {/* ONE BIG VETO BUTTON */}
                  <button
                    onClick={() => {
                      elderVetoAction(log.id);
                      setComfortFeedback(`Cancelled "${log.action}". Your routine is restored.`);
                      setActiveView('main');
                    }}
                    className="w-full min-h-[68px] bg-amber-700 hover:bg-amber-800 text-white text-2xl font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-3 shadow-md active:scale-98 cursor-pointer transition-all"
                  >
                    <AlertCircle className="w-8 h-8" />
                    <span>Veto and Cancel This Change</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => setActiveView('main')}
            className="w-full min-h-[64px] bg-slate-900 text-white text-2xl font-bold rounded-2xl px-6 py-4 cursor-pointer shadow-md active:scale-98"
          >
            ← Return to Home Screen
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: GENTLE WELLNESS CHECK-IN
  // -------------------------------------------------------------
  if (activeView === 'wellness') {
    return (
      <div className="min-h-screen bg-[#fcfbfa] text-[#0f172a] p-6 flex flex-col justify-between max-w-xl mx-auto">
        <div>
          <span className="inline-block bg-emerald-100 text-[#064e3b] font-bold px-4 py-2 rounded-full text-lg mb-3">
            Morning & Midday Comfort
          </span>
          <h1 className="text-3xl font-extrabold text-[#0f172a] mb-3">
            How are your knees and body feeling right now?
          </h1>
          <p className="text-xl text-slate-700 mb-8">
            Sarah and Dr. Vance check your comfort notes to keep you walking easily.
          </p>

          <div className="space-y-5">
            {/* OPTION 1: BIG BUTTON */}
            <button
              onClick={() => {
                setComfortFeedback('Thank you, Arthur! Logged: Feeling steady & comfortable.');
                setActiveView('main');
              }}
              className="w-full min-h-[72px] bg-[#064e3b] hover:bg-[#053d2e] text-white text-2xl font-bold rounded-2xl p-5 flex items-center justify-center gap-3 shadow-lg active:scale-98 cursor-pointer"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              <span>Feeling good and comfortable</span>
            </button>

            {/* OPTION 2: WARM AMBER BUTTON (NO SHAME) */}
            <button
              onClick={() => {
                setComfortFeedback('Noted: Knees feeling a bit stiff. Sarah has been informed to check in.');
                setActiveView('main');
              }}
              className="w-full min-h-[72px] bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300 text-2xl font-bold rounded-2xl p-5 flex items-center justify-center gap-3 active:scale-98 cursor-pointer"
            >
              <AlertCircle className="w-8 h-8 text-amber-800" />
              <span>A bit stiff or tired today</span>
            </button>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => setActiveView('main')}
            className="w-full min-h-[64px] bg-slate-200 text-slate-900 text-xl font-bold rounded-2xl p-4 cursor-pointer"
          >
            Back to my medication
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // HERO CASE 1: AI PROPOSAL NEEDS CONFIRMATION
  // "Every AI output is a PROPOSAL the elder confirms. Never auto-apply."
  // -------------------------------------------------------------
  if (activeElderProposal) {
    const medData = activeElderProposal.medicationData;
    const anchor = (medData.mealAnchor as MealAnchor) || 'after_lunch';
    const anchorConfig = MEAL_ANCHORS[anchor];

    return (
      <div className="min-h-screen bg-[#fcfbfa] text-[#0f172a] p-6 flex flex-col justify-between max-w-xl mx-auto">
        <div>
          {/* High Contrast Header */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-950 font-bold px-4 py-2 rounded-full text-lg mb-3">
              <Sparkles className="w-5 h-5 text-amber-700" />
              New Proposal from {profile.doctorName}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] leading-tight">
              Dr. Vance recommends adding {activeElderProposal.title}.
            </h1>
          </div>

          {/* Proposal Explanation Card */}
          <div className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-6 mb-8 space-y-4">
            <div className="text-2xl font-bold text-slate-900">
              When to take it:
              <span className="block text-2xl font-extrabold text-[#064e3b] mt-1">
                {anchorConfig.label} ({anchorConfig.windowLabel})
              </span>
            </div>

            <p className="text-xl text-slate-800 leading-relaxed">
              {activeElderProposal.summary}
            </p>

            <div className="bg-white/90 p-4 rounded-xl border border-amber-200 text-xl text-slate-800">
              <strong>Instructions:</strong> {medData.instructions || 'Take 1 tablet with water and food.'}
            </div>

            <p className="text-lg text-amber-950 font-medium italic">
              Nothing will change unless you tap yes below. You are in complete control.
            </p>
          </div>
        </div>

        {/* ONE BIG BUTTON + ONE CALM AMBER DECLINE BUTTON */}
        <div className="space-y-4 pb-4">
          <button
            onClick={() => {
              elderResolveProposal(activeElderProposal.id, true);
              setComfortFeedback(`Approved! ${activeElderProposal.title} is now in your routine.`);
            }}
            className="w-full min-h-[76px] bg-[#064e3b] hover:bg-[#043e2f] text-white text-2xl sm:text-3xl font-extrabold rounded-2xl px-6 py-5 flex items-center justify-center gap-3 shadow-xl active:scale-98 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-9 h-9 text-emerald-300" />
            <span>Yes, add this to my routine</span>
          </button>

          <button
            onClick={() => {
              elderResolveProposal(activeElderProposal.id, false);
              setComfortFeedback('Proposal declined. Your schedule remains unchanged.');
            }}
            className="w-full min-h-[64px] bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300 text-xl font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>No, keep my routine as it is</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // HERO CASE 2: PENDING MEDICATION TO TAKE RIGHT NOW
  // Design Law: One screen = one question = one big button
  // -------------------------------------------------------------
  if (nextPendingMed) {
    const anchorConfig = MEAL_ANCHORS[nextPendingMed.mealAnchor];

    return (
      <div className="min-h-screen bg-[#fcfbfa] text-[#0f172a] p-6 flex flex-col justify-between max-w-xl mx-auto">
        <div>
          {/* Reassurance Banner */}
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] font-bold px-4 py-2 rounded-full text-lg">
              <ShieldCheck className="w-5 h-5 text-[#047857]" />
              Adept • Routine Window
            </span>
            <span className="text-xl font-bold text-slate-700">
              {anchorConfig.windowLabel}
            </span>
          </div>

          {/* Feedback toast if any */}
          {comfortFeedback && (
            <div className="bg-emerald-100 border-2 border-emerald-400 text-emerald-950 p-4 rounded-2xl text-xl font-semibold mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              <span>{comfortFeedback}</span>
            </div>
          )}

          {/* THE ONE QUESTION (22px - 32px font, plain English) */}
          <div className="my-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] leading-tight mb-3">
              Good day, {profile.name.split(' ')[0]}.
            </h1>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-snug">
              Did you take your <span className="text-[#064e3b] underline decoration-emerald-400">{nextPendingMed.friendlyName}</span> with {anchorConfig.label.toLowerCase()}?
            </h2>
          </div>

          {/* Friendly Visual Cue (Shape & Instructions) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm my-6 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md font-bold text-2xl"
                style={{ backgroundColor: nextPendingMed.color || '#3b82f6' }}
              >
                💊
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  {nextPendingMed.friendlyName}
                </h3>
                <p className="text-xl text-slate-600 font-medium">
                  {nextPendingMed.name} ({nextPendingMed.dosage})
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xl text-slate-800">
              <p className="font-semibold text-[#0f172a]">Instructions:</p>
              <p className="mt-1">{nextPendingMed.instructions}</p>
            </div>

            <p className="text-lg text-slate-600">
              <strong>Why you take this:</strong> {nextPendingMed.purpose}
            </p>
          </div>
        </div>

        {/* ONE BIG BUTTON (min-h 72px, tap target 64px+, AAA contrast) */}
        <div className="space-y-4 pb-4">
          <button
            onClick={() => {
              confirmDose(nextPendingMed.id);
              setComfortFeedback(`Wonderful, Arthur! ${nextPendingMed.friendlyName} confirmed.`);
            }}
            className="w-full min-h-[76px] bg-[#064e3b] hover:bg-[#053d2e] text-white text-2xl sm:text-3xl font-black rounded-2xl px-6 py-5 flex items-center justify-center gap-4 shadow-xl active:scale-98 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-300" />
            <span>Yes, I took it</span>
          </button>

          {/* WARM AMBER (NO RED, NO SHAME, NO TIMEOUTS) */}
          <button
            onClick={() => {
              deferDoseComfortably(nextPendingMed.id, 'Arthur chose to rest first.');
              setComfortFeedback('Take your time, Arthur. Sarah knows you are having a relaxed morning.');
            }}
            className="w-full min-h-[64px] bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300 text-xl font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Not yet, I’ll take it in a little while</span>
          </button>

          {/* Veto or Routine Management */}
          <div className="pt-2 text-center">
            <button
              onClick={() => setActiveView('veto')}
              className="text-slate-600 hover:text-slate-900 text-lg font-semibold underline underline-offset-4 py-2 px-4 cursor-pointer"
            >
              Review changes or cancel an update
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // HERO CASE 3: ALL CAUGHT UP! CALM BY DEFAULT (GREEN / NEUTRAL)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#fcfbfa] text-[#0f172a] p-6 flex flex-col justify-between max-w-xl mx-auto">
      <div>
        {/* Calm Status Pill */}
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] font-bold px-4 py-2 rounded-full text-lg mb-6">
          <CheckCircle2 className="w-6 h-6 text-[#047857]" />
          All Caught Up • Calm & Peaceful
        </div>

        {comfortFeedback && (
          <div className="bg-emerald-100 border-2 border-emerald-400 text-emerald-950 p-4 rounded-2xl text-xl font-semibold mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            <span>{comfortFeedback}</span>
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] leading-tight mb-4">
          Everything is steady, Arthur.
        </h1>
        <p className="text-2xl text-slate-800 leading-relaxed mb-8">
          You’ve taken all your scheduled medicines for this window. There is nothing you need to worry about right now.
        </p>

        {/* Completed Routine Overview */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
            Today’s Routine Status
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xl font-bold text-[#064e3b] flex items-center gap-2">
                <Sunrise className="w-6 h-6 text-emerald-700" />
                Breakfast (7:00 – 10:00 AM)
              </span>
              <span className="text-lg font-bold text-emerald-800">Completed ✓</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-xl font-bold text-[#064e3b] flex items-center gap-2">
                <Sun className="w-6 h-6 text-emerald-700" />
                Lunch (12:00 – 2:30 PM)
              </span>
              <span className="text-lg font-bold text-emerald-800">Completed ✓</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xl font-semibold text-slate-700 flex items-center gap-2">
                <Sunset className="w-6 h-6 text-slate-500" />
                Dinner (6:00 – 8:30 PM)
              </span>
              <span className="text-lg text-slate-600 font-medium">Coming later</span>
            </div>
          </div>
        </div>
      </div>

      {/* ONE BIG ACTION BUTTON: HOW ARE YOU FEELING */}
      <div className="space-y-4 pb-4">
        <button
          onClick={() => setActiveView('wellness')}
          className="w-full min-h-[72px] bg-[#064e3b] hover:bg-[#053d2e] text-white text-2xl font-bold rounded-2xl px-6 py-5 flex items-center justify-center gap-3 shadow-xl active:scale-98 cursor-pointer transition-all"
        >
          <HeartHandshake className="w-8 h-8 text-emerald-300" />
          <span>Record how I am feeling</span>
        </button>

        <button
          onClick={() => setActiveView('veto')}
          className="w-full min-h-[64px] bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-300 text-xl font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <span>View recent changes & my veto power</span>
        </button>
      </div>
    </div>
  );
};
