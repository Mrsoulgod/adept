import React, { useState } from 'react';
import { useAdept } from '../../../context/AdeptContext';
import { Users, Phone, Heart, Send, CheckCircle2, Stethoscope, User } from 'lucide-react';

export const FamilyTeamTab: React.FC = () => {
  const { profile, sendFamilyCheerMessage, authUser } = useAdept();
  const [noteText, setNoteText] = useState('');
  const [sentNotice, setSentNotice] = useState(false);

  const handleSendCheer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    sendFamilyCheerMessage(authUser?.name || 'James (Son)', noteText.trim());
    setSentNotice(true);
    setNoteText('');
    setTimeout(() => setSentNotice(false), 3500);
  };

  return (
    <div className="px-4 py-5 space-y-5 font-sans">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Arthur’s Care Team
        </h1>
        <p className="text-xs text-slate-500">
          Household coordinators, physicians & family
        </p>
      </div>

      {/* Send Dad a Cheer Note */}
      <div className="bg-white border-2 border-[#064e3b]/30 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#064e3b]">
          <Heart className="w-4 h-4 text-emerald-700" />
          <span>Send Arthur a Warm Note</span>
        </div>

        <p className="text-xs text-slate-500">
          Appears instantly in large, readable type on Dad's tablet Family tab.
        </p>

        {sentNotice && (
          <div className="bg-emerald-50 border border-emerald-300 text-[#064e3b] p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Note posted to Arthur's tablet feed!</span>
          </div>
        )}

        <form onSubmit={handleSendCheer} className="space-y-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Thinking of you today, Dad! Excited to see you on Sunday."
            rows={2}
            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#064e3b] resize-none"
          />

          <button
            type="submit"
            className="w-full h-12 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post to Arthur's Tablet</span>
          </button>
        </form>
      </div>

      {/* Care Team Directory */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Care Team Directory
        </h2>

        <div className="space-y-2.5">
          {/* Arthur */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">{profile.name}</h3>
                <p className="text-xs text-slate-500">Elder • Age {profile.age}</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-100 text-[#064e3b] font-bold px-2 py-0.5 rounded-full">
              Recipient
            </span>
          </div>

          {/* Sarah Davies */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">{profile.caretakerName || 'Sarah Davies'}</h3>
                <p className="text-xs text-slate-500">Primary Caretaker • {profile.caretakerEmail}</p>
              </div>
            </div>
            <a
              href={`tel:${profile.caretakerPhone || '555-345-6789'}`}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Dr. Evelyn Vance */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">{profile.doctorName || 'Dr. Evelyn Vance'}</h3>
                <p className="text-xs text-slate-500">Physician • {profile.doctorPhone || '(555) 234-5678'}</p>
              </div>
            </div>
            <a
              href={`tel:${profile.doctorPhone || '555-234-5678'}`}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
