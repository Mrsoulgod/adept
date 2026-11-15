import React, { useState, useEffect } from 'react';
import { useAdept } from '../../context/AdeptContext';
import {
  User,
  Camera,
  Calendar,
  Languages,
  Sunrise,
  Clock,
  Stethoscope,
  PhoneCall,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { LogoHeader } from '../shared/LogoHeader';

interface ElderSetupWizardProps {
  onComplete: () => void;
  onTriggerDemo: () => void;
}

const WIZARD_STEP_KEY = 'adept_wizard_step';
const WIZARD_DRAFT_KEY = 'adept_wizard_draft';

export const ElderSetupWizard: React.FC<ElderSetupWizardProps> = ({ onComplete, onTriggerDemo }) => {
  const { saveElderProfileAndCircle } = useAdept();

  // Restore step and draft data if closed midway (Prompt 2 requirement: resume if closed midway)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(WIZARD_STEP_KEY);
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const [draft, setDraft] = useState(() => {
    try {
      const saved = localStorage.getItem(WIZARD_DRAFT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      name: '',
      photoUrl: '',
      age: 78,
      language: 'en' as 'en' | 'hi',
      wakeTime: '07:00',
      breakfastTime: '08:30',
      lunchTime: '13:00',
      dinnerTime: '19:30',
      sleepTime: '22:00',
      doctorName: 'Dr. Evelyn Vance',
      doctorPhone: '(555) 234-5678',
      emergencyContactName: 'Sarah Davies (Daughter)',
      emergencyContactPhone: '(555) 345-6789',
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-persist draft and step on every change
  useEffect(() => {
    try {
      localStorage.setItem(WIZARD_STEP_KEY, currentStep.toString());
      localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [currentStep, draft]);

  const updateDraft = (key: string, value: any) => {
    setDraft((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await saveElderProfileAndCircle({
        name: draft.name.trim() || 'My Elder',
        photoUrl: draft.photoUrl || '',
        age: Number(draft.age) || 78,
        language: draft.language,
        wakeTime: draft.wakeTime,
        breakfastTime: draft.breakfastTime,
        lunchTime: draft.lunchTime,
        dinnerTime: draft.dinnerTime,
        sleepTime: draft.sleepTime,
        doctorName: draft.doctorName.trim() || 'Dr. Evelyn Vance',
        doctorPhone: draft.doctorPhone.trim() || '(555) 234-5678',
        emergencyContactName: draft.emergencyContactName.trim() || 'Family Caretaker',
        emergencyContactPhone: draft.emergencyContactPhone.trim() || '(555) 345-6789',
      });

      // Clear wizard draft once successfully saved
      localStorage.removeItem(WIZARD_STEP_KEY);
      localStorage.removeItem(WIZARD_DRAFT_KEY);

      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[390px] mx-auto min-h-screen bg-[#fcfbfa] flex flex-col shadow-2xl border-x border-slate-200/60 font-sans pb-8">
      {/* Top Header with Long-press Demo trigger */}
      <LogoHeader onTriggerDemo={onTriggerDemo} />

      <div className="px-5 py-4 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header Progress Bar (Prompt 2: One question per screen) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Care Circle Setup</span>
              <span>Question {currentStep} of 8</span>
            </div>
            <div className="grid grid-cols-8 gap-1 h-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <div
                  key={s}
                  className={`h-full rounded-full transition-all duration-300 ${
                    s <= currentStep ? 'bg-[#064e3b]' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* SCREEN 1: ELDER'S NAME */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  What is your elder’s name?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We address your elder personally throughout daily greetings, dose reminders, and family digests.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => updateDraft('name', e.target.value)}
                  placeholder="e.g. Dad, Mom, Eleanor, or Arthur Davies"
                  autoFocus
                  required
                  className="w-full h-14 px-4 rounded-xl border border-slate-200 text-lg font-bold text-slate-900 focus:outline-none focus:border-[#064e3b]"
                />
              </div>
            </div>
          )}

          {/* SCREEN 2: PHOTO (OPTIONAL) */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Add a photo (optional)
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Helps personalize the care team feed and tablet welcome banner.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-[#064e3b] flex items-center justify-center font-black text-2xl border border-emerald-200">
                  {draft.photoUrl ? (
                    <img src={draft.photoUrl} alt="Arthur" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>AD</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateDraft('photoUrl', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150')}
                    className="text-xs font-bold text-[#064e3b] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    Use Sample Photo
                  </button>
                  {draft.photoUrl && (
                    <button
                      type="button"
                      onClick={() => updateDraft('photoUrl', '')}
                      className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: AGE */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  How old is Arthur?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Used for clinical dosage window context and doctor handoff summaries.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center">
                <input
                  type="number"
                  min={50}
                  max={120}
                  value={draft.age}
                  onChange={(e) => updateDraft('age', Number(e.target.value))}
                  required
                  className="w-32 h-16 text-center font-black text-4xl text-slate-900 rounded-2xl border-2 border-slate-300 focus:outline-none focus:border-[#064e3b]"
                />
                <span className="text-lg font-bold text-slate-500 ml-3">years old</span>
              </div>
            </div>
          )}

          {/* SCREEN 4: LANGUAGE (ENGLISH / HINDI) */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                <Languages className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Preferred Language?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Arthur can view prompts and dictate "maine goli kha li" in English or Hindi.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateDraft('language', 'en')}
                  className={`h-24 p-4 rounded-2xl border-2 text-left flex flex-col justify-between cursor-pointer transition-all ${
                    draft.language === 'en'
                      ? 'border-[#064e3b] bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base font-black text-slate-900">English</span>
                  <span className="text-xs text-slate-500">"Good morning Arthur"</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateDraft('language', 'hi')}
                  className={`h-24 p-4 rounded-2xl border-2 text-left flex flex-col justify-between cursor-pointer transition-all ${
                    draft.language === 'hi'
                      ? 'border-[#064e3b] bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base font-black text-slate-900">हिन्दी (Hindi)</span>
                  <span className="text-xs text-slate-500">"शुभ प्रभात आर्थर"</span>
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 5: WAKE TIME */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                <Sunrise className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  When does Arthur wake up?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Anchors the morning breakfast window so Arthur is never disturbed early.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Usual Wake Time
                </label>
                <input
                  type="time"
                  value={draft.wakeTime}
                  onChange={(e) => updateDraft('wakeTime', e.target.value)}
                  className="w-full h-14 px-4 text-center text-2xl font-black text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#064e3b]"
                />
              </div>
            </div>
          )}

          {/* SCREEN 6: MEAL & SLEEP ANCHORS */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Daily Meal & Sleep Times
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Design law: Doses are anchored to meal windows, never stressful exact minutes.
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Breakfast
                    </label>
                    <input
                      type="time"
                      value={draft.breakfastTime}
                      onChange={(e) => updateDraft('breakfastTime', e.target.value)}
                      className="w-full h-11 px-2.5 text-center font-bold text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Lunch
                    </label>
                    <input
                      type="time"
                      value={draft.lunchTime}
                      onChange={(e) => updateDraft('lunchTime', e.target.value)}
                      className="w-full h-11 px-2.5 text-center font-bold text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Dinner
                    </label>
                    <input
                      type="time"
                      value={draft.dinnerTime}
                      onChange={(e) => updateDraft('dinnerTime', e.target.value)}
                      className="w-full h-11 px-2.5 text-center font-bold text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Sleep / Bedtime
                    </label>
                    <input
                      type="time"
                      value={draft.sleepTime}
                      onChange={(e) => updateDraft('sleepTime', e.target.value)}
                      className="w-full h-11 px-2.5 text-center font-bold text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 7: DOCTOR NAME + PHONE */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Primary Physician
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enables Arthur's one-tap doctor call button and auto-fills Pre-Visit clinical briefs.
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Doctor's Name
                  </label>
                  <input
                    type="text"
                    value={draft.doctorName}
                    onChange={(e) => updateDraft('doctorName', e.target.value)}
                    placeholder="Dr. Evelyn Vance"
                    required
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#064e3b]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Clinic / Direct Phone
                  </label>
                  <input
                    type="tel"
                    value={draft.doctorPhone}
                    onChange={(e) => updateDraft('doctorPhone', e.target.value)}
                    placeholder="(555) 234-5678"
                    required
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#064e3b]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 8: EMERGENCY CONTACT */}
          {currentStep === 8 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Emergency Contact
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Connected to Arthur’s prominent Help tab on his tablet for one-tap calling.
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Contact Name & Relationship
                  </label>
                  <input
                    type="text"
                    value={draft.emergencyContactName}
                    onChange={(e) => updateDraft('emergencyContactName', e.target.value)}
                    placeholder="Sarah Davies (Daughter)"
                    required
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#064e3b]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={draft.emergencyContactPhone}
                    onChange={(e) => updateDraft('emergencyContactPhone', e.target.value)}
                    placeholder="(555) 345-6789"
                    required
                    className="w-full h-12 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#064e3b]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions: Allow Back, Next (56px max touch target) */}
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="w-14 h-14 rounded-2xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
          >
            {currentStep === 8 ? (
              <span>{isSubmitting ? 'Saving Care Circle...' : 'Complete & Launch Home'}</span>
            ) : (
              <span>Continue</span>
            )}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
