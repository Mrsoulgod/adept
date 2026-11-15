import React, { useState } from 'react';
import { useAdept } from '../../../context/AdeptContext';
import type { FamilyTask } from '../../../context/AdeptContext';
import { Plus, Check, Clock, UserCheck } from 'lucide-react';

export const FamilyTasksTab: React.FC = () => {
  const { familyTasks, toggleFamilyTask, addFamilyTask } = useAdept();
  const [showAddForm, setShowAddForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('James Davies');
  const [dueText, setDueText] = useState('This Weekend');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addFamilyTask(taskTitle.trim(), assignedTo.trim(), dueText.trim());
    setTaskTitle('');
    setShowAddForm(false);
  };

  return (
    <div className="px-4 py-5 space-y-5 font-sans">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Family Care Tasks
          </h1>
          <p className="text-xs text-slate-500">
            Coordinate pharmacy pickups, visits & rides
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-11 bg-[#064e3b] hover:bg-[#043d2e] text-white px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Add Task Expandable Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTask} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Create Shared Task
          </h3>

          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Pick up Lisinopril refill at pharmacy"
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#064e3b]"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                Assigned To
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                When
              </label>
              <input
                type="text"
                value={dueText}
                onChange={(e) => setDueText(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-[#064e3b] text-white text-xs font-bold cursor-pointer"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Tasks List */}
      <div className="space-y-2.5">
        {familyTasks.map((task: FamilyTask) => (
          <div
            key={task.id}
            onClick={() => toggleFamilyTask(task.id)}
            className={`w-full p-4 rounded-2xl border transition-all flex items-start gap-3 text-left cursor-pointer select-none ${
              task.completed
                ? 'bg-slate-50 border-slate-200 opacity-60'
                : 'bg-white border-slate-200/90 shadow-xs hover:border-[#064e3b]/50'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                task.completed
                  ? 'bg-[#064e3b] border-[#064e3b] text-white'
                  : 'bg-white border-slate-300 text-transparent'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </div>

            <div className="flex-1">
              <h3
                className={`text-sm font-bold leading-tight ${
                  task.completed ? 'line-through text-slate-500' : 'text-slate-900'
                }`}
              >
                {task.title}
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                <span className="flex items-center gap-1 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  {task.assignedTo}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {task.dueText}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
