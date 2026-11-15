import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { HeartHandshake, Tablet, ShieldCheck, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { LogoHeader } from '../shared/LogoHeader';

interface AuthScreenProps {
  onTriggerDemo: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onTriggerDemo }) => {
  const { loginUser, registerUser, pairElderDevice } = useAdept();

  const [activeTab, setActiveTab] = useState<'family' | 'elder'>('family');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Family credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Elder pairing
  const [pairingInput, setPairingInput] = useState('');
  const [pairingError, setPairingError] = useState<string | null>(null);

  const handleFamilySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        if (!email.trim() || !password.trim()) {
          setAuthError('Please fill in email and password.');
          setIsLoading(false);
          return;
        }
        const res = await registerUser(email, password, name || 'Family Coordinator');
        if (!res.success) {
          setAuthError(res.error || 'Registration failed.');
        }
      } else {
        if (!email.trim() || !password.trim()) {
          setAuthError('Please enter your email and password.');
          setIsLoading(false);
          return;
        }
        const res = await loginUser(email, password);
        if (!res.success) {
          setAuthError(res.error || 'Invalid credentials.');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePairElder = (e: React.FormEvent) => {
    e.preventDefault();
    setPairingError(null);

    if (!pairingInput.trim()) {
      setPairingError('Please enter the 9-character pairing code.');
      return;
    }

    const success = pairElderDevice(pairingInput);
    if (!success) {
      setPairingError('Invalid code. Try "ADEPT-7890" or check the code on your family app.');
    }
  };

  // Demo autofill for judges & fast testing
  const handleQuickDemoFamily = async () => {
    setEmail('james.davies@family.care');
    setPassword('calmcare2026');
    setName('James Davies (Son)');
    await loginUser('james.davies@family.care', 'calmcare2026');
  };

  const handleQuickDemoElder = () => {
    pairElderDevice('ADEPT-7890');
  };

  return (
    <div className="w-full max-w-[390px] mx-auto min-h-screen bg-[#fcfbfa] flex flex-col shadow-2xl border-x border-slate-200/60 font-sans">
      {/* Top Header with Long-press Demo trigger */}
      <LogoHeader onTriggerDemo={onTriggerDemo} />

      <div className="flex-1 px-5 py-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Main Title & Hero Tagline */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Calm Elderly Care
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Passcode-paired medication routine & reassurance
            </p>
          </div>

          {/* Segmented Device Switcher (Max 56px touch target) */}
          <div className="grid grid-cols-2 bg-slate-200/70 p-1 rounded-2xl h-14">
            <button
              type="button"
              onClick={() => setActiveTab('family')}
              className={`flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer h-full ${
                activeTab === 'family'
                  ? 'bg-white text-[#064e3b] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Family Owner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('elder')}
              className={`flex items-center justify-center gap-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer h-full ${
                activeTab === 'elder'
                  ? 'bg-[#064e3b] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tablet className="w-4 h-4" />
              <span>Elder Device</span>
            </button>
          </div>

          {/* Tab 1: Family Auth (Real Supabase Auth) */}
          {activeTab === 'family' ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {authMode === 'signin' ? 'Sign In' : 'Create Family Account'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setAuthError(null);
                  }}
                  className="text-xs font-bold text-[#064e3b] hover:underline cursor-pointer"
                >
                  {authMode === 'signin' ? 'Need an account? Register' : 'Have an account? Sign in'}
                </button>
              </div>

              {authMode === 'signup' && (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs text-[#064e3b] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>First user rule:</strong> The first registered account becomes the <strong>Family Owner</strong> and configures Dad's profile.
                  </span>
                </div>
              )}

              {authError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs font-semibold">
                  {authError}
                </div>
              )}

              <form onSubmit={handleFamilySubmit} className="space-y-3">
                {authMode === 'signup' && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="James Davies"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="james.davies@example.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b]"
                    />
                  </div>
                </div>

                {/* Primary Submit Button: max touch target 56px (h-14) */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>{authMode === 'signin' ? 'Sign In as Family Owner' : 'Create Account & Begin Onboarding'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Fast Test Helper Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleQuickDemoFamily}
                  className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Quick Test: Sign in as Family Owner</span>
                </button>
              </div>
            </div>
          ) : (
            /* Tab 2: Elder Tablet Device Pairing */
            <div className="bg-white border-2 border-[#064e3b]/30 rounded-3xl p-6 shadow-sm space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center mx-auto">
                <Tablet className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Pair Dad’s Device
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Enter Arthur’s 9-character code from your Family setup. Arthur logs in once and stays logged in forever.
                </p>
              </div>

              {pairingError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs font-semibold">
                  {pairingError}
                </div>
              )}

              <form onSubmit={handlePairElder} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={pairingInput}
                    onChange={(e) => setPairingInput(e.target.value.toUpperCase())}
                    placeholder="ADEPT-7890"
                    maxLength={10}
                    className="w-full h-14 text-center font-mono font-black text-xl tracking-widest uppercase rounded-2xl border-2 border-slate-300 focus:outline-none focus:border-[#064e3b] bg-slate-50 text-slate-900"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Default pairing code: ADEPT-7890</span>
                </div>

                {/* Primary Pair Button: 56px touch target */}
                <button
                  type="submit"
                  className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                >
                  <span>Connect Arthur's Tablet</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleQuickDemoElder}
                  className="w-full h-12 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>One-Tap Pair as Arthur (Demo)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Note */}
        <div className="text-center pt-4">
          <p className="text-[11px] text-slate-400">
            Adept Platform • AAA Accessible • Zero Log-out Friction for Elders
          </p>
        </div>
      </div>
    </div>
  );
};
