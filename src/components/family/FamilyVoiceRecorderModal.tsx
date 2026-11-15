import React, { useState, useRef } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { Mic, Square, Send, X, Heart, CheckCircle2 } from 'lucide-react';

interface FamilyVoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyVoiceRecorderModal: React.FC<FamilyVoiceRecorderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { authUser, role, addFamilyVoiceNote } = useAdept();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);

  const mediaRecorderRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
      }
    } catch {
      // simulated recording if mic blocked
    }

    setIsRecording(true);
    setRecordingSeconds(0);
    setHasRecorded(false);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    setHasRecorded(true);
  };

  const handleSend = () => {
    const sender = authUser?.name || (role === 'caretaker' ? 'Sarah Davies (Daughter)' : 'James Davies (Son)');
    addFamilyVoiceNote(sender, role, Math.max(recordingSeconds, 15));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in zoom-in-95 font-sans">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 border-2 border-emerald-600/30 text-center">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-700" />
            <h3 className="font-black text-slate-900 text-lg">Daily Voice Greeting</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Record a short 15-30s audio note. It appears as the very first card on Dad's screen with a big Play button.
        </p>

        {/* Recording Animation Meter */}
        <div className="py-4 space-y-3">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-200'
                : hasRecorded
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isRecording ? (
              <Mic className="w-10 h-10 animate-bounce" />
            ) : hasRecorded ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-700" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </div>

          <div className="font-mono font-black text-2xl text-slate-800">
            0:{recordingSeconds.toString().padStart(2, '0')}
          </div>
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
            {isRecording ? 'Recording your voice...' : hasRecorded ? 'Greeting ready to send' : 'Tap to start recording'}
          </span>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          {!hasRecorded ? (
            isRecording ? (
              <button
                onClick={stopRecording}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
              >
                <Square className="w-5 h-5" />
                <span>Stop Recording</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
              >
                <Mic className="w-5 h-5" />
                <span>Start Recording Voice Note</span>
              </button>
            )
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleSend}
                className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
              >
                <Send className="w-5 h-5" />
                <span>Send to Dad's Screen</span>
              </button>
              <button
                onClick={() => {
                  setHasRecorded(false);
                  setRecordingSeconds(0);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Re-record greeting
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
