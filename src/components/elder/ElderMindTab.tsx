import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAdept } from '../../context/AdeptContext';
import {
  Brain,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  Heart,
  HelpCircle,
  RotateCcw,
  Clock,
  Pill,
  Sun,
  Coffee,
  ArrowRight,
  Smile,
} from 'lucide-react';
import type { CogGameType, MemoryLanePhoto, RoutineRecallQuestion } from '../../lib/types';
import { generateRoutineRecallQuestions } from '../../lib/cognitiveEngine';

export const ElderMindTab: React.FC = () => {
  const {
    activeElder,
    language,
    memoryLanePhotos,
    medications,
    doseLogs,
    cognitiveLevels,
    recordCogEvent,
    isAiSoundEnabled,
    toggleAiSound,
  } = useAdept();

  const isHindi = language === 'hi';
  const elderFirstName = activeElder.name.split(' ')[0] || 'Dad';

  // Active module: Memory Lane or Routine Recall
  const [activeModule, setActiveModule] = useState<CogGameType>('memory_lane');

  // Session state
  const [sessionIndex, setSessionIndex] = useState<number>(0);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [gentleHintText, setGentleHintText] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [encouragementNote, setEncouragementNote] = useState<string>('');
  const [isSpeakingCaption, setIsSpeakingCaption] = useState<boolean>(false);

  // Timing for responseMs
  const questionStartTimeRef = useRef<number>(0);
  const hintUsedRef = useRef<boolean>(false);

  // Memory lane photos pool
  const photosPool: MemoryLanePhoto[] =
    memoryLanePhotos.length > 0 ? memoryLanePhotos : [];

  // Routine recall questions pool
  const routineQuestions: RoutineRecallQuestion[] = useMemo(
    () =>
      generateRoutineRecallQuestions(
        medications,
        doseLogs,
        elderFirstName,
        language
      ),
    [medications, doseLogs, elderFirstName, language]
  );

  const totalQuestionsInSession = 5;

  // Current item
  const currentPhoto = photosPool[sessionIndex % Math.max(1, photosPool.length)];
  const currentRoutineQ = routineQuestions[sessionIndex % Math.max(1, routineQuestions.length)];

  // Current level
  const currentLevelData = cognitiveLevels[activeModule] || {
    game: activeModule,
    level: 2,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    history: [],
  };

  // Reset timing when question changes
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    hintUsedRef.current = false;
    const timer = setTimeout(() => {
      setGentleHintText(null);
      setSelectedOptionId(null);
      setIsAnswerRevealed(false);
      setEncouragementNote('');
      setIsSpeakingCaption(false);
    }, 0);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    return () => clearTimeout(timer);
  }, [sessionIndex, activeModule]);

  // Voice narration helper
  const speakText = useCallback(
    (text: string) => {
      if (!isAiSoundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.88;
        utterance.pitch = 1.0;
        utterance.lang = isHindi ? 'hi-IN' : 'en-US';
        utterance.onstart = () => setIsSpeakingCaption(true);
        utterance.onend = () => setIsSpeakingCaption(false);
        utterance.onerror = () => setIsSpeakingCaption(false);
        window.speechSynthesis.speak(utterance);
      } catch {}
    },
    [isAiSoundEnabled, isHindi]
  );

  // Build 3 options for Memory Lane photo
  const getMemoryLaneOptions = () => {
    if (!currentPhoto) return [];
    const correctOption = {
      id: 'opt-correct',
      label: isHindi && currentPhoto.name === 'Rahul' ? 'राहुल (पोता)' : `${currentPhoto.name} (${currentPhoto.relationship})`,
      isCorrect: true,
    };

    // Pick 2 decoys from other photos or presets
    const decoys = photosPool
      .filter((p) => p.id !== currentPhoto.id)
      .map((p) => ({
        id: `opt-${p.id}`,
        label: isHindi && p.name === 'Sarah' ? 'सारा (बेटी)' : `${p.name} (${p.relationship})`,
        isCorrect: false,
      }));

    if (decoys.length < 2) {
      decoys.push({
        id: 'opt-decoy-neighbor',
        label: isHindi ? 'सुभाष (मित्र)' : 'Arthur (Old friend from Bath)',
        isCorrect: false,
      });
      decoys.push({
        id: 'opt-decoy-colleague',
        label: isHindi ? 'आनंद (सहकर्मी)' : 'David (Neighbor)',
        isCorrect: false,
      });
    }

    // Deterministic shuffle based on sessionIndex
    const all = [correctOption, decoys[0], decoys[1]];
    const offset = sessionIndex % 3;
    const shuffled = [
      all[offset],
      all[(offset + 1) % 3],
      all[(offset + 2) % 3],
    ];
    return shuffled;
  };

  const handleOptionClick = useCallback(
    (isCorrect: boolean, optionId: string, _optionLabel: string) => {
      if (isAnswerRevealed && isCorrect) return;

      const responseMs = Math.max(800, Date.now() - questionStartTimeRef.current);
      setSelectedOptionId(optionId);

      if (isCorrect) {
        setIsAnswerRevealed(true);
        const enc = isHindi
          ? 'शानदार! यह बिल्कुल सही है।'
          : 'Wonderful! You remembered beautifully.';
        setEncouragementNote(enc);

        // Record cog event
        recordCogEvent({
          game: activeModule,
          item: activeModule === 'memory_lane' ? currentPhoto?.name || 'Photo' : currentRoutineQ?.id || 'Routine',
          correct: true,
          responseMs,
          hintUsed: hintUsedRef.current,
          level: currentLevelData.level,
          elderLanguage: language,
        });

        // Voice read caption
        const captionToRead =
          activeModule === 'memory_lane'
            ? (isHindi && currentPhoto?.captionHi ? currentPhoto.captionHi : currentPhoto?.caption) || ''
            : (isHindi && currentRoutineQ?.explanationHi ? currentRoutineQ.explanationHi : currentRoutineQ?.explanation) || '';
        if (captionToRead) {
          speakText(captionToRead);
        }
      } else {
        // Gentle hint without failure or buzzer
        hintUsedRef.current = true;
        const hint =
          activeModule === 'memory_lane'
            ? isHindi && currentPhoto?.captionHi
              ? `संकेत: यह ${currentPhoto.name} हैं, जो आपसे बहुत प्यार करते हैं!`
              : `Gentle clue: It's ${currentPhoto?.name}, your ${currentPhoto?.relationship?.toLowerCase()}!`
            : isHindi && currentRoutineQ?.hintHi
            ? currentRoutineQ.hintHi
            : currentRoutineQ?.hint || 'Hint: Take a quiet breath and look again.';
        setGentleHintText(hint);

        // Record hint event
        recordCogEvent({
          game: activeModule,
          item: activeModule === 'memory_lane' ? currentPhoto?.name || 'Photo' : currentRoutineQ?.id || 'Routine',
          correct: false,
          responseMs,
          hintUsed: true,
          level: currentLevelData.level,
          elderLanguage: language,
        });
      }
    },
    [
      activeModule,
      currentLevelData.level,
      currentPhoto,
      currentRoutineQ,
      isAnswerRevealed,
      isHindi,
      language,
      recordCogEvent,
      speakText,
    ]
  );

  const handleNextQuestion = () => {
    if (sessionIndex + 1 >= totalQuestionsInSession) {
      setSessionCompleted(true);
    } else {
      setSessionIndex((prev) => prev + 1);
    }
  };

  const restartSession = () => {
    setSessionIndex(0);
    setSessionCompleted(false);
  };

  // Render question icon
  const renderOptionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Pill':
        return <Pill className="w-6 h-6 text-emerald-700 shrink-0" />;
      case 'Heart':
        return <Heart className="w-6 h-6 text-rose-600 shrink-0" />;
      case 'Sun':
        return <Sun className="w-6 h-6 text-amber-600 shrink-0" />;
      case 'Coffee':
        return <Coffee className="w-6 h-6 text-amber-800 shrink-0" />;
      case 'Clock':
        return <Clock className="w-6 h-6 text-slate-600 shrink-0" />;
      default:
        return <Sparkles className="w-6 h-6 text-emerald-700 shrink-0" />;
    }
  };

  return (
    <div className="w-full pb-20 pt-3 px-4 max-w-[390px] mx-auto select-none font-sans">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-[#064e3b] to-[#043427] text-white rounded-3xl p-4 shadow-lg mb-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center">
              <Brain className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {isHindi ? 'मन और स्मृति' : 'Mind & Memory'}
              </h1>
              <p className="text-xs text-emerald-100/90 font-medium">
                {isHindi ? `${elderFirstName} के लिए सुखद अभ्यास` : `Comfortable recall for ${elderFirstName}`}
              </p>
            </div>
          </div>

          {/* Voice sound toggle */}
          <button
            onClick={toggleAiSound}
            aria-label={isAiSoundEnabled ? 'Mute voice audio' : 'Unmute voice audio'}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer border border-white/20"
          >
            {isAiSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-75" />}
          </button>
        </div>

        {/* Level & Streak Ribbon */}
        <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-xs font-semibold text-emerald-100">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            {isHindi ? `स्तर ${currentLevelData.level} • सौम्य लय` : `Level ${currentLevelData.level} • Gentle rhythm`}
          </span>
          <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white">
            {isHindi ? 'कोई असफलता नहीं' : 'Calm & Encouraging'}
          </span>
        </div>
      </div>

      {/* Module Switcher Buttons (Min 56px touch target) */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => {
            setActiveModule('memory_lane');
            restartSession();
          }}
          className={`h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm px-3 border transition-all cursor-pointer ${
            activeModule === 'memory_lane'
              ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ImageIcon className="w-5 h-5 shrink-0" />
          <span>{isHindi ? 'तस्वीरें (स्मृति)' : 'Memory Lane'}</span>
        </button>

        <button
          onClick={() => {
            setActiveModule('routine_recall');
            restartSession();
          }}
          className={`h-14 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm px-3 border transition-all cursor-pointer ${
            activeModule === 'routine_recall'
              ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <RotateCcw className="w-5 h-5 shrink-0" />
          <span>{isHindi ? 'दिनचर्या स्मरण' : 'Routine Recall'}</span>
        </button>
      </div>

      {/* Game Content Card */}
      {!sessionCompleted ? (
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-md">
          {/* Question Counter & "I'm done" finish early button */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isHindi
                ? `प्रश्न ${sessionIndex + 1} / ${totalQuestionsInSession}`
                : `Question ${sessionIndex + 1} of ${totalQuestionsInSession}`}
            </span>

            <button
              onClick={() => setSessionCompleted(true)}
              className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
            >
              {isHindi ? 'बस हो गया' : "I'm done for now"}
            </button>
          </div>

          {/* MODULE 1: MEMORY LANE */}
          {activeModule === 'memory_lane' && currentPhoto && (
            <div className="flex flex-col items-center">
              {/* Photo Frame */}
              <div className="w-full h-52 bg-slate-100 rounded-2xl overflow-hidden shadow-inner relative border border-slate-200 mb-3">
                <img
                  src={currentPhoto.photoUrl}
                  alt={currentPhoto.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>{currentPhoto.relationship}</span>
                </div>
              </div>

              {/* Question Text (Large 20px readable typography) */}
              <h2 className="text-xl font-extrabold text-slate-900 text-center mb-4 leading-snug">
                {isHindi
                  ? 'इस तस्वीर में आपके अपने कौन मुस्कुरा रहे हैं?'
                  : 'Who is smiling warmly in this family photo?'}
              </h2>

              {/* 3 Large Option Buttons (Min 56px touch target) */}
              <div className="w-full flex flex-col gap-2.5">
                {getMemoryLaneOptions().map((opt) => {
                  const isChosen = selectedOptionId === opt.id;
                  const isCorrect = opt.isCorrect;
                  const showAsSuccess = isAnswerRevealed && isCorrect;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionClick(opt.isCorrect, opt.id, opt.label)}
                      className={`w-full min-h-[58px] px-4 py-3 rounded-2xl font-bold text-base transition-all flex items-center justify-between cursor-pointer border-2 text-left ${
                        showAsSuccess
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-md ring-2 ring-emerald-500/20'
                          : isChosen && !isCorrect
                          ? 'bg-amber-50 border-amber-300 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg leading-snug">{opt.label}</span>
                      {showAsSuccess ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : isChosen && !isCorrect ? (
                        <HelpCircle className="w-6 h-6 text-amber-600 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Gentle Clue / Hint without buzzer */}
              {gentleHintText && !isAnswerRevealed && (
                <div className="mt-3 w-full bg-amber-50 border border-amber-300 rounded-2xl p-3 text-amber-950 text-sm font-semibold flex items-start gap-2 animate-in fade-in">
                  <Smile className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">{gentleHintText}</p>
                </div>
              )}

              {/* Success Story & Voice Caption */}
              {isAnswerRevealed && (
                <div className="mt-4 w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      {isHindi ? 'प्यारी कहानी' : 'Cherished Memory'}
                    </span>
                    <button
                      onClick={() => {
                        const txt = isHindi && currentPhoto.captionHi ? currentPhoto.captionHi : currentPhoto.caption;
                        speakText(txt);
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeakingCaption ? 'animate-pulse text-emerald-600' : ''}`} />
                      <span>{isHindi ? 'सुनें' : 'Listen'}</span>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-emerald-950 leading-relaxed">
                    {isHindi && currentPhoto.captionHi ? currentPhoto.captionHi : currentPhoto.caption}
                  </p>

                  <button
                    onClick={handleNextQuestion}
                    className="mt-4 w-full h-14 bg-[#064e3b] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-md hover:bg-[#053d2e] cursor-pointer"
                  >
                    <span>{isHindi ? 'अगला प्रश्न' : 'Next Question'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODULE 2: ROUTINE RECALL */}
          {activeModule === 'routine_recall' && currentRoutineQ && (
            <div className="flex flex-col">
              {/* Question Text */}
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 mb-4 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  {currentRoutineQ.sourceFact}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                  {isHindi ? currentRoutineQ.questionTextHi : currentRoutineQ.questionText}
                </h2>
              </div>

              {/* 3 Big Picture & Text Options */}
              <div className="flex flex-col gap-2.5">
                {currentRoutineQ.options.map((opt) => {
                  const isChosen = selectedOptionId === opt.id;
                  const isCorrect = opt.isCorrect;
                  const showAsSuccess = isAnswerRevealed && isCorrect;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionClick(opt.isCorrect, opt.id, opt.text)}
                      className={`w-full min-h-[58px] px-4 py-3 rounded-2xl font-bold text-base transition-all flex items-center justify-between cursor-pointer border-2 text-left ${
                        showAsSuccess
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-md ring-2 ring-emerald-500/20'
                          : isChosen && !isCorrect
                          ? 'bg-amber-50 border-amber-300 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {renderOptionIcon(opt.iconName)}
                        <span className="text-base leading-snug">
                          {isHindi ? opt.textHi : opt.text}
                        </span>
                      </div>
                      {showAsSuccess ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : isChosen && !isCorrect ? (
                        <HelpCircle className="w-6 h-6 text-amber-600 shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Gentle Hint */}
              {gentleHintText && !isAnswerRevealed && (
                <div className="mt-3 bg-amber-50 border border-amber-300 rounded-2xl p-3 text-amber-950 text-sm font-semibold flex items-start gap-2 animate-in fade-in">
                  <Smile className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">{gentleHintText}</p>
                </div>
              )}

              {/* Success Explanation */}
              {isAnswerRevealed && (
                <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {encouragementNote || (isHindi ? 'बहुत बढ़िया!' : 'Great Recall!')}
                    </span>
                    <button
                      onClick={() => {
                        const txt = isHindi ? currentRoutineQ.explanationHi : currentRoutineQ.explanation;
                        speakText(txt);
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeakingCaption ? 'animate-pulse text-emerald-600' : ''}`} />
                      <span>{isHindi ? 'सुनें' : 'Listen'}</span>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-emerald-950 leading-relaxed">
                    {isHindi ? currentRoutineQ.explanationHi : currentRoutineQ.explanation}
                  </p>

                  <button
                    onClick={handleNextQuestion}
                    className="mt-4 w-full h-14 bg-[#064e3b] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-md hover:bg-[#053d2e] cursor-pointer"
                  >
                    <span>{isHindi ? 'अगला प्रश्न' : 'Next Question'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Summary / Session Complete Card (Pure encouragement, no failure) */
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md text-center animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Heart className="w-8 h-8 fill-emerald-600 text-emerald-600" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
            {isHindi ? 'सुंदर और सुखद सत्र!' : 'Wonderful session!'}
          </h2>
          <p className="text-base text-slate-600 font-medium mb-6">
            {isHindi
              ? `${elderFirstName}, आपका मन आज बहुत शांत और जागरूक रहा। यादों ने दिन को सुखद बना दिया।`
              : `${elderFirstName}, your mind is calm, bright, and active today. Spending time with these memories brings warmth.`}
          </p>

          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 mb-6 flex items-center justify-around">
            <div>
              <span className="text-2xl font-black text-emerald-900">
                {sessionIndex + (isAnswerRevealed ? 1 : 0)}
              </span>
              <p className="text-xs font-bold text-emerald-700">
                {isHindi ? 'यादें खोजी गईं' : 'Moments recalled'}
              </p>
            </div>
            <div className="w-px h-8 bg-emerald-200" />
            <div>
              <span className="text-2xl font-black text-emerald-900">
                {currentLevelData.level}
              </span>
              <p className="text-xs font-bold text-emerald-700">
                {isHindi ? 'सौम्य स्तर' : 'Gentle level'}
              </p>
            </div>
          </div>

          <button
            onClick={restartSession}
            className="w-full h-14 bg-[#064e3b] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-md hover:bg-[#053d2e] cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{isHindi ? 'एक और बार खेलें' : 'Play again comfortably'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
