import React from 'react';

export interface GreetingProps {
  elderName: string;
  statusText?: string;
  subtext?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  isCalmDefault?: boolean;
}

export const Greeting: React.FC<GreetingProps> = ({
  elderName,
  statusText = 'All is peaceful right now',
  subtext,
  timeOfDay,
  isCalmDefault = true,
}) => {
  // Determine time of day if not explicitly passed
  const currentHour = new Date().getHours();
  const calculatedTimeOfDay =
    timeOfDay ||
    (currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening');

  const greetingPrefix = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
  }[calculatedTimeOfDay];

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="w-full bg-[#FAF8F5] py-4">
      {/* Calm Status Pill & Date */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-base font-bold border ${
            isCalmDefault
              ? 'bg-[#EAF2EC] border-[#C6DBD0] text-[#244937]'
              : 'bg-[#FBF5EA] border-[#EBDBC1] text-[#92631E]'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isCalmDefault ? 'bg-[#244937] animate-pulse' : 'bg-[#92631E]'
            }`}
          />
          <span>{statusText}</span>
        </div>

        <span className="text-base font-semibold text-[#70756F]">
          {formattedDate}
        </span>
      </div>

      {/* Main Human Greeting (28px - 36px font scale) */}
      <h1 className="text-[32px] sm:text-[38px] font-bold text-[#1A1D1A] tracking-tight leading-tight">
        {greetingPrefix}, {elderName}.
      </h1>

      {/* Gentle Subtext */}
      {subtext && (
        <p className="text-[20px] sm:text-[22px] text-[#474C46] leading-relaxed mt-2 font-normal">
          {subtext}
        </p>
      )}
    </header>
  );
};
