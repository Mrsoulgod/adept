import React, { useState } from 'react';
import { AdeptProvider, useAdept } from './context/AdeptContext';
import { RoleSelector } from './components/shared/RoleSelector';
import { ElderScreen } from './components/elder/ElderScreen';
import { CaretakerDashboard } from './components/caretaker/CaretakerDashboard';
import { FamilyDashboard } from './components/family/FamilyDashboard';
import { AuditLogViewer } from './components/shared/AuditLogViewer';
import { SettingsModal } from './components/shared/SettingsModal';

const AdeptMain: React.FC = () => {
  const { role, setDirectRole } = useAdept();
  const [auditOpen, setAuditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        />
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
