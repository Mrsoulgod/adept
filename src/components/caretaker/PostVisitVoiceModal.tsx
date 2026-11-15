import React, { useState, useRef } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { parsePostVisitVoiceNote, DOCTOR_CONFIRMATION_SAFETY_NOTE } from '../../lib/gemini';
import type { PostVisitVoiceExtractionResult } from '../../lib/gemini';
import { MEAL_ANCHORS } from '../../lib/types';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  X,
  AlertTriangle,
  Volume2,
  PlusCircle,
  MinusCircle,
  RefreshCw,
} from 'lucide-react';

interface PostVisitVoiceModalProps {
  onClose: () => void;
}

export const PostVisitVoiceModal: React.FC<PostVisitVoiceModalProps> = ({ onClose }) => {
  const { profile, medications, createProposalFromAI, settings } = useAdept();

  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<PostVisitVoiceExtractionResult | null>(null);
  const [proposalSubmitted, setProposalSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sample realistic voice notes for zero-friction evaluation
  const sampleVoiceNotes = [
    {
      title: 'Dr. Vance Post-Visit Note (Knee & Statin Adjustment)',
      desc: 'Discontinue Glucosamine, add Celecoxib 100mg with lunch, increase evening statin to 40mg',
      text: "Dr. Evelyn Vance examined Arthur today. She noted his blood pressure is well controlled at 128/82, so keep Amlodipine 5mg with breakfast. However, for his ongoing knee discomfort, she advised stopping Glucosamine Complex and starting Celecoxib 100mg once daily after lunch with food. She also wants to increase his evening Atorvastatin from 20mg to 40mg with dinner for better cardiovascular protection.",
    },
    {
      title: 'Dr. Vance Winter Checkup (Vitamin D3 Addition)',
      desc: 'Add Vitamin D3 1000 IU after lunch, keep all other medications steady',
      text: "Appointment complete with Dr. Vance. Arthur's glucose numbers and blood pressure are steady. She recommended adding Vitamin D3 1000 IU softgel daily after lunch for winter musculoskeletal support. Keep morning blood pressure and evening pills exactly as they are.",
    },
  ];

  const handleToggleRecord = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback: load sample preset if Web Speech API is unavailable in current browser
      setTranscript(sampleVoiceNotes[0].text);
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setErrorMsg(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(finalTranscript.trim());
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech error:', err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleAnalyzeWithGemini = async () => {
    if (!transcript.trim()) {
      setErrorMsg('Please record or enter a post-visit voice note first.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const res = await parsePostVisitVoiceNote(
        transcript,
        medications,
        settings.geminiApiKey
      );
      setExtractionResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze voice note. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // STRICT DESIGN LAW: AI output is ALWAYS a PROPOSAL the elder confirms. NEVER auto-apply!
  const handleSendProposalToArthur = () => {
    if (!extractionResult) return;

    createProposalFromAI({
      title: `Doctor Visit Schedule Adjustments (${profile.doctorName})`,
      summary: extractionResult.summary,
      proposedBy: 'post_visit_voice',
      voiceTranscript: transcript,
      proposedScheduleChanges: extractionResult.proposedChanges,
      medicationData: {},
      doctorNote: extractionResult.doctorComments,
      safetyNote: extractionResult.safetyNote || DOCTOR_CONFIRMATION_SAFETY_NOTE,
    });

    setProposalSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-6 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Volume2 className="w-4 h-4 text-[#047857]" />
            Doctor Handoff Loop • Post-Visit Voice Note
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Record Post-Visit Appointment Note
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Speak or transcribe what {profile.doctorName} recommended. Gemini extracts proposed schedule changes for <strong>{profile.name.split(' ')[0]}</strong> to confirm.
          </p>
        </div>

        {/* SUBMITTED STATE */}
        {proposalSubmitted ? (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 sm:p-8 text-center my-4 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-[#047857] mx-auto" />
            <h3 className="text-2xl font-black text-[#064e3b]">
              Proposed Schedule Sent to {profile.name.split(' ')[0]}!
            </h3>
            <p className="text-slate-700 text-base leading-relaxed max-w-lg mx-auto">
              Per Adept's Design Law: <span className="font-semibold text-slate-900">"Every AI output is a PROPOSAL the elder confirms."</span> {profile.name.split(' ')[0]} will see these proposed adjustments on their screen and decide whether to apply them.
            </p>
            <div className="pt-3">
              <button
                onClick={onClose}
                className="bg-[#064e3b] text-white px-8 py-3 rounded-xl font-bold text-base hover:bg-[#043d2e] cursor-pointer shadow-md"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            {/* Voice Recording Controls */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleRecord}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-all ${
                      isRecording
                        ? 'bg-rose-600 text-white animate-pulse shadow-lg ring-4 ring-rose-200'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                  </button>
                  <div>
                    <div className="font-bold text-slate-900 text-sm sm:text-base">
                      {isRecording ? 'Listening to voice note...' : 'Tap to Record Spoken Note'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {isRecording ? 'Speak clearly into your microphone' : 'Uses Web Speech API or type below'}
                    </div>
                  </div>
                </div>

                {transcript && !analyzing && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      setExtractionResult(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Clear Text
                  </button>
                )}
              </div>

              {/* Transcript Textarea */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Spoken or Written Note:
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="e.g. Dr. Vance said Arthur's blood pressure is good. She wants to stop Glucosamine and start Celecoxib 100mg after lunch with food..."
                  rows={4}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                />
              </div>

              {/* Preset buttons for fast evaluation */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Or load a sample doctor visit voice note:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sampleVoiceNotes.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTranscript(sample.text);
                        setExtractionResult(null);
                      }}
                      className="text-left p-3 border border-slate-200 bg-white rounded-xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer"
                    >
                      <div className="font-bold text-xs text-slate-900">{sample.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{sample.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyze Button */}
              <button
                type="button"
                onClick={handleAnalyzeWithGemini}
                disabled={analyzing || !transcript.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{analyzing ? 'Gemini is Extracting Changes...' : 'Extract Proposed Schedule Changes with Gemini'}</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-center gap-2.5 text-amber-950 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Extraction Results */}
            {extractionResult && (
              <div className="bg-white border-2 border-emerald-300 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <span className="bg-emerald-100 text-[#064e3b] font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#047857]" />
                    AI Proposed Schedule Changes ({extractionResult.proposedChanges.length})
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Dr. Vance Review</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
                  <strong>Clinical Summary:</strong> {extractionResult.summary}
                </div>

                {/* Proposed Changes List */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Extracted Regimen Changes:
                  </span>
                  {extractionResult.proposedChanges.map((change, idx) => {
                    const anchorConfig = change.mealAnchor ? MEAL_ANCHORS[change.mealAnchor] : null;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          change.action === 'discontinue'
                            ? 'bg-rose-50/60 border-rose-200'
                            : change.action === 'modify'
                            ? 'bg-sky-50/60 border-sky-200'
                            : 'bg-emerald-50/60 border-emerald-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {change.action === 'discontinue' && (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <MinusCircle className="w-3 h-3" /> Discontinue
                              </span>
                            )}
                            {change.action === 'modify' && (
                              <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Modify Dose
                              </span>
                            )}
                            {change.action === 'add' && (
                              <span className="bg-emerald-100 text-[#064e3b] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <PlusCircle className="w-3 h-3" /> Add Medication
                              </span>
                            )}
                            <span className="font-bold text-slate-900 text-sm">
                              {change.friendlyName || change.medicationName} {change.dosage && `(${change.dosage})`}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600">
                            {anchorConfig && (
                              <span className="font-semibold text-slate-700 mr-2">
                                When: {anchorConfig.label} ({anchorConfig.windowLabel})
                              </span>
                            )}
                            {change.instructions && <span>• {change.instructions}</span>}
                          </div>

                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Reason: {change.reason}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mandatory Safety Note */}
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Confirm with your doctor:</strong> {extractionResult.safetyNote || DOCTOR_CONFIRMATION_SAFETY_NOTE}
                  </div>
                </div>

                {/* Design Law Check */}
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950 flex items-start gap-2">
                  <span className="font-bold shrink-0">Design Law Check:</span>
                  <span>These changes are NOT applied yet. {profile.name.split(' ')[0]} must review and confirm on their screen.</span>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={handleSendProposalToArthur}
                  className="w-full bg-[#064e3b] hover:bg-[#043d2e] text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                >
                  <span>Send Proposed Schedule Changes to {profile.name.split(' ')[0]} for Confirmation</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
