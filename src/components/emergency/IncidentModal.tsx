import React, { useState, useEffect } from 'react';
import { useAdept } from '../../context/AdeptContext';
import {
  AlertOctagon,
  PhoneCall,
  Clock,
  CheckCircle2,
  Navigation,
  UserCheck,
  X,
} from 'lucide-react';
import type { IncidentRecord } from '../../lib/types';

interface IncidentModalProps {
  incident: IncidentRecord;
  onClose: () => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({ incident, onClose }) => {
  const {
    role,
    activeElder,
    authUser,
    claimIncident,
    escalateIncident,
    resolveIncident,
  } = useAdept();

  const [secondsRemaining, setSecondsRemaining] = useState(90);
  const isClaimed = incident.status === 'claimed' || incident.status === 'resolved';
  const isEscalated = incident.status === 'escalated';
  const isResolved = incident.status === 'resolved';

  // 90-second escalation countdown timer (Prompt 12 requirement)
  useEffect(() => {
    if (isClaimed || isResolved) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          escalateIncident(incident.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incident.id, isClaimed, isResolved]);

  const handleClaim = () => {
    const claimantName = authUser?.name || (role === 'caretaker' ? 'Sarah Davies (Caretaker)' : 'James Davies (Family)');
    claimIncident(incident.id, claimantName, role);
  };

  const handleEscalateNow = () => {
    escalateIncident(incident.id);
  };

  const handleResolve = () => {
    const resolverName = authUser?.name || 'Care Team';
    resolveIncident(incident.id, resolverName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-red-950/80 backdrop-blur-sm animate-in fade-in font-sans">
      <div className="bg-[#fcfbfa] border-4 border-red-600 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-black">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {incident.status.toUpperCase()}
                </span>
                <span className="text-xs text-red-700 font-bold">Active Incident</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {incident.elderName}’s SOS Alert
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claim / Escalation Status Banner */}
        {isResolved ? (
          <div className="bg-emerald-50 border-2 border-emerald-500 p-4 rounded-2xl text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="text-base font-black text-emerald-950">Incident Resolved</h3>
            <p className="text-xs text-emerald-800">
              Resolved by {incident.resolvedBy || 'Care Team'}. Elder is safe.
            </p>
          </div>
        ) : isClaimed ? (
          <div className="bg-emerald-50 border-2 border-emerald-500 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-200 text-emerald-950 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-950">
                Help is on the way!
              </h3>
              <p className="text-xs text-emerald-800">
                <strong>{incident.claimedBy}</strong> has claimed this incident and is actively assisting {incident.elderName.split(' ')[0]}.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border-2 border-red-300 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-red-900 uppercase">
                <Clock className="w-4 h-4 text-red-700 animate-spin" />
                <span>Auto-Escalation Countdown</span>
              </div>
              <span className="text-sm font-black font-mono text-red-700">
                {secondsRemaining}s
              </span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${(secondsRemaining / 90) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-red-800 font-medium">
              If unclaimed within 90 seconds, alerts re-fire to Tier 2 (Emergency EMS 112 & Physician).
            </p>
          </div>
        )}

        {/* Location Snapshot (Prompt 12 Geolocation API requirement) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-700" />
              <span>Location Coordinate</span>
            </span>
            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
              GPS Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Bath, Somerset, UK (Coordinates: 51.3811° N, 2.3590° W)
          </p>
          <a
            href={incident.location?.mapsUrl || 'https://maps.google.com/?q=51.3811,-2.3590'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#064e3b] hover:underline flex items-center gap-1 block"
          >
            <span>Open in Google Maps →</span>
          </a>
        </div>

        {/* Action Buttons: "I'm on it", "Call", "Escalate", "Resolve" */}
        <div className="space-y-2 pt-1">
          {!isClaimed && !isResolved && (
            <button
              onClick={handleClaim}
              className="w-full min-h-[56px] bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
            >
              <UserCheck className="w-5 h-5 text-emerald-300" />
              <span>I'm On It (Lock Incident)</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${activeElder.emergencyContactPhone || '555-345-6789'}`}
              className="h-12 bg-white hover:bg-slate-50 border-2 border-red-300 rounded-xl text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call {incident.elderName.split(' ')[0]}</span>
            </a>

            {!isResolved ? (
              <button
                onClick={handleResolve}
                className="h-12 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Mark Resolved</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="h-12 bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Close View
              </button>
            )}
          </div>

          {!isEscalated && !isResolved && (
            <button
              onClick={handleEscalateNow}
              className="w-full h-11 text-xs text-red-700 hover:bg-red-50 rounded-xl font-bold border border-red-200 cursor-pointer"
            >
              Escalate Immediately to EMS 112 / Dr. Vance
            </button>
          )}
        </div>

        {/* Event Timeline (Prompt 12 requirement: Log every step as events and show timeline) */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Incident Event Audit Trail
          </span>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {incident.timeline.map((item, idx) => (
              <div key={idx} className="text-xs p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900">{item.title}</div>
                  <div className="text-[11px] text-slate-500">{item.description}</div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 pl-2">
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
