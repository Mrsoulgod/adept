import React, { useState } from 'react';
import { useAdept } from '../../context/AdeptContext';
import {
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Tag,
  User,
  AlertCircle,
} from 'lucide-react';
import type { EditSource } from '../../lib/types';
import { EDIT_SOURCE_LABELS } from '../../lib/types';

export const AuditLogView: React.FC = () => {
  const { auditLogs, elderVetoAction, elderApproveAuditAction } = useAdept();
  const [filterMode, setFilterMode] = useState<'all' | 'vetoable' | 'vetoed'>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterMode === 'vetoable') return log.canElderVeto && !log.isVetoed;
    if (filterMode === 'vetoed') return log.isVetoed;
    return true;
  });

  const getSourceBadgeStyle = (source?: EditSource) => {
    switch (source) {
      case 'prescription_photo':
        return 'bg-emerald-100 text-[#064e3b] border-emerald-300';
      case 'doctor_visit_voice':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'physician_phone_order':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'lab_review':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4 text-[#047857]" />
            Household Governance & Audit Ledger
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Regimen Audit Log & Elder Veto
          </h3>
          <p className="text-slate-600 text-sm mt-0.5 max-w-2xl">
            Design Law: <strong>Every edit requires a source.</strong> Arthur holds perpetual veto power over any change made by caretakers or family.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0 text-xs font-bold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({auditLogs.length})
          </button>
          <button
            onClick={() => setFilterMode('vetoable')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterMode === 'vetoable'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Vetoable ({auditLogs.filter((l) => l.canElderVeto && !l.isVetoed).length})
          </button>
          <button
            onClick={() => setFilterMode('vetoed')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              filterMode === 'vetoed'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Vetoed ({auditLogs.filter((l) => l.isVetoed).length})
          </button>
        </div>
      </div>

      {/* Log Items List */}
      <div className="space-y-3.5">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-sm">
            No audit records match the selected filter.
          </div>
        ) : (
          filteredLogs.map((item) => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                item.isVetoed
                  ? 'bg-amber-50/60 border-amber-300'
                  : 'bg-white border-slate-200 hover:border-emerald-200'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {item.actorName}
                  </span>

                  {/* Mandatory Edit Source Badge */}
                  {item.source && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSourceBadgeStyle(
                        item.source
                      )}`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>source: {item.sourceLabel || EDIT_SOURCE_LABELS[item.source]}</span>
                    </span>
                  )}

                  <span className="text-xs text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <h5 className="text-base font-bold text-slate-900">
                  {item.action}
                </h5>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-mono bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  "{item.plainEnglishDescription}"
                </p>
              </div>

              {/* Status & Action */}
              <div className="shrink-0 flex items-center gap-3">
                {item.isVetoed ? (
                  <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 border border-amber-300 px-3.5 py-1.5 rounded-full text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-800" />
                    <span>Vetoed by Arthur</span>
                  </span>
                ) : item.canElderVeto ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => elderApproveAuditAction(item.id)}
                      className="text-xs text-emerald-900 hover:text-emerald-950 hover:bg-emerald-100/70 border border-emerald-300 px-3 py-1 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1"
                      title="Affirm Elder Approval"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => elderVetoAction(item.id)}
                      className="text-xs text-amber-900 hover:text-amber-950 hover:bg-amber-100/70 border border-amber-300 px-3 py-1 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1"
                      title="Trigger Elder Veto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Veto</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Standard Log</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
