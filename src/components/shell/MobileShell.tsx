import React, { useState, useEffect } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { LogoHeader } from '../shared/LogoHeader';
import { DemoModeModal } from '../shared/DemoModeModal';

// Elder Views
import { ElderScreen } from '../elder/ElderScreen';
import { ElderFamilyTab } from '../elder/ElderFamilyTab';
import { ElderHelpTab } from '../elder/ElderHelpTab';

// Caretaker Views
import { CaretakerTodayTab } from '../caretaker/tabs/CaretakerTodayTab';
import { CaretakerMedsTab } from '../caretaker/tabs/CaretakerMedsTab';
import { CaretakerLogTab } from '../caretaker/tabs/CaretakerLogTab';
import { CaretakerAlertsTab } from '../caretaker/tabs/CaretakerAlertsTab';

// Family Views
import { FamilyHomeTab } from '../family/tabs/FamilyHomeTab';
import { FamilyTeamTab } from '../family/tabs/FamilyTeamTab';
import { FamilyTasksTab } from '../family/tabs/FamilyTasksTab';
import { FamilySettingsTab } from '../family/tabs/FamilySettingsTab';

// Icons
import {
  Calendar,
  Users,
  HelpCircle,
  Pill,
  FileText,
  Bell,
  Home,
  CheckSquare,
  Settings,
  Heart,
} from 'lucide-react';

interface MobileShellProps {
  onOpenDesign: () => void;
  onOpenSettings: () => void;
  onStartOnboardingTest?: () => void;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  onOpenDesign,
  onOpenSettings,
  onStartOnboardingTest,
}) => {
  const { role } = useAdept();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Tab State per role: each tab is its own distinct route/view, NOT one long scroll!
  const [elderTab, setElderTab] = useState<'today' | 'family' | 'help'>('today');
  const [caretakerTab, setCaretakerTab] = useState<'today' | 'meds' | 'log' | 'alerts'>('today');
  const [familyTab, setFamilyTab] = useState<'home' | 'team' | 'tasks' | 'settings'>('home');

  // URL Hash routing synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      const [r, t] = hash.split('/');
      if (r === 'elder' && (t === 'today' || t === 'family' || t === 'help')) {
        setElderTab(t as any);
      } else if (r === 'caretaker' && (t === 'today' || t === 'meds' || t === 'log' || t === 'alerts')) {
        setCaretakerTab(t as any);
      } else if (r === 'family' && (t === 'home' || t === 'team' || t === 'tasks' || t === 'settings')) {
        setFamilyTab(t as any);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const switchElderTab = (tab: 'today' | 'family' | 'help') => {
    setElderTab(tab);
    window.location.hash = `#/elder/${tab}`;
  };

  const switchCaretakerTab = (tab: 'today' | 'meds' | 'log' | 'alerts') => {
    setCaretakerTab(tab);
    window.location.hash = `#/caretaker/${tab}`;
  };

  const switchFamilyTab = (tab: 'home' | 'team' | 'tasks' | 'settings') => {
    setFamilyTab(tab);
    window.location.hash = `#/family/${tab}`;
  };

  return (
    <div className="w-full max-w-[390px] mx-auto min-h-screen bg-[#fcfbfa] flex flex-col shadow-2xl relative border-x border-slate-200/60 pb-16 font-sans">
      {/* Top Header with Long-press Demo Mode Trigger */}
      <LogoHeader onTriggerDemo={() => setDemoModalOpen(true)} />

      {/* Main Content Area - Renders ONLY the active tab route */}
      <main className="flex-1 w-full">
        {/* ELDER ROLE TABS */}
        {role === 'elder' && (
          <>
            {elderTab === 'today' && <ElderScreen />}
            {elderTab === 'family' && <ElderFamilyTab />}
            {elderTab === 'help' && <ElderHelpTab />}
          </>
        )}

        {/* CARETAKER ROLE TABS */}
        {role === 'caretaker' && (
          <>
            {caretakerTab === 'today' && <CaretakerTodayTab />}
            {caretakerTab === 'meds' && <CaretakerMedsTab />}
            {caretakerTab === 'log' && <CaretakerLogTab />}
            {caretakerTab === 'alerts' && <CaretakerAlertsTab />}
          </>
        )}

        {/* FAMILY ROLE TABS */}
        {role === 'family' && (
          <>
            {familyTab === 'home' && <FamilyHomeTab />}
            {familyTab === 'team' && <FamilyTeamTab />}
            {familyTab === 'tasks' && <FamilyTasksTab />}
            {familyTab === 'settings' && <FamilySettingsTab />}
          </>
        )}
      </main>

      {/* Bottom Tab Navigation Bar (Max Touch Target: 56px / h-14) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200/90 h-14 z-40 flex items-center justify-around px-2 shadow-lg">
        {/* Elder Navigation: Today / Family / Help */}
        {role === 'elder' && (
          <>
            <button
              onClick={() => switchElderTab('today')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                elderTab === 'today' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[11px] leading-tight">Today</span>
              {elderTab === 'today' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>

            <button
              onClick={() => switchElderTab('family')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                elderTab === 'family' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <Heart className="w-5 h-5" />
              <span className="text-[11px] leading-tight">Family</span>
              {elderTab === 'family' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>

            <button
              onClick={() => switchElderTab('help')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                elderTab === 'help' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-[11px] leading-tight">Help</span>
              {elderTab === 'help' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>
          </>
        )}

        {/* Caretaker Navigation: Today / Meds / Log / Alerts */}
        {role === 'caretaker' && (
          <>
            <button
              onClick={() => switchCaretakerTab('today')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                caretakerTab === 'today' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Today</span>
              {caretakerTab === 'today' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>

            <button
              onClick={() => switchCaretakerTab('meds')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                caretakerTab === 'meds' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Meds</span>
              {caretakerTab === 'meds' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>

            <button
              onClick={() => switchCaretakerTab('log')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                caretakerTab === 'log' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Log</span>
              {caretakerTab === 'log' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>

            <button
              onClick={() => switchCaretakerTab('alerts')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                caretakerTab === 'alerts' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Alerts</span>
              {caretakerTab === 'alerts' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>
          </>
        )}

        {/* Family Navigation: Home / Care Team / Tasks / Settings */}
        {role === 'family' && (
          <>
            <button
              onClick={() => switchFamilyTab('home')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                familyTab === 'home' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Home</span>
              {familyTab === 'home' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>

            <button
              onClick={() => switchFamilyTab('team')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                familyTab === 'team' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Care Team</span>
              {familyTab === 'team' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>

            <button
              onClick={() => switchFamilyTab('tasks')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                familyTab === 'tasks' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Tasks</span>
              {familyTab === 'tasks' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>

            <button
              onClick={() => switchFamilyTab('settings')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                familyTab === 'settings' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-[10px] leading-tight">Settings</span>
              {familyTab === 'settings' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>
          </>
        )}
      </nav>

      {/* Secret Demo Mode Modal (Opened via 700ms long-press on Adept logo) */}
      {demoModalOpen && (
        <DemoModeModal
          onClose={() => setDemoModalOpen(false)}
          onOpenDesign={onOpenDesign}
          onOpenSettings={onOpenSettings}
          onStartOnboardingTest={onStartOnboardingTest}
        />
      )}
    </div>
  );
};
