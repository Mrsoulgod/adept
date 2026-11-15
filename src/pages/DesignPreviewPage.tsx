import React, { useState } from 'react';
import { Button } from '../components/design-system/Button';
import { BigChoice } from '../components/design-system/BigChoice';
import { Greeting } from '../components/design-system/Greeting';
import { CaretakerDashboardShell } from '../components/design-system/CaretakerDashboardShell';
import {
  CheckCircle2,
  Sparkles,
  HeartHandshake,
  AlertCircle
} from 'lucide-react';

export const DesignPreviewPage: React.FC<{ onReturnToApp?: () => void }> = ({ onReturnToApp }) => {
  const [selectedChoice, setSelectedChoice] = useState<string>('morning-med');
  const [clickCount, setClickCount] = useState<number>(0);
  const [activeTimeOfDay, setActiveTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1D1A] font-sans pb-24">
      {/* Top Banner with Return Navigation */}
      <div className="bg-[#244937] text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
              Adept Foundation
            </span>
            <span className="font-bold text-lg">Design System & Elder Component Preview</span>
          </div>

          {onReturnToApp && (
            <button
              onClick={onReturnToApp}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              ← Return to Main Application
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-10 space-y-16">
        {/* Intro Manifesto: Quiet Luxury & Anti-Medical Aesthetic */}
        <section className="bg-white border border-[#EAE5DB] rounded-3xl p-8 sm:p-10 shadow-xs">
          <div className="inline-flex items-center gap-2 bg-[#EAF2EC] text-[#244937] px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4 text-[#244937]" />
            Adept Design Law Manifesto
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1D1A]">
            Quiet, Respectful & Anti-Medical
          </h1>
          <p className="text-xl text-[#474C46] leading-relaxed mt-3 max-w-3xl">
            Adept rejects the cold, sterile hospital aesthetics of traditional health apps. We use a warm off-white linen palette, a single calming heritage sage accent, and Atkinson Hyperlegible typography designed specifically for low-vision and elderly clarity.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-[#EAE5DB]">
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DB]">
              <div className="text-xs font-bold text-[#70756F] uppercase">Rule 1: Scale</div>
              <div className="text-lg font-bold text-[#1A1D1A] mt-1">20px+ Body Typography</div>
              <div className="text-xs text-[#70756F] mt-1">Legible without reading glasses</div>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DB]">
              <div className="text-xs font-bold text-[#70756F] uppercase">Rule 2: Touch</div>
              <div className="text-lg font-bold text-[#1A1D1A] mt-1">64px+ Tap Targets</div>
              <div className="text-xs text-[#70756F] mt-1">Effortless for unsteady hands</div>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DB]">
              <div className="text-xs font-bold text-[#70756F] uppercase">Rule 3: Contrast</div>
              <div className="text-lg font-bold text-[#244937] mt-1">WCAG AAA Certified</div>
              <div className="text-xs text-[#70756F] mt-1">Deep contrast ratio &gt; 12:1</div>
            </div>
          </div>
        </section>

        {/* SECTION 1: PALETTE & SWATCHES */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1D1A]">
              1. Warm Off-White Palette & Calm Accent
            </h2>
            <p className="text-base text-[#70756F] mt-1">
              Soft linen warmth rather than stark clinical white. Single calm green accent.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE5DB] shadow-xs">
              <div className="w-full h-12 rounded-xl bg-[#FAF8F5] border border-[#EAE5DB] mb-2" />
              <div className="font-bold text-xs text-[#1A1D1A]">Warm Linen</div>
              <div className="text-[11px] text-[#70756F]">#FAF8F5 • Canvas</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAE5DB] shadow-xs">
              <div className="w-full h-12 rounded-xl bg-white border border-[#EAE5DB] mb-2" />
              <div className="font-bold text-xs text-[#1A1D1A]">Warm Surface</div>
              <div className="text-[11px] text-[#70756F]">#FFFFFF • Cards</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAE5DB] shadow-xs">
              <div className="w-full h-12 rounded-xl bg-[#244937] mb-2" />
              <div className="font-bold text-xs text-[#1A1D1A]">Heritage Sage</div>
              <div className="text-[11px] text-[#70756F]">#244937 • Accent</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAE5DB] shadow-xs">
              <div className="w-full h-12 rounded-xl bg-[#EAF2EC] border border-[#C6DBD0] mb-2" />
              <div className="font-bold text-xs text-[#1A1D1A]">Sage Tint</div>
              <div className="text-[11px] text-[#70756F]">#EAF2EC • Badges</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAE5DB] shadow-xs">
              <div className="w-full h-12 rounded-xl bg-[#FBF5EA] border border-[#EBDBC1] mb-2" />
              <div className="font-bold text-xs text-[#1A1D1A]">Warm Amber</div>
              <div className="text-[11px] text-[#70756F]">#FBF5EA • Deferral</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#EAE5DB] shadow-xs">
              <div className="w-full h-12 rounded-xl bg-[#1A1D1A] mb-2" />
              <div className="font-bold text-xs text-[#1A1D1A]">Charcoal Ink</div>
              <div className="text-[11px] text-[#70756F]">#1A1D1A • High Contrast</div>
            </div>
          </div>
        </section>

        {/* SECTION 2: GREETING HEADER COMPONENT */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1A1D1A]">
                2. Greeting Header Component
              </h2>
              <p className="text-base text-[#70756F] mt-1">
                Time-of-day awareness, quiet tone, and calm baseline status indicator.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-[#EAE5DB] p-1 rounded-xl self-start">
              {(['morning', 'afternoon', 'evening'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTimeOfDay(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer transition-colors ${
                    activeTimeOfDay === t ? 'bg-[#244937] text-white' : 'text-[#70756F] hover:text-[#1A1D1A]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#EAE5DB] rounded-3xl p-8 shadow-xs">
            <Greeting
              elderName="Arthur"
              timeOfDay={activeTimeOfDay}
              statusText="All is peaceful right now"
              subtext="Your morning routine is complete. Your next anchor is after lunch."
            />
          </div>
        </section>

        {/* SECTION 3: BUTTON COMPONENT AT ELDER SIZE */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1D1A]">
              3. Button Component (At Elder Size: min-h 68px, 22px body font)
            </h2>
            <p className="text-base text-[#70756F] mt-1">
              One big button rule: generous 68px tap target, large clear text, high contrast.
            </p>
          </div>

          <div className="bg-white border border-[#EAE5DB] rounded-3xl p-8 shadow-xs space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-[#70756F] uppercase tracking-wider mb-2 block">
                  Primary Button (Calm Heritage Sage • Elder Size)
                </span>
                <Button
                  variant="primary"
                  size="elder"
                  icon={<CheckCircle2 className="w-8 h-8 text-emerald-300" />}
                  onClick={() => setClickCount((c) => c + 1)}
                >
                  Yes, I took my morning medicine
                </Button>
              </div>

              <div>
                <span className="text-xs font-bold text-[#70756F] uppercase tracking-wider mb-2 block">
                  Amber Button (Rest / Deferral • Never Red, Never Shame • Elder Size)
                </span>
                <Button
                  variant="amber"
                  size="elder"
                  icon={<AlertCircle className="w-8 h-8 text-[#92631E]" />}
                  onClick={() => setClickCount((c) => c + 1)}
                >
                  Not yet, I’ll take it in a little while
                </Button>
              </div>

              <div>
                <span className="text-xs font-bold text-[#70756F] uppercase tracking-wider mb-2 block">
                  Secondary Button (Warm Surface • Elder Size)
                </span>
                <Button
                  variant="secondary"
                  size="elder"
                  icon={<HeartHandshake className="w-8 h-8 text-[#244937]" />}
                  onClick={() => setClickCount((c) => c + 1)}
                >
                  Record how my body is feeling
                </Button>
              </div>
            </div>

            {clickCount > 0 && (
              <div className="text-center text-sm font-bold text-[#244937] bg-[#EAF2EC] p-3 rounded-xl border border-[#C6DBD0]">
                Interactive response verified: Button tapped {clickCount} {clickCount === 1 ? 'time' : 'times'}.
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: BIGCHOICE CARD COMPONENT */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1D1A]">
              4. BigChoice Card Component (At Elder Size)
            </h2>
            <p className="text-base text-[#70756F] mt-1">
              "One screen = one question = one big choice card". Entire card is a comfortable tactile tap target.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BigChoice
              title="Dr. Vance's Prescription Proposal"
              description="Dr. Evelyn Vance recommended adding Vitamin D3 (1,000 IU) to take after lunch for bone strength."
              badge="Proposal from Physician"
              meta="After Lunch (12:00 – 2:30 PM)"
              icon={<Sparkles className="w-8 h-8" />}
              selected={selectedChoice === 'dr-proposal'}
              variant="calm"
              onClick={() => setSelectedChoice('dr-proposal')}
              actionLabel="Arthur Confirms"
            />

            <BigChoice
              title="Rest First & Check In Later"
              description="Feeling a bit tired this morning? Sarah will be gently notified so you can take meals at your own pace."
              badge="Comfort & Patience"
              meta="Warm Amber • No Rush"
              icon={<AlertCircle className="w-8 h-8" />}
              selected={selectedChoice === 'rest-comfort'}
              variant="amber"
              onClick={() => setSelectedChoice('rest-comfort')}
              actionLabel="Take Your Time"
            />
          </div>
        </section>

        {/* SECTION 5: CARETAKER DASHBOARD SHELL */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1D1A]">
              5. Caretaker Dashboard Shell
            </h2>
            <p className="text-base text-[#70756F] mt-1">
              Discreet, premium wellness concierge for Sarah Davies and family members.
            </p>
          </div>

          <div className="border border-[#EAE5DB] rounded-3xl overflow-hidden shadow-sm">
            <CaretakerDashboardShell
              elderName="Arthur Davies"
              elderAge={78}
              doctorName="Dr. Evelyn Vance"
              caretakerName="Sarah Davies"
              adherenceRate={96}
              onOpenScanner={() => alert('Prescription Scanner (Gemini OCR) Triggered')}
              onOpenBrief={() => alert('Doctor Pre-Visit Brief Triggered')}
              onOpenDigest={() => alert('Daily Digest Dispatch Triggered')}
            >
              <div className="p-6 bg-white rounded-2xl border border-[#EAE5DB]">
                <h4 className="text-lg font-bold text-[#1A1D1A] mb-1">
                  Active Care Coordinator View
                </h4>
                <p className="text-sm text-[#474C46]">
                  This shell wraps all clinical integrations (Gemini Vision prescription parser, 30-day pre-visit doctor briefs, baseline-deviation monitor, and Resend one-tap magic link emails) in an unhurried, reassuring environment.
                </p>
              </div>
            </CaretakerDashboardShell>
          </div>
        </section>
      </div>
    </div>
  );
};
