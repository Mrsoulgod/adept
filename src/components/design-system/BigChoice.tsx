import React from 'react';

export interface BigChoiceProps {
  title: string;
  description?: string;
  meta?: string;
  badge?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  variant?: 'calm' | 'amber' | 'neutral';
  onClick: () => void;
  actionLabel?: string;
}

export const BigChoice: React.FC<BigChoiceProps> = ({
  title,
  description,
  meta,
  badge,
  icon,
  selected = false,
  variant = 'calm',
  onClick,
  actionLabel = 'Tap to choose',
}) => {
  // Variant theme configurations
  const variantStyles = {
    calm: {
      border: selected ? 'border-[#244937] ring-4 ring-[#C6DBD0]' : 'border-[#EAE5DB] hover:border-[#244937]',
      bg: selected ? 'bg-[#EAF2EC]/60' : 'bg-white hover:bg-[#FAF8F5]',
      iconBg: selected ? 'bg-[#244937] text-white' : 'bg-[#EAF2EC] text-[#244937]',
      badgeBg: 'bg-[#EAF2EC] text-[#244937] border-[#C6DBD0]',
      titleColor: 'text-[#1A1D1A]',
      accentColor: 'text-[#244937]',
    },
    amber: {
      border: selected ? 'border-[#92631E] ring-4 ring-[#FBF5EA]' : 'border-[#EBDBC1] hover:border-[#92631E]',
      bg: selected ? 'bg-[#FBF5EA]' : 'bg-white hover:bg-[#FBF5EA]/50',
      iconBg: selected ? 'bg-[#92631E] text-white' : 'bg-[#FBF5EA] text-[#92631E]',
      badgeBg: 'bg-[#FBF5EA] text-[#7A4F13] border-[#EBDBC1]',
      titleColor: 'text-[#1A1D1A]',
      accentColor: 'text-[#7A4F13]',
    },
    neutral: {
      border: selected ? 'border-[#1A1D1A] ring-4 ring-[#EAE5DB]' : 'border-[#EAE5DB] hover:border-[#D8D1C3]',
      bg: selected ? 'bg-[#F4F0E8]' : 'bg-white hover:bg-[#FAF8F5]',
      iconBg: selected ? 'bg-[#1A1D1A] text-white' : 'bg-[#F4F0E8] text-[#1A1D1A]',
      badgeBg: 'bg-[#F4F0E8] text-[#474C46] border-[#D8D1C3]',
      titleColor: 'text-[#1A1D1A]',
      accentColor: 'text-[#474C46]',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative w-full text-left rounded-3xl p-6 sm:p-7 border-2 transition-all duration-150 cursor-pointer select-none active:scale-[0.99] shadow-sm ${style.border} ${style.bg}`}
    >
      {/* Top Meta & Badge Bar */}
      {(badge || meta) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          {badge && (
            <span
              className={`inline-block px-3.5 py-1 rounded-full text-sm font-bold border ${style.badgeBg}`}
            >
              {badge}
            </span>
          )}
          {meta && <span className="text-base text-[#70756F] font-semibold">{meta}</span>}
        </div>
      )}

      {/* Main Choice Body */}
      <div className="flex items-start gap-5">
        {icon && (
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${style.iconBg}`}
          >
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className={`text-[24px] sm:text-[26px] font-bold leading-snug tracking-tight ${style.titleColor}`}>
            {title}
          </h3>

          {description && (
            <p className="text-[20px] sm:text-[21px] text-[#474C46] leading-relaxed mt-2">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Clear Bottom Affordance (Elder-friendly) */}
      <div className="mt-5 pt-4 border-t border-[#EAE5DB]/80 flex items-center justify-between text-base">
        <span className="text-[#70756F] font-medium">Single-tap selection</span>
        <span className={`font-bold flex items-center gap-1.5 ${style.accentColor}`}>
          {actionLabel} →
        </span>
      </div>
    </div>
  );
};

