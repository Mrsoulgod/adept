import React, { useState } from 'react';
import { useAdept } from '../../../context/AdeptContext';
import type { Medication } from '../../../lib/types';
import { MEAL_ANCHORS } from '../../../lib/types';
import { ScheduleEditor } from '../ScheduleEditor';
import { StockPredictionView } from '../StockPredictionView';
import { Plus, Pill, Edit2 } from 'lucide-react';

export const CaretakerMedsTab: React.FC = () => {
  const { medications } = useAdept();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingMed(null);
    setEditorOpen(true);
  };

  return (
    <div className="px-4 py-5 space-y-5 font-sans">
      {/* Title & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Medication Regimen
          </h1>
          <p className="text-xs text-slate-500">
            Anchor doses to meals • Mandatory sources
          </p>
        </div>

        {/* Add Med Button (Max touch target 56px, h-12) */}
        <button
          onClick={handleAddNew}
          className="h-12 bg-[#064e3b] hover:bg-[#043d2e] text-white px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dose</span>
        </button>
      </div>

      {/* Stock Prediction & Weekend Refill Alerts */}
      <StockPredictionView />

      {/* Active Medications List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Active Doses ({medications.filter((m: Medication) => m.isActive).length})
        </h2>

        <div className="space-y-2.5">
          {medications.map((med: Medication) => {
            const anchor = MEAL_ANCHORS[med.mealAnchor];
            return (
              <div
                key={med.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-xs"
                    style={{ backgroundColor: med.color || '#059669' }}
                  >
                    <Pill className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-slate-900">
                        {med.friendlyName}
                      </h3>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded-md">
                        {med.dosage}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {anchor?.label || 'With meal'} • {med.stockCount ?? 30} pills left
                    </div>
                    {med.source && (
                      <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
                        Source: {med.source.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleEdit(med)}
                  className="h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer shrink-0 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Editor with Mandatory Source */}
      {editorOpen && (
        <ScheduleEditor
          editingMed={editingMed}
          onClose={() => {
            setEditorOpen(false);
            setEditingMed(null);
          }}
        />
      )}
    </div>
  );
};
