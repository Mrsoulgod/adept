import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { Phone, Heart, MessageCircle, Users, BellRing } from 'lucide-react';
import { CareCircleChatModal } from '../chat/CareCircleChatModal';

export const ElderFamilyTab: React.FC = () => {
  const { profile, familyCheerMessages, requestFamilyCall } = useAdept();
  const [chatOpen, setChatOpen] = useState(false);
  const [targetChannel, setTargetChannel] = useState<'group' | 'sarah-direct' | 'james-direct'>('group');

  const openChatWith = (channel: 'group' | 'sarah-direct' | 'james-direct') => {
    setTargetChannel(channel);
    setChatOpen(true);
  };

  return (
    <div className="px-5 py-6 space-y-6 font-sans">
      {/* Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
          <Heart className="w-3.5 h-3.5 text-[#064e3b]" />
          <span>Your Family</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Loved Ones & Care Circle
        </h1>
        <p className="text-sm text-slate-600">
          Sarah, James, and your family are right here with you.
        </p>
      </div>

      {/* Main Big Choice Action: Open Family Chat */}
      <button
        onClick={() => openChatWith('group')}
        className="w-full min-h-[64px] bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl p-4 flex items-center justify-between shadow-md cursor-pointer active:scale-98 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-200" />
          </div>
          <div className="text-left">
            <div className="text-base font-black">Family Group Chat</div>
            <div className="text-xs text-emerald-200 font-medium">
              Talk or speak with Sarah & James together
            </div>
          </div>
        </div>
        <span className="text-xs bg-emerald-400 text-emerald-950 px-3 py-1.5 rounded-full font-black">
          Open Chat
        </span>
      </button>

      {/* 1-on-1 Family Direct Connect */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Direct Call & Message
        </h2>

        {/* Sarah Davies */}
        <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold text-xl">
                👩
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Sarah Davies (Daughter)
                </h3>
                <p className="text-xs text-slate-500">
                  Care Coordinator • {profile.caretakerPhone || '(555) 345-6789'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <a
              href={`tel:${profile.caretakerPhone || '555-345-6789'}`}
              className="h-12 bg-white hover:bg-emerald-50 border border-emerald-600/50 rounded-xl flex items-center justify-center gap-1 text-slate-900 font-bold text-xs active:scale-98 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-[#064e3b]" />
              <span>Call</span>
            </a>
            <button
              onClick={() => openChatWith('sarah-direct')}
              className="h-12 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-xl flex items-center justify-center gap-1 font-bold text-xs cursor-pointer active:scale-98 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Message</span>
            </button>
            <button
              onClick={() => requestFamilyCall('Sarah Davies', profile.name)}
              className="h-12 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl flex items-center justify-center gap-1 font-bold text-xs cursor-pointer active:scale-98 transition-all"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-800" />
              <span>Ask to Call Me</span>
            </button>
          </div>
        </div>

        {/* James Davies */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xl">
                👨
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  James Davies (Son)
                </h3>
                <p className="text-xs text-slate-500">
                  Family Coordinator • Chicago
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <a
              href="tel:555-789-0123"
              className="h-12 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center gap-1 text-slate-900 font-bold text-xs active:scale-98 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-slate-600" />
              <span>Call</span>
            </a>
            <button
              onClick={() => openChatWith('james-direct')}
              className="h-12 bg-slate-800 hover:bg-slate-900 text-white rounded-xl flex items-center justify-center gap-1 font-bold text-xs cursor-pointer active:scale-98 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Message</span>
            </button>
            <button
              onClick={() => requestFamilyCall('James Davies', profile.name)}
              className="h-12 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl flex items-center justify-center gap-1 font-bold text-xs cursor-pointer active:scale-98 transition-all"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-800" />
              <span>Ask to Call Me</span>
            </button>
          </div>
        </div>
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

      {/* Care Circle Chat Modal */}
      <CareCircleChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        defaultChannelId={targetChannel}
      />
    </div>
  );
};
