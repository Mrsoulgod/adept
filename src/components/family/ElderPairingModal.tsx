import React, { useState, useEffect } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { ElderDeviceRecord } from '../../lib/types';
import {
  Tablet,
  Copy,
  Check,
  RotateCcw,
  X,
  Clock,
  Smartphone,
} from 'lucide-react';

interface ElderPairingModalProps {
  onClose: () => void;
}

export const ElderPairingModal: React.FC<ElderPairingModalProps> = ({ onClose }) => {
  const {
    activePairingCodeMeta,
    regeneratePairingCode,
    elderDevices,
    revokeElderDevice,
    activeElder,
  } = useAdept();

  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(activePairingCodeMeta.secondsRemaining);

  // Live 15-minute countdown timer (Prompt 4 requirement: expires in 15 min)
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRegenerate = () => {
    regeneratePairingCode();
    setSecondsRemaining(900);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isExpired = secondsRemaining <= 0;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(activePairingCodeMeta.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#fcfbfa] border-2 border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
              <Tablet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Set up {activeElder.relationship || activeElder.name.split(' ')[0]}'s Phone
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">Prompt 4: Permanent elder pairing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6-Digit Code & 15-Minute Expiration */}
        <div className="bg-white border-2 border-[#064e3b] rounded-2xl p-5 text-center space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
              6-Digit Pairing Code
            </span>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                isExpired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-[#064e3b]'
              }`}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              {isExpired ? 'Expired' : `${timeFormatted} remaining`}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <span className="font-mono font-black text-3xl tracking-[0.25em] text-[#064e3b]">
              {activePairingCodeMeta.code}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copy code"
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* SVG QR Code */}
          <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" fill="white" />
              <rect x="10" y="10" width="25" height="25" fill="#064e3b" rx="4" />
              <rect x="15" y="15" width="15" height="15" fill="white" rx="2" />
              <rect x="18" y="18" width="9" height="9" fill="#064e3b" rx="1" />
              <rect x="65" y="10" width="25" height="25" fill="#064e3b" rx="4" />
              <rect x="70" y="15" width="15" height="15" fill="white" rx="2" />
              <rect x="73" y="18" width="9" height="9" fill="#064e3b" rx="1" />
              <rect x="10" y="65" width="25" height="25" fill="#064e3b" rx="4" />
              <rect x="15" y="70" width="15" height="15" fill="white" rx="2" />
              <rect x="18" y="73" width="9" height="9" fill="#064e3b" rx="1" />
              <rect x="42" y="15" width="6" height="6" fill="#064e3b" rx="1" />
              <rect x="52" y="22" width="6" height="6" fill="#064e3b" rx="1" />
              <rect x="46" y="44" width="8" height="8" fill="#064e3b" rx="2" />
              <rect x="22" y="46" width="6" height="6" fill="#064e3b" rx="1" />
              <rect x="70" y="46" width="6" height="6" fill="#064e3b" rx="1" />
              <rect x="44" y="68" width="6" height="6" fill="#064e3b" rx="1" />
              <rect x="54" y="76" width="6" height="6" fill="#064e3b" rx="1" />
            </svg>
          </div>

          {/* Regenerate if expired */}
          {isExpired && (
            <button
              onClick={handleRegenerate}
              className="text-xs text-[#064e3b] font-bold underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Generate New 6-Digit Code</span>
            </button>
          )}

          <p className="text-[11px] text-slate-500 leading-tight">
            On {activeElder.relationship || activeElder.name.split(' ')[0]}'s phone, open Adept and tap <strong>"I'm the elder"</strong>. Enter this code once and stay logged in permanently.
          </p>
        </div>

        {/* Active Paired Devices & Revocation (Prompt 4: Family can revoke devices from Settings) */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Paired Devices</span>
            <span>{elderDevices.filter((d: ElderDeviceRecord) => !d.isRevoked).length} Active</span>
          </div>

          <div className="space-y-2">
            {elderDevices.map((device: ElderDeviceRecord) => (
              <div
                key={device.id}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  device.isRevoked ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{device.deviceName}</div>
                    <div className="text-[10px] text-slate-400">
                      {device.isRevoked ? 'Revoked' : 'Permanently logged in'}
                    </div>
                  </div>
                </div>

                {!device.isRevoked ? (
                  <button
                    onClick={() => revokeElderDevice(device.id)}
                    className="text-red-600 hover:text-red-700 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-50 cursor-pointer"
                  >
                    Revoke
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">Revoked</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
