import React from 'react';
import { useAdept } from '../../context/AdeptContext';
import { Phone, Heart, MessageCircle } from 'lucide-react';

export const ElderFamilyTab: React.FC = () => {
  const { profile, familyCheerMessages } = useAdept();

  return (
    <div className="px-5 py-6 space-y-6 font-sans">
      {/* Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
          <Heart className="w-3.5 h-3.5 text-[#064e3b]" />
          <span>Your Family</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Loved Ones & Messages
        </h1>
        <p className="text-sm text-slate-600">
          Sarah, James, and the family are always with you.
        </p>
      </div>

      {/* Quick One-Tap Call Buttons (56px max touch target) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Quick Phone Call
        </h2>

        <a
          href={`tel:${profile.caretakerPhone || '555-345-6789'}`}
          className="w-full h-14 bg-white hover:bg-emerald-50 border-2 border-emerald-600/40 rounded-2xl px-4 flex items-center justify-between text-slate-900 font-bold shadow-xs active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black">Call Sarah (Daughter)</div>
              <div className="text-xs text-slate-500">{profile.caretakerPhone || '(555) 345-6789'}</div>
            </div>
          </div>
          <span className="text-xs bg-emerald-100 text-[#064e3b] px-3 py-1 rounded-full font-black">
            Call
          </span>
        </a>

        <a
          href="tel:555-789-0123"
          className="w-full h-14 bg-white hover:bg-emerald-50 border-2 border-slate-300 rounded-2xl px-4 flex items-center justify-between text-slate-900 font-bold shadow-xs active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-black">Call James (Son)</div>
              <div className="text-xs text-slate-500">(555) 789-0123 • Chicago</div>
            </div>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-black">
            Call
          </span>
        </a>
      </div>

      {/* Cheer Cards Feed */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />
          <span>Warm Messages from Home</span>
        </h2>

        <div className="space-y-3">
          {familyCheerMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#064e3b]">{msg.sender}</span>
                <span className="text-slate-400 font-medium">{msg.date}</span>
              </div>
              <p className="text-slate-800 text-base font-medium leading-relaxed">
                "{msg.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
