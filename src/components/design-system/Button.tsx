import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'amber' | 'ghost';
export type ButtonSize = 'elder' | 'standard';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'elder',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Base styles: tactile, responsive, smooth, zero drag requirement
  const baseClasses =
    'relative inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.985]';

  // Size configurations
  const sizeClasses = {
    // Elder size: 68px+ height, 22px body text, 64px+ tap target guaranteed
    elder: 'min-h-[68px] w-full px-8 py-5 text-[22px] font-bold rounded-2xl gap-4',
    // Standard size for desktop caretaker utilities
    standard: 'min-h-[48px] px-6 py-3 text-base font-semibold rounded-xl gap-2.5',
  };

  // Variants: Quiet luxury, calm accent, no garish gradients or red failure states
  const variantClasses = {
    // Primary: Calm Heritage Sage (#244937), crisp white text (> 12:1 AAA contrast)
    primary:
      'bg-[#244937] hover:bg-[#1B3729] text-white shadow-sm border border-[#1B3729] focus:ring-[#C6DBD0]',
    // Secondary: Warm surface (#FFFFFF), crisp border (#D8D1C3), dark charcoal text (#1A1D1A)
    secondary:
      'bg-white hover:bg-[#F4F0E8] text-[#1A1D1A] border-2 border-[#D8D1C3] hover:border-[#B5ADA0] focus:ring-[#EAE5DB]',
    // Amber: Warm amber for resting / deferring doses (never red, never shame)
    amber:
      'bg-[#FBF5EA] hover:bg-[#F5EAD3] text-[#7A4F13] border-2 border-[#EBDBC1] hover:border-[#D9C4A1] focus:ring-[#F5EAD3]',
    // Ghost: Subtle text button
    ghost:
      'bg-transparent hover:bg-[#F4F0E8] text-[#474C46] hover:text-[#1A1D1A] focus:ring-[#EAE5DB]',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="leading-tight">{children}</span>
    </button>
  );
};

