import React, { useRef, useState } from 'react';
import { useAdept } from '../../context/AdeptContext';

interface LogoHeaderProps {
  onTriggerDemo: () => void;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({ onTriggerDemo }) => {
  const { role, profile, authUser, isElderPaired } = useAdept();
  const [isPressing, setIsPressing] = useState(false);
  const pressTimer = useRef<any>(null);

  const startLongPress = () => {
    setIsPressing(true);
    pressTimer.current = setTimeout(() => {
      setIsPressing(false);
      onTriggerDemo();
    }, 700); // 700ms long-press threshold
  };

  const cancelLongPress = () => {
    setIsPressing(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const getRoleLabel = () => {
    // Only show role badge when a user session or elder device is actually active!
    if (!authUser && !isElderPaired) return null;
    if (role === 'elder') return `${profile.name || 'Arthur Davies'} • Elder`;
    if (role === 'caretaker') return `${authUser?.name || profile.caretakerName || 'Sarah Davies'} • Caretaker`;
    return `${authUser?.name || 'James Davies'} • Family Owner`;
  };

  const roleLabel = getRoleLabel();

  return (
    <header className="w-full bg-[#fcfbfa] border-b border-slate-200/80 px-4 h-14 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Long-press trigger */}
      <div
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        title="Long-press for secret demo panel"
        className={`flex items-center gap-2.5 cursor-pointer transition-transform ${
          isPressing ? 'scale-95 opacity-80' : 'hover:opacity-90 active:scale-95'
        }`}
      >
        <div className="w-8 h-8 rounded-xl bg-[#064e3b] text-white flex items-center justify-center font-black text-sm shadow-xs relative">
          A
          {isPressing && (
            <span className="absolute -inset-1 rounded-2xl border-2 border-emerald-500 animate-ping opacity-75" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">
            Adept
          </span>
        </div>
      </div>

      {/* Role Pill indicator (Only when authenticated) */}
      {roleLabel && (
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-100 text-[#064e3b] font-bold px-2.5 py-1 rounded-full border border-emerald-200/60 max-w-[190px] truncate">
            {roleLabel}
          </span>
        </div>
      )}
    </header>
  );
};
