import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { Role } from '../../lib/types';
import { PasscodeModal } from './PasscodeModal';
import { User, Users, HeartHandshake, Settings, FileText, Palette } from 'lucide-react';

interface RoleSelectorProps {
  onOpenAudit: () => void;
  onOpenSettings: () => void;
  onOpenDesign?: () => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onOpenAudit, onOpenSettings, onOpenDesign }) => {
  const { role, pendingProposalsCount } = useAdept();
  const [passcodeModalTarget, setPasscodeModalTarget] = useState<Role | null>(null);

  const roles: Array<{ id: Role; label: string; icon: React.ReactNode; badge?: string }> = [
    {
      id: 'elder',
      label: 'Elder (Arthur)',
      icon: <User className="w-4 h-4" />,
      badge: pendingProposalsCount > 0 ? `${pendingProposalsCount} Proposal` : undefined,
    },
    {
      id: 'caretaker',
      label: 'Caretaker (Sarah)',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'family',
      label: 'Family (James)',
      icon: <HeartHandshake className="w-4 h-4" />,
    },
  ];

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-18 flex items-center justify-between gap-2">
          {/* Brand Logo & Calm Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#064e3b] text-white flex items-center justify-center font-black text-xl shadow-md">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Adept
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold bg-emerald-100 text-[#064e3b] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Calm by Default
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Shared Profile: Arthur Davies (78)
              </p>
            </div>
          </div>

          {/* Role Switcher with Passcode Protection */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {roles.map((r) => {
              const isActive = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    if (r.id !== role) {
                      setPasscodeModalTarget(r.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#064e3b] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {r.icon}
                  <span className="hidden md:inline">{r.label}</span>
                  <span className="md:hidden">
                    {r.id === 'elder' ? 'Arthur' : r.id === 'caretaker' ? 'Sarah' : 'Family'}
                  </span>

                  {r.badge && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1 sm:static sm:w-auto sm:h-auto sm:bg-amber-300 sm:text-amber-950 sm:text-[10px] sm:px-1.5 sm:py-0.2 sm:rounded-full">
                      <span className="hidden sm:inline">{r.badge}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Tools (Design Preview, Audit Trail & Settings) */}
          <div className="flex items-center gap-1.5">
            {onOpenDesign && (
              <button
                onClick={onOpenDesign}
                title="Design System Preview (/design)"
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Palette className="w-4 h-4 text-[#064e3b]" />
                <span className="hidden sm:inline">Design System</span>
              </button>
            )}

            <button
              onClick={onOpenAudit}
              title="Audit Log & Elder Veto History"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Audit & Veto</span>
            </button>

            <button
              onClick={onOpenSettings}
              title="Platform Settings & API Keys"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Passcode Modal */}
      {passcodeModalTarget && (
        <PasscodeModal
          targetRole={passcodeModalTarget}
          onClose={() => setPasscodeModalTarget(null)}
          onSuccess={() => setPasscodeModalTarget(null)}
        />
      )}
    </>
  );
};
