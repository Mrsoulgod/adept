import React, { useState, useEffect } from 'react';
import { AdeptProvider, useAdept } from './context/AdeptContext';
import { RoleSelector } from './components/shared/RoleSelector';
import { ElderScreen } from './components/elder/ElderScreen';
import { CaretakerDashboard } from './components/caretaker/CaretakerDashboard';
import { FamilyDashboard } from './components/family/FamilyDashboard';
import { AuditLogViewer } from './components/shared/AuditLogViewer';
import { SettingsModal } from './components/shared/SettingsModal';
import { DesignPreviewPage } from './pages/DesignPreviewPage';
import { Palette } from 'lucide-react';

const AdeptMain: React.FC = () => {
  const { role, setDirectRole, confirmDose, deferDoseComfortably, skipDoseComfortably, medications } = useAdept();
  const [auditOpen, setAuditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showDesignPreview, setShowDesignPreview] = useState(false);
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
  }, []);

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

  return (
    <div className="min-h-screen bg-[#fcfbfa] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Global Navigation Header (Shown for Caretaker and Family, or discreet toggle for Elder) */}
      {role === 'elder' ? (
        <div className="bg-[#fcfbfa] border-b border-slate-200/60 px-4 py-3 flex items-center justify-between max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#064e3b] text-white flex items-center justify-center font-black text-sm">
              A
            </div>
            <span className="font-extrabold text-slate-800 text-lg">Adept</span>
            <span className="text-xs bg-emerald-100 text-[#064e3b] font-bold px-2.5 py-0.5 rounded-full">
              Arthur Davies (78)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openDesign}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] font-bold px-2.5 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>/design</span>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold px-2 py-1"
            >
              Demo Settings
            </button>
            <button
              onClick={() => setDirectRole('caretaker')}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer"
            >
              Switch Role
            </button>
          </div>
        </div>
      ) : (
        <RoleSelector
          onOpenAudit={() => setAuditOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenDesign={openDesign}
        />
      )}

      {/* One-Tap Email Action Confirmation Toast */}
      {emailActionNotice && (
        <div className="bg-[#EAF2EC] border-b border-[#C6DBD0] text-[#244937] p-4 text-center text-lg font-bold flex items-center justify-center gap-3">
          <span>{emailActionNotice}</span>
          <button
            onClick={() => setEmailActionNotice(null)}
            className="text-xs text-[#244937] underline font-bold px-2 py-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main View Area by Role */}
      <main className="flex-1 pb-12">
        {role === 'elder' && <ElderScreen />}
        {role === 'caretaker' && <CaretakerDashboard />}
        {role === 'family' && <FamilyDashboard />}
      </main>

      {/* Modals */}
      {auditOpen && <AuditLogViewer onClose={() => setAuditOpen(false)} />}
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
