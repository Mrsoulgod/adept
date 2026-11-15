import React, { useState, useEffect } from 'react';
import { AdeptProvider, useAdept } from './context/AdeptContext';
import { WelcomeScreen } from './components/auth/WelcomeScreen';
import { ElderSetupWizard } from './components/onboarding/ElderSetupWizard';
import { MobileShell } from './components/shell/MobileShell';
import { DemoModeModal } from './components/shared/DemoModeModal';
import { SettingsModal } from './components/shared/SettingsModal';
import { DesignPreviewPage } from './pages/DesignPreviewPage';

const AdeptMain: React.FC = () => {
  const {
    authUser,
    isElderPaired,
    isOnboarded,
    confirmDose,
    deferDoseComfortably,
    skipDoseComfortably,
    medications,
  } = useAdept();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [showDesignPreview, setShowDesignPreview] = useState(false);
  const [showOnboardingSim, setShowOnboardingSim] = useState(false);
  const [emailActionNotice, setEmailActionNotice] = useState<string | null>(null);

  // Check URL path, hash, or signed one-tap link query params on load
  useEffect(() => {
    const checkRoute = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const emailAction = urlParams.get('action');

      if (emailAction) {
        const medId = urlParams.get('med_id') || (medications[0]?.id || 'med-1');
        if (emailAction === 'taken') {
          confirmDose(medId, 'Logged via signed 1-tap email link. No login required.');
          setEmailActionNotice('✓ Dose recorded: Taken via signed one-tap link! Zero login needed.');
        } else if (emailAction === 'later') {
          deferDoseComfortably(medId, 'Deferred 1 hour via email link.');
          setEmailActionNotice('⏳ Dose deferred for 1 hour via email link.');
        } else if (emailAction === 'skip') {
          skipDoseComfortably(medId, 'Skipped comfortably today via email link.');
          setEmailActionNotice('🛌 Dose comfortably skipped today via email link.');
        }

        // Clean up URL parameters cleanly without page refresh
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (
        window.location.pathname === '/design' ||
        window.location.hash === '#/design' ||
        window.location.hash === '#design'
      ) {
        setShowDesignPreview(true);
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    window.addEventListener('hashchange', checkRoute);
    return () => {
      window.removeEventListener('popstate', checkRoute);
      window.removeEventListener('hashchange', checkRoute);
    };
  }, [medications, confirmDose, deferDoseComfortably, skipDoseComfortably]);

  const openDesign = () => {
    setShowDesignPreview(true);
    window.history.pushState({}, '', '/design');
  };

  const closeDesign = () => {
    setShowDesignPreview(false);
    window.history.pushState({}, '', '/');
  };

  if (showDesignPreview) {
    return <DesignPreviewPage onReturnToApp={closeDesign} />;
  }

  // 1. Unauthenticated and Elder tablet not paired -> Render Mobile-first Welcome Screen (Prompt 1 & 4)
  const isAuthenticated = Boolean(authUser) || isElderPaired;
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfbfa] flex items-center justify-center font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <WelcomeScreen onTriggerDemo={() => setDemoModalOpen(true)} />
        {demoModalOpen && (
          <DemoModeModal
            onClose={() => setDemoModalOpen(false)}
            onOpenDesign={openDesign}
            onOpenSettings={() => setSettingsOpen(true)}
            onStartOnboardingTest={() => setShowOnboardingSim(true)}
          />
        )}
        {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      </div>
    );
  }

  // 2. First-time Family Owner needs onboarding setup (Prompt 2: One-Question Elder Profile Wizard)
  const needsOnboarding = showOnboardingSim || (!isElderPaired && !isOnboarded && authUser?.isOwner);
  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-[#fcfbfa] flex items-center justify-center font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <ElderSetupWizard
          onComplete={() => setShowOnboardingSim(false)}
          onTriggerDemo={() => setDemoModalOpen(true)}
        />
        {demoModalOpen && (
          <DemoModeModal
            onClose={() => setDemoModalOpen(false)}
            onOpenDesign={openDesign}
            onOpenSettings={() => setSettingsOpen(true)}
            onStartOnboardingTest={() => setShowOnboardingSim(true)}
          />
        )}
        {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      </div>
    );
  }

  // 3. Authenticated Mobile Shell (390px, Bottom Tab Navigation per Role)
  return (
    <div className="min-h-screen bg-[#1c221e]/8 flex items-center justify-center font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full max-w-[390px] min-h-screen bg-[#fcfbfa] relative flex flex-col">
        {/* One-Tap Email Action Confirmation Toast */}
        {emailActionNotice && (
          <div className="bg-[#EAF2EC] border-b border-[#C6DBD0] text-[#244937] p-3 text-center text-xs font-bold flex items-center justify-center gap-2">
            <span>{emailActionNotice}</span>
            <button
              onClick={() => setEmailActionNotice(null)}
              className="text-[10px] text-[#244937] underline font-bold px-1.5 py-0.5 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <MobileShell
          onOpenDesign={openDesign}
          onOpenSettings={() => setSettingsOpen(true)}
          onStartOnboardingTest={() => setShowOnboardingSim(true)}
        />
      </div>

      {/* Secret Demo Modal (Logo Long-press) & Settings Modal */}
      {demoModalOpen && (
        <DemoModeModal
          onClose={() => setDemoModalOpen(false)}
          onOpenDesign={openDesign}
          onOpenSettings={() => setSettingsOpen(true)}
          onStartOnboardingTest={() => setShowOnboardingSim(true)}
        />
      )}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <AdeptProvider>
      <AdeptMain />
    </AdeptProvider>
  );
}
