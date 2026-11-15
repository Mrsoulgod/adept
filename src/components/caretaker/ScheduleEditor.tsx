import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import type { Medication, MealAnchor } from '../../lib/types';
import { MEAL_ANCHORS } from '../../lib/types';
import { Clock, X } from 'lucide-react';

interface ScheduleEditorProps {
  onClose: () => void;
  editingMed?: Medication | null;
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ onClose, editingMed }) => {
  const { addOrUpdateMedication } = useAdept();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !friendlyName) return;

    const med: Medication = {
      id: editingMed ? editingMed.id : `med-${Date.now()}`,
      name,
      friendlyName,
      dosage: dosage || 'Standard dose',
      instructions,
      mealAnchor,
      shapeDescription,
      color,
      purpose: purpose || 'Prescribed daily wellness support',
      prescribedBy: 'Dr. Evelyn Vance',
      isActive: true,
      createdAt: editingMed?.createdAt || new Date().toISOString(),
    };

    addOrUpdateMedication(med);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-4 h-4 text-[#047857]" />
            Dose Windows & Meal Anchors
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {editingMed ? 'Edit Medication Schedule' : 'Add Medication Anchor'}
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Design Law: We anchor doses to meals and comfortable daily windows, never stressful exact clock times.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Official Clinical Name
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

          <div className="pt-4 flex gap-3 justify-end">
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
              Save Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
