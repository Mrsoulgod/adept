import React, { useState } from 'react';
import { useAdept } from '../../../context/AdeptContext';
import { getLockoutStatus, resetLockout, recordFailedAttempt } from '../../../lib/authSecurity';
import { QrCode, LogOut, Copy, Check, KeyRound } from 'lucide-react';

export const FamilySettingsTab: React.FC = () => {
  const { elderPairingCode, logoutUser } = useAdept();
  const [copied, setCopied] = useState(false);
  const [lockoutState, setLockoutState] = useState(() => getLockoutStatus('caretaker'));
  const [pinNotice, setPinNotice] = useState<string | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(elderPairingCode || 'ADEPT-7890');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateFailedTry = () => {
    const updated = recordFailedAttempt('caretaker');
    setLockoutState(updated);
    if (updated.isLocked) {
      setPinNotice(`🔒 Lockout triggered! 5 consecutive failures recorded.`);
    } else {
      setPinNotice(`Recorded 1 failed attempt. ${updated.remainingAttempts} attempts remaining.`);
    }
    setTimeout(() => setPinNotice(null), 3500);
  };

  const handleResetPinLockout = () => {
    resetLockout('caretaker');
    setLockoutState(getLockoutStatus('caretaker'));
    setPinNotice('✓ Caretaker PIN lockout successfully reset.');
    setTimeout(() => setPinNotice(null), 3000);
  };

  return (
    <div className="px-4 py-5 space-y-5 font-sans">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Household & Security Settings
        </h1>
        <p className="text-xs text-slate-500">
          Caretaker PIN security • Elder device pairing
        </p>
      </div>

      {pinNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-[#064e3b] p-3 rounded-2xl text-xs font-bold text-center animate-in fade-in">
          {pinNotice}
        </div>
      )}

      {/* Caretaker PIN Security Status */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Caretaker PIN Protection
              </h2>
              <span className="text-[11px] text-slate-500">
                Sarah Davies • SHA-256 Cryptographic Hash
              </span>
            </div>
          </div>

          {lockoutState.isLocked ? (
            <span className="text-[10px] bg-red-100 text-red-800 font-black px-2 py-0.5 rounded-full">
              Locked (5 fails)
            </span>
          ) : (
            <span className="text-[10px] bg-emerald-100 text-[#064e3b] font-black px-2 py-0.5 rounded-full">
              Protected
            </span>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
          <div className="flex justify-between">
            <span>Failed Attempts:</span>
            <strong className="text-slate-900">{lockoutState.failedAttempts} / 5</strong>
          </div>
          <div className="flex justify-between">
            <span>Remaining Attempts:</span>
            <strong className="text-slate-900">{lockoutState.remainingAttempts}</strong>
          </div>
          {lockoutState.isLocked && (
            <div className="text-red-600 font-bold text-[11px] pt-1">
              Locked out for {lockoutState.minutesRemaining || 15} minutes to prevent unauthorized dosage changes.
            </div>
          )}
        </div>

        {/* PIN Security Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleSimulateFailedTry}
            className="py-2.5 px-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold cursor-pointer"
          >
            Test 1 Failed PIN Try
          </button>
          <button
            type="button"
            onClick={handleResetPinLockout}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
          >
            Reset / Unlock
          </button>
        </div>
      </div>

      {/* Elder Pairing Code Display */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Arthur's Tablet Pairing Code
            </h2>
            <p className="text-[11px] text-slate-500">
              One-time code to connect Dad's tablet
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Active Code
            </span>
            <span className="text-xl font-mono font-black text-[#064e3b] tracking-widest">
              {elderPairingCode || 'ADEPT-7890'}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Log Out Button (56px max touch target) */}
      <button
        onClick={logoutUser}
        className="w-full h-14 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of Family Account</span>
      </button>
    </div>
  );
};
