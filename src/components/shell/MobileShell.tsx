import React, { useState, useEffect } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { LogoHeader } from '../shared/LogoHeader';
import { DemoModeModal } from '../shared/DemoModeModal';
import { WalkthroughTour } from '../walkthrough/WalkthroughTour';
import { IncidentModal } from '../emergency/IncidentModal';
import { AskAdeptSheet } from '../ai/AskAdeptSheet';
import { ShieldAlert } from 'lucide-react';

// Elder Views
import { ElderScreen } from '../elder/ElderScreen';
import { ElderMindTab } from '../elder/ElderMindTab';
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
  Brain,
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
  const {
    role,
    isTourRunning,
    endWalkthroughTour,
    activeIncident,
    isAdeptSheetOpen,
    closeAdeptSheet,
    adeptContextMed,
    adeptInitialQuestion,
  } = useAdept();
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [bounceNotice, setBounceNotice] = useState<string | null>(null);

  // Tab State per role: each tab is its own distinct route/view, NOT one long scroll!
  const [elderTab, setElderTab] = useState<'today' | 'mind' | 'family' | 'help'>('today');
  const [caretakerTab, setCaretakerTab] = useState<'today' | 'meds' | 'log' | 'alerts'>('today');
  const [familyTab, setFamilyTab] = useState<'home' | 'team' | 'tasks' | 'settings'>('home');

  // Prompt 5 Route Guard: Enforce role-based URLs and bounce back unauthorized attempts
  useEffect(() => {
    const enforceRouteGuard = () => {
      const rawHash = window.location.hash.replace('#/', '');
      const [targetRole, targetTab] = rawHash.split('/');

      // 1. If user attempts to open another role's URL, bounce back immediately!
      if (
        targetRole &&
        targetRole !== role &&
        (targetRole === 'elder' || targetRole === 'caretaker' || targetRole === 'family')
      ) {
        const defaultTab = role === 'family' ? 'home' : 'today';
        window.location.hash = `#/${role}/${defaultTab}`;
        const roleLabel =
          role === 'elder' ? 'Elder' : role === 'caretaker' ? 'Caretaker' : 'Family Owner';
        setBounceNotice(`Access restricted: As ${roleLabel}, you were redirected from /${targetRole} to your ${defaultTab} screen.`);
        setTimeout(() => setBounceNotice(null), 4000);
        return;
      }

      // 2. If on authorized role's routes, sync tab state
      if (targetRole === role) {
        if (role === 'elder') {
          if (
            targetTab === 'today' ||
            targetTab === 'mind' ||
            targetTab === 'family' ||
            targetTab === 'help'
          ) {
            setElderTab(targetTab);
          } else {
            window.location.hash = '#/elder/today';
            setElderTab('today');
          }
        } else if (role === 'caretaker') {
          if (
            targetTab === 'today' ||
            targetTab === 'meds' ||
            targetTab === 'log' ||
            targetTab === 'alerts'
          ) {
            setCaretakerTab(targetTab);
          } else {
            window.location.hash = '#/caretaker/today';
            setCaretakerTab('today');
          }
        } else if (role === 'family') {
          if (
            targetTab === 'home' ||
            targetTab === 'team' ||
            targetTab === 'tasks' ||
            targetTab === 'settings'
          ) {
            setFamilyTab(targetTab);
          } else {
            window.location.hash = '#/family/home';
            setFamilyTab('home');
          }
        }
      } else {
        // Unrecognized or root hash: set to role default
        const defaultTab = role === 'family' ? 'home' : 'today';
        window.location.hash = `#/${role}/${defaultTab}`;
      }
    };

    enforceRouteGuard();
    window.addEventListener('hashchange', enforceRouteGuard);
    return () => window.removeEventListener('hashchange', enforceRouteGuard);
  }, [role]);

  const switchElderTab = (tab: 'today' | 'mind' | 'family' | 'help') => {
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
      {/* Top Header with Logged-in Name, Role & Long-press Demo Mode Trigger */}
      <LogoHeader onTriggerDemo={() => setDemoModalOpen(true)} />

      {/* Prompt 5 Route Guard Bounce Notice */}
      {bounceNotice && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 text-xs font-bold text-amber-900 flex items-center justify-between gap-2 animate-in slide-in-from-top">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{bounceNotice}</span>
          </div>
          <button
            onClick={() => setBounceNotice(null)}
            className="text-[10px] text-amber-800 underline font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area - Renders ONLY the active tab route */}
      <main className="flex-1 w-full">
        {/* ELDER ROLE TABS */}
        {role === 'elder' && (
          <>
            {elderTab === 'today' && <ElderScreen />}
            {elderTab === 'mind' && <ElderMindTab />}
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
        {/* Elder Navigation: Today / Mind / Family / Help */}
        {role === 'elder' && (
          <>
            <button
              id="elder-tab-today"
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
              id="elder-tab-mind"
              onClick={() => switchElderTab('mind')}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                elderTab === 'mind' ? 'text-[#064e3b] font-black' : 'text-slate-500 font-semibold'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span className="text-[11px] leading-tight">Mind</span>
              {elderTab === 'mind' && <div className="w-1.5 h-1.5 rounded-full bg-[#064e3b]" />}
            </button>

            <button
              id="elder-tab-family"
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
              id="elder-help-tab-btn"
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
              id="caretaker-tab-meds"
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
              id="caretaker-tab-alerts"
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
              id="family-tab-team"
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
              id="family-tab-tasks"
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
              id="family-tab-settings"
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

      {/* Interactive Walkthrough Tour (Prompt 6) */}
      <WalkthroughTour forceStart={isTourRunning} onClose={endWalkthroughTour} />

      {/* Secret Demo Mode Modal (Opened via 700ms long-press on Adept logo) */}
      {demoModalOpen && (
        <DemoModeModal
          onClose={() => setDemoModalOpen(false)}
          onOpenDesign={onOpenDesign}
          onOpenSettings={onOpenSettings}
          onStartOnboardingTest={onStartOnboardingTest}
        />
      )}

      {/* Prompt 12: Incident Screen with Escalation & "I'm on it" Claim Locking */}
      {activeIncident && activeIncident.status !== 'resolved' && role !== 'elder' && (
        <IncidentModal
          incident={activeIncident}
          onClose={() => {}}
        />
      )}

      {/* Prompt 8 & 10: Ask Adept AI Bottom Sheet on all roles */}
      <AskAdeptSheet
        isOpen={isAdeptSheetOpen}
        onClose={closeAdeptSheet}
        contextMed={adeptContextMed}
        initialQuestion={adeptInitialQuestion}
      />
    </div>
  );
};
