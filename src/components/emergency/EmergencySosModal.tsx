import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { AlertOctagon, PhoneCall, Stethoscope, Users, X, CheckCircle2, ShieldAlert } from 'lucide-react';

interface EmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({ isOpen, onClose }) => {
  const { activeElder, triggerEmergencySOS } = useAdept();
  const [sosSent, setSosSent] = useState(false);

  if (!isOpen) return null;

  const handleSendUrgentAlert = () => {
    triggerEmergencySOS(activeElder.id, 'Elder pressed the red Emergency SOS button');
    setSosSent(true);
    setTimeout(() => {
      // Comfort reassurance stays visible
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/70 backdrop-blur-xs animate-in fade-in font-sans">
      <div className="bg-[#fcfbfa] border-4 border-red-600 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-black">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-lg leading-tight">
                Emergency & Help
              </h2>
              <p className="text-xs text-slate-500 font-semibold">Immediate assistance for {activeElder.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reassurance Banner after SOS pressed */}
        {sosSent ? (
          <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-black text-emerald-950">Help Alert Sent!</h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              We notified <strong>{activeElder.caretakerName || 'Sarah'}</strong> and{' '}
              <strong>{activeElder.familyName || 'James'}</strong> with high priority. Keep your phone near you; they are calling you immediately.
            </p>
          </div>
        ) : (
          /* Big Red Send Urgent Alert Button */
          <button
            onClick={handleSendUrgentAlert}
            className="w-full min-h-[72px] bg-red-600 hover:bg-red-700 text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div className="text-left">
                <div className="text-base font-black uppercase tracking-wide">
                  Send Urgent SOS Alert
                </div>
                <div className="text-xs text-red-100 font-medium">
                  Alerts Sarah & James immediately
                </div>
              </div>
            </div>
            <span className="text-xs bg-white text-red-700 px-3 py-1.5 rounded-full font-black">
              Press SOS
            </span>
          </button>
        )}

        {/* Direct Call Buttons */}
        <div className="space-y-2.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Direct Phone Calls (1 Tap)
          </span>

          {/* 911 Call */}
          <a
            href="tel:911"
            className="w-full h-14 bg-white hover:bg-red-50 border-2 border-red-200 rounded-2xl px-4 flex items-center justify-between text-slate-900 font-bold shadow-xs active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black">Dial 911 (Ambulance / EMS)</div>
                <div className="text-xs text-red-700">Immediate Medical Emergency</div>
              </div>
            </div>
            <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-black">
              Call 911
            </span>
          </a>

          {/* Primary Physician */}
          <a
            href={`tel:${activeElder.doctorPhone || '555-234-8901'}`}
            className="w-full h-14 bg-white hover:bg-emerald-50 border-2 border-slate-200 rounded-2xl px-4 flex items-center justify-between text-slate-900 font-bold shadow-xs active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black">{activeElder.doctorName || 'Dr. Evelyn Vance'}</div>
                <div className="text-xs text-slate-500">Primary Physician</div>
              </div>
            </div>
            <span className="text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-bold">
              Call Doctor
            </span>
          </a>

          {/* Emergency Family Contact */}
          <a
            href={`tel:${activeElder.emergencyContactPhone || '555-345-6789'}`}
            className="w-full h-14 bg-white hover:bg-emerald-50 border-2 border-slate-200 rounded-2xl px-4 flex items-center justify-between text-slate-900 font-bold shadow-xs active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black">{activeElder.emergencyContactName || 'Sarah Davies'}</div>
                <div className="text-xs text-slate-500">Emergency Family Contact</div>
              </div>
            </div>
            <span className="text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-bold">
              Call Family
            </span>
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          Close Emergency Menu
        </button>
      </div>
    </div>
  );
};

