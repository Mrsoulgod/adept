import React from 'react';
import { ShieldCheck, Stethoscope, Mail, Camera } from 'lucide-react';

export interface CaretakerDashboardShellProps {
  elderName?: string;
  elderAge?: number;
  doctorName?: string;
  caretakerName?: string;
  adherenceRate?: number;
  onOpenScanner?: () => void;
  onOpenBrief?: () => void;
  onOpenDigest?: () => void;
  children?: React.ReactNode;
}

export const CaretakerDashboardShell: React.FC<CaretakerDashboardShellProps> = ({
  elderName = 'Arthur Davies',
  elderAge = 78,
  doctorName = 'Dr. Evelyn Vance',
  caretakerName = 'Sarah Davies',
  adherenceRate = 96,
  onOpenScanner,
  onOpenBrief,
  onOpenDigest,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1D1A] font-sans">
      {/* Top Quiet Concierge Header */}
      <header className="border-b border-[#EAE5DB] bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#244937] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-[#1A1D1A]">
                  Adept Care
                </span>
                <span className="text-xs font-bold bg-[#EAF2EC] text-[#244937] border border-[#C6DBD0] px-2.5 py-0.5 rounded-full">
                  Quiet Concierge
                </span>
              </div>
              <p className="text-xs text-[#70756F] font-medium">
                Care Coordinator: {caretakerName} • Patient: {elderName} ({elderAge})
              </p>
            </div>
          </div>

          {/* Quick Actions (Calm luxury, not frantic emergency buttons) */}
          <div className="flex items-center gap-2.5">
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="bg-[#244937] hover:bg-[#1B3729] text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Scan Prescription</span>
              </button>
            )}

            {onOpenBrief && (
              <button
                onClick={onOpenBrief}
                className="bg-white hover:bg-[#FAF8F5] text-[#1A1D1A] border border-[#D8D1C3] px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Stethoscope className="w-4 h-4 text-[#244937]" />
                <span className="hidden md:inline">Doctor Brief</span>
              </button>
            )}

            {onOpenDigest && (
              <button
                onClick={onOpenDigest}
                className="bg-white hover:bg-[#FAF8F5] text-[#1A1D1A] border border-[#D8D1C3] px-3.5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Mail className="w-4 h-4 text-[#244937]" />
                <span className="hidden md:inline">Digest</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Reassurance & Baseline Banner */}
        <section className="bg-white border border-[#EAE5DB] rounded-3xl p-7 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EAF2EC] text-[#244937] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Calm Baseline Monitor
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1D1A] tracking-tight">
                {elderName}’s Routine is Calm & Steady
              </h2>
              <p className="text-[#474C46] text-base mt-1.5">
                Primary Physician: <strong>{doctorName}</strong> • Routine anchored to daily meals.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#FAF8F5] border border-[#EAE5DB] px-6 py-4 rounded-2xl shrink-0">
              <div className="text-4xl font-bold text-[#244937]">{adherenceRate}%</div>
              <div className="text-xs font-bold text-[#474C46] leading-snug">
                30-Day Window<br />Adherence
              </div>
            </div>
          </div>

          {/* Meal Anchor Window Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-[#EAE5DB]">
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE5DB]">
              <div className="text-xs font-bold text-[#244937] uppercase">Breakfast (7–10 AM)</div>
              <div className="text-sm font-bold text-[#1A1D1A] mt-1">Completed ✓</div>
              <div className="text-xs text-[#70756F]">8:15 AM with toast</div>
            </div>

            <div className="bg-[#EAF2EC]/60 p-3.5 rounded-xl border border-[#C6DBD0]">
              <div className="text-xs font-bold text-[#244937] uppercase">Lunch (12–2:30 PM)</div>
              <div className="text-sm font-bold text-[#244937] mt-1">In Window ⏳</div>
              <div className="text-xs text-[#474C46]">Joint comfort capsule</div>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE5DB]">
              <div className="text-xs font-bold text-[#70756F] uppercase">Dinner (6–8:30 PM)</div>
              <div className="text-sm font-semibold text-[#474C46] mt-1">Upcoming</div>
              <div className="text-xs text-[#70756F]">Heart shield tablet</div>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE5DB]">
              <div className="text-xs font-bold text-[#70756F] uppercase">Bedtime (9–11:30 PM)</div>
              <div className="text-sm font-semibold text-[#474C46] mt-1">Rest Window</div>
              <div className="text-xs text-[#70756F]">Rest supplement</div>
            </div>
          </div>
        </section>

        {/* Dynamic Section or Children */}
        {children ? (
          children
        ) : (
          <section className="bg-white border border-[#EAE5DB] rounded-3xl p-7 shadow-xs">
            <h3 className="text-xl font-bold text-[#1A1D1A] mb-2">Care Routine Dashboard</h3>
            <p className="text-sm text-[#70756F]">
              Select a module from the top navigation or design preview to inspect components.
            </p>
          </section>
        )}
      </main>
    </div>
  );
};
