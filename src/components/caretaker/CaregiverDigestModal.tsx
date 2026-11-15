import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { Mail, CheckCircle2, X, Send, ArrowRight } from 'lucide-react';

interface CaregiverDigestModalProps {
  onClose: () => void;
}

export const CaregiverDigestModal: React.FC<CaregiverDigestModalProps> = ({ onClose }) => {
  const { profile, triggerCaregiverDigest, lastEmailDispatch, settings, setDirectRole } = useAdept();
  const [recipient, setRecipient] = useState(profile.caretakerEmail || 'sarah.care@example.com');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await triggerCaregiverDigest(recipient);
      setSentSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Mail className="w-4 h-4 text-[#047857]" />
            Hero Feature 1: Resend One-Tap Magic-Link Emails
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Caregiver Daily Digest
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Automated email digest sent every evening or on demand via Resend API. Features a 1-tap passwordless magic link for instant reassurance.
          </p>
        </div>

        {/* Input & Dispatch Form */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Recipient Caregiver Email
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="caregiver@example.com"
            />
            <button
              onClick={handleSend}
              disabled={isSending}
              className="bg-[#064e3b] hover:bg-[#043d2e] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all disabled:opacity-60"
            >
              {sentSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Send className="w-4 h-4" />}
              <span>{isSending ? 'Sending...' : sentSuccess ? 'Sent Successfully!' : 'Send Digest Email'}</span>
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>
              Resend API Key: {settings.resendApiKey ? 'Configured (Live Send)' : 'Default (Demo Simulation)'}
            </span>
            <span className="text-emerald-700 font-semibold">100% Free Tier Compatible</span>
          </div>
        </div>

        {/* Live Email Preview (Rendered HTML) */}
        {lastEmailDispatch && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Live Email Dispatch Output
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {lastEmailDispatch.mode === 'live_resend' ? 'Sent via Resend API' : 'Simulated Resend API'}
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner max-h-80 overflow-y-auto bg-slate-100 p-2">
              <div
                className="bg-white rounded-xl p-4 shadow-sm"
                dangerouslySetInnerHTML={{ __html: lastEmailDispatch.htmlContent }}
              />
            </div>

            {/* Test 1-Tap Magic Link Action */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#064e3b]">
                  Test One-Tap Magic Link Experience
                </p>
                <p className="text-xs text-slate-600">
                  Clicking this link opens the Caregiver view without any passwords or friction.
                </p>
              </div>
              <button
                onClick={() => {
                  setDirectRole('caretaker');
                  onClose();
                }}
                className="bg-[#047857] hover:bg-[#064e3b] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
              >
                <span>Follow 1-Tap Magic Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

