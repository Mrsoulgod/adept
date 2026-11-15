import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import { UserPlus, Heart, Stethoscope, Check, X, Edit2 } from 'lucide-react';

export const ElderSelectorBar: React.FC = () => {
  const {
    elders,
    activeElderId,
    activeElder,
    switchActiveElder,
    addElder,
    updateElderHealthStatus,
  } = useAdept();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  // New Elder Form State
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<'Mom' | 'Dad' | 'Grandmother' | 'Grandfather' | 'Elder'>('Mom');
  const [age, setAge] = useState(76);
  const [conditions, setConditions] = useState('');
  const [healthStatus, setHealthStatus] = useState('Active & Comfortable');

  const handleCreateElder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addElder({
      name: name.trim(),
      relationship,
      age: Number(age) || 75,
      healthStatus,
      conditions: conditions.split(',').map((c) => c.trim()).filter(Boolean),
    });

    setName('');
    setConditions('');
    setAddModalOpen(false);
  };

  const handleUpdateHealth = (status: string) => {
    updateElderHealthStatus(activeElderId, status);
    setHealthModalOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Elder Selector Tabs */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Care Circle Elders ({elders.length})
        </span>
        <button
          onClick={() => setHealthModalOpen(true)}
          className="text-[11px] font-bold text-[#064e3b] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Edit2 className="w-3 h-3" />
          <span>Update {activeElder.relationship || 'Elder'}'s Health</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {elders.map((elder) => {
          const isActive = elder.id === activeElderId;
          const isDad = elder.relationship === 'Dad' || elder.name.includes('Arthur');
          return (
            <button
              key={elder.id}
              onClick={() => switchActiveElder(elder.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>{isDad ? '👴' : '👵'}</span>
              <span>
                {elder.relationship ? `${elder.relationship} (${elder.name.split(' ')[0]})` : elder.name}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                  elder.isDevicePaired
                    ? isActive
                      ? 'bg-emerald-400 text-emerald-950'
                      : 'bg-emerald-100 text-emerald-800'
                    : isActive
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {elder.isDevicePaired ? 'Connected' : 'Not Paired'}
              </span>
            </button>
          );
        })}

        {/* Add Elder Button */}
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 shrink-0 cursor-pointer transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Elder</span>
        </button>
      </div>

      {/* Active Elder Health Summary Pill */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#064e3b] flex items-center justify-center font-bold">
            <Heart className="w-3.5 h-3.5 text-[#064e3b]" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900">{activeElder.name}</span>
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              {activeElder.healthStatus || 'Resting comfortably'}
            </span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">Age {activeElder.age}</span>
      </div>

      {/* MODAL: ADD ELDER */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fcfbfa] border-2 border-slate-200 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Add Elder to Care Circle</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Mom, Grandmother, or other elder</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateElder} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Elder's Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Martha Davies"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#064e3b] bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#064e3b] bg-white font-medium"
                  >
                    <option value="Mom">Mom</option>
                    <option value="Dad">Dad</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Elder">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    min={50}
                    max={120}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#064e3b] bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Health Status
                </label>
                <input
                  type="text"
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value)}
                  placeholder="e.g. Active & Comfortable"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#064e3b] bg-white font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Known Conditions (comma separated)
                </label>
                <input
                  type="text"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="e.g. Mild Osteoporosis, Seasonal Allergies"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#064e3b] bg-white font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all mt-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Elder Profile</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE HEALTH STATUS */}
      {healthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#fcfbfa] border-2 border-slate-200 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Update {activeElder.name}'s Health Status
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Select current observation</p>
                </div>
              </div>
              <button
                onClick={() => setHealthModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                'Resting Steady & Comfortable',
                'Active & Energetic Today',
                'Under Routine Doctor Observation',
                'Mild Joint Fatigue / Rest Recommended',
                'Recovering from Seasonal Cold',
              ].map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateHealth(status)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    activeElder.healthStatus === status
                      ? 'bg-emerald-50 border-emerald-300 text-[#064e3b]'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span>{status}</span>
                  {activeElder.healthStatus === status && <Check className="w-4 h-4 text-[#064e3b]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
