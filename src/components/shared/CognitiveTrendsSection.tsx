import React from 'react';
import { useAdept } from '../../context/AdeptContext';
import {
  Brain,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Smile,
} from 'lucide-react';

interface CognitiveTrendsSectionProps {
  role?: 'caretaker' | 'family';
}

export const CognitiveTrendsSection: React.FC<CognitiveTrendsSectionProps> = ({ role: _role = 'family' }) => {
  const { activeElder, getCognitiveMetrics } = useAdept();
  const elderFirstName = activeElder.name.split(' ')[0] || 'Dad';

  const metrics = getCognitiveMetrics(activeElder.id);

  // SVG sparkline points for response time / levels
  const levelHistory = metrics.levelHistory;
  const maxLevel = 5;
  const svgWidth = 260;
  const svgHeight = 44;
  const stepX = svgWidth / Math.max(1, levelHistory.length - 1);

  const points = levelHistory
    .map((item, idx) => {
      const x = Math.round(idx * stepX);
      const y = Math.round(svgHeight - (item.level / maxLevel) * (svgHeight - 12) - 6);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      id="cognitive-trends-card"
      className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3.5 font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Mind & Memory Rhythm
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {elderFirstName}’s cognitive games & recall engagement
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          Prompt 18
        </span>
      </div>

      {/* Calm Amber Alert on Sustained Drop (2+ weeks vs personal baseline) */}
      {metrics.sustainedDropDetected ? (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              Observation for Doctor Checkup
            </h3>
            <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
              Recall speed and accuracy have eased over the last 14 days compared to {elderFirstName}’s typical rhythm. Worth mentioning to Dr. {activeElder.doctorName || 'Vance'} during the next routine visit.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-bold text-emerald-950">
              Cognitive Rhythm Steady
            </span>
          </div>
          <span className="text-[11px] text-emerald-800 font-semibold">
            Matches baseline
          </span>
        </div>
      )}

      {/* Primary 3 Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Weekly Sessions */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 text-center">
          <span className="text-lg font-black text-slate-900 block leading-tight">
            {metrics.weeklySessions}
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Sessions / wk
          </span>
        </div>

        {/* Accuracy */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 text-center">
          <span className="text-lg font-black text-[#064e3b] block leading-tight">
            {metrics.accuracyWeekly}%
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Accuracy
          </span>
        </div>

        {/* Avg Response Time */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 text-center">
          <span className="text-lg font-black text-slate-900 block leading-tight">
            {(metrics.avgResponseTimeMs / 1000).toFixed(1)}s
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Avg Recall
          </span>
        </div>
      </div>

      {/* 7-Day Trend Sparkline */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>7-Day Adaptive Rhythm Curve</span>
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            Current Level {metrics.level}
          </span>
        </div>

        {/* SVG Sparkline */}
        <div className="w-full flex justify-center py-1">
          <svg width={svgWidth} height={svgHeight} className="overflow-visible">
            {/* Grid Line */}
            <line
              x1="0"
              y1={svgHeight - 6}
              x2={svgWidth}
              y2={svgHeight - 6}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            {/* Polyline Path */}
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            {/* Data Dots */}
            {levelHistory.map((item, idx) => {
              const x = Math.round(idx * stepX);
              const y = Math.round(svgHeight - (item.level / maxLevel) * (svgHeight - 12) - 6);
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="3.5" fill="#064e3b" stroke="#ffffff" strokeWidth="1.5" />
                  <text
                    x={x}
                    y={svgHeight + 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#64748b"
                    fontWeight="bold"
                  >
                    {item.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Best Time of Day & Streak (Never shaming) */}
      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
        <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Best Time of Day</span>
          </span>
          <p className="font-bold text-slate-900 leading-snug">
            {metrics.bestTimeOfDay}
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
            <Smile className="w-3 h-3 text-amber-500" />
            <span>Weekly Rhythm</span>
          </span>
          <p className="font-bold text-slate-900 leading-snug">
            {metrics.streakDays} active days this week
          </p>
        </div>
      </div>
    </div>
  );
};
