import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { Play, Pause, Heart } from 'lucide-react';
import type { FamilyVoiceNote } from '../../lib/types';

interface FamilyVoiceNoteCardProps {
  note: FamilyVoiceNote;
}

export const FamilyVoiceNoteCard: React.FC<FamilyVoiceNoteCardProps> = ({ note }) => {
  const { markVoiceNotePlayed, loveVoiceNote, language } = useAdept();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    setIsPlaying(true);
    markVoiceNotePlayed(note.id);

    // Speak a warm greeting aloud
    if ('speechSynthesis' in window) {
      const greeting =
        language === 'hi'
          ? 'नमस्ते पिताजी, शुभ प्रभात! आशा है आपकी सुबह अच्छी रही। अपनी सुबह की दवाई नाश्ते के बाद लेना न भूलें। साराह की तरफ से ढेर सारा प्यार।'
          : 'Good morning Dad! Hope you slept well. Sarah here. I picked up some fresh blueberries for you yesterday, enjoy your tea and morning pills. Love you!';
      const utter = new SpeechSynthesisUtterance(greeting);
      utter.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      utter.onend = () => {
        setIsPlaying(false);
        setProgress(100);
      };
      window.speechSynthesis.speak(utter);
    }

    // Simulated progress bar
    let p = 0;
    const interval = setInterval(() => {
      p += 6;
      if (p >= 100) {
        clearInterval(interval);
        setIsPlaying(false);
        setProgress(100);
      } else {
        setProgress(p);
      }
    }, 1000);
  };

  const handleLoveClick = () => {
    loveVoiceNote(note.id);
  };

  return (
    <div
      id="elder-voice-note-hero"
      className="bg-gradient-to-br from-[#fefbf6] to-[#f4ebe1] border-2 border-[#D8C7B0] rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 font-sans animate-in fade-in"
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 bg-[#FAF8F5] border border-[#D8C7B0] text-[#7A4F13] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5 text-[#92631E] fill-[#92631E]" />
          <span>{language === 'hi' ? 'परिवार का संदेश' : 'Daily Message from Family'}</span>
        </div>
        <span className="text-xs font-bold text-[#70756F]">{note.recordedAt}</span>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1A1D1A] tracking-tight">
          {note.senderName}
        </h2>
        <p className="text-base sm:text-lg text-[#70756F] mt-0.5 font-medium">
          {language === 'hi'
            ? 'आपके लिए एक प्यार भरा वॉयस नोट भेजा है'
            : 'Sent you a warm morning audio message'}
        </p>
      </div>

      {/* Big Playback Button (56px+ target) */}
      <div className="space-y-2">
        <button
          onClick={handlePlayToggle}
          className={`w-full min-h-[64px] rounded-2xl px-5 py-3 flex items-center justify-between shadow-xs cursor-pointer active:scale-98 transition-all ${
            isPlaying
              ? 'bg-[#244937] text-white ring-4 ring-[#C6DBD0]'
              : 'bg-white hover:bg-[#FAF8F5] border-2 border-[#244937]/30 text-[#244937]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                isPlaying ? 'bg-white text-[#244937]' : 'bg-[#EAF2EC] text-[#244937]'
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-[#244937]" />}
            </div>
            <div className="text-left">
              <div className="text-lg font-black leading-tight">
                {isPlaying ? (language === 'hi' ? 'सुना जा रहा है...' : 'Listening...') : (language === 'hi' ? 'वॉयस नोट सुनें' : 'Play Voice Message')}
              </div>
              <div className="text-xs opacity-80 font-semibold">
                0:{note.durationSeconds.toString().padStart(2, '0')} • Sarah
              </div>
            </div>
          </div>

          <span
            className={`text-xs px-3 py-1 rounded-full font-black ${
              isPlaying ? 'bg-emerald-400 text-emerald-950' : 'bg-[#EAF2EC] text-[#244937]'
            }`}
          >
            {isPlaying ? 'Playing' : 'Listen'}
          </span>
        </button>

        {/* Audio Progress Meter */}
        {isPlaying && (
          <div className="w-full bg-[#EBDBC1] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#244937] h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* "Loved it ❤️" Heart Reaction Button (Prompt 14 requirement) */}
      <div className="pt-1">
        {note.lovedReply ? (
          <div className="bg-[#EAF2EC] text-[#244937] p-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-[#C6DBD0]">
            <Heart className="w-4 h-4 text-emerald-700 fill-emerald-700" />
            <span>
              {language === 'hi' ? 'साराह को आपका प्यार मिल गया! ❤️' : 'Sarah received your love! ❤️'}
            </span>
          </div>
        ) : (
          <button
            onClick={handleLoveClick}
            className="w-full min-h-[56px] bg-white hover:bg-rose-50 border-2 border-rose-300 text-rose-800 rounded-2xl px-4 py-2.5 flex items-center justify-center gap-2 font-black text-base cursor-pointer shadow-xs active:scale-98 transition-all"
          >
            <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
            <span>{language === 'hi' ? 'बहुत अच्छा लगा ❤️' : 'Loved it ❤️'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
