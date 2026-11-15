import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { Heart, CheckCircle2, ShieldCheck, Phone, Mail, Send, Sparkles } from 'lucide-react';

export const FamilyDashboard: React.FC = () => {
  const { profile, triggerCaregiverDigest } = useAdept();
  const [loveNote, setLoveNote] = useState('');
  const [noteSent, setNoteSent] = useState(false);
  const [digestStatus, setDigestStatus] = useState<string | null>(null);

  const handleSendLoveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loveNote.trim()) return;
    setNoteSent(true);
    setTimeout(() => {
      setLoveNote('');
      setNoteSent(false);
    }, 3000);
  };

  const handleEmailDigest = async () => {
    try {
      await triggerCaregiverDigest(profile.familyEmail);
      setDigestStatus('Daily update sent to ' + profile.familyEmail);
      setTimeout(() => setDigestStatus(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Calm Reassurance Banner (Hero Law: Calm by default) */}
      <div className="bg-gradient-to-br from-[#064e3b] to-[#043d2e] text-white rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-400/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Family Reassurance View • Peace of Mind
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Dad is having a calm, steady day.
            </h1>
            <p className="text-emerald-100 text-lg mt-2 max-w-xl">
              Arthur had his morning toast and Earl Grey tea, and took his morning blood pressure and sugar tablets on time.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-center shrink-0">
            <div className="w-14 h-14 bg-emerald-400 text-emerald-950 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-black">
              ✓
            </div>
            <div className="text-lg font-bold">All Good</div>
            <div className="text-xs text-emerald-200">Baseline Maintained</div>
          </div>
        </div>
      </div>

      {/* Routine Progress Timeline */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="text-2xl font-black text-slate-900">
          Today’s Routine at a Glance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shrink-0">
              ✓
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase">Morning Window</span>
              <h4 className="text-base font-bold text-slate-900">Breakfast (7 – 10 AM)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Completed at 8:15 AM with breakfast toast.
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shrink-0">
              ✓
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase">Midday Window</span>
              <h4 className="text-base font-bold text-slate-900">Lunch (12 – 2:30 PM)</h4>
              <p className="text-xs text-slate-600 mt-1">
                Joint comfort supplement confirmed.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-300 text-slate-700 rounded-xl flex items-center justify-center font-bold shrink-0">
              ⏳
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Evening Window</span>
              <h4 className="text-base font-bold text-slate-900">Dinner (6 – 8:30 PM)</h4>
              <p className="text-xs text-slate-500 mt-1">
                Scheduled for this evening.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Send Love & Reassurance to Dad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            Send Arthur a Loving Note
          </div>
          <h4 className="text-xl font-bold text-slate-900">
            Brighten Dad’s Day
          </h4>
          <p className="text-xs text-slate-600">
            Notes appear directly on Arthur’s large tablet screen alongside his morning and evening check-ins.
          </p>

          <form onSubmit={handleSendLoveNote} className="space-y-3">
            <textarea
              rows={3}
              value={loveNote}
              onChange={(e) => setLoveNote(e.target.value)}
              placeholder="Hi Dad! Thinking of you. The kids send huge hugs. Call us whenever you feel like a chat."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {noteSent ? (
              <div className="bg-emerald-100 text-emerald-900 p-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Note sent to Dad’s tablet!
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-[#064e3b] hover:bg-[#043d2e] text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Send Note to Dad</span>
              </button>
            )}
          </form>
        </div>

        {/* Family Care Contacts & Email Digest */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              Connected Care Team
            </div>
            <h4 className="text-xl font-bold text-slate-900 mt-1">
              Primary Caretaker & Physician
            </h4>

            <div className="space-y-3 mt-4 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">{profile.caretakerName}</div>
                  <div className="text-xs text-slate-500">Primary Local Caregiver</div>
                </div>
                <a
                  href={`tel:${profile.caretakerPhone}`}
                  className="bg-emerald-100 text-[#064e3b] px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">{profile.doctorName}</div>
                  <div className="text-xs text-slate-500">St. Jude Geriatric Care</div>
                </div>
                <a
                  href={`tel:${profile.doctorPhone}`}
                  className="bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {digestStatus && (
              <p className="text-xs text-emerald-700 font-bold mb-2 text-center">{digestStatus}</p>
            )}
            <button
              onClick={handleEmailDigest}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Mail className="w-4 h-4 text-slate-600" />
              <span>Send Me Today’s Family Digest (Resend)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

