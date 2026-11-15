import React from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { Role } from '../../lib/types';
import { User, Users, HeartHandshake, Palette, Settings, RotateCcw, X, ShieldAlert } from 'lucide-react';

interface DemoModeModalProps {
  onClose: () => void;
  onOpenDesign: () => void;
  onOpenSettings: () => void;
  onStartOnboardingTest?: () => void;
}

export const DemoModeModal: React.FC<DemoModeModalProps> = ({
  onClose,
  onOpenDesign,
  onOpenSettings,
  onStartOnboardingTest,
}) => {
  const { role, setDirectRole, resetDemoData, profile } = useAdept();

  const handleSelectRole = (targetRole: Role) => {
    setDirectRole(targetRole);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo medication data and test state back to default?')) {
      resetDemoData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#fcfbfa] border-2 border-slate-300 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-black text-xs">
              A
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Developer & Demo Panel</h3>
              <p className="text-[11px] text-slate-500 font-semibold">Unlocked via 700ms logo long-press</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Standard UI hides all role switches & demo buttons. Use this secret panel to test any view instantly.
          </span>
        </div>

        {/* Role Selector Grid */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Switch Active Role
          </label>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleSelectRole('elder')}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                role === 'elder'
                  ? 'bg-emerald-50 border-[#064e3b] text-[#064e3b] font-bold shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold">Elder View</div>
                  <div className="text-xs text-slate-500">{profile.name} (Age {profile.age})</div>
                </div>
              </div>
              {role === 'elder' && <span className="text-xs font-bold bg-[#064e3b] text-white px-2 py-0.5 rounded-full">Active</span>}
            </button>

            <button
              onClick={() => handleSelectRole('caretaker')}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                role === 'caretaker'
                  ? 'bg-emerald-50 border-[#064e3b] text-[#064e3b] font-bold shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold">Caretaker View</div>
                  <div className="text-xs text-slate-500">{profile.caretakerName} (Care Coordinator)</div>
                </div>
              </div>
              {role === 'caretaker' && <span className="text-xs font-bold bg-[#064e3b] text-white px-2 py-0.5 rounded-full">Active</span>}
            </button>

            <button
              onClick={() => handleSelectRole('family')}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                role === 'family'
                  ? 'bg-emerald-50 border-[#064e3b] text-[#064e3b] font-bold shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-extrabold">Family View</div>
                  <div className="text-xs text-slate-500">Family Owner & Reassurance</div>
                </div>
              </div>
              {role === 'family' && <span className="text-xs font-bold bg-[#064e3b] text-white px-2 py-0.5 rounded-full">Active</span>}
            </button>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenDesign();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Palette className="w-4 h-4 text-emerald-800" />
            <span>Open Design System Preview (/design)</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-700" />
            <span>Platform API Keys & Settings</span>
          </button>

          {onStartOnboardingTest && (
            <button
              onClick={() => {
                onClose();
                onStartOnboardingTest();
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer"
            >
              Simulate 4-Step Onboarding Wizard
            </button>
          )}

          <button
            onClick={handleReset}
            className="w-full py-2 px-3 text-red-600 hover:text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer pt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
