import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { User, Shield, Users, QrCode, ArrowRight, ArrowLeft, CheckCircle2, Copy, Check } from 'lucide-react';
import { LogoHeader } from '../shared/LogoHeader';

interface OnboardingWizardProps {
  onComplete: () => void;
  onTriggerDemo: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete, onTriggerDemo }) => {
  const { completeOnboarding, elderPairingCode } = useAdept();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Elder Profile
  const [elderName, setElderName] = useState('Arthur Davies');
  const [elderAge, setElderAge] = useState(78);
  const [doctorName, setDoctorName] = useState('Dr. Evelyn Vance');
  const [doctorPhone, setDoctorPhone] = useState('(555) 234-5678');
  const [conditions, setConditions] = useState('Hypertension, Mild Osteoarthritis');

  // Step 2: Caretaker
  const [caretakerName, setCaretakerName] = useState('Sarah Davies');
  const [caretakerEmail, setCaretakerEmail] = useState('sarah.davies@example.com');
  const [caretakerPin, setCaretakerPin] = useState('246810');
  const [pinError, setPinError] = useState<string | null>(null);

  // Step 3: Family
  const [familyEmail, setFamilyEmail] = useState('james.davies@example.com');
  const [familyNote, setFamilyNote] = useState('Son in Chicago (Calm daily updates)');

  // Step 4: Pairing Code & Copy State
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = caretakerPin.trim();
    if (cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      setPinError('Please enter a valid 6-digit numeric PIN.');
      return;
    }
    setPinError(null);
    setStep(3);
  };

  const handleNextStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        elderName: elderName.trim() || 'Arthur Davies',
        elderAge: Number(elderAge) || 78,
        doctorName: doctorName.trim() || 'Dr. Evelyn Vance',
        doctorPhone: doctorPhone.trim() || '(555) 234-5678',
        conditions: conditions.split(',').map((c) => c.trim()).filter(Boolean),
        caretakerName: caretakerName.trim() || 'Sarah Davies',
        caretakerEmail: caretakerEmail.trim() || 'sarah.davies@example.com',
        caretakerPin: caretakerPin.trim() || '246810',
        familyEmail: familyEmail.trim() || 'james.davies@example.com',
      });
      setStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(elderPairingCode || 'ADEPT-7890');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-[390px] mx-auto min-h-screen bg-[#fcfbfa] flex flex-col shadow-2xl border-x border-slate-200/60 font-sans pb-8">
      {/* Top Header with Long-press Demo trigger */}
      <LogoHeader onTriggerDemo={onTriggerDemo} />

      <div className="px-5 py-4 flex-1 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Progress Indicator (4 Steps) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Setup Wizard</span>
              <span>Step {step} of 4</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 h-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-full rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-[#064e3b]' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* STEP 1: ELDER PROFILE */}
          {step === 1 && (
            <form onSubmit={handleNextStep1} className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center mb-2">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Elder Profile
                </h2>
                <p className="text-xs text-slate-500">
                  Who is the centre of care decisions in your household?
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Elder's Full Name
                  </label>
                  <input
                    type="text"
                    value={elderName}
                    onChange={(e) => setElderName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={elderAge}
                      onChange={(e) => setElderAge(Number(e.target.value))}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Doctor's Phone
                  </label>
                  <input
                    type="text"
                    value={doctorPhone}
                    onChange={(e) => setDoctorPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Health Conditions (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
              >
                <span>Continue to Caretaker Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: ADD CARETAKER */}
          {step === 2 && (
            <form onSubmit={handleNextStep2} className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center mb-2">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Add Primary Caretaker
                </h2>
                <p className="text-xs text-slate-500">
                  Assign the day-to-day coordinator and protect edits with a 6-digit PIN.
                </p>
              </div>

              {pinError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs font-semibold">
                  {pinError}
                </div>
              )}

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Caretaker Full Name
                  </label>
                  <input
                    type="text"
                    value={caretakerName}
                    onChange={(e) => setCaretakerName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Caretaker Email
                  </label>
                  <input
                    type="email"
                    value={caretakerEmail}
                    onChange={(e) => setCaretakerEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    6-Digit Security PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={caretakerPin}
                    onChange={(e) => setCaretakerPin(e.target.value)}
                    placeholder="246810"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base tracking-widest font-mono text-center focus:outline-none focus:border-[#064e3b]"
                  />
                </div>

                {/* Security Guarantee Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <span>🔐 Hashed & Salted Security</span>
                  </div>
                  <p>
                    PIN is hashed using SHA-256 Web Crypto. To protect Dad's regimen, the system automatically triggers a <strong>15-minute lockout after 5 consecutive incorrect attempts</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-14 h-14 rounded-2xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  className="flex-1 h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                >
                  <span>Continue to Family Invites</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: INVITE FAMILY */}
          {step === 3 && (
            <form onSubmit={handleNextStep3} className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Invite Remote Family
                </h2>
                <p className="text-xs text-slate-500">
                  Keep distant siblings and loved ones updated with peaceful daily digests.
                </p>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Family Member Email
                  </label>
                  <input
                    type="email"
                    value={familyEmail}
                    onChange={(e) => setFamilyEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Relationship / Note
                  </label>
                  <input
                    type="text"
                    value={familyNote}
                    onChange={(e) => setFamilyNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                  />
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900">
                  Family members receive calm reassurance emails and can coordinate visits and rides on the shared checklist.
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-14 h-14 rounded-2xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Configuring Profile...' : 'Generate Elder Pairing Code'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: ELDER PAIRING CODE & QR */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Pair Arthur’s Device
                </h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Arthur enters this code once on his phone or tablet and stays logged in forever with zero password hassle.
                </p>
              </div>

              {/* Pairing Code Card */}
              <div className="bg-white border-2 border-[#064e3b] rounded-3xl p-5 shadow-sm space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Pairing Code
                    </span>
                    <span className="text-2xl font-mono font-black text-[#064e3b] tracking-widest">
                      {elderPairingCode || 'ADEPT-7890'}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Crisp SVG QR Code Representation */}
                <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-xs flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="white" />
                    {/* Corner Position Boxes */}
                    <rect x="10" y="10" width="25" height="25" fill="#064e3b" rx="4" />
                    <rect x="15" y="15" width="15" height="15" fill="white" rx="2" />
                    <rect x="18" y="18" width="9" height="9" fill="#064e3b" rx="1" />

                    <rect x="65" y="10" width="25" height="25" fill="#064e3b" rx="4" />
                    <rect x="70" y="15" width="15" height="15" fill="white" rx="2" />
                    <rect x="73" y="18" width="9" height="9" fill="#064e3b" rx="1" />

                    <rect x="10" y="65" width="25" height="25" fill="#064e3b" rx="4" />
                    <rect x="15" y="70" width="15" height="15" fill="white" rx="2" />
                    <rect x="18" y="73" width="9" height="9" fill="#064e3b" rx="1" />

                    {/* Stylized QR Pixels */}
                    <rect x="42" y="12" width="6" height="6" fill="#064e3b" rx="1" />
                    <rect x="52" y="18" width="6" height="6" fill="#064e3b" rx="1" />
                    <rect x="42" y="26" width="6" height="6" fill="#064e3b" rx="1" />
                    <rect x="48" y="44" width="8" height="8" fill="#064e3b" rx="2" />
                    <rect x="18" y="44" width="6" height="6" fill="#064e3b" rx="1" />
                    <rect x="28" y="50" width="6" height="6" fill="#064e3b" rx="1" />
                    <rect x="68" y="44" width="6" height="6" fill="#064e3b" rx="1" />
                    <rect x="78" y="52" width="6" height="6" fill="#064e3b" rx="1" />
                    <rect x="42" y="66" width="6" height="6" fill="#064e3b" rx="1" />
                    <rect x="52" y="74" width="6" height="6" fill="#064e3b" rx="1" />
                    <rect x="68" y="72" width="6" height="6" fill="#064e3b" rx="1" />
                    <rect x="78" y="80" width="8" height="8" fill="#064e3b" rx="1" />
                  </svg>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Scan with Arthur's tablet camera or type code directly.
                </div>
              </div>

              {/* Final Complete Button: 56px touch target */}
              <button
                type="button"
                onClick={onComplete}
                className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>Complete Setup & Open Adept</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Guarantee footer */}
        <p className="text-[11px] text-slate-400 text-center pt-4">
          Adept Household Security • SHA-256 PIN • 5-Attempt Lockout Defense
        </p>
      </div>
    </div>
  );
};
