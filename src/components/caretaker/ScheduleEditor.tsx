import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { Medication, MealAnchor, EditSource } from '../../lib/types';
import { MEAL_ANCHORS, EDIT_SOURCE_LABELS } from '../../lib/types';
import { Clock, X, Package, Tag } from 'lucide-react';

interface ScheduleEditorProps {
  onClose: () => void;
  editingMed?: Medication | null;
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ onClose, editingMed }) => {
  const { addOrUpdateMedication, activeElderId } = useAdept();

  const [name, setName] = useState(editingMed?.name || '');
  const [friendlyName, setFriendlyName] = useState(editingMed?.friendlyName || '');
  const [dosage, setDosage] = useState(editingMed?.dosage || '');
  const [instructions, setInstructions] = useState(
    editingMed?.instructions || 'Take 1 tablet with water and food'
  );
  const [mealAnchor, setMealAnchor] = useState<MealAnchor>(
    editingMed?.mealAnchor || 'morning_breakfast'
  );
  const [shapeDescription, setShapeDescription] = useState(
    editingMed?.shapeDescription || 'Small round tablet'
  );
  const [color, setColor] = useState(editingMed?.color || '#3b82f6');
  const [purpose, setPurpose] = useState(editingMed?.purpose || '');

  // Mandatory Edit Source
  const [source, setSource] = useState<EditSource>(
    (editingMed?.source as EditSource) || 'prescription_photo'
  );

  // Pharmacy Inventory & Stock
  const [stockCount, setStockCount] = useState<number>(
    editingMed?.stockCount !== undefined ? editingMed.stockCount : 30
  );
  const [dailyDoseUnits, setDailyDoseUnits] = useState<number>(
    editingMed?.dailyDoseUnits || 1
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !friendlyName) return;

    const med: Medication = {
      id: editingMed ? editingMed.id : `med-${Date.now()}`,
      elderId: editingMed?.elderId || activeElderId,
      name,
      friendlyName,
      dosage: dosage || 'Standard dose',
      instructions,
      mealAnchor,
      stockCount: Number(stockCount) || 30,
      dailyDoseUnits: Number(dailyDoseUnits) || 1,
      source,
      shapeDescription,
      color,
      purpose: purpose || 'Prescribed daily wellness support',
      prescribedBy: 'Dr. Evelyn Vance',
      isActive: true,
      createdAt: editingMed?.createdAt || new Date().toISOString(),
    };

    addOrUpdateMedication(med, source, 'Rahul (Caretaker)');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-4 h-4 text-[#047857]" />
            Dose Windows & Medication Editor
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {editingMed ? 'Edit Medication Regimen' : 'Add Medication Anchor'}
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Design Law: Doses anchor to meals. <strong>Every edit requires an authenticated clinical source</strong> for Arthur's audit log.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* MANDATORY SOURCE SELECTOR */}
          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-950">
              <Tag className="w-4 h-4 text-amber-800" />
              Edit Source (Mandatory Governance Law)
            </div>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as EditSource)}
              className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="prescription_photo">Prescription Photo (Dr. Vance Rx Paper / Photo)</option>
              <option value="doctor_visit_voice">Doctor Visit Voice Note (Post-appointment audio)</option>
              <option value="physician_phone_order">Physician Phone Order (Clinic confirmation)</option>
              <option value="caretaker_manual">Caretaker Manual Observation (Direct check)</option>
              <option value="lab_review">Lab / Diagnostic Review (Biomarker adjustment)</option>
            </select>
            <p className="text-[11px] text-amber-900 italic">
              Audit entry: "Rahul changed dose, source: {EDIT_SOURCE_LABELS[source]}". Arthur has full veto power.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Clinical Drug Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amlodipine"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Dosage
              </label>
              <input
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g. 5 mg"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              Elder-Friendly Display Name (Arthur sees this)
            </label>
            <input
              type="text"
              required
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              placeholder="e.g. Morning Blood Pressure Pill"
              className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* MEAL ANCHOR SELECTION */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Meal Anchor & Window (Strict Law)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(MEAL_ANCHORS) as MealAnchor[]).map((anchorKey) => {
                const config = MEAL_ANCHORS[anchorKey];
                const isSelected = mealAnchor === anchorKey;
                return (
                  <button
                    key={anchorKey}
                    type="button"
                    onClick={() => setMealAnchor(anchorKey)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#064e3b] bg-emerald-50/70 ring-2 ring-[#064e3b]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-sm">{config.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{config.windowLabel}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STOCK INVENTORY & REFILL RATE */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Package className="w-4 h-4 text-emerald-700" />
              Pharmacy Inventory & Refill Tracking
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Current Stock Count (Pills)
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockCount}
                  onChange={(e) => setStockCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Daily Consumption Rate
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={dailyDoseUnits}
                  onChange={(e) => setDailyDoseUnits(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Instructions for Arthur
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Take 1 tablet with breakfast toast"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Visual Cue / Pill Shape
              </label>
              <input
                type="text"
                value={shapeDescription}
                onChange={(e) => setShapeDescription(e.target.value)}
                placeholder="White round tablet"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Pill Color Tag
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300"
                />
                <span className="text-xs text-slate-500">Helps visual recognition</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Purpose (Plain Language)
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Keeps your blood pressure steady"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-sm cursor-pointer shadow-md transition-all active:scale-98"
            >
              Save Schedule with Source
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
