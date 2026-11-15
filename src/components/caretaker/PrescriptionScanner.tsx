import React, { useState, useRef } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { parsePrescriptionImage, DOCTOR_CONFIRMATION_SAFETY_NOTE } from '../../lib/gemini';
import type { PrescriptionExtractionResult } from '../../lib/gemini';
import { Camera, Sparkles, CheckCircle2, ArrowRight, X, AlertTriangle, FileText } from 'lucide-react';
import { MEAL_ANCHORS } from '../../lib/types';

interface PrescriptionScannerProps {
  onClose: () => void;
}

export const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({ onClose }) => {
  const { profile, createProposalFromAI, settings } = useAdept();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<PrescriptionExtractionResult | null>(null);
  const [proposalSubmitted, setProposalSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sample realistic prescriptions for instant demo
  const samplePrescriptions = [
    {
      title: 'Dr. Vance – Vitamin D3 Order',
      desc: 'Midday bone and strength booster (1000 IU)',
      sampleImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="20" y="20" width="360" height="220" rx="8" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="55" font-family="sans-serif" font-weight="bold" font-size="16" fill="%230f172a">ST. JUDE GERIATRIC CLINIC</text><text x="40" y="75" font-family="sans-serif" font-size="12" fill="%2364748b">Dr. Evelyn Vance, MD • Lic %2389214</text><line x1="40" y1="90" x2="360" y2="90" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="115" font-family="sans-serif" font-size="13" fill="%23334155">Patient: Arthur Davies (78)</text><text x="40" y="145" font-family="sans-serif" font-weight="bold" font-size="15" fill="%23064e3b">Rx: Cholecalciferol (Vitamin D3) 1,000 IU</text><text x="40" y="170" font-family="sans-serif" font-size="13" fill="%23475569">Sig: 1 softgel po daily with midday meal</text><text x="40" y="195" font-family="sans-serif" font-size="12" fill="%2364748b">Refills: 3 • For winter musculoskeletal support</text><text x="260" y="225" font-family="cursive" font-size="15" fill="%231e293b">Dr. E. Vance</text></svg>',
    },
    {
      title: 'Dr. Vance – CoQ10 Order',
      desc: 'Cardiovascular cellular co-factor (100 mg)',
      sampleImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="20" y="20" width="360" height="220" rx="8" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="55" font-family="sans-serif" font-weight="bold" font-size="16" fill="%230f172a">ST. JUDE GERIATRIC CLINIC</text><text x="40" y="75" font-family="sans-serif" font-size="12" fill="%2364748b">Dr. Evelyn Vance, MD</text><line x1="40" y1="90" x2="360" y2="90" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="115" font-family="sans-serif" font-size="13" fill="%23334155">Patient: Arthur Davies (78)</text><text x="40" y="145" font-family="sans-serif" font-weight="bold" font-size="15" fill="%23064e3b">Rx: Ubiquinone (CoQ10) 100 mg</text><text x="40" y="170" font-family="sans-serif" font-size="13" fill="%23475569">Sig: Take 1 softgel po once daily after lunch</text><text x="40" y="195" font-family="sans-serif" font-size="12" fill="%2364748b">Safe with Amlodipine & Metformin</text><text x="260" y="225" font-family="cursive" font-size="15" fill="%231e293b">Dr. E. Vance</text></svg>',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      processImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Data: string) => {
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const result = await parsePrescriptionImage(base64Data, settings.geminiApiKey);
      setExtractedData(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to extract prescription. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // STRICT DESIGN LAW: AI output is ALWAYS a PROPOSAL sent to Arthur. NEVER auto-apply!
  const handleSendProposalToArthur = () => {
    if (!extractedData) return;

    createProposalFromAI({
      title: extractedData.friendlyName || extractedData.medicationName,
      summary: `Dr. Evelyn Vance prescribed ${extractedData.medicationName} (${extractedData.dosage}) to be taken with ${MEAL_ANCHORS[extractedData.mealAnchor]?.label}.`,
      proposedBy: 'gemini_prescription_ocr',
      prescriptionImageUrl: imagePreview || undefined,
      medicationData: {
        name: extractedData.medicationName,
        friendlyName: extractedData.friendlyName,
        dosage: extractedData.dosage,
        instructions: extractedData.instructions,
        mealAnchor: extractedData.mealAnchor,
        shapeDescription: extractedData.shapeDescription,
        color: extractedData.color || '#3b82f6',
        purpose: extractedData.purpose,
        prescribedBy: profile.doctorName,
        isActive: true,
      },
      doctorNote: extractedData.doctorNotes,
      safetyNote: extractedData.safetyNote || DOCTOR_CONFIRMATION_SAFETY_NOTE,
    });

    setProposalSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1.5 rounded-full text-sm font-semibold mb-2">
            <Sparkles className="w-4 h-4 text-[#047857]" />
            Doctor Handoff Loop • Gemini Vision OCR
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Scan Doctor’s Prescription
          </h2>
          <p className="text-slate-600 mt-1">
            Capture or upload a paper prescription. Gemini will parse the dosage and meal window, then present it to <strong>Arthur</strong> as a proposal to confirm.
          </p>
        </div>

        {/* SUBMITTED STATE */}
        {proposalSubmitted ? (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center my-6 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-[#047857] mx-auto" />
            <h3 className="text-2xl font-bold text-[#064e3b]">
              Proposal Dispatched to Arthur!
            </h3>
            <p className="text-slate-700 text-lg leading-relaxed max-w-lg mx-auto">
              Per Adept’s Design Law: <span className="font-semibold text-slate-900">“Every AI output is a PROPOSAL the elder confirms.”</span> Arthur will see this on his screen with one big confirmation button.
            </p>
            <div className="pt-4 flex gap-4 justify-center">
              <button
                onClick={onClose}
                className="bg-[#064e3b] text-white px-8 py-3.5 rounded-xl font-bold text-lg hover:bg-[#043d2e] cursor-pointer shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Uploader / Instant Samples */}
            {!imagePreview ? (
              <div className="space-y-6">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-3 border-dashed border-slate-300 hover:border-emerald-600 rounded-3xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="w-16 h-16 bg-emerald-100 text-[#064e3b] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-1">
                    Take Photo or Upload Prescription
                  </h4>
                  <p className="text-slate-500 text-sm">
                    Supports JPG, PNG, camera capture on mobile
                  </p>
                </div>

                {/* Instant Presets for Fast Hackathon Evaluation */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Or select a sample prescription for instant testing:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {samplePrescriptions.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImagePreview(sample.sampleImage);
                          processImage(sample.sampleImage);
                        }}
                        className="text-left p-3.5 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-start gap-3"
                      >
                        <FileText className="w-6 h-6 text-[#064e3b] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{sample.title}</div>
                          <div className="text-xs text-slate-500">{sample.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Image Preview Thumbnail */}
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="w-24 h-20 bg-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Prescription preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">Prescription Image Captured</p>
                    <p className="text-xs text-slate-500">Gemini 2.5 Flash Optical Parsing</p>
                  </div>
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setExtractedData(null);
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline px-2 py-1"
                  >
                    Change
                  </button>
                </div>

                {/* Loading State */}
                {analyzing && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
                    <p className="text-lg font-bold text-[#064e3b]">
                      Gemini Vision is analyzing prescription...
                    </p>
                    <p className="text-sm text-slate-600">
                      Extracting dosage, drug name, safety notes, and mapping to meal window.
                    </p>
                  </div>
                )}

                {/* Error */}
                {errorMsg && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3 text-amber-900 text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Parsed Extraction Result Preview */}
                {extractedData && !analyzing && (
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                        AI Proposal Draft • Confidence {Math.round(extractedData.confidenceScore * 100)}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Dr. Vance Order</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Medication Name
                        </label>
                        <p className="text-lg font-bold text-slate-900">
                          {extractedData.medicationName} ({extractedData.dosage})
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Elder-Friendly Name
                        </label>
                        <p className="text-lg font-bold text-emerald-900">
                          {extractedData.friendlyName}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Proposed Meal Anchor
                        </label>
                        <p className="text-base font-semibold text-slate-800">
                          {MEAL_ANCHORS[extractedData.mealAnchor]?.label}
                          <span className="block text-xs text-slate-500">
                            {MEAL_ANCHORS[extractedData.mealAnchor]?.windowLabel}
                          </span>
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Visual Cue & Color
                        </label>
                        <p className="text-sm text-slate-700">
                          {extractedData.shapeDescription}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl text-sm text-slate-700">
                      <strong>Clinical Notes:</strong> {extractedData.doctorNotes}
                    </div>

                    {/* Mandatory Safety Note */}
                    <div className="bg-amber-50/90 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Confirm with your doctor:</strong> This is an AI-assisted medication proposal. Always confirm with {profile.doctorName} or your pharmacist before changing any prescribed regimen.
                      </div>
                    </div>

                    {/* Strict Law Notice */}
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-950 flex items-start gap-2">
                      <span className="font-bold shrink-0">Design Law Check:</span>
                      <span>This proposal will NOT be added to Arthur's schedule until he reviews and taps "Yes" on his elder screen.</span>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={handleSendProposalToArthur}
                      className="w-full bg-[#064e3b] hover:bg-[#043d2e] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                    >
                      <span>Send Proposal to Arthur for Confirmation</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
