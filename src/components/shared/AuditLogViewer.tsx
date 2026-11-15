import React from 'react';
import { useAdept } from '../../context/AdeptContext';
import { ShieldCheck, AlertCircle, X, RotateCcw } from 'lucide-react';

interface AuditLogViewerProps {
  onClose: () => void;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ onClose }) => {
  const { auditLogs, elderVetoAction } = useAdept();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-[#064e3b] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-[#047857]" />
            Transparency & Governance • Elder Veto Power
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Audit Trail & Elder Veto
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            Every schedule modification, OCR scan, and dose confirmation is logged in plain English. <strong>Arthur Davies</strong> has ultimate veto power over any change.
          </p>
        </div>

        {/* Log Entries */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {auditLogs.length === 0 ? (
            <p className="text-center text-slate-500 py-12">No audit logs recorded yet.</p>
          ) : (
            auditLogs.map((item) => {
              const isVetoed = item.isVetoed;
              const canVeto = item.canElderVeto && !isVetoed;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isVetoed
                      ? 'bg-amber-50/60 border-amber-300 opacity-80'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          item.actorRole === 'elder'
                            ? 'bg-emerald-100 text-[#064e3b]'
                            : item.actorRole === 'caretaker'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-purple-100 text-purple-900'
                        }`}
                      >
                        {item.actorName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {isVetoed && (
                      <span className="bg-amber-200 text-amber-950 font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        VETOED BY ELDER
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-1">
                    {item.action}
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {item.plainEnglishDescription}
                  </p>

                  {/* Elder Veto Button */}
                  {canVeto && (
                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        Elder veto is active on this change.
                      </span>
                      <button
                        onClick={() => elderVetoAction(item.id)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-800" />
                        <span>Exercise Elder Veto</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer hover:bg-slate-800"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};

