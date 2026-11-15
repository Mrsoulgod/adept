import React, { useState, useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAdept } from '../../context/AdeptContext';
import { isTourCompletedForMember, setTourCompletedForMember } from '../../lib/authService';
import { CheckCircle2, Pill } from 'lucide-react';

interface WalkthroughTourProps {
  forceStart?: boolean;
  onClose?: () => void;
}

export const WalkthroughTour: React.FC<WalkthroughTourProps> = ({ forceStart = false, onClose }) => {
  const { role, language, authUser } = useAdept();
  const [showPracticeModal, setShowPracticeModal] = useState(false);

  const memberKey = authUser?.id || role;

  const startTour = useCallback(() => {
    // 1. ELDER TOUR: Big readable text, one idea per step, Hindi/English
    if (role === 'elder') {
      const isHindi = language === 'hi';

      const d = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        doneBtnText: isHindi ? 'समाप्त' : 'Done',
        nextBtnText: isHindi ? 'अगला' : 'Next',
        prevBtnText: isHindi ? 'पीछे' : 'Back',
        onDestroyStarted: () => {
          setTourCompletedForMember(memberKey, true);
          if (onClose) onClose();
          d.destroy();
          // Hands-on: open Practice Mode right after elder tour finishes
          setShowPracticeModal(true);
        },
        steps: [
          {
            element: '#elder-screen-root',
            popover: {
              title: isHindi ? 'अडेप्ट में आपका स्वागत है' : 'Welcome to Adept, Arthur',
              description: isHindi
                ? 'यह ऐप आपके लिए बनाया गया है। बड़े बटन, शांत रंग, कोई हड़बड़ी नहीं।'
                : 'Designed just for you. Big friendly buttons, calm colors, and one clear question at a time.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#elder-main-action-card',
            popover: {
              title: isHindi ? 'आपकी अगली दवा' : 'Your Next Medicine Card',
              description: isHindi
                ? 'आपकी दवा खाने के समय (नाश्ता, दोपहर या रात के खाने) से जुड़ी है। exact clock का कोई तनाव नहीं।'
                : 'Your doses are anchored to your breakfast, lunch, or dinner. No stress about exact clock minutes.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#elder-feeling-checkin',
            popover: {
              title: isHindi ? 'आप कैसा महसूस कर रहे हैं?' : 'How do you feel today?',
              description: isHindi
                ? 'चार चेहरों में से एक चुनें। यह धीरे से सारा और परिवार को बता देता है कि आप ठीक हैं।'
                : 'Tap a face to let Sarah and family quietly know you are resting comfortably.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#elder-voice-btn',
            popover: {
              title: isHindi ? 'बोलकर बताएं' : 'Speak to Adept',
              description: isHindi
                ? 'माइक दबाएं और कहें: "मैंने गोली खा ली"। टाइप करने की जरूरत नहीं।'
                : 'Tap the big microphone and say "I took my morning pill" or "maine goli kha li".',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#elder-help-tab-btn',
            popover: {
              title: isHindi ? 'मदद और आपका फैसला' : 'Help & Your Decisions',
              description: isHindi
                ? 'डॉक्टर इवलिन वेंस या 911 को कॉल करें। आपके पास किसी भी बदलाव को रद्द (Veto) करने की पूरी ताकत है।'
                : 'Emergency 911, Dr. Vance call, and full Elder Veto power over any schedule change.',
              side: 'top',
              align: 'center',
            },
          },
        ],
      });

      d.drive();
      return;
    }

    // 2. CARETAKER TOUR: 4-6 short steps
    if (role === 'caretaker') {
      const d = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        onDestroyStarted: () => {
          setTourCompletedForMember(memberKey, true);
          if (onClose) onClose();
          d.destroy();
        },
        steps: [
          {
            element: '#caretaker-today-header',
            popover: {
              title: 'Care Coordinator Portal',
              description: `Monitor Arthur's daily rhythm, meal anchor windows, and reported comfort score.`,
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#caretaker-timeline-section',
            popover: {
              title: 'Baseline Timeline ("Normal for Dad")',
              description: `Adept learns Arthur's personal dose habits. Green shows adherence within normal personal variance; warm amber flags deviations.`,
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#caretaker-tab-meds',
            popover: {
              title: 'PIN-Protected Medication Schedule',
              description: `Schedule doses with mandatory clinical sources. Unlocking edits requires your 6-digit PIN (5 wrong tries = 10-minute lockout).`,
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#caretaker-tab-alerts',
            popover: {
              title: 'Clinical AI & Doctor Handoff Loop',
              description: `Scan prescription photos with Gemini Vision OCR, generate 1-page Pre-Visit Brief PDFs for Dr. Vance, and send Resend digests.`,
              side: 'top',
              align: 'center',
            },
          },
        ],
      });

      d.drive();
      return;
    }

    // 3. FAMILY TOUR: 4-6 short steps
    if (role === 'family') {
      const d = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        onDestroyStarted: () => {
          setTourCompletedForMember(memberKey, true);
          if (onClose) onClose();
          d.destroy();
        },
        steps: [
          {
            element: '#family-reassurance-card',
            popover: {
              title: 'Calm Family Reassurance',
              description: `Peace of mind that Dad had breakfast and took his blood pressure medicine on time, without intrusive calling.`,
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#family-tab-team',
            popover: {
              title: 'Care Team & Cheer Notes',
              description: `Send Dad cheerful notes that appear instantly on his tablet feed, and manage family view/edit permissions.`,
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#family-tab-tasks',
            popover: {
              title: 'Family Care Coordination',
              description: `Coordinate pharmacy pickups, doctor rides, and Sunday family dinners in a shared interactive checklist.`,
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#family-tab-settings',
            popover: {
              title: `Set up Dad's Phone & Security`,
              description: `Generate a 15-minute 6-digit code or QR to pair Dad's tablet forever, and monitor Caretaker PIN security.`,
              side: 'top',
              align: 'center',
            },
          },
        ],
      });

      d.drive();
      return;
    }
  }, [role, language, memberKey, onClose]);

  // Run automatically on first mount if tour not completed yet, or if forced
  useEffect(() => {
    const isCompleted = isTourCompletedForMember(memberKey);
    if (!isCompleted || forceStart) {
      // Small timeout to allow DOM elements to mount
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [forceStart, memberKey, startTour]);

  return (
    <>
      <PracticeModeModal
        isOpen={showPracticeModal}
        onClose={() => setShowPracticeModal(false)}
        language={language}
      />
    </>
  );
};

export const PracticeModeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'hi';
}> = ({ isOpen, onClose, language }) => {
  const [practiceSuccess, setPracticeSuccess] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#fcfbfa] border-2 border-[#064e3b] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064e3b] flex items-center justify-center mx-auto">
          <Pill className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            Practice Mode • Safe Sandbox
          </span>
          <h3 className="text-xl font-black text-slate-900">
            {language === 'hi' ? 'दवा लेने का अभ्यास करें' : 'Try Tapping "Taken"'}
          </h3>
          <p className="text-xs text-slate-500">
            {language === 'hi'
              ? 'यह केवल अभ्यास है। यह आपके असली रिकॉर्ड को नहीं बदलेगा।'
              : 'Tap below to see how easy it is. Safe sandbox data that never touches your real medication logs.'}
          </p>
        </div>

        {!practiceSuccess ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="text-sm font-bold text-slate-800">
              Morning Blood Pressure Tablet (5mg)
            </div>
            <button
              onClick={() => setPracticeSuccess(true)}
              className="w-full h-14 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <span>Taken • Yes, I took it</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-2 animate-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xl font-black">
              ✓
            </div>
            <div className="text-sm font-black text-[#064e3b]">
              {language === 'hi' ? 'बहुत बढ़िया! दर्ज हो गया।' : 'Wonderful! That was so easy.'}
            </div>
            <p className="text-xs text-emerald-800">
              {language === 'hi'
                ? 'असली स्क्रीन पर भी बस इतना ही करना है। कोई पासवर्ड नहीं।'
                : 'On your real screen, confirming a dose is just that single tap. No passwords, no stress.'}
            </p>
          </div>
        )}

        <button
          onClick={() => {
            onClose();
            setPracticeSuccess(false);
          }}
          className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          {language === 'hi' ? 'वापस जाएं' : 'Close Practice Mode'}
        </button>
      </div>
    </div>
  );
};
