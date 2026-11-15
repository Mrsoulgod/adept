import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import {
  X,
  Droplets,
  Footprints,
  PhoneCall,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { ActivityType, DailyActivityReminder } from '../../lib/types';

interface ActivityReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityReminderModal: React.FC<ActivityReminderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeElder,
    dailyActivityReminders,
    addOrUpdateActivityReminder,
    deleteActivityReminder,
  } = useAdept();

  const [reminderType, setReminderType] = useState<ActivityType>('walk');
  const [title, setTitle] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('11:00 AM');
  const [timeAnchor, setTimeAnchor] = useState<'morning' | 'midday' | 'evening' | 'bedtime'>('morning');
  const [targetGlasses, setTargetGlasses] = useState(6);
  const [successNotice, setSuccessNotice] = useState(false);

  if (!isOpen) return null;

  const elderFirstName = activeElder.name.split(' ')[0] || 'Dad';

  // Hydration reminder item
  const hydrationReminder = dailyActivityReminders.find((r) => r.type === 'hydration');

  const handleUpdateHydrationTarget = (newTarget: number) => {
    setTargetGlasses(newTarget);
    if (hydrationReminder) {
      addOrUpdateActivityReminder({
        ...hydrationReminder,
        dailyTarget: newTarget,
      });
    }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const iconMap: Record<ActivityType, string> = {
      hydration: 'Droplets',
      walk: 'Footprints',
      call: 'PhoneCall',
      custom: 'Sparkles',
    };

    const newReminder: DailyActivityReminder = {
      id: `rem-custom-${Date.now()}`,
      elderId: activeElder.id,
      type: reminderType,
      title: title.trim(),
      titleHi: titleHi.trim() || title.trim(),
      description: description.trim() || `Daily routine for ${elderFirstName}.`,
      descriptionHi: description.trim() || 'दैनिक दिनचर्या।',
      timeAnchor,
      scheduledTime,
      isCompletedToday: false,
      dailyTarget: 1,
      currentProgress: 0,
      icon: iconMap[reminderType] || 'Sparkles',
      isConfigurable: true,
    };

    addOrUpdateActivityReminder(newReminder);
    setSuccessNotice(true);
    setTitle('');
    setTitleHi('');
    setDescription('');
    setTimeout(() => setSuccessNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl relative border border-slate-100 animate-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-cyan-100 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-cyan-800" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Hydration & Activities
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Anchored to {elderFirstName}’s daily routine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {successNotice && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-2.5 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Reminder saved to {elderFirstName}’s schedule!</span>
            </div>
          )}

          {/* Section 1: Hydration Goal */}
          <div className="bg-cyan-50/80 border border-cyan-200 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-700" />
                <h3 className="text-xs font-bold text-cyan-950 uppercase tracking-wide">
                  Daily Water Target
                </h3>
              </div>
              <span className="text-xs font-extrabold text-cyan-900 bg-white px-2 py-0.5 rounded-full border border-cyan-200">
                {hydrationReminder?.dailyTarget || targetGlasses} glasses / day
              </span>
            </div>

            <p className="text-xs text-cyan-900/80 mb-3">
              One-tap water logging on {elderFirstName}’s screen prompts gentle hydration throughout the day.
            </p>

            <div className="flex items-center gap-2">
              {[4, 6, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleUpdateHydrationTarget(num)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    (hydrationReminder?.dailyTarget || targetGlasses) === num
                      ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm'
                      : 'bg-white text-cyan-950 border-cyan-200 hover:bg-cyan-100/50'
                  }`}
                >
                  {num} gl
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Active Reminders List */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Today’s Daily Reminders
            </h3>

            <div className="space-y-2">
              {dailyActivityReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {rem.type === 'hydration' ? (
                        <Droplets className="w-4 h-4 text-cyan-600" />
                      ) : rem.type === 'walk' ? (
                        <Footprints className="w-4 h-4 text-emerald-600" />
                      ) : rem.type === 'call' ? (
                        <PhoneCall className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {rem.title}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 inline" />
                        <span>{rem.scheduledTime}</span>
                        <span className="capitalize">• {rem.timeAnchor}</span>
                      </p>
                    </div>
                  </div>

                  {rem.type !== 'hydration' && (
                    <button
                      onClick={() => deleteActivityReminder(rem.id)}
                      className="w-7 h-7 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Add New Activity Form */}
          <form onSubmit={handleAddActivity} className="border-t border-slate-100 pt-3 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Add Custom Routine Activity</span>
            </h3>

            {/* Type selector */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setReminderType('walk');
                  setTitle('Afternoon Garden Walk');
                  setDescription('A refreshing 10-minute walk in the fresh air.');
                }}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer ${
                  reminderType === 'walk'
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Walk</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setReminderType('call');
                  setTitle('Call Family Member');
                  setDescription('A pleasant 5-minute chat with family.');
                }}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer ${
                  reminderType === 'call'
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setReminderType('custom');
                  setTitle('');
                  setDescription('');
                }}
                className={`py-1.5 px-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 cursor-pointer ${
                  reminderType === 'custom'
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom</span>
              </button>
            </div>

            {/* Activity Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Activity Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Evening herbal tea & music"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Time Anchor & Scheduled Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Routine Anchor
                </label>
                <select
                  value={timeAnchor}
                  onChange={(e) => setTimeAnchor(e.target.value as any)}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                >
                  <option value="morning">Morning</option>
                  <option value="midday">Midday</option>
                  <option value="evening">Evening</option>
                  <option value="bedtime">Bedtime</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4:30 PM"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#064e3b] hover:bg-[#053d2e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer mt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add to {elderFirstName}’s Day</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

