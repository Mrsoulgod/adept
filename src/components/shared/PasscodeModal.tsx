import React, { useState } from 'react';
import { useAdept, ROLE_PASSCODES } from '../../context/AdeptContext';
import type { Role } from '../../lib/types';
import { Lock, Delete, X } from 'lucide-react';

interface PasscodeModalProps {
  targetRole: Role;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasscodeModal: React.FC<PasscodeModalProps> = ({ targetRole, onClose, onSuccess }) => {
  const { switchRoleWithPin } = useAdept();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const roleLabels: Record<Role, { title: string; hint: string }> = {
    elder: { title: 'Elder Profile (Arthur)', hint: 'Default PIN is 1111' },
    caretaker: { title: 'Caretaker Portal (Sarah)', hint: 'Default PIN is 2222' },
    family: { title: 'Family Portal (James)', hint: 'Default PIN is 3333' },
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        const ok = switchRoleWithPin(targetRole, nextPin);
        if (ok) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl text-center relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-emerald-100 text-[#064e3b] rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-2xl font-black text-slate-900">
          Enter Passcode
        </h3>
        <p className="text-slate-600 text-sm mt-1 font-medium">
          {roleLabels[targetRole].title}
        </p>
        <p className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full inline-block mt-2 font-semibold">
          {roleLabels[targetRole].hint}
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-4 my-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                pin.length > i
                  ? error
                    ? 'bg-amber-600 scale-125'
                    : 'bg-[#064e3b] scale-125'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-amber-800 text-xs font-bold mb-4 bg-amber-50 p-2 rounded-lg">
            Incorrect passcode. Try again ({roleLabels[targetRole].hint})
          </p>
        )}

        {/* Numeric Keypad (Huge accessible tap targets) */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-16 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-200 text-2xl font-bold text-slate-900 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-200 text-2xl font-bold text-slate-900 flex items-center justify-center cursor-pointer transition-colors shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Bypass for judges/demo */}
        <button
          onClick={() => {
            switchRoleWithPin(targetRole, ROLE_PASSCODES[targetRole]);
            onSuccess();
          }}
          className="mt-6 text-xs text-slate-500 hover:text-emerald-800 underline font-semibold block mx-auto cursor-pointer"
        >
          Quick switch without keypad (Demo mode)
        </button>
      </div>
    </div>
  );
};
