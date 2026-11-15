import React, { useState } from 'react';
import { useAdept } from '../../../context/AdeptContext';
import { getLockoutStatus, resetLockout, recordFailedAttempt } from '../../../lib/authSecurity';
import { ElderPairingModal } from '../ElderPairingModal';
import { MembersScreen } from '../MembersScreen';
import {
  QrCode,
  LogOut,
  KeyRound,
  Users,
  Play,
  Tablet,
} from 'lucide-react';

export const FamilySettingsTab: React.FC = () => {
  const { logoutUser, startWalkthroughTour, elderDevices, revokeElderDevice, activeElder } = useAdept();
  const [lockoutState, setLockoutState] = useState(() => getLockoutStatus('caretaker'));
  const [pinNotice, setPinNotice] = useState<string | null>(null);

  // Modals / subviews
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [membersScreenOpen, setMembersScreenOpen] = useState(false);

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

  if (membersScreenOpen) {
    return <MembersScreen onBack={() => setMembersScreenOpen(false)} />;
  }

  return (
    <div className="px-4 py-5 space-y-5 font-sans" id="family-tab-settings">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Settings & Household
        </h1>
        <p className="text-xs text-slate-500">
          Elder device pairing • Care Team PIN & permissions
        </p>
      </div>

      {pinNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-[#064e3b] p-3 rounded-2xl text-xs font-bold text-center animate-in fade-in">
          {pinNotice}
        </div>
      )}

      {/* 1. Prompt 4: Set Up Dad's Phone Card & Button */}
      <div className="bg-white border-2 border-[#064e3b]/30 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Tablet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Set up Dad's Phone
              </h2>
              <p className="text-[11px] text-slate-500">
                15-min pairing code & QR code
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
            Prompt 4
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Generate a 6-digit pairing code for Arthur. He enters it once on the welcome screen and stays logged in forever with zero passwords.
        </p>

        {/* Primary Set Up Dad's Phone Button (56px max touch target, h-12) */}
        <button
          id="family-setup-dad-btn"
          onClick={() => setPairingModalOpen(true)}
          className="w-full h-12 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 transition-all"
        >
          <QrCode className="w-4 h-4" />
          <span>Set up {activeElder.relationship || "Dad"}'s Phone (Code & QR)</span>
        </button>

        {/* Active Paired Hardware Devices (Prompt 4: Revoke from Settings) */}
        {elderDevices.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Paired Hardware Devices</span>
              <span>{elderDevices.filter((d) => !d.isRevoked).length} Active</span>
            </div>
            {elderDevices.map((dev) => (
              <div
                key={dev.id}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  dev.isRevoked ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">{dev.deviceName}</div>
                  <div className="text-[10px] text-slate-500">
                    {dev.isRevoked ? 'Revoked' : 'Permanently connected • Zero passwords'}
                  </div>
                </div>
                {!dev.isRevoked ? (
                  <button
                    onClick={() => revokeElderDevice(dev.id)}
                    className="text-red-600 hover:text-red-700 font-bold px-2.5 py-1 rounded-xl border border-red-200 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    Revoke
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold">Revoked</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Prompt 3: Care Team Members & Permissions (RLS) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Care Team & Permissions
              </h2>
              <p className="text-[11px] text-slate-500">
                Add Caretaker with PIN • Invite Family
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-100 text-[#064e3b] px-2.5 py-0.5 rounded-full">
            Prompt 3
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Manage member permissions (view-only vs can-edit) enforced by Supabase row-level security.
        </p>

        <button
          onClick={() => setMembersScreenOpen(true)}
          className="w-full h-12 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 transition-all"
        >
          <Users className="w-4 h-4 text-emerald-800" />
          <span>Manage Members & Roles</span>
        </button>
      </div>

      {/* 3. Caretaker PIN Security Status (10-minute lockout defense) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Caretaker PIN Security
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
              Account locked for 10 minutes to protect Dad's regimen against unauthorized edits.
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

      {/* 4. Prompt 6: Replay Walkthrough Tour Button */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900">Interactive Walkthrough</h3>
            <p className="text-[10px] text-slate-500">Spotlight tour of Adept features</p>
          </div>
        </div>

        <button
          onClick={startWalkthroughTour}
          className="text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          Replay Tour
        </button>
      </div>

      {/* 5. Working Sign Out (Prompt 1) */}
      <button
        onClick={logoutUser}
        className="w-full h-14 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out of Family Account</span>
      </button>

      {/* Modals */}
      {pairingModalOpen && <ElderPairingModal onClose={() => setPairingModalOpen(false)} />}
    </div>
  );
};
