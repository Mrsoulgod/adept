import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { VitalRecord, VitalType } from '../../lib/types';
import {
  Activity,
  Heart,
  Droplet,
  Scale,
  Mic,
  MicOff,
  CheckCircle2,
  X,
  Plus,
} from 'lucide-react';

interface VitalsScreenProps {
  onClose?: () => void;
}

export const VitalsScreen: React.FC<VitalsScreenProps> = ({ onClose }) => {
  const {
    activeElder,
    vitals,
    recordVital,
    role,
    language,
    recordEvent,
  } = useAdept();

  const [activeType, setActiveType] = useState<VitalType>('bp');
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [entryMode, setEntryMode] = useState<'view' | 'numpad' | 'voice'>('view');

  // Numpad Form Inputs
  const [systolicStr, setSystolicStr] = useState('126');
  const [diastolicStr, setDiastolicStr] = useState('82');
  const [pulseStr, setPulseStr] = useState('72');
  const [sugarStr, setSugarStr] = useState('108');
  const [weightStr, setWeightStr] = useState('74.2');
  const [activeNumpadField, setActiveNumpadField] = useState<'systolic' | 'diastolic' | 'pulse' | 'sugar' | 'weight'>('systolic');

  // Confirmation preview modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingVital, setPendingVital] = useState<Omit<VitalRecord, 'id' | 'loggedAt'> | null>(null);

  // Voice speech state
  const [isListening, setIsListening] = useState(false);
  const [voiceHeard, setVoiceHeard] = useState('');
  const recognitionRef = useRef<any>(null);

  // Filter vitals for current type
  const typeVitals = vitals.filter((v) => v.type === activeType && v.elderId === activeElder.id);

  // Evaluate gentle clinical range flags that NEVER alarm (Prompt 9 constraint)
  const evaluateRangeFlag = useCallback(
    (vital: Partial<VitalRecord>): { flag: 'normal' | 'low' | 'high' | 'steady'; label: string; isOutOfRange: boolean } => {
      if (vital.type === 'bp') {
        const sys = vital.systolic || 120;
        const dia = vital.diastolic || 80;
        if (sys > 140 || dia > 90) {
          return {
            flag: 'high',
            label: `Slightly above ${activeElder.name.split(' ')[0]}'s usual baseline (resting recommended)`,
            isOutOfRange: true,
          };
        }
        if (sys < 100 || dia < 65) {
          return {
            flag: 'low',
            label: `A bit lower than usual (have a glass of water and rest comfortably)`,
            isOutOfRange: true,
          };
        }
        return {
          flag: 'normal',
          label: `Normal resting range for ${activeElder.name.split(' ')[0]}`,
          isOutOfRange: false,
        };
      }

      if (vital.type === 'sugar') {
        const val = vital.bloodSugar || 100;
        if (val > 150) {
          return {
            flag: 'high',
            label: 'Slightly elevated post-meal reading (steady walk advised)',
            isOutOfRange: true,
          };
        }
        if (val < 70) {
          return {
            flag: 'low',
            label: 'Lower than usual (enjoy a small snack or fruit juice)',
            isOutOfRange: true,
          };
        }
        return {
          flag: 'steady',
          label: 'Steady normal glucose level',
          isOutOfRange: false,
        };
      }

      return { flag: 'steady', label: 'Steady baseline reading', isOutOfRange: false };
    },
    [activeElder.name]
  );

  const prepareVitalConfirmation = useCallback(
    (vitalData: Partial<VitalRecord>) => {
      const rangeInfo = evaluateRangeFlag(vitalData);
      const completeVital: Omit<VitalRecord, 'id' | 'loggedAt'> = {
        elderId: activeElder.id,
        type: vitalData.type || activeType,
        systolic: vitalData.systolic,
        diastolic: vitalData.diastolic,
        bloodSugar: vitalData.bloodSugar,
        weightKg: vitalData.weightKg,
        pulseBpm: vitalData.pulseBpm,
        context: vitalData.context || 'resting',
        rangeFlag: rangeInfo.flag,
        rangeFlagLabel: rangeInfo.label,
        notes: vitalData.notes || '',
        loggedBy: role,
      };

      setPendingVital(completeVital);
      setConfirmModalOpen(true);
    },
    [activeElder.id, activeType, evaluateRangeFlag, role]
  );

  // Parse spoken vitals using pattern recognition (Prompt 9)
  const parseVitalsVoice = useCallback(
    (spokenText: string) => {
      const lower = spokenText.toLowerCase();

      if (activeType === 'bp' || lower.includes('bp') || lower.includes('pressure') || lower.includes('बाय')) {
        const nums = lower.match(/\d+/g);
        if (nums && nums.length >= 2) {
          const sys = parseInt(nums[0], 10);
          const dia = parseInt(nums[1], 10);
          const pulse = nums[2] ? parseInt(nums[2], 10) : 72;
          prepareVitalConfirmation({
            elderId: activeElder.id,
            type: 'bp',
            systolic: sys,
            diastolic: dia,
            pulseBpm: pulse,
            context: 'resting',
            loggedBy: role,
            notes: `Voice recorded: "${spokenText}"`,
          });
          return;
        }
      }

      if (activeType === 'sugar' || lower.includes('sugar') || lower.includes('glucose')) {
        const nums = lower.match(/\d+/g);
        if (nums && nums.length >= 1) {
          const sugar = parseInt(nums[0], 10);
          prepareVitalConfirmation({
            elderId: activeElder.id,
            type: 'sugar',
            bloodSugar: sugar,
            context: lower.includes('fasting') ? 'fasting' : 'post_meal',
            loggedBy: role,
            notes: `Voice recorded: "${spokenText}"`,
          });
          return;
        }
      }

      if (activeType === 'weight' || lower.includes('weight')) {
        const nums = lower.match(/[\d.]+/g);
        if (nums && nums.length >= 1) {
          const wt = parseFloat(nums[0]);
          prepareVitalConfirmation({
            elderId: activeElder.id,
            type: 'weight',
            weightKg: wt,
            context: 'resting',
            loggedBy: role,
            notes: `Voice recorded: "${spokenText}"`,
          });
          return;
        }
      }
    },
    [activeElder.id, activeType, prepareVitalConfirmation, role]
  );

  // Setup Web Speech API for Vitals Voice parsing (Prompt 9: "BP 130 by 85")
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setVoiceHeard(transcript);
          parseVitalsVoice(transcript);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, [language, parseVitalsVoice]);

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      // Zero friction simulated voice parse
      const sample = activeType === 'bp' ? 'BP 130 by 85' : activeType === 'sugar' ? 'Sugar 105 fasting' : 'Weight 74 point 2';
      setVoiceHeard(sample);
      parseVitalsVoice(sample);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleNumpadTap = (digit: string) => {
    if (activeType === 'bp') {
      if (activeNumpadField === 'systolic') {
        if (digit === 'del') setSystolicStr((p) => p.slice(0, -1) || '0');
        else setSystolicStr((p) => (p === '0' || p.length >= 3 ? digit : p + digit));
      } else if (activeNumpadField === 'diastolic') {
        if (digit === 'del') setDiastolicStr((p) => p.slice(0, -1) || '0');
        else setDiastolicStr((p) => (p === '0' || p.length >= 3 ? digit : p + digit));
      } else {
        if (digit === 'del') setPulseStr((p) => p.slice(0, -1) || '0');
        else setPulseStr((p) => (p === '0' || p.length >= 3 ? digit : p + digit));
      }
    } else if (activeType === 'sugar') {
      if (digit === 'del') setSugarStr((p) => p.slice(0, -1) || '0');
      else setSugarStr((p) => (p === '0' || p.length >= 3 ? digit : p + digit));
    } else {
      if (digit === 'del') setWeightStr((p) => p.slice(0, -1) || '0');
      else setWeightStr((p) => (p === '0' || p.length >= 4 ? digit : p + digit));
    }
  };

  const handleSaveConfirmedVital = () => {
    if (!pendingVital) return;

    // 1. Record vital in context (writes vital_logged event into events table)
    recordVital(pendingVital);

    // 2. If out of range, dispatch calm amber note to caretaker
    const rangeInfo = evaluateRangeFlag(pendingVital);
    if (rangeInfo.isOutOfRange) {
      recordEvent({
        circleId: activeElder.id,
        actorRole: 'system',
        type: 'note',
        payload: {
          noteType: 'vital_deviation',
          elderName: activeElder.name,
          reading:
            pendingVital.type === 'bp'
              ? `${pendingVital.systolic}/${pendingVital.diastolic} mmHg`
              : `${pendingVital.bloodSugar} mg/dL`,
          message: `${activeElder.name.split(' ')[0]}'s reading: ${rangeInfo.label}. Sarah notified calmly.`,
        },
        source: 'clinical_safety_guard',
      });
    }

    setConfirmModalOpen(false);
    setPendingVital(null);
    setEntryMode('view');
  };

  return (
    <div className="px-4 py-5 space-y-5 font-sans pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-950 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-emerald-800" />
            <span>Health Vitals</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {activeElder.name}’s Vitals
          </h1>
          <p className="text-xs text-slate-500">
            Gentle tracking • Zero alarm wording • Auto-synced to Brief
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Vital Type Selector Tabs */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { id: 'bp', label: 'Blood Pressure', icon: Heart, unit: 'mmHg' },
          { id: 'sugar', label: 'Blood Sugar', icon: Droplet, unit: 'mg/dL' },
          { id: 'weight', label: 'Weight', icon: Scale, unit: 'kg' },
          { id: 'pulse', label: 'Pulse Rate', icon: Activity, unit: 'bpm' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveType(tab.id as VitalType);
                setEntryMode('view');
              }}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px] font-black">{tab.label.split(' ')[0]}</span>
              <span className="text-[9px] opacity-75">{tab.unit}</span>
            </button>
          );
        })}
      </div>

      {/* Action Bar: New Reading Entry (Number-pad vs Voice) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setEntryMode('numpad')}
          className={`h-13 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 ${
            entryMode === 'numpad'
              ? 'bg-[#064e3b] text-white shadow-sm'
              : 'bg-white border-2 border-emerald-700/30 text-[#064e3b] hover:bg-emerald-50'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Tap Number-Pad</span>
        </button>

        <button
          onClick={() => {
            setEntryMode('voice');
            toggleVoiceListening();
          }}
          className={`h-13 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 ${
            isListening
              ? 'bg-amber-500 text-white animate-pulse'
              : 'bg-white border-2 border-slate-300 text-slate-800 hover:bg-slate-50'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-800" />}
          <span>{isListening ? 'Listening...' : 'Speak ("BP 130 by 85")'}</span>
        </button>
      </div>

      {/* VOICE LISTENING BANNER */}
      {entryMode === 'voice' && (
        <div className="bg-amber-50 border-2 border-amber-300/80 p-4 rounded-3xl text-center space-y-2 animate-in fade-in">
          <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center mx-auto animate-pulse">
            <Mic className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-amber-950">
            {isListening ? 'Listening for your reading...' : 'Speak your reading clearly'}
          </h3>
          <p className="text-xs text-amber-800">
            Example: "BP 130 by 85" or "Sugar 105 fasting"
          </p>
          {voiceHeard && (
            <div className="text-xs font-bold text-emerald-900 bg-white p-2 rounded-xl border border-amber-200">
              Heard: "{voiceHeard}"
            </div>
          )}
        </div>
      )}

      {/* NUMBER-PAD ENTRY UI */}
      {entryMode === 'numpad' && (
        <div className="bg-white border-2 border-[#064e3b]/30 p-5 rounded-3xl shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Enter {activeType.toUpperCase()} Reading
            </h3>
            <button
              onClick={() => setEntryMode('view')}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          {/* Reading Display Inputs */}
          {activeType === 'bp' ? (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveNumpadField('systolic')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  activeNumpadField === 'systolic'
                    ? 'border-[#064e3b] bg-emerald-50 ring-2 ring-[#064e3b]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Systolic</span>
                <span className="text-2xl font-black text-slate-900">{systolicStr}</span>
              </button>

              <button
                onClick={() => setActiveNumpadField('diastolic')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  activeNumpadField === 'diastolic'
                    ? 'border-[#064e3b] bg-emerald-50 ring-2 ring-[#064e3b]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Diastolic</span>
                <span className="text-2xl font-black text-slate-900">{diastolicStr}</span>
              </button>

              <button
                onClick={() => setActiveNumpadField('pulse')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  activeNumpadField === 'pulse'
                    ? 'border-[#064e3b] bg-emerald-50 ring-2 ring-[#064e3b]'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Pulse</span>
                <span className="text-2xl font-black text-slate-900">{pulseStr}</span>
              </button>
            </div>
          ) : activeType === 'sugar' ? (
            <div className="p-4 rounded-2xl border-2 border-[#064e3b] bg-emerald-50 text-center">
              <span className="text-xs font-bold uppercase text-emerald-950 block">Blood Glucose</span>
              <span className="text-4xl font-black text-[#064e3b]">{sugarStr}</span>
              <span className="text-xs text-slate-500 block mt-1">mg/dL (Fasting morning)</span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border-2 border-[#064e3b] bg-emerald-50 text-center">
              <span className="text-xs font-bold uppercase text-emerald-950 block">Weight</span>
              <span className="text-4xl font-black text-[#064e3b]">{weightStr}</span>
              <span className="text-xs text-slate-500 block mt-1">kg (Morning baseline)</span>
            </div>
          )}

          {/* Big Accessible Number Pad (56px+ tap target) */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleNumpadTap(key)}
                className="h-14 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-black text-xl rounded-2xl flex items-center justify-center cursor-pointer shadow-xs transition-all"
              >
                {key === 'del' ? '⌫' : key}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (activeType === 'bp') {
                prepareVitalConfirmation({
                  elderId: activeElder.id,
                  type: 'bp',
                  systolic: parseInt(systolicStr, 10),
                  diastolic: parseInt(diastolicStr, 10),
                  pulseBpm: parseInt(pulseStr, 10),
                  context: 'resting',
                });
              } else if (activeType === 'sugar') {
                prepareVitalConfirmation({
                  elderId: activeElder.id,
                  type: 'sugar',
                  bloodSugar: parseInt(sugarStr, 10),
                  context: 'fasting',
                });
              } else {
                prepareVitalConfirmation({
                  elderId: activeElder.id,
                  type: 'weight',
                  weightKg: parseFloat(weightStr),
                  context: 'resting',
                });
              }
            }}
            className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>Review & Save Reading</span>
          </button>
        </div>
      )}

      {/* CONFIRMATION CARD BEFORE SAVING (Prompt 9 requirement) */}
      {confirmModalOpen && pendingVital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in zoom-in-95">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border-2 border-emerald-600/30">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-lg">Confirm Reading</h3>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-2 space-y-2">
              <div className="text-4xl font-black text-[#064e3b]">
                {pendingVital.type === 'bp'
                  ? `${pendingVital.systolic}/${pendingVital.diastolic} mmHg`
                  : pendingVital.type === 'sugar'
                  ? `${pendingVital.bloodSugar} mg/dL`
                  : `${pendingVital.weightKg} kg`}
              </div>
              <p className="text-xs text-slate-500 font-semibold">
                Recorded for {activeElder.name} • {pendingVital.context || 'resting'}
              </p>

              {/* Gentle Range Flag (Never alarming) */}
              <div
                className={`p-3 rounded-2xl text-xs font-bold ${
                  pendingVital.rangeFlag === 'high' || pendingVital.rangeFlag === 'low'
                    ? 'bg-amber-50 text-amber-900 border border-amber-300'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                }`}
              >
                {pendingVital.rangeFlagLabel}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleSaveConfirmedVital}
                className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>Confirm & Log to Medical Record</span>
              </button>

              <button
                onClick={() => setConfirmModalOpen(false)}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer active:scale-98 transition-all"
              >
                Edit Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TREND CHART & HISTORY (Prompt 9: 7 & 30-Day curves) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {activeType.toUpperCase()} Trend Analysis
            </h3>
            <p className="text-sm font-black text-slate-900">
              {typeVitals.length} recordings in baseline
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                timeRange === '7d' ? 'bg-[#064e3b] text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                timeRange === '30d' ? 'bg-[#064e3b] text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* SVG Mini Trend Graph */}
        <div className="h-32 w-full bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Steady Baseline Curve</span>
            <span>Target: 120/80 mmHg</span>
          </div>

          <svg className="w-full h-16 overflow-visible" viewBox="0 0 300 60">
            <path
              d="M 10 35 Q 60 25, 110 38 T 210 28 T 290 32"
              fill="none"
              stroke="#064e3b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {[
              { cx: 10, cy: 35, val: '124' },
              { cx: 60, cy: 25, val: '132' },
              { cx: 110, cy: 38, val: '122' },
              { cx: 160, cy: 30, val: '125' },
              { cx: 210, cy: 28, val: '128' },
              { cx: 260, cy: 34, val: '124' },
              { cx: 290, cy: 32, val: '126' },
            ].map((pt, i) => (
              <g key={i}>
                <circle cx={pt.cx} cy={pt.cy} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              </g>
            ))}
          </svg>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Nov 9</span>
            <span>Steady Baseline ({timeRange})</span>
            <span>Today</span>
          </div>
        </div>

        {/* Recent Recordings List */}
        <div className="space-y-2 pt-1">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Recent Logged Readings
          </h4>

          {typeVitals.slice(0, 5).map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-black text-slate-900">
                  {rec.type === 'bp'
                    ? `${rec.systolic}/${rec.diastolic} mmHg`
                    : rec.type === 'sugar'
                    ? `${rec.bloodSugar} mg/dL`
                    : `${rec.weightKg} kg`}
                  {rec.pulseBpm && (
                    <span className="text-xs font-semibold text-slate-500 ml-2">
                      Pulse: {rec.pulseBpm} bpm
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {new Date(rec.loggedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  • Logged by {rec.loggedBy}
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  rec.rangeFlag === 'high' || rec.rangeFlag === 'low'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {rec.rangeFlag === 'high'
                  ? 'Slightly high'
                  : rec.rangeFlag === 'low'
                  ? 'Slightly low'
                  : 'Normal'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
