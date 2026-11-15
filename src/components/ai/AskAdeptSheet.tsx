import React, { useState, useEffect, useRef } from 'react';
import { useAdept } from '../../context/AdeptContext';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  X,
  Volume2,
  AlertOctagon,
  PhoneCall,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  askAdeptAi,
  getWhyThisPillHelper,
  type ToolExecutionContext,
} from '../../lib/geminiAiService';
import type { AdeptAiMessage, Medication } from '../../lib/types';

interface AskAdeptSheetProps {
  isOpen: boolean;
  onClose: () => void;
  contextMed?: Medication | null;
  initialQuestion?: string;
}

export const AskAdeptSheet: React.FC<AskAdeptSheetProps> = ({
  isOpen,
  onClose,
  contextMed,
  initialQuestion,
}) => {
  const {
    role,
    activeElder,
    medications,
    events,
    vitals,
    recordEvent,
    language,
    getStockRemaining,
    getDaysOfSupply,
    getAdherence7d,
    getAdherence30d,
    getUsualDoseTime,
    triggerEmergencySOS,
  } = useAdept();

  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState<AdeptAiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const isElder = role === 'elder';

  // Role-specific quick questions derived from live data (Prompt 8)
  const quickChips = isElder
    ? [
        language === 'hi' ? 'मेरी अगली दवा क्या है?' : "What's next for me?",
        language === 'hi' ? 'दवाइयां कितनी बची हैं?' : 'How many tablets left?',
        language === 'hi' ? 'क्या मैंने सुबह की दवा ली?' : 'Did I take my morning dose?',
      ]
    : [
        `How was ${activeElder.name.split(' ')[0]}'s week?`,
        'Anything unusual detected?',
        'What needs refilling soon?',
        `How is ${activeElder.name.split(' ')[0]}'s blood pressure?`,
      ];

  // Tool execution context for tool calls
  const toolCtx: ToolExecutionContext = {
    medications,
    events,
    vitals,
    role,
    elderName: activeElder.name,
    doctorName: activeElder.doctorName || 'Dr. Evelyn Vance',
    stockRemainingFn: getStockRemaining,
    daysOfSupplyFn: getDaysOfSupply,
    adherence7dFn: getAdherence7d,
    adherence30dFn: getAdherence30d,
    usualDoseTimeFn: getUsualDoseTime,
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial greeting or initialQuestion / contextMed handling
  useEffect(() => {
    if (!isOpen) return;

    if (contextMed) {
      // Prompt 10: "Why this pill?" voice helper with 3 short sentences
      const whyHelper = getWhyThisPillHelper(contextMed, language);
      const initialAssistantMsg: AdeptAiMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: whyHelper.fullText,
        sources: [
          `Prescription Purpose (${contextMed.friendlyName})`,
          `Dr. ${contextMed.prescribedBy || 'Evelyn Vance'} Regimen`,
        ],
        followUpChips: [
          `How many ${contextMed.friendlyName} left?`,
          'When do I take this next?',
          'Confirm with doctor',
        ],
        timestamp: 'Just now',
      };
      setMessages([initialAssistantMsg]);

      // Read aloud automatically using Web Speech Synthesis (Prompt 10)
      if ('speechSynthesis' in window) {
        try {
          const utter = new SpeechSynthesisUtterance(whyHelper.fullText);
          utter.lang = language === 'hi' ? 'hi-IN' : 'en-US';
          window.speechSynthesis.speak(utter);
        } catch {}
      }
      return;
    }

    if (initialQuestion) {
      handleAskQuestion(initialQuestion);
      return;
    }

    if (messages.length === 0) {
      const greeting =
        language === 'hi'
          ? `नमस्ते! मैं अडेप्ट केयर सहायक हूँ। आप मुझसे ${activeElder.name} की दवाओं, खुराक के समय, स्टॉक या स्वास्थ्य के बारे में पूछ सकते हैं।`
          : `Hello! I'm Adept AI for ${activeElder.name}'s care circle. Ask me anything about scheduled doses, stock counts, adherence trends, or vitals.`;

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: greeting,
          sources: ['Adept Clinical Knowledge Spine'],
          followUpChips: quickChips,
          timestamp: 'Now',
        },
      ]);
    }
  }, [isOpen, contextMed, initialQuestion]);

  // Web Speech API Voice Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuestion(transcript);
          handleAskQuestion(transcript);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      // Fallback simulated speech query for zero friction
      const sample =
        language === 'hi'
          ? 'मेरी अगली दवा कब है?'
          : isElder
          ? 'How many Metformin are left?'
          : "How was Dad's week?";
      setInputQuestion(sample);
      handleAskQuestion(sample);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleAskQuestion = async (qText: string) => {
    const clean = qText.trim();
    if (!clean) return;

    // 1. Add User Message
    const userMsg: AdeptAiMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: clean,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    // 2. Log event: ai_question (Prompt 7 & 8 requirement)
    recordEvent({
      circleId: activeElder.id,
      actorRole: role,
      type: 'ai_question',
      payload: { question: clean, role },
      source: 'ask_adept_sheet',
    });

    try {
      // 3. Dispatch to Adept AI Core
      const res = await askAdeptAi(clean, toolCtx, language);

      const assistantMsg: AdeptAiMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        followUpChips: res.followUpChips,
        isEmergency: res.isEmergency,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If user asks for voice reading (or for elder), speak it gently
      if (isElder && 'speechSynthesis' in window && !res.isEmergency) {
        try {
          const utter = new SpeechSynthesisUtterance(res.answer);
          utter.lang = language === 'hi' ? 'hi-IN' : 'en-US';
          window.speechSynthesis.speak(utter);
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in font-sans">
      <div className="bg-[#fcfbfa] border-t-2 sm:border-2 border-slate-200 rounded-t-3xl sm:rounded-3xl max-w-lg w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#064e3b] to-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-slate-900 text-base leading-tight">
                  Ask Adept AI
                </h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-950 font-bold px-2 py-0.5 rounded-full uppercase">
                  Live Tools
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {contextMed
                  ? `Clinical info for ${contextMed.friendlyName}`
                  : `Answers cited from ${activeElder.name}'s care data`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips Bar */}
        <div className="p-2.5 bg-slate-100/90 border-b border-slate-200/80 overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Ask:</span>
          </span>
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleAskQuestion(chip)}
              className="text-xs bg-white hover:bg-emerald-50 hover:text-[#064e3b] hover:border-emerald-300 text-slate-700 font-bold px-3 py-1.5 rounded-full border border-slate-200 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF8F5]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <span className="text-[10px] font-bold text-slate-400 px-1">
                  {isUser ? 'You' : 'Adept AI'} • {msg.timestamp}
                </span>

                <div
                  className={`max-w-[90%] rounded-2xl p-4 shadow-xs space-y-2 ${
                    isUser
                      ? 'bg-[#064e3b] text-white rounded-tr-xs'
                      : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs'
                  }`}
                >
                  {/* Emergency Red Banner inside message if detected */}
                  {msg.isEmergency && (
                    <div className="bg-red-600 text-white p-3.5 rounded-xl space-y-2.5 animate-in zoom-in-95">
                      <div className="flex items-center gap-2 font-black text-sm uppercase">
                        <AlertOctagon className="w-5 h-5 animate-pulse" />
                        <span>Emergency Care Required</span>
                      </div>
                      <p className="text-xs text-red-100 leading-relaxed font-semibold">
                        Call emergency services immediately or press the button below.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href="tel:911"
                          className="flex-1 h-11 bg-white text-red-700 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>Call 112 / 911</span>
                        </a>
                        <button
                          onClick={() => {
                            triggerEmergencySOS(activeElder.id, 'SOS activated from Adept AI Emergency check');
                            onClose();
                          }}
                          className="h-11 px-3 bg-red-800 text-white rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                        >
                          Trigger SOS
                        </button>
                      </div>
                    </div>
                  )}

                  <p
                    className={`${
                      isElder ? 'text-lg leading-relaxed' : 'text-sm leading-relaxed'
                    } font-medium whitespace-pre-line`}
                  >
                    {msg.content}
                  </p>

                  {/* Sources Chips under answers (Prompt 8 requirement) */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span>Sources:</span>
                      </span>
                      {msg.sources.map((src, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md border border-slate-200/60"
                        >
                          {src}
                        </span>
                      ))}

                      {/* Read aloud icon button */}
                      <button
                        onClick={() => speakText(msg.content)}
                        title="Read aloud"
                        className="ml-auto p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2-3 Follow-up Chips after each answer (Prompt 8 requirement) */}
                {!isUser && msg.followUpChips && msg.followUpChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 px-1">
                    {msg.followUpChips.map((fChip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskQuestion(fChip)}
                        className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] font-bold px-2.5 py-1 rounded-full border border-emerald-200/80 cursor-pointer active:scale-95 transition-all"
                      >
                        {fChip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold p-3 bg-white rounded-2xl border border-slate-200 max-w-[200px] animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Consulting care tools...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(inputQuestion);
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
        >
          {/* Web Speech API Microphone Button (56px touch target) */}
          <button
            type="button"
            onClick={toggleListening}
            title="Speak your question"
            className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-emerald-100 hover:bg-emerald-200 text-[#064e3b]'
            }`}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder={
              isListening
                ? 'Listening... speak now'
                : isElder
                ? 'Ask Adept about your medicines...'
                : 'Ask Adept (e.g., How many Metformin left?)...'
            }
            className="flex-1 h-13 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b] bg-slate-50 font-medium"
          />

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="w-13 h-13 rounded-2xl bg-[#064e3b] hover:bg-[#043d2e] disabled:opacity-40 text-white flex items-center justify-center cursor-pointer shrink-0 active:scale-95 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
