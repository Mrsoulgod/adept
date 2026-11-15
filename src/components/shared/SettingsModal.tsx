import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { Settings, Key, Database, Mail, RefreshCw, X, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, resetDemoData } = useAdept();

  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [resendKey, setResendKey] = useState(settings.resendApiKey || '');
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseKey || '');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      geminiApiKey: geminiKey.trim(),
      resendApiKey: resendKey.trim(),
      supabaseUrl: supabaseUrl.trim(),
      supabaseKey: supabaseKey.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo data back to clean initial state?')) {
      resetDemoData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Settings className="w-4 h-4 text-[#047857]" />
            Configuration & Zero-Cost Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Platform Settings & Integrations
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Adept operates in zero-cost mode with realistic fallback mocks. Enter your live API keys below for real-time cloud connections.
          </p>
        </div>

        {savedNotice && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 p-3 rounded-xl text-xs font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            Settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Gemini API Key */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-700" />
              Gemini API Key (Doctor Handoff OCR & Briefs)
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy... (leave blank for realistic simulation)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Resend API Key */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-700" />
              Resend API Key (One-Tap Emails & Digests)
            </label>
            <input
              type="password"
              value={resendKey}
              onChange={(e) => setResendKey(e.target.value)}
              placeholder="re_... (leave blank for live preview simulation)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Supabase URL & Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-700" />
                Supabase URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyz.supabase.co"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Supabase Anon Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbG..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={handleReset}
              className="text-amber-800 hover:text-amber-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Demo Data
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Save Keys
              </button>
            </div>
          </div>
        </form>

        {/* Hackathon Design Laws Summary */}
        <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 space-y-1.5">
          <p className="font-bold text-slate-900 uppercase tracking-wide">
            Adept Design Laws Checklist:
          </p>
          <p>✓ Elder UI: One screen = one question = one big button (Body 20px+, targets 64px+, AAA)</p>
          <p>✓ Calm by default: green/neutral, warm amber on deviation, zero shame</p>
          <p>✓ Every AI output is a PROPOSAL the elder confirms. Never auto-apply.</p>
          <p>✓ Dose windows & meal anchors, not exact clock times.</p>
          <p>✓ Audit log with elder veto authority.</p>
        </div>
      </div>
    </div>
  );
};

