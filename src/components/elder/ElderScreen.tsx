import React, { useState, useEffect, useRef } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { MealAnchor, Medication } from '../../lib/types';
import { MEAL_ANCHORS } from '../../lib/types';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Sunrise,
  Sun,
  Sunset,
  AlertTriangle,
  MessageCircle,
  PhoneCall,
  LogOut,
  VolumeX,
  Droplets,
  Footprints,
  WifiOff,
  Check,
} from 'lucide-react';
import { EmergencySosModal } from '../emergency/EmergencySosModal';
import { CareCircleChatModal } from '../chat/CareCircleChatModal';
import { FamilyVoiceNoteCard } from './FamilyVoiceNoteCard';
import { InactivitySafetyCheckModal } from './InactivitySafetyCheckModal';
import { AskAdeptSheet } from '../ai/AskAdeptSheet';
import { getWhyThisPillHelper } from '../../lib/geminiAiService';

export const ElderScreen: React.FC = () => {
  const {
    activeElderId,
    profile,
    medications,
    doseLogs,
    language,
    setLanguage,
    activeElderProposal,
    confirmDose,
    deferDoseComfortably,
    skipDoseComfortably,
    recordSymptomCheckin,
    elderResolveProposal,
    elderVetoAction,
    elderApproveAuditAction,
    auditLogs,
    familyVoiceNotes,
    activeIncident,
    triggerSosWithEscalation,
    isAdeptSheetOpen,
    openAdeptSheet,
    closeAdeptSheet,
    adeptContextMed,
    adeptInitialQuestion,
    logoutUser,
    isAiSoundEnabled,
    toggleAiSound,
    isOffline,
    offlineQueueCount,
    dailyActivityReminders,
    logHydration,
    logDailyActivity,
  } = useAdept();

  const [activeView, setActiveView] = useState<'main' | 'veto'>('main');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [inactivityCheckOpen, setInactivityCheckOpen] = useState(false);

  // Press-and-hold 2s + 5s cancel countdown for SOS (Prompt 12)
  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const holdTimerRef = useRef<any>(null);
  const cancelCountdownRef = useRef<any>(null);

  // Web Speech API state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Today's date string
  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const todayLogs = doseLogs.filter((l) => l.date === todayStr);

  // Current meal anchor
  const [currentHour] = useState(() => new Date().getHours());
  let currentAnchor: MealAnchor = 'morning_breakfast';
  if (currentHour >= 11 && currentHour < 16) {
    currentAnchor = 'after_lunch';
  } else if (currentHour >= 16 && currentHour < 21) {
    currentAnchor = 'evening_dinner';
  } else if (currentHour >= 21 || currentHour < 6) {
    currentAnchor = 'before_bedtime';
  }

  const [formattedDate] = useState(() =>
    new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  );

  // Filter medications for active elder (Dad vs Mom vs Custom Elder)
  const elderMeds = medications.filter((med) =>
    med.elderId ? med.elderId === activeElderId : activeElderId === 'elder-dad'
  );

  // Next pending medication
  const pendingMedInWindow = elderMeds.find((med) => {
    if (!med.isActive) return false;
    if (med.mealAnchor !== currentAnchor) return false;
    const hasLog = todayLogs.some((l) => l.medicationId === med.id && l.status === 'taken');
    return !hasLog;
  });

  const nextPendingMed =
    pendingMedInWindow ||
    elderMeds.find((med) => {
      if (!med.isActive) return false;
      const hasLog = todayLogs.some((l) => l.medicationId === med.id && l.status === 'taken');
      return !hasLog;
    });

  // Time-aware greeting calculations
  const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

  const t = {
    en: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      allCalm: 'All is peaceful right now',
      windowOpen: 'Meal window is open',
      giantCardTitle: nextPendingMed
        ? nextPendingMed.mealAnchor === 'morning_breakfast'
          ? 'Time for your morning pill, after breakfast'
          : nextPendingMed.mealAnchor === 'after_lunch'
          ? 'Time for your midday capsule, after lunch'
          : 'Time for your evening tablet, with dinner'
        : 'All caught up for right now',
      takenBtn: 'Taken • Yes, I took it',
      laterBtn: 'Later • Remind in a little while',
      skipBtn: 'Skip comfortably today',
      voicePrompt: 'Tap to Speak',
      voiceListening: 'Listening... Say "maine goli kha li" or "I took my pill"',
      voiceHint: 'Say: "maine goli kha li" or "I took my pill"',
      simulateVoice: 'Try Voice: "maine goli kha li"',
      summaryTitle: "Today's Routine (Anchored to Meals)",
      breakfast: 'Morning with breakfast (7–10 AM)',
      lunch: 'Midday after lunch (12–2:30 PM)',
      dinner: 'Evening with dinner (6–8:30 PM)',
      completed: 'Completed ✓',
      inWindow: 'In Window ⏳',
      upcoming: 'Coming later',
      howFeelTitle: 'How do you feel today?',
      howFeelSub: 'Sarah and Dr. Vance check your comfort to keep you walking easily.',
      great: 'Great',
      steady: 'Steady & Calm',
      tired: 'A bit tired',
      discomfort: 'Discomfort / Pain',
      thankYouFeeling: `Thank you, ${profile.name.split(' ')[0]}! Your comfort status has been shared with your care team.`,
      reviewVeto: 'Review routine changes or cancel an update',
      allCaughtUpTitle: `Everything is steady, ${profile.name.split(' ')[0]}.`,
      allCaughtUpBody: 'You have taken your scheduled medicines for this window. Enjoy your day.',
      vetoTitle: 'Recent Routine Changes & Veto',
      vetoDesc: 'You have ultimate authority. Tap Veto to cancel any change made by Sarah or Dr. Vance.',
      vetoBtn: 'Veto and Cancel This Change',
      returnHome: '← Return to Home Screen',
    },
    hi: {
      morning: 'शुभ प्रभात',
      afternoon: 'शुभ दोपहर',
      evening: 'शुभ संध्या',
      allCalm: 'सब कुछ शांत और स्थिर है',
      windowOpen: 'दवाई का समय खुला है',
      giantCardTitle: nextPendingMed
        ? nextPendingMed.mealAnchor === 'morning_breakfast'
          ? 'नाश्ते के बाद, सुबह की गोली का समय'
          : nextPendingMed.mealAnchor === 'after_lunch'
          ? 'दोपहर के भोजन के बाद, दवाई का समय'
          : 'रात के खाने के साथ, शाम की गोली का समय'
        : 'अभी के लिए सब दवाईयां पूरी हैं',
      takenBtn: 'ले ली • हाँ, मैंने ले ली',
      laterBtn: 'बाद में • थोड़ी देर बाद याद दिलाएं',
      skipBtn: 'आज आराम करें • आज नहीं लेनी',
      voicePrompt: 'बोलने के लिए माइक दबाएं',
      voiceListening: 'सुन रहे हैं... बोलें: "मैंने गोली खा ली"',
      voiceHint: 'बोलें: "मैंने गोली खा ली" या "I took my pill"',
      simulateVoice: 'आवाज़ जांचें: "मैंने गोली खा ली"',
      summaryTitle: 'आज का समय-चक्र (भोजन से जुड़ा)',
      breakfast: 'सुबह नाश्ते के बाद (7–10 बजे)',
      lunch: 'दोपहर खाने के बाद (12–2:30 बजे)',
      dinner: 'रात के खाने के साथ (6–8:30 बजे)',
      completed: 'पूर्ण ✓',
      inWindow: 'अभी समय है ⏳',
      upcoming: 'बाद में आएगी',
      howFeelTitle: 'आज आप कैसा महसूस कर रहे हैं?',
      howFeelSub: 'आपकी देखभाल टीम को यह जानकारी मिलती है ताकि आप स्वस्थ रहें।',
      great: 'बहुत अच्छा',
      steady: 'ठीक-ठाक',
      tired: 'थोड़ी थकान',
      discomfort: 'दर्द / बेचैनी',
      thankYouFeeling: 'धन्यवाद आर्थर जी! आपकी तबीयत की जानकारी सारा को मिल गई है।',
      reviewVeto: 'बदलाव देखें या रद्द (Veto) करें',
      allCaughtUpTitle: 'सब कुछ शांत और ठीक है, आर्थर जी।',
      allCaughtUpBody: 'इस पहर की सभी दवाइयां पूरी हो चुकी हैं। आपका दिन शुभ हो।',
      vetoTitle: 'हालिया बदलाव और आपका वीटो अधिकार',
      vetoDesc: 'आप हर फैसले के केंद्र में हैं। किसी भी बदलाव को रद्द करने के लिए वीटो दबाएं।',
      vetoBtn: 'यह बदलाव रद्द करें (Veto)',
      returnHome: '← मुख्य पृष्ठ पर वापस जाएं',
    },
  }[language];

  const handleVoiceCommand = (transcript: string) => {
    const lower = transcript.toLowerCase();
    const isTakenIntent =
      lower.includes('maine goli kha li') ||
      lower.includes('goli kha li') ||
      lower.includes('le li') ||
      lower.includes('took my pill') ||
      lower.includes('taken') ||
      lower.includes('done') ||
      lower.includes('kha li');

    if (isTakenIntent) {
      if (nextPendingMed) {
        confirmDose(nextPendingMed.id, `Voice confirmed: "${transcript}"`);
        const confirmMsg =
          language === 'hi'
            ? `आवाज़ सुनी गई: "${transcript}" • ${nextPendingMed.friendlyName} ले ली गई!`
            : `Voice heard: "${transcript}" • Confirmed!`;
        setFeedbackNotice(confirmMsg);

        // Gentle voice reassurance (respects sound toggle)
        if (isAiSoundEnabled && 'speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(
            language === 'hi'
              ? `बहुत बढ़िया ${profile.name.split(' ')[0]} जी, आपकी दवाई दर्ज हो गई है।`
              : `Wonderful ${profile.name.split(' ')[0]}, your dose has been recorded.`
          );
          utter.lang = language === 'hi' ? 'hi-IN' : 'en-US';
          window.speechSynthesis.speak(utter);
        }
      }
    } else {
      setFeedbackNotice(
        language === 'hi'
          ? `सुना: "${transcript}". कृपया कहें "मैंने गोली खा ली"`
          : `Heard: "${transcript}". Please say "I took my pill"`
      );
    }
  };

  const handleVoiceCommandRef = useRef(handleVoiceCommand);
  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  });

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setSpeechTranscript(transcript);
        handleVoiceCommandRef.current(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      handleVoiceCommand('maine goli kha li');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
        handleVoiceCommand('maine goli kha li');
      }
    }
  };

  const handleSimulateVoice = () => {
    handleVoiceCommand('maine goli kha li');
  };

  // 2s Press-and-hold SOS Handlers (Prompt 12)
  const startSosHold = () => {
    if (sosCountdown !== null) return;
    const startTime = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / 2000) * 100));
      setSosHoldProgress(pct);
      if (pct >= 100) {
        clearInterval(holdTimerRef.current);
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        setSosCountdown(5);
      }
    }, 40);
  };

  const cancelSosHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (sosHoldProgress < 100) {
      setSosHoldProgress(0);
    }
  };

  useEffect(() => {
    if (sosCountdown === null) return;
    if (sosCountdown <= 0) {
      const finishTimer = setTimeout(() => {
        triggerSosWithEscalation(activeElderId);
        setSosCountdown(null);
        setSosHoldProgress(0);
      }, 0);
      return () => clearTimeout(finishTimer);
    }
    cancelCountdownRef.current = setTimeout(() => {
      setSosCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => {
      if (cancelCountdownRef.current) clearTimeout(cancelCountdownRef.current);
    };
  }, [sosCountdown, activeElderId, triggerSosWithEscalation]);

  const handleAbortSosCountdown = () => {
    if (cancelCountdownRef.current) clearTimeout(cancelCountdownRef.current);
    setSosCountdown(null);
    setSosHoldProgress(0);
  };

  // "Why this pill?" Voice Helper (Prompt 10)
  const handleWhyThisPill = async (med: Medication) => {
    openAdeptSheet({ med, question: `Why this pill: ${med.friendlyName}?` });
    try {
      const helper = await getWhyThisPillHelper(med, language);
      if (isAiSoundEnabled && 'speechSynthesis' in window) {
        const spoken = `${helper.whatItIsFor} ${helper.howToTake} ${helper.oneThingToWatch}`;
        const utter = new SpeechSynthesisUtterance(spoken);
        utter.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        window.speechSynthesis.speak(utter);
      }
    } catch {}
  };

  // -------------------------------------------------------------
  // VETO SCREEN (Elder ultimate authority)
  // -------------------------------------------------------------
  if (activeView === 'veto') {
    const vetoableLogs = auditLogs.filter((l) => l.canElderVeto && !l.isVetoed);

    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1A1D1A] p-6 max-w-xl mx-auto flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="bg-[#EAF2EC] text-[#244937] font-bold px-4 py-1.5 rounded-full text-base">
              Adept • Elder Veto
            </span>
            {/* Language Toggle */}
            <div className="flex items-center bg-white border border-[#EAE5DB] p-1 rounded-xl">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  language === 'en' ? 'bg-[#244937] text-white' : 'text-[#70756F]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  language === 'hi' ? 'bg-[#244937] text-white' : 'text-[#70756F]'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-[#1A1D1A] mb-2">{t.vetoTitle}</h1>
          <p className="text-xl text-[#474C46] leading-relaxed mb-6">{t.vetoDesc}</p>

          {vetoableLogs.length === 0 ? (
            <div className="bg-white border-2 border-[#EAE5DB] rounded-3xl p-8 text-center my-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#244937] mx-auto" />
              <p className="text-2xl font-bold text-[#1A1D1A]">
                {language === 'hi' ? 'कोई नया बदलाव नहीं है' : 'No changes need your attention'}
              </p>
              <p className="text-lg text-[#70756F]">
                {language === 'hi'
                  ? 'आपकी दिनचर्या बिल्कुल स्थिर और शांत है।'
                  : 'Your routine is peaceful and unchanged.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5 my-4">
              {vetoableLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="bg-[#FBF5EA] border-2 border-[#EBDBC1] rounded-3xl p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[#92631E] font-bold text-base">
                      {log.actorName}
                    </span>
                    {log.source && (
                      <span className="bg-white text-[#92631E] border border-[#EBDBC1] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        source: {log.sourceLabel || log.source}
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-[#1A1D1A]">{log.action}</h3>
                  <p className="text-xl text-[#474C46] leading-relaxed">
                    {log.plainEnglishDescription}
                  </p>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => {
                        elderApproveAuditAction(log.id);
                        setFeedbackNotice(
                          language === 'hi'
                            ? `स्वीकृत! "${log.action}" दिनचर्या में जारी रहेगा।`
                            : `Approved! "${log.action}" is kept in your routine.`
                        );
                        setActiveView('main');
                      }}
                      className="w-full min-h-[64px] bg-[#244937] hover:bg-[#1B3729] text-white text-xl font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 transition-all"
                    >
                      <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                      <span>{language === 'hi' ? 'हाँ, यह बदलाव ठीक है (स्वीकार)' : 'Keep this change (Approve)'}</span>
                    </button>

                    <button
                      onClick={() => {
                        elderVetoAction(log.id);
                        setFeedbackNotice(
                          language === 'hi'
                            ? `वीटो किया गया: "${log.action}" तुरंत वापस ले लिया गया।`
                            : `Vetoed: "${log.action}" has been completely rolled back.`
                        );
                        setActiveView('main');
                      }}
                      className="w-full min-h-[64px] bg-[#92631E] hover:bg-[#7A4F13] text-white text-xl font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98 transition-all"
                    >
                      <RotateCcw className="w-6 h-6" />
                      <span>{language === 'hi' ? 'नहीं, इसे रद्द करें (वीटो)' : 'Veto this change (Rollback)'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveView('main')}
          className="w-full min-h-[64px] bg-[#1A1D1A] hover:bg-black text-white text-xl font-bold rounded-2xl p-4 cursor-pointer mt-6"
        >
          {t.returnHome}
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // HERO CASE: AI PROPOSAL NEEDS ARTHUR'S APPROVAL
  // -------------------------------------------------------------
  if (activeElderProposal) {
    const medData = activeElderProposal.medicationData;
    const anchor = (medData?.mealAnchor as MealAnchor) || 'after_lunch';
    const anchorConfig = MEAL_ANCHORS[anchor];
    const hasMultipleChanges =
      activeElderProposal.proposedScheduleChanges &&
      activeElderProposal.proposedScheduleChanges.length > 0;

    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1A1D1A] p-6 max-w-xl mx-auto flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-2 bg-[#FBF5EA] border border-[#EBDBC1] text-[#92631E] font-bold px-4 py-1.5 rounded-full text-base">
              <Sparkles className="w-5 h-5 text-[#92631E]" />
              {language === 'hi' ? 'डॉ. वांस का नया प्रस्ताव' : `Proposal from ${profile.doctorName}`}
            </span>

            {/* Language Selector */}
            <div className="flex items-center bg-white border border-[#EAE5DB] p-1 rounded-xl">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  language === 'en' ? 'bg-[#244937] text-white' : 'text-[#70756F]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  language === 'hi' ? 'bg-[#244937] text-white' : 'text-[#70756F]'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1D1A] leading-tight mb-4">
            {language === 'hi'
              ? `डॉ. वांस ने आपकी दिनचर्या में बदलाव का प्रस्ताव दिया है।`
              : `Dr. Vance proposes schedule adjustments for your routine.`}
          </h1>

          <div className="bg-white border-2 border-[#EBDBC1] rounded-3xl p-6 sm:p-7 mb-6 space-y-4 shadow-xs">
            {hasMultipleChanges ? (
              <div className="space-y-4">
                <p className="text-xl text-[#474C46] leading-relaxed">
                  {activeElderProposal.summary}
                </p>

                <div className="space-y-3 pt-2">
                  <div className="text-lg font-bold text-[#1A1D1A] uppercase tracking-wider text-xs">
                    {language === 'hi' ? 'प्रस्तावित बदलाव:' : 'Proposed Schedule Adjustments:'}
                  </div>

                  {activeElderProposal.proposedScheduleChanges!.map((change, idx) => {
                    const changeAnchor = change.mealAnchor ? MEAL_ANCHORS[change.mealAnchor] : null;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border text-lg ${
                          change.action === 'discontinue'
                            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                            : change.action === 'modify'
                            ? 'bg-sky-50/70 border-sky-200 text-sky-950'
                            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>
                            {change.friendlyName || change.medicationName} ({change.dosage})
                          </span>
                          <span className="text-xs uppercase px-2 py-0.5 rounded-full font-bold">
                            {change.action}
                          </span>
                        </div>
                        {changeAnchor && (
                          <div className="text-sm font-semibold text-slate-700 mt-1">
                            With: {changeAnchor.label} ({changeAnchor.windowLabel})
                          </div>
                        )}
                        {change.instructions && (
                          <div className="text-base text-slate-600 mt-0.5">
                            {change.instructions}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xl font-bold text-[#1A1D1A]">
                  {language === 'hi' ? 'कब लेनी है:' : 'When to take it:'}
                  <span className="block text-2xl font-black text-[#244937] mt-1">
                    {anchorConfig.label} ({anchorConfig.windowLabel})
                  </span>
                </div>

                <p className="text-xl text-[#474C46] leading-relaxed">
                  {activeElderProposal.summary}
                </p>

                <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DB] text-xl text-[#1A1D1A]">
                  <strong>{language === 'hi' ? 'निर्देश:' : 'Instructions:'}</strong>{' '}
                  {medData.instructions || 'Take 1 tablet with water and food.'}
                </div>
              </div>
            )}

            <p className="text-lg text-[#92631E] font-medium italic pt-1">
              {language === 'hi'
                ? 'जब तक आप हाँ नहीं कहते, यह दिनचर्या में नहीं जुड़ेगी।'
                : 'Nothing will change unless you tap yes below. You are in control.'}
            </p>
          </div>

          {/* Mandatory Confirm With Your Doctor Safety Note */}
          <div className="bg-[#FBF5EA] border border-[#EBDBC1] p-4 rounded-2xl text-base text-[#92631E] flex items-start gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-[#92631E] shrink-0 mt-0.5" />
            <div>
              <strong>{language === 'hi' ? 'डॉक्टर से पुष्टि करें:' : 'Confirm with your doctor:'}</strong>{' '}
              {language === 'hi'
                ? `यह डॉ. वांस के परामर्श पर आधारित एआई प्रस्ताव है। किसी भी बदलाव से पहले हमेशा अपने डॉक्टर से पुष्टि करें।`
                : `This is an AI proposal based on Dr. ${profile.doctorName}'s clinical notes. Please confirm with your doctor or pharmacist before changing your regimen.`}
            </div>
          </div>
        </div>

        <div className="space-y-4 pb-4">
          <button
            onClick={() => {
              elderResolveProposal(activeElderProposal.id, true);
              setFeedbackNotice(
                language === 'hi'
                  ? `स्वीकृत! नई दिनचर्या दर्ज हो गई है।`
                  : `Approved! Schedule adjustments are now active in your routine.`
              );
            }}
            className="w-full min-h-[76px] bg-[#244937] hover:bg-[#1B3729] text-white text-2xl sm:text-3xl font-bold rounded-2xl px-6 py-5 flex items-center justify-center gap-3 shadow-md active:scale-98 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-300" />
            <span>{language === 'hi' ? 'हाँ, दिनचर्या में जोड़ें' : 'Yes, apply these changes to my routine'}</span>
          </button>

          <button
            onClick={() => {
              elderResolveProposal(activeElderProposal.id, false);
              setFeedbackNotice(
                language === 'hi' ? 'प्रस्ताव अस्वीकार कर दिया गया।' : 'Proposal declined.'
              );
            }}
            className="w-full min-h-[64px] bg-[#FBF5EA] hover:bg-[#F5EAD3] text-[#7A4F13] border-2 border-[#EBDBC1] text-xl font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>{language === 'hi' ? 'नहीं, अभी ऐसे ही रहने दें' : 'No, keep my routine as it is'}</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN ELDER HOME VIEW
  // -------------------------------------------------------------
  return (
    <div id="elder-screen-root" className="min-h-screen bg-[#FAF8F5] text-[#1A1D1A] p-6 max-w-xl mx-auto flex flex-col justify-between font-sans">
      <div className="space-y-6">
        {/* Top Header: Time-aware greeting & Hindi/English Toggle */}
        <header className="pt-2">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-[#EAF2EC] border border-[#C6DBD0] text-[#244937] px-3.5 py-1 rounded-full text-base font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#244937] animate-pulse" />
                <span>{nextPendingMed ? t.windowOpen : t.allCalm}</span>
              </div>

              {/* Prompt 19: Tiny Offline Resilience Indicator */}
              {isOffline && (
                <div
                  id="elder-offline-indicator"
                  className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-full text-xs font-bold animate-in fade-in"
                  title="Offline: events safely queued in IndexedDB with client-generated UUIDs"
                >
                  <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>{language === 'hi' ? 'सहेजा गया, सिंक होगा' : 'Saved, will sync'}</span>
                  {offlineQueueCount > 0 && (
                    <span className="bg-amber-300 text-amber-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                      {offlineQueueCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Ask Adept AI Trigger Button */}
              <button
                onClick={() => openAdeptSheet({ question: "What's next for today?" })}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Ask</span>
                <span>Adept</span>
              </button>

              {/* Adept Voice Audio Mute/Unmute Toggle Button */}
              <button
                type="button"
                onClick={toggleAiSound}
                title={isAiSoundEnabled ? 'Adept Voice: ON (Tap to mute)' : 'Adept Voice: MUTED (Tap to unmute)'}
                className={`h-8 px-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all border ${
                  isAiSoundEnabled
                    ? 'bg-emerald-50 text-[#064e3b] border-emerald-300'
                    : 'bg-slate-100 text-slate-500 border-slate-300'
                }`}
              >
                {isAiSoundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#064e3b]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {/* Language Switcher */}
              <div className="flex items-center bg-white border border-[#EAE5DB] p-0.5 rounded-xl shadow-xs">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-[#244937] text-white shadow-xs'
                      : 'text-[#70756F] hover:text-[#1A1D1A]'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'hi'
                      ? 'bg-[#244937] text-white shadow-xs'
                      : 'text-[#70756F] hover:text-[#1A1D1A]'
                  }`}
                >
                  हिंदी
                </button>
              </div>

              {/* Log Out of Elder Tablet Button */}
              <button
                type="button"
                onClick={logoutUser}
                title="Log Out of Elder Profile"
                className="h-8 w-8 rounded-xl bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <h1 className="text-[32px] sm:text-[38px] font-bold text-[#1A1D1A] tracking-tight leading-tight">
            {t[timeOfDay]}, {profile.name.split(' ')[0]}
            {language === 'hi' ? ' जी' : ''}.
          </h1>
          <p className="text-xl text-[#70756F] mt-1 font-medium">
            {formattedDate}
          </p>
        </header>

        {/* Prompt 12: Reassurance Banner if SOS Incident is Open */}
        {activeIncident && activeIncident.status !== 'resolved' && (
          <div className="bg-emerald-900 border-2 border-emerald-400 text-white p-5 rounded-3xl shadow-lg space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-300 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h3 className="text-xl font-bold leading-tight">
                  {activeIncident.status === 'claimed'
                    ? `Help is coming: ${activeIncident.claimedBy || 'Sarah'} is on it`
                    : 'Help alert sent to your family! Someone is responding...'}
                </h3>
                <p className="text-sm text-emerald-200 mt-1">
                  Your phone is connected. Keep calm, we are with you.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-700/60">
              <a
                href="tel:112"
                className="h-11 bg-white hover:bg-slate-100 text-emerald-950 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs shadow-xs"
              >
                <PhoneCall className="w-4 h-4 text-emerald-900" />
                <span>Call 112 (EMS)</span>
              </a>
              <a
                href={`tel:${profile.doctorPhone || '555-234-8901'}`}
                className="h-11 bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-500 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs"
              >
                <span>Dr. {profile.doctorName || 'Vance'}</span>
              </a>
            </div>
          </div>
        )}

        {/* Prompt 14: FAMILY VOICE NOTE AS FIRST PROMINENT CARD */}
        {familyVoiceNotes && familyVoiceNotes.length > 0 && (
          <FamilyVoiceNoteCard note={familyVoiceNotes[0]} />
        )}

        {/* Emergency SOS & Family Chat Action Bar */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Prompt 12: Permanent SOS Button with 2s press-and-hold */}
          <button
            onMouseDown={startSosHold}
            onMouseUp={cancelSosHold}
            onMouseLeave={cancelSosHold}
            onTouchStart={startSosHold}
            onTouchEnd={cancelSosHold}
            className="min-h-[64px] relative overflow-hidden bg-red-600 hover:bg-red-700 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-md cursor-pointer active:scale-98 transition-all select-none"
          >
            {/* Visual fill indicator during 2s hold */}
            {sosHoldProgress > 0 && (
              <div
                className="absolute inset-0 bg-red-800 transition-all pointer-events-none"
                style={{ width: `${sosHoldProgress}%` }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-base font-black uppercase tracking-wide leading-tight">
                  {language === 'hi' ? 'आपातकालीन' : 'Emergency'}
                </div>
                <div className="text-xs text-red-100 font-bold">
                  {sosHoldProgress > 0 ? `Hold (${sosHoldProgress}%)` : (language === 'hi' ? '2s दबाए रखें' : 'Hold 2s')}
                </div>
              </div>
            </div>
            <span className="relative z-10 text-xs bg-white text-red-700 px-2 py-1 rounded-full font-black">
              SOS
            </span>
          </button>

          {/* Family Chat Button */}
          <button
            onClick={() => setChatOpen(true)}
            className="min-h-[64px] bg-white hover:bg-emerald-50 border-2 border-[#064e3b]/30 text-[#064e3b] rounded-2xl p-3.5 flex items-center justify-between shadow-xs cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-[#064e3b]" />
              </div>
              <div className="text-left">
                <div className="text-base font-black tracking-wide leading-tight text-slate-900">
                  {language === 'hi' ? 'परिवार चैट' : 'Family Chat'}
                </div>
                <div className="text-xs text-emerald-800 font-bold">
                  {language === 'hi' ? 'बातचीत करें' : 'Group & Direct'}
                </div>
              </div>
            </div>
            <span className="text-xs bg-emerald-100 text-[#064e3b] px-2 py-1 rounded-full font-black">
              Chat
            </span>
          </button>
        </div>

        {/* Feedback Banner if any action occurred */}
        {feedbackNotice && (
          <div className="bg-[#EAF2EC] border-2 border-[#C6DBD0] text-[#244937] p-4 rounded-2xl text-xl font-bold flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-7 h-7 text-[#244937] shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* HERO 1: ONE NEXT ACTION AS A GIANT CARD                  */}
        {/* ========================================================= */}
        {nextPendingMed ? (
          <div id="elder-main-action-card" className="bg-white border-2 border-[#EAE5DB] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
            <div>
              <span className="text-base font-bold text-[#244937] bg-[#EAF2EC] px-3.5 py-1 rounded-full uppercase tracking-wide">
                {MEAL_ANCHORS[nextPendingMed.mealAnchor]?.label}
              </span>
              <h2 className="text-[26px] sm:text-[30px] font-extrabold text-[#1A1D1A] mt-3 leading-snug">
                {t.giantCardTitle}
              </h2>
            </div>

            {/* Pill Visual Cue */}
            <div className="bg-[#FAF8F5] border border-[#EAE5DB] rounded-2xl p-5 flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xs shrink-0"
                style={{ backgroundColor: nextPendingMed.color || '#244937' }}
              >
                💊
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-[#1A1D1A] leading-tight">
                  {nextPendingMed.friendlyName}
                </h3>
                <p className="text-lg text-[#70756F] font-medium mt-0.5">
                  {nextPendingMed.name} ({nextPendingMed.dosage})
                </p>
                <p className="text-base text-[#474C46] mt-1">
                  {nextPendingMed.instructions}
                </p>
              </div>
            </div>

            {/* Prompt 10: "Why this pill?" Voice Helper Button */}
            <button
              onClick={() => handleWhyThisPill(nextPendingMed)}
              className="w-full min-h-[52px] bg-[#FBF5EA] hover:bg-[#F5EAD3] border border-[#EBDBC1] text-[#7A4F13] rounded-2xl px-4 py-2.5 flex items-center justify-center gap-2 font-bold text-base cursor-pointer active:scale-98 transition-all"
            >
              <Volume2 className="w-5 h-5 text-[#92631E]" />
              <span>{language === 'hi' ? 'यह गोली क्यों? (सुनें)' : 'Why this pill? (Listen)'}</span>
            </button>

            {/* BIG ACTION BUTTONS: TAKEN / LATER / SKIP */}
            <div className="space-y-3.5 pt-2">
              {/* 1. TAKEN (Giant Calm Accent Button) */}
              <button
                onClick={() => {
                  confirmDose(nextPendingMed.id);
                  setFeedbackNotice(
                    language === 'hi'
                      ? `शाबाश ${profile.name.split(' ')[0]} जी! ${nextPendingMed.friendlyName} ले ली गई है।`
                      : `Wonderful ${profile.name.split(' ')[0]}! ${nextPendingMed.friendlyName} confirmed.`
                  );
                }}
                className="w-full min-h-[72px] bg-[#244937] hover:bg-[#1B3729] text-white text-2xl font-bold rounded-2xl px-6 py-5 flex items-center justify-center gap-3 shadow-md active:scale-98 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                <span>{t.takenBtn}</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 2. LATER (Warm Amber) */}
                <button
                  onClick={() => {
                    deferDoseComfortably(nextPendingMed.id, 'Taking in a little while.');
                    setFeedbackNotice(
                      language === 'hi'
                        ? 'कोई जल्दी नहीं है। थोड़ी देर बाद याद दिलाएंगे।'
                        : `Take your time, ${profile.name.split(' ')[0]}. We will check in later.`
                    );
                  }}
                  className="w-full min-h-[64px] bg-[#FBF5EA] hover:bg-[#F5EAD3] text-[#7A4F13] border-2 border-[#EBDBC1] text-xl font-bold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Clock className="w-5 h-5 text-[#92631E]" />
                  <span>{t.laterBtn}</span>
                </button>

                {/* 3. SKIP (Gentle Amber, No Shame) */}
                <button
                  onClick={() => {
                    skipDoseComfortably(nextPendingMed.id, `${profile.name.split(' ')[0]} chose to rest today.`);
                    setFeedbackNotice(
                      language === 'hi'
                        ? 'आज के लिए यह खुराक छोड़ दी गई है। केयर टीम को सूचित कर दिया गया है।'
                        : 'Dose skipped comfortably today. Care team informed.'
                    );
                  }}
                  className="w-full min-h-[64px] bg-white hover:bg-[#FAF8F5] text-[#474C46] border-2 border-[#D8D1C3] text-xl font-bold rounded-2xl px-4 py-4 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <span>{t.skipBtn}</span>
                </button>
              </div>
            </div>

            {/* HERO 2: BIG VOICE BUTTON (Web Speech API) */}
            <div className="pt-2 border-t border-[#EAE5DB]">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  id="elder-voice-btn"
                  onClick={toggleListening}
                  className={`w-full flex-1 min-h-[68px] rounded-2xl font-bold text-xl px-5 py-4 flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs active:scale-98 ${
                    isListening
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-[#FAF8F5] hover:bg-[#EAF2EC] text-[#244937] border-2 border-[#C6DBD0]'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-7 h-7" />
                      <span>{t.voiceListening}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-7 h-7 text-[#244937]" />
                      <span>{t.voicePrompt}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSimulateVoice}
                  title="Simulate speech: 'maine goli kha li'"
                  className="bg-white hover:bg-[#FAF8F5] border border-[#D8D1C3] text-[#70756F] text-xs font-bold px-3 py-2 rounded-xl shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{t.simulateVoice}</span>
                </button>
              </div>
              <p className="text-xs text-[#70756F] text-center mt-2 font-medium">
                {speechTranscript ? (
                  <span className="font-bold text-[#244937]">Heard: "{speechTranscript}"</span>
                ) : (
                  t.voiceHint
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-[#EAE5DB] rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#EAF2EC] text-[#244937] flex items-center justify-center mx-auto text-3xl font-bold">
              ✓
            </div>
            <h2 className="text-3xl font-black text-[#1A1D1A]">
              {t.allCaughtUpTitle}
            </h2>
            <p className="text-xl text-[#474C46] leading-relaxed max-w-md mx-auto">
              {t.allCaughtUpBody}
            </p>
          </div>
        )}

        {/* HERO 3: CALM 3-ITEM SUMMARY OF THE DAY (Meal Anchors) */}
        <section className="bg-white border border-[#EAE5DB] rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-[#1A1D1A] uppercase tracking-wide">
            {t.summaryTitle}
          </h3>

          <div className="space-y-3">
            {/* Morning (Breakfast) */}
            {(() => {
              const meds = elderMeds.filter((m) => m.mealAnchor === 'morning_breakfast');
              const medNames = meds.map((m) => m.friendlyName).join(', ') || 'No morning doses';
              const isDone =
                meds.length > 0 &&
                meds.every((m) =>
                  todayLogs.some((l) => l.medicationId === m.id && l.status === 'taken')
                );
              return (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DB]">
                  <div className="flex items-center gap-3">
                    <Sunrise className="w-6 h-6 text-[#244937]" />
                    <div>
                      <div className="font-bold text-lg text-[#1A1D1A]">{t.breakfast}</div>
                      <div className="text-sm text-[#70756F]">{medNames}</div>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-base px-3 py-1 rounded-full ${
                      isDone
                        ? 'text-[#244937] bg-[#EAF2EC]'
                        : 'text-slate-600 bg-slate-100'
                    }`}
                  >
                    {isDone ? t.completed : t.inWindow}
                  </span>
                </div>
              );
            })()}

            {/* Midday (Lunch) */}
            {(() => {
              const meds = elderMeds.filter((m) => m.mealAnchor === 'after_lunch');
              const medNames = meds.map((m) => m.friendlyName).join(', ') || 'No midday doses';
              const isDone =
                meds.length > 0 &&
                meds.every((m) =>
                  todayLogs.some((l) => l.medicationId === m.id && l.status === 'taken')
                );
              return (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DB]">
                  <div className="flex items-center gap-3">
                    <Sun className="w-6 h-6 text-[#92631E]" />
                    <div>
                      <div className="font-bold text-lg text-[#1A1D1A]">{t.lunch}</div>
                      <div className="text-sm text-[#70756F]">{medNames}</div>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-base px-3 py-1 rounded-full ${
                      isDone
                        ? 'text-[#244937] bg-[#EAF2EC]'
                        : 'text-[#92631E] bg-[#FBF5EA]'
                    }`}
                  >
                    {isDone ? t.completed : t.inWindow}
                  </span>
                </div>
              );
            })()}

            {/* Evening (Dinner) */}
            {(() => {
              const meds = elderMeds.filter((m) => m.mealAnchor === 'evening_dinner');
              const medNames = meds.map((m) => m.friendlyName).join(', ') || 'No evening doses';
              const isDone =
                meds.length > 0 &&
                meds.every((m) =>
                  todayLogs.some((l) => l.medicationId === m.id && l.status === 'taken')
                );
              return (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DB]">
                  <div className="flex items-center gap-3">
                    <Sunset className="w-6 h-6 text-[#70756F]" />
                    <div>
                      <div className="font-bold text-lg text-[#1A1D1A]">{t.dinner}</div>
                      <div className="text-sm text-[#70756F]">{medNames}</div>
                    </div>
                  </div>
                  <span
                    className={`font-semibold text-base px-3 py-1 rounded-full ${
                      isDone
                        ? 'text-[#244937] bg-[#EAF2EC] font-bold'
                        : 'text-[#70756F]'
                    }`}
                  >
                    {isDone ? t.completed : t.upcoming}
                  </span>
                </div>
              );
            })()}
          </div>
        </section>

        {/* PROMPT 20: HYDRATION & DAILY ROUTINE ACTIVITIES */}
        <section id="elder-hydration-activities" className="bg-white border border-[#EAE5DB] rounded-3xl p-6 shadow-xs space-y-5">
          {/* Hydration Widget */}
          {(() => {
            const hydrationRem = dailyActivityReminders.find((r) => r.type === 'hydration');
            const target = hydrationRem?.dailyTarget || 6;
            const progress = hydrationRem?.currentProgress || 0;
            const isCompleted = progress >= target;

            return (
              <div className="bg-cyan-50/70 border border-cyan-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {language === 'hi' ? 'दैनिक जल सेवन' : 'Daily Hydration'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {progress} / {target} {language === 'hi' ? 'गिलास पूरे हुए' : 'glasses today'}
                      </p>
                    </div>
                  </div>

                  {isCompleted && (
                    <span className="text-xs font-bold bg-cyan-200 text-cyan-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'लक्ष्य पूरा' : 'Goal met'}</span>
                    </span>
                  )}
                </div>

                {/* Droplets row visualization */}
                <div className="flex items-center justify-between gap-1.5 py-1">
                  {Array.from({ length: target }).map((_, idx) => {
                    const isFilled = idx < progress;
                    return (
                      <div
                        key={idx}
                        className={`flex-1 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isFilled
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-white border border-cyan-200 text-cyan-300'
                        }`}
                      >
                        <Droplets className="w-4 h-4 fill-current" />
                      </div>
                    );
                  })}
                </div>

                {/* 1-Tap Drink Water Button (Min 56px touch target) */}
                <button
                  id="elder-log-water-btn"
                  onClick={() => {
                    logHydration(1);
                    setFeedbackNotice(
                      language === 'hi'
                        ? 'बहुत बढ़िया! 1 गिलास पानी दर्ज कर लिया गया।'
                        : 'Refreshing! 1 glass of water recorded.'
                    );
                  }}
                  className="w-full min-h-[58px] bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2.5 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <Droplets className="w-5 h-5 fill-current" />
                  <span>
                    {language === 'hi'
                      ? 'पानी पिया • 1 गिलास दर्ज करें'
                      : 'Drank Water • Log 1 Glass 💧'}
                  </span>
                </button>
              </div>
            );
          })()}

          {/* Daily Routine Activities (Walk, Call, etc.) */}
          {(() => {
            const nonHydration = dailyActivityReminders.filter((r) => r.type !== 'hydration');
            if (nonHydration.length === 0) return null;

            return (
              <div className="space-y-2.5 pt-1">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  {language === 'hi' ? 'आज की गतिविधियां' : 'Daily Routine Activities'}
                </h4>

                <div className="space-y-2.5">
                  {nonHydration.map((rem) => {
                    return (
                      <div
                        key={rem.id}
                        className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                          rem.isCompletedToday
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              rem.isCompletedToday
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {rem.type === 'walk' ? (
                              <Footprints className="w-5 h-5" />
                            ) : rem.type === 'call' ? (
                              <PhoneCall className="w-5 h-5" />
                            ) : (
                              <Sparkles className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-base text-slate-900 leading-snug truncate">
                              {language === 'hi' ? rem.titleHi : rem.title}
                            </h5>
                            <p className="text-xs text-slate-500 font-medium">
                              {rem.scheduledTime} • {language === 'hi' ? rem.descriptionHi : rem.description}
                            </p>
                          </div>
                        </div>

                        {/* 1-Tap Toggle (Min 56px touch target) */}
                        <button
                          onClick={() => {
                            if (!rem.isCompletedToday) {
                              logDailyActivity(rem.id);
                              setFeedbackNotice(
                                language === 'hi'
                                  ? `${rem.titleHi} पूरी हो गई!`
                                  : `Completed: ${rem.title}!`
                              );
                            }
                          }}
                          className={`min-h-[52px] px-4 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                            rem.isCompletedToday
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-default'
                              : 'bg-[#244937] hover:bg-[#1B3729] text-white shadow-xs active:scale-98'
                          }`}
                        >
                          {rem.isCompletedToday ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              <span>{language === 'hi' ? 'पूर्ण ✓' : 'Done ✓'}</span>
                            </>
                          ) : (
                            <span>{language === 'hi' ? 'पूरा हुआ' : 'Mark Done'}</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </section>

        {/* HERO 4: ONE QUESTION DAILY "HOW DO YOU FEEL?" (4 FACES) */}
        <section id="elder-feeling-checkin" className="bg-white border border-[#EAE5DB] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-[#1A1D1A] tracking-tight">
              {t.howFeelTitle}
            </h3>
            <p className="text-lg text-[#70756F] mt-1">{t.howFeelSub}</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-2">
            {/* Face 1: Great */}
            <button
              onClick={() => {
                setSelectedFeeling('great');
                recordSymptomCheckin('great', 'Feeling wonderful and active');
                setFeedbackNotice(t.thankYouFeeling);
              }}
              className={`min-h-[80px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 ${
                selectedFeeling === 'great'
                  ? 'border-[#244937] bg-[#EAF2EC] ring-4 ring-[#C6DBD0]'
                  : 'border-[#EAE5DB] hover:border-[#244937] bg-[#FAF8F5]'
              }`}
            >
              <span className="text-4xl">😊</span>
              <span className="font-bold text-lg text-[#1A1D1A]">{t.great}</span>
            </button>

            {/* Face 2: Steady */}
            <button
              onClick={() => {
                setSelectedFeeling('steady');
                recordSymptomCheckin('steady', 'Steady and comfortable');
                setFeedbackNotice(t.thankYouFeeling);
              }}
              className={`min-h-[80px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 ${
                selectedFeeling === 'steady'
                  ? 'border-[#244937] bg-[#EAF2EC] ring-4 ring-[#C6DBD0]'
                  : 'border-[#EAE5DB] hover:border-[#244937] bg-[#FAF8F5]'
              }`}
            >
              <span className="text-4xl">😌</span>
              <span className="font-bold text-lg text-[#1A1D1A]">{t.steady}</span>
            </button>

            {/* Face 3: Tired */}
            <button
              onClick={() => {
                setSelectedFeeling('tired');
                recordSymptomCheckin('tired', 'Feeling a bit tired');
                setFeedbackNotice(t.thankYouFeeling);
              }}
              className={`min-h-[80px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 ${
                selectedFeeling === 'tired'
                  ? 'border-[#92631E] bg-[#FBF5EA] ring-4 ring-[#EBDBC1]'
                  : 'border-[#EAE5DB] hover:border-[#92631E] bg-[#FAF8F5]'
              }`}
            >
              <span className="text-4xl">🥱</span>
              <span className="font-bold text-lg text-[#1A1D1A]">{t.tired}</span>
            </button>

            {/* Face 4: Discomfort */}
            <button
              onClick={() => {
                setSelectedFeeling('discomfort');
                recordSymptomCheckin('discomfort', 'Reported discomfort or joint stiffness');
                setFeedbackNotice(t.thankYouFeeling);
              }}
              className={`min-h-[80px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 ${
                selectedFeeling === 'discomfort'
                  ? 'border-[#92631E] bg-[#FBF5EA] ring-4 ring-[#EBDBC1]'
                  : 'border-[#EAE5DB] hover:border-[#92631E] bg-[#FAF8F5]'
              }`}
            >
              <span className="text-4xl">😣</span>
              <span className="font-bold text-lg text-[#1A1D1A]">{t.discomfort}</span>
            </button>
          </div>
        </section>
      </div>

      {/* Bottom Veto & Governance Access */}
      <footer className="pt-8 pb-4 text-center">
        <button
          onClick={() => setActiveView('veto')}
          className="text-base text-[#70756F] hover:text-[#1A1D1A] font-semibold underline underline-offset-4 cursor-pointer py-2 px-4"
        >
          {t.reviewVeto}
        </button>
      </footer>

      {/* Prompt 12: 5s Cancel Countdown Modal */}
      {sosCountdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white border-4 border-red-600 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-4xl font-black animate-pulse">
              {sosCountdown}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {language === 'hi' ? `आपातकालीन सूचना: ${sosCountdown}s` : `Emergency Alert in ${sosCountdown}s`}
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {language === 'hi'
                  ? 'सारा और जेम्स को आपका स्थान भेजा जा रहा है। रद्द करने के लिए नीचे दबाएं।'
                  : 'Alerting Sarah, James, and care circle with your live location link.'}
              </p>
            </div>
            <button
              onClick={handleAbortSosCountdown}
              className="w-full min-h-[64px] bg-slate-900 hover:bg-black text-white text-xl font-bold rounded-2xl cursor-pointer active:scale-98 transition-all"
            >
              {language === 'hi' ? 'रद्द करें (मैं ठीक हूँ)' : "Cancel SOS (I'm okay)"}
            </button>
          </div>
        </div>
      )}

      {/* Emergency & SOS Direct Options Modal */}
      <EmergencySosModal
        isOpen={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
      />

      {/* Care Circle Family Chat Modal */}
      <CareCircleChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        defaultChannelId="group"
      />

      {/* Prompt 13: Inactivity Safety Net Modal */}
      <InactivitySafetyCheckModal
        isOpen={inactivityCheckOpen}
        onConfirmOkay={() => setInactivityCheckOpen(false)}
        onSnooze={() => setInactivityCheckOpen(false)}
        onTriggerSos={() => {
          setInactivityCheckOpen(false);
          triggerSosWithEscalation(activeElderId);
        }}
      />

      {/* Prompt 8 & 10: Ask Adept AI Bottom Sheet */}
      <AskAdeptSheet
        isOpen={isAdeptSheetOpen}
        onClose={closeAdeptSheet}
        contextMed={adeptContextMed}
        initialQuestion={adeptInitialQuestion}
      />
    </div>
  );
};
