import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { PermissionLevel, Member } from '../../lib/types';
import {
  UserPlus,
  KeyRound,
  Eye,
  Edit3,
  Copy,
  Check,
  ArrowLeft,
  X,
} from 'lucide-react';

interface MembersScreenProps {
  onBack?: () => void;
}

export const MembersScreen: React.FC<MembersScreenProps> = ({ onBack }) => {
  const {
    members,
    addCaretakerMember,
    inviteFamilyMember,
    updateMemberPermission,
    removeMember,
  } = useAdept();

  const [activeModal, setActiveModal] = useState<'none' | 'add_caretaker' | 'invite_family'>('none');

  // Add Caretaker Form
  const [caretakerName, setCaretakerName] = useState('Sarah Davies');
  const [caretakerEmail, setCaretakerEmail] = useState('');
  const [caretakerPin, setCaretakerPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Invite Family Form
  const [familyName, setFamilyName] = useState('');
  const [familyEmail, setFamilyEmail] = useState('');
  const [familyPermission, setFamilyPermission] = useState<PermissionLevel>('view_only');

  // Copy feedback
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [notice, setNoticeMessage] = useState<string | null>(null);

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard?.writeText(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Submit Caretaker
  const handleSaveCaretaker = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = caretakerPin.trim();
    if (cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      setPinError('Please enter a valid 6-digit numeric PIN.');
      return;
    }
    setPinError(null);

    await addCaretakerMember(caretakerName.trim(), caretakerEmail.trim(), cleanPin);
    setActiveModal('none');
    setCaretakerEmail('');
    setCaretakerPin('');
    setNoticeMessage(`✓ Caretaker invite generated for ${caretakerName}!`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Submit Family Invite
  const handleSaveFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyEmail.trim()) return;

    inviteFamilyMember(familyName.trim() || 'Family Member', familyEmail.trim(), familyPermission);
    setActiveModal('none');
    setFamilyName('');
    setFamilyEmail('');
    setNoticeMessage(`✓ Family invite created with ${familyPermission === 'view_only' ? 'View-Only' : 'Can-Edit'} permissions!`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  return (
    <div className="px-4 py-5 space-y-5 font-sans">
      {/* Title & Back Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Care Team & Members
            </h1>
            <p className="text-xs text-slate-500">
              Manage Caretaker PIN & Family permissions
            </p>
          </div>
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 text-[#064e3b] p-3 rounded-2xl text-xs font-bold text-center animate-in fade-in">
          {notice}
        </div>
      )}

      {/* Action Buttons: Add Caretaker & Invite Family (Max touch target 56px, h-12) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveModal('add_caretaker')}
          className="h-12 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
        >
          <KeyRound className="w-4 h-4" />
          <span>Add Caretaker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModal('invite_family')}
          className="h-12 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
        >
          <UserPlus className="w-4 h-4 text-emerald-800" />
          <span>Invite Family</span>
        </button>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Members ({members.length})
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold">
            RLS Protected
          </span>
        </div>

        <div className="space-y-2.5">
          {members.map((m: Member) => {
            const isOwner = m.role === 'family' && m.isPrimary;
            const isCaretaker = m.role === 'caretaker';
            const isViewOnly = m.permission === 'view_only';

            return (
              <div
                key={m.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-slate-900">
                        {m.name}
                      </h3>
                      {isOwner && (
                        <span className="text-[10px] bg-emerald-100 text-[#064e3b] font-bold px-1.5 py-0.2 rounded-md">
                          Owner
                        </span>
                      )}
                      {isCaretaker && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-md">
                          PIN Caretaker
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {m.email}
                    </div>
                  </div>

                  {/* Permission badge */}
                  <div className="flex items-center gap-1">
                    {isViewOnly ? (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>View Only</span>
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Edit3 className="w-3 h-3" />
                        <span>Can Edit</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Invite Link & Role Toggle Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  {/* Role / Permission switch */}
                  {!isOwner && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateMemberPermission(m.id, isViewOnly ? 'can_edit' : 'view_only')}
                        className="text-[11px] text-slate-600 hover:text-slate-900 underline font-semibold cursor-pointer"
                      >
                        Make {isViewOnly ? 'Can-Edit' : 'View-Only'}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeMember(m.id)}
                        className="text-[11px] text-red-500 hover:text-red-700 font-semibold cursor-pointer ml-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Invite Link Copy */}
                  {m.inviteLink && (
                    <button
                      type="button"
                      onClick={() => handleCopyLink(m.inviteLink!, m.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#064e3b] bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg cursor-pointer transition-colors ml-auto"
                    >
                      {copiedLink === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Invite Link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: ADD CARETAKER WITH 6-DIGIT PIN */}
      {activeModal === 'add_caretaker' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fcfbfa] border-2 border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Add Caretaker</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl text-xs font-semibold">
                {pinError}
              </div>
            )}

            <form onSubmit={handleSaveCaretaker} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                  Caretaker Name
                </label>
                <input
                  type="text"
                  value={caretakerName}
                  onChange={(e) => setCaretakerName(e.target.value)}
                  required
                  placeholder="Sarah Davies"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={caretakerEmail}
                  onChange={(e) => setCaretakerEmail(e.target.value)}
                  required
                  placeholder="sarah.davies@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                  6-Digit Caretaker PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={caretakerPin}
                  onChange={(e) => setCaretakerPin(e.target.value)}
                  placeholder="246810"
                  required
                  className="w-full px-3 py-2 text-center text-xl font-mono tracking-widest rounded-xl border border-slate-200 focus:outline-none focus:border-[#064e3b]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Stored hashed (SHA-256). 5 wrong PINs = 10-minute lockout.
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#064e3b] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Create & Copy Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVITE FAMILY MEMBER (VIEW-ONLY OR CAN-EDIT) */}
      {activeModal === 'invite_family' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fcfbfa] border-2 border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Invite Family Member</h3>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFamily} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Rahul Davies"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={familyEmail}
                  onChange={(e) => setFamilyEmail(e.target.value)}
                  required
                  placeholder="rahul.davies@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                />
              </div>

              {/* Permission Selector (Prompt 3: choosing view-only or can-edit) */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                  Permission Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFamilyPermission('view_only')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      familyPermission === 'view_only'
                        ? 'border-[#064e3b] bg-emerald-50 text-[#064e3b] font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">View-Only</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Cannot edit medications</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFamilyPermission('can_edit')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      familyPermission === 'can_edit'
                        ? 'border-[#064e3b] bg-emerald-50 text-[#064e3b] font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">Can-Edit</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Can edit routines</div>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#064e3b] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Generate Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
