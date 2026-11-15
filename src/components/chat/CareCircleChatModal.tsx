import React, { useState, useEffect, useRef } from 'react';
import { useAdept } from '../../context/AdeptContext';
import {
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Users,
  User,
  X,
} from 'lucide-react';

interface CareCircleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChannelId?: string;
}

export const CareCircleChatModal: React.FC<CareCircleChatModalProps> = ({
  isOpen,
  onClose,
  defaultChannelId = 'group',
}) => {
  const { role, activeElder, chatMessages, sendChatMessage, language } = useAdept();
  const [activeChannelId, setActiveChannelId] = useState(defaultChannelId);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const isElder = role === 'elder';

  // Available Channels
  const channels = [
    { id: 'group', name: 'Family Group Chat', icon: Users, desc: 'Everyone in Care Circle' },
    { id: 'sarah-direct', name: 'Sarah Davies', icon: User, desc: 'Daughter & Caretaker' },
    { id: 'james-direct', name: 'James Davies', icon: User, desc: 'Son & Family Owner' },
  ];

  // Filter messages for current channel
  const filteredMessages = chatMessages.filter((m) => m.channelId === activeChannelId);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  // Web Speech API for voice messaging
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
          setInputText(transcript);
          // Directly send voice message
          sendChatMessage(activeChannelId, transcript, true);
          setInputText('');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, [activeChannelId, language]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      // Fallback simulated speech for zero friction
      const sample = language === 'hi' ? 'मैंने अपनी दवा ले ली है और ठीक हूँ।' : 'I took my morning pills and feel good!';
      sendChatMessage(activeChannelId, sample, true);
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(activeChannelId, inputText.trim());
    setInputText('');
  };

  const handleQuickReply = (text: string) => {
    sendChatMessage(activeChannelId, text, false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in font-sans">
      <div className="bg-[#fcfbfa] border-2 border-slate-200 rounded-3xl max-w-sm w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base leading-tight">
                {channels.find((c) => c.id === activeChannelId)?.name || 'Care Circle Chat'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {isElder ? `Talking as ${activeElder.name}` : `Connected with ${activeElder.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Switcher Pills */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-100 border-b border-slate-200/80 overflow-x-auto no-scrollbar shrink-0">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const isSelected = activeChannelId === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#064e3b] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{ch.name}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8F5]">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-200/60 text-slate-400 flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No messages yet</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Send a quick hello or voice note to stay in touch.
              </p>
            </div>
          ) : (
            filteredMessages
              .slice()
              .reverse()
              .map((msg) => {
                const isMe =
                  (role === 'elder' && msg.senderRole === 'elder') ||
                  (role === 'caretaker' && msg.senderRole === 'caretaker') ||
                  (role === 'family' && msg.senderRole === 'family');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 px-1">
                      {msg.senderName} • {msg.timestamp}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs ${
                        isMe
                          ? 'bg-[#064e3b] text-white rounded-tr-xs'
                          : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs'
                      }`}
                    >
                      <p className={`${isElder ? 'text-lg' : 'text-sm'} leading-relaxed font-medium`}>
                        {msg.text}
                      </p>
                      {msg.isVoiceTranscription && (
                        <span className="text-[10px] opacity-75 mt-1 block italic flex items-center gap-1">
                          <Mic className="w-2.5 h-2.5" />
                          <span>Voice spoken</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Pills for Elder / Family */}
        <div className="p-2 bg-white border-t border-slate-200/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 shrink-0">
            Quick:
          </span>
          {[
            'I took my morning pills! 💊',
            'Feeling good today ❤️',
            'Please give me a call 📞',
            'Good morning family! ☀️',
            'Thank you for the note! 🙏',
          ].map((quickText) => (
            <button
              key={quickText}
              type="button"
              onClick={() => handleQuickReply(quickText)}
              className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-[#064e3b] hover:border-emerald-200 text-slate-700 px-3 py-1.5 rounded-full font-bold border border-slate-200 shrink-0 cursor-pointer active:scale-95 transition-all"
            >
              {quickText}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          {/* Voice-to-Text Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            title="Speak message"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-emerald-100 hover:bg-emerald-200 text-[#064e3b]'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening... speak now' : 'Type a message...'}
            className="flex-1 h-12 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b] bg-slate-50 font-medium"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-12 h-12 rounded-2xl bg-[#064e3b] hover:bg-[#043d2e] disabled:opacity-40 text-white flex items-center justify-center cursor-pointer shrink-0 active:scale-95 transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
