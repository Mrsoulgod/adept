import React, { useState, useEffect } from 'react';
import { useAdept } from '../../context/AdeptContext';
import {
  Heart,
  Clock,
  CheckCircle2,
  Moon,
  Activity,
} from 'lucide-react';

interface InactivitySafetyCheckModalProps {
  isOpen: boolean;
  onConfirmOkay: () => void;
  onSnooze: () => void;
  onTriggerSos: () => void;
}

export const InactivitySafetyCheckModal: React.FC<InactivitySafetyCheckModalProps> = ({
  isOpen,
  onConfirmOkay,
  onSnooze,
  onTriggerSos,
}) => {
  const { activeElder, language } = useAdept();
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [fallDetectionBeta, setFallDetectionBeta] = useState(false);
  const [fallDetectedNotice, setFallDetectedNotice] = useState(false);

  // 30-second countdown (Prompt 13 requirement: no tap in 30s -> auto-trigger SOS flow)
  useEffect(() => {
    if (!isOpen) return;

    const resetTimer = setTimeout(() => {
      setSecondsRemaining(30);
    }, 0);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTriggerSos();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(resetTimer);
      clearInterval(interval);
    };
  }, [isOpen, onTriggerSos]);

  // Experimental DeviceMotion Fall Detection listener (Beta)
  useEffect(() => {
    if (!fallDetectionBeta) return;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const totalAcc = Math.sqrt(
        (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2
      );
      // Spike detection threshold (> 28 m/s^2)
      if (totalAcc > 28) {
        setFallDetectedNotice(true);
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [fallDetectionBeta]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in font-sans">
      <div className="bg-[#FAF8F5] border-4 border-amber-400 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl space-y-6 text-center">
        {/* Calm Icon Banner */}
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto shadow-sm">
          <Heart className="w-8 h-8 text-amber-700 animate-pulse" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-200/80 text-amber-950 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-800" />
            <span>Daily Wake-Up Check</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            {language === 'hi'
              ? `नमस्ते ${activeElder.name.split(' ')[0]} जी, क्या आप ठीक हैं?`
              : `Good morning ${activeElder.name.split(' ')[0]}, are you okay?`}
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {language === 'hi'
              ? `हम यह सुनिश्चित करना चाहते हैं कि आप सुरक्षित हैं। यदि कोई उत्तर नहीं मिला तो परिवार को सतर्क कर दिया जाएगा।`
              : `We haven't seen you tap your morning routine yet. If you don't respond in ${secondsRemaining}s, we will notify Sarah and James to check on you.`}
          </p>
        </div>

        {/* 30-Second Countdown Meter */}
        <div className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-950">
            <span>Safety Timer</span>
            <span className="font-mono text-base font-black text-amber-900">
              0:{secondsRemaining.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-1000"
              style={{ width: `${(secondsRemaining / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* Movement Spike Alert if detected */}
        {fallDetectedNotice && (
          <div className="bg-amber-100 border border-amber-300 text-amber-950 p-2.5 rounded-xl text-xs font-semibold text-center">
            Abrupt movement spike detected. Please confirm you are safe.
          </div>
        )}

        {/* Action Buttons (Max touch target 56px+, large accessible text) */}
        <div className="space-y-3 pt-1">
          {/* Main Big Button: I'm Okay */}
          <button
            onClick={onConfirmOkay}
            className="w-full min-h-[68px] bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2.5 shadow-md cursor-pointer active:scale-98 transition-all"
          >
            <CheckCircle2 className="w-7 h-7 text-emerald-300" />
            <span>{language === 'hi' ? 'हाँ, मैं बिल्कुल ठीक हूँ!' : "Yes, I'm doing well!"}</span>
          </button>

          {/* Secondary Button: Snooze (Napping) */}
          <button
            onClick={onSnooze}
            className="w-full min-h-[56px] bg-white hover:bg-slate-100 border-2 border-slate-300 text-slate-800 rounded-2xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
          >
            <Moon className="w-5 h-5 text-slate-600" />
            <span>{language === 'hi' ? 'आराम कर रहा हूँ (30 मिनट बाद)' : "I'm resting (Snooze 30 mins)"}</span>
          </button>
        </div>

        {/* Experimental Fall Detection Card (Beta - Prompt 13) */}
        <div className="pt-2 border-t border-slate-200 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Activity className="w-3.5 h-3.5 text-emerald-700" />
              <span>Motion Fall Detection (Beta)</span>
            </div>
            <button
              onClick={() => setFallDetectionBeta(!fallDetectionBeta)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                fallDetectionBeta
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {fallDetectionBeta ? 'Active' : 'Enable Beta'}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-normal">
            Honest note: Browser motion sensing is experimental and functions while the app is active. Inactivity check is your primary safeguard.
          </p>
        </div>
      </div>
    </div>
  );
};
