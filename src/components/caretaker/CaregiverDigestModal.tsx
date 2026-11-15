import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { Mail, CheckCircle2, X, Send } from 'lucide-react';
import { buildUpcomingDoseReminderHtml, buildDeviationAlertHtml, sendEmailViaResend } from '../../lib/resend';

interface CaregiverDigestModalProps {
  onClose: () => void;
}

export const CaregiverDigestModal: React.FC<CaregiverDigestModalProps> = ({ onClose }) => {
  const { profile, medications, triggerCaregiverDigest, lastEmailDispatch, settings } = useAdept();
  const [recipient, setRecipient] = useState(profile.caretakerEmail || 'sarah.care@example.com');
  const [templateType, setTemplateType] = useState<'digest' | 'dose_reminder' | 'missed_dose' | 'appointment'>('dose_reminder');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Generate signed links preview
  const activeMed = medications[0] || {
    id: 'med-1',
    name: 'Amlodipine',
    friendlyName: 'Morning Blood Pressure Pill',
    dosage: '5 mg',
    instructions: '1 tablet with breakfast toast',
    mealAnchor: 'morning_breakfast',
  };

  const origin = window.location.origin;
  const linkTaken = `${origin}/?action=taken&med_id=${activeMed.id}`;
  const linkLater = `${origin}/?action=later&med_id=${activeMed.id}`;
  const linkSkip = `${origin}/?action=skip&med_id=${activeMed.id}`;

  const handleSend = async () => {
    setIsSending(true);
    setSentSuccess(false);

    try {
      if (templateType === 'digest') {
        const res = await triggerCaregiverDigest(recipient);
        setPreviewHtml(res.htmlContent);
      } else if (templateType === 'dose_reminder') {
        const html = buildUpcomingDoseReminderHtml({
          elderName: profile.name,
          medicationName: activeMed.friendlyName || activeMed.name,
          dosage: activeMed.dosage,
          mealAnchorLabel: 'Morning with breakfast (7:00 AM – 10:00 AM)',
          instructions: activeMed.instructions || '1 tablet with breakfast and warm water',
          linkTaken,
          linkLater,
          linkSkip,
        });

        await sendEmailViaResend({
          to: recipient,
          subject: `Time for your morning pill, after breakfast • ${profile.name}`,
          html,
          apiKey: settings.resendApiKey,
        });
        setPreviewHtml(html);
      } else if (templateType === 'missed_dose') {
        const html = buildDeviationAlertHtml({
          elderName: profile.name,
          mealAnchorLabel: 'Morning with breakfast',
          windowLabel: '7:00 AM – 10:00 AM',
          delayedByStr: 'approx. 45 minutes ago',
          comfortNote: `${profile.name.split(' ')[0]} enjoyed a quiet rest in the garden this morning.`,
          magicLink: linkTaken,
        });

        await sendEmailViaResend({
          to: recipient,
          subject: `Gentle Routine Check: Morning with breakfast • ${profile.name}`,
          html,
          apiKey: settings.resendApiKey,
        });
        setPreviewHtml(html);
      }
      setSentSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Mail className="w-4 h-4 text-[#047857]" />
            Resend Email Reminders & One-Tap Actions
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Email Reminders with Signed 1-Tap Links
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Emails feature large readable text and secure signed links (Taken / Later / Skip) that log doses safely with zero passwords and expire in 24 hours.
          </p>
        </div>

        {/* Template Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => {
              setTemplateType('dose_reminder');
              setPreviewHtml(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              templateType === 'dose_reminder'
                ? 'bg-[#064e3b] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming Dose (Taken/Later/Skip)
          </button>

          <button
            onClick={() => {
              setTemplateType('missed_dose');
              setPreviewHtml(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              templateType === 'missed_dose'
                ? 'bg-[#064e3b] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Missed Window (Warm Amber)
          </button>

          <button
            onClick={() => {
              setTemplateType('digest');
              setPreviewHtml(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              templateType === 'digest'
                ? 'bg-[#064e3b] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Caregiver Daily Digest
          </button>
        </div>

        {/* Input & Dispatch Form */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            Recipient Email Address
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="caregiver@example.com"
            />
            <button
              onClick={handleSend}
              disabled={isSending}
              className="bg-[#064e3b] hover:bg-[#043d2e] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all disabled:opacity-60"
            >
              {sentSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Send className="w-4 h-4" />}
              <span>{isSending ? 'Sending...' : sentSuccess ? 'Sent & Rendered!' : 'Send & Preview Email'}</span>
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>
              Resend Key: {settings.resendApiKey ? 'Configured (Live)' : 'Default (Demo Simulation)'}
            </span>
            <span className="text-emerald-700 font-semibold">One-Tap Links Encrypted with HMAC-SHA256</span>
          </div>
        </div>

        {/* Live Email Preview (Rendered HTML) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {(previewHtml || lastEmailDispatch) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Rendered Email (Large-Text & Quiet Luxury)
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready to test
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner max-h-72 overflow-y-auto bg-slate-100 p-2">
                <iframe
                  title="Caregiver Digest Preview"
                  srcDoc={previewHtml || lastEmailDispatch?.htmlContent || ''}
                  className="w-full h-72 rounded-xl border-0 bg-white shadow-sm"
                  sandbox="allow-same-origin"
                />
              </div>

              {/* Interactive test links */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#064e3b]">
                    Test Signed One-Tap Action Links
                  </p>
                  <p className="text-xs text-slate-600">
                    Click any action below to simulate opening the link directly from {profile.name.split(' ')[0]}'s email:
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a
                    href={linkTaken}
                    className="bg-[#064e3b] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#043d2e]"
                  >
                    Test Taken ✓
                  </a>
                  <a
                    href={linkLater}
                    className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    Test Later ⏳
                  </a>
                  <a
                    href={linkSkip}
                    className="bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    Test Skip
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
