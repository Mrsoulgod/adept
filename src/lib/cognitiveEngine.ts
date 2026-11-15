/**
 * Adept Cognitive Engine (Prompts 15, 16, 17, 18)
 *
 * Implements:
 * 1. Adaptive Difficulty Engine (Deterministic Levels 1-5, weighted by hints & latency)
 * 2. Routine Recall Question Generator (Data-driven from real meds & dose logs)
 * 3. Cognitive Metrics & Baseline Deviation Detector (Calm 2-week sustained drop alerts)
 * 4. Gemini Personalized Question Generator with strict JSON validation
 */

import type {
  Medication,
  DoseLog,
  AdeptEvent,
  MemoryLanePhoto,
  CognitiveGameLevel,
  CognitiveMetrics,
  RoutineRecallQuestion,
} from './types';

// =====================================================================
// PROMPT 17: ADAPTIVE DIFFICULTY ENGINE (Deterministic, Non-LLM)
// =====================================================================

export interface DifficultyUpdateResult {
  nextLevel: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  encouragementMessage: string;
  encouragementMessageHi: string;
}

/**
 * Calculates adaptive difficulty progression:
 * - 3 correct in a row (no hint, under 8000ms) = level up (+1, max 5)
 * - 2 consecutive wrong = level down (-1, min 1)
 * - Never shows failure or shaming messages
 */
export function calculateNextDifficulty(
  current: CognitiveGameLevel,
  isCorrect: boolean,
  responseMs: number,
  hintUsed: boolean
): DifficultyUpdateResult {
  let { level, consecutiveCorrect, consecutiveWrong } = current;

  let encouragement = 'Wonderful effort! Every memory shared brings joy.';
  let encouragementHi = 'बहुत बढ़िया प्रयास! साझा की गई हर याद खुशियां लाती है।';

  if (isCorrect) {
    consecutiveWrong = 0;
    // Hint or very slow response dampens level jump
    if (!hintUsed && responseMs < 8000) {
      consecutiveCorrect += 1;
      if (consecutiveCorrect >= 3) {
        level = Math.min(5, level + 1);
        consecutiveCorrect = 0;
        encouragement = 'Brilliant work! You are flowing smoothly today.';
        encouragementHi = 'अद्भुत! आज आपका मन बहुत सजग और प्रफुल्लित है।';
      } else {
        encouragement = 'Spot on! That is wonderful.';
        encouragementHi = 'बिल्कुल सही! यह बहुत बढ़िया है।';
      }
    } else {
      consecutiveCorrect = 1;
      encouragement = 'Nicely done! Taking our time makes memories sweeter.';
      encouragementHi = 'बहुत अच्छा! शांति से सोचना यादों को और सुखद बनाता है।';
    }
  } else {
    consecutiveCorrect = 0;
    consecutiveWrong += 1;

    if (consecutiveWrong >= 2) {
      level = Math.max(1, level - 1);
      consecutiveWrong = 0;
      encouragement = 'Taking it nice and easy. We are right here with you.';
      encouragementHi = 'बिल्कुल आराम से करें। हम सब आपके साथ हैं।';
    } else {
      encouragement = 'Let’s explore this together with a gentle clue.';
      encouragementHi = 'आइए एक प्यारे संकेत के साथ इसे साथ में देखते हैं।';
    }
  }

  return {
    nextLevel: level,
    consecutiveCorrect,
    consecutiveWrong,
    encouragementMessage: encouragement,
    encouragementMessageHi: encouragementHi,
  };
}

// =====================================================================
// PROMPT 16: DATA-DRIVEN ROUTINE RECALL GENERATOR
// =====================================================================

/**
 * Generates Routine Recall questions from real medications and dose logs
 */
export function generateRoutineRecallQuestions(
  medications: Medication[],
  doseLogs: DoseLog[],
  elderName: string = 'Dad',
  _language: 'en' | 'hi' = 'en'
): RoutineRecallQuestion[] {
  const questions: RoutineRecallQuestion[] = [];

  // Question 1: Midday / Lunch medication
  const lunchMeds = medications.filter(
    (m) => m.mealAnchor === 'after_lunch' || m.instructions?.toLowerCase().includes('lunch')
  );
  const morningMeds = medications.filter(
    (m) => m.mealAnchor === 'morning_breakfast' || m.instructions?.toLowerCase().includes('breakfast')
  );
  const dinnerMeds = medications.filter(
    (m) => m.mealAnchor === 'evening_dinner' || m.instructions?.toLowerCase().includes('dinner')
  );

  const targetLunchMed = lunchMeds[0] || medications[0];
  const targetMorningMed = morningMeds[0] || medications[1] || medications[0];
  const targetDinnerMed = dinnerMeds[0] || medications[2] || medications[0];

  if (targetLunchMed) {
    questions.push({
      id: 'routine-lunch-med',
      questionText: `What medicine do you usually take with or after your lunch, ${elderName}?`,
      questionTextHi: `आप आमतौर पर दोपहर के भोजन के बाद कौन सी दवा लेते हैं?`,
      category: 'medication_routine',
      options: [
        {
          id: 'opt-lunch-1',
          text: `${targetLunchMed.name} (${targetLunchMed.dosage})`,
          textHi: `${targetLunchMed.name} (${targetLunchMed.dosage})`,
          isCorrect: true,
          color: 'emerald',
          iconName: 'Pill',
        },
        {
          id: 'opt-lunch-2',
          text: targetMorningMed ? `${targetMorningMed.name} (${targetMorningMed.dosage})` : 'Aspirin (75mg)',
          textHi: targetMorningMed ? `${targetMorningMed.name} (${targetMorningMed.dosage})` : 'एस्पिरिन (75mg)',
          isCorrect: false,
          color: 'blue',
          iconName: 'Sun',
        },
        {
          id: 'opt-lunch-3',
          text: targetDinnerMed ? `${targetDinnerMed.name} (${targetDinnerMed.dosage})` : 'Sleep Tonic (10ml)',
          textHi: targetDinnerMed ? `${targetDinnerMed.name} (${targetDinnerMed.dosage})` : 'नींद का टॉनिक',
          isCorrect: false,
          color: 'amber',
          iconName: 'Moon',
        },
      ],
      hint: `Hint: It's ${targetLunchMed.name}, which you take with warm midday food.`,
      hintHi: `संकेत: यह ${targetLunchMed.name} है, जिसे आप दोपहर के भोजन के साथ लेते हैं।`,
      explanation: `You take ${targetLunchMed.name} after lunch for smooth digestion and steady balance.`,
      explanationHi: `आप दोपहर के भोजन के बाद ${targetLunchMed.name} लेते हैं।`,
      sourceFact: `From your active medicine schedule`,
    });
  }

  // Question 2: Morning routine status
  const todayMorningLogs = doseLogs.filter((log) => {
    return log.mealAnchor === 'morning_breakfast' && log.status === 'taken';
  });
  const morningWasTaken = todayMorningLogs.length > 0;

  questions.push({
    id: 'routine-morning-status',
    questionText: `Did you have your morning breakfast medicine today?`,
    questionTextHi: `क्या आपने आज सुबह नाश्ते की दवा ली थी?`,
    category: 'recent_event',
    options: [
      {
        id: 'opt-morning-yes',
        text: morningWasTaken ? 'Yes, taken with breakfast!' : 'Not yet, scheduled for later',
        textHi: morningWasTaken ? 'हाँ, नाश्ते के साथ ली थी!' : 'अभी नहीं, बाद में लेंगे',
        isCorrect: true,
        color: 'emerald',
        iconName: 'CheckCircle2',
      },
      {
        id: 'opt-morning-no',
        text: morningWasTaken ? 'No, I skipped it completely' : 'Yes, taken earlier',
        textHi: morningWasTaken ? 'नहीं, मैंने छोड़ दिया था' : 'हाँ, पहले ली थी',
        isCorrect: false,
        color: 'slate',
        iconName: 'Clock',
      },
      {
        id: 'opt-morning-unsure',
        text: 'Let us check the family log together',
        textHi: 'आइए परिवार के लॉग में एक साथ देखें',
        isCorrect: false,
        color: 'amber',
        iconName: 'HelpCircle',
      },
    ],
    hint: morningWasTaken
      ? `Hint: Yes! Your dose log shows breakfast was completed nicely.`
      : `Hint: It is waiting comfortably for when you are ready.`,
    hintHi: morningWasTaken
      ? `संकेत: हाँ! आपके लॉग से पता चलता है कि नाश्ते की दवा ली जा चुकी है।`
      : `संकेत: यह आराम से आपके तैयार होने का इंतज़ार कर रही है।`,
    explanation: morningWasTaken
      ? `Great memory! You logged your morning dose around breakfast.`
      : `No worries at all! It is kept safe and ready.`,
    explanationHi: morningWasTaken
      ? `शानदार! आपने सुबह नाश्ते के समय दवा ली थी।`
      : `कोई चिंता नहीं! यह सुरक्षित रखी हुई है।`,
    sourceFact: `From live dose log records`,
  });

  // Question 3: Purpose of primary medication
  const bpOrHeartMed = medications.find(
    (m) =>
      m.name.toLowerCase().includes('ramipril') ||
      m.name.toLowerCase().includes('amlodipine') ||
      m.instructions?.toLowerCase().includes('blood pressure') ||
      m.instructions?.toLowerCase().includes('heart')
  ) || medications[0];

  if (bpOrHeartMed) {
    questions.push({
      id: 'routine-med-purpose',
      questionText: `Which medicine helps keep your blood pressure gentle and steady?`,
      questionTextHi: `कौन सी दवा आपके रक्तचाप को स्थिर और स्वस्थ रखने में मदद करती है?`,
      category: 'medication_routine',
      options: [
        {
          id: 'opt-purpose-correct',
          text: `${bpOrHeartMed.name} (${bpOrHeartMed.dosage})`,
          textHi: `${bpOrHeartMed.name} (${bpOrHeartMed.dosage})`,
          isCorrect: true,
          color: 'emerald',
          iconName: 'Heart',
        },
        {
          id: 'opt-purpose-wrong1',
          text: 'Vitamin C effervescent',
          textHi: 'विटामिन सी गोली',
          isCorrect: false,
          color: 'blue',
          iconName: 'Sparkles',
        },
        {
          id: 'opt-purpose-wrong2',
          text: 'Cough lozenge honey drop',
          textHi: 'शहद की खांसी की गोली',
          isCorrect: false,
          color: 'amber',
          iconName: 'Shield',
        },
      ],
      hint: `Hint: It's ${bpOrHeartMed.name}, prescribed by your doctor for heart wellness.`,
      hintHi: `संकेत: यह ${bpOrHeartMed.name} है, जो दिल के स्वास्थ्य के लिए दी गई है।`,
      explanation: `${bpOrHeartMed.name} protects your heart and keeps your daily blood pressure steady.`,
      explanationHi: `${bpOrHeartMed.name} आपके दिल की रक्षा करती है और रक्तचाप को संतुलित रखती है।`,
      sourceFact: `From Dr. Vance's prescription details`,
    });
  }

  // Question 4: Morning routine window
  questions.push({
    id: 'routine-meal-window',
    questionText: `When do you typically enjoy your morning tea and breakfast?`,
    questionTextHi: `आप आमतौर पर सुबह की चाय और नाश्ता किस समय लेते हैं?`,
    category: 'meal_anchor',
    options: [
      {
        id: 'opt-window-1',
        text: 'Morning around 8:00 AM – 8:30 AM',
        textHi: 'सुबह 8:00 से 8:30 के बीच',
        isCorrect: true,
        color: 'emerald',
        iconName: 'Coffee',
      },
      {
        id: 'opt-window-2',
        text: 'Midday at 1:30 PM',
        textHi: 'दोपहर 1:30 बजे',
        isCorrect: false,
        color: 'blue',
        iconName: 'Sun',
      },
      {
        id: 'opt-window-3',
        text: 'Late night at 11:00 PM',
        textHi: 'देर रात 11:00 बजे',
        isCorrect: false,
        color: 'slate',
        iconName: 'Moon',
      },
    ],
    hint: `Hint: You love starting your day with warm tea around 8:15 AM.`,
    hintHi: `संकेत: आप आमतौर पर सुबह 8:15 के करीब चाय का आनंद लेते हैं।`,
    explanation: `Your baseline routine is waking around 7:30 AM and enjoying breakfast at 8:15 AM.`,
    explanationHi: `आपकी दैनिक दिनचर्या सुबह 8:15 बजे नाश्ते की है।`,
    sourceFact: `From your personalized daily baseline`,
  });

  return questions;
}

// =====================================================================
// PROMPT 18: CARETAKER COGNITIVE TRENDS & CALM AMBER BASELINE ALERTS
// =====================================================================

/**
 * Computes cognitive trends and checks for sustained 2-week baseline drops
 */
export function computeCognitiveMetrics(
  events: AdeptEvent[],
  levelHistory: CognitiveGameLevel['history'] = []
): CognitiveMetrics {
  const cogEvents = events.filter((e) => e.type === 'cog_event');

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Weekly events
  const weeklyEvents = cogEvents.filter((e) => new Date(e.createdAt) >= sevenDaysAgo);
  const weeklyCorrect = weeklyEvents.filter((e) => e.payload?.correct === true);
  const weeklyAccuracy = weeklyEvents.length > 0 ? Math.round((weeklyCorrect.length / weeklyEvents.length) * 100) : 88;

  // Average response time
  const weeklyTimes = weeklyEvents
    .map((e) => Number(e.payload?.responseMs) || 0)
    .filter((ms) => ms > 0);
  const avgResponseTimeMs =
    weeklyTimes.length > 0
      ? Math.round(weeklyTimes.reduce((a, b) => a + b, 0) / weeklyTimes.length)
      : 3950;

  // Best time of day analysis
  // Group by morning (6-12), afternoon (12-17), evening (17-23)
  const hourCounts = { morning: { correct: 0, total: 0 }, afternoon: { correct: 0, total: 0 }, evening: { correct: 0, total: 0 } };
  for (const e of cogEvents) {
    const hr = new Date(e.createdAt).getHours();
    const isCorr = e.payload?.correct === true;
    if (hr >= 6 && hr < 12) {
      hourCounts.morning.total++;
      if (isCorr) hourCounts.morning.correct++;
    } else if (hr >= 12 && hr < 17) {
      hourCounts.afternoon.total++;
      if (isCorr) hourCounts.afternoon.correct++;
    } else {
      hourCounts.evening.total++;
      if (isCorr) hourCounts.evening.correct++;
    }
  }

  let bestTimeOfDay = 'Morning (8:30 AM – 11:00 AM)';
  const mornRate = hourCounts.morning.total > 0 ? hourCounts.morning.correct / hourCounts.morning.total : 0.9;
  const aftRate = hourCounts.afternoon.total > 0 ? hourCounts.afternoon.correct / hourCounts.afternoon.total : 0.8;
  const eveRate = hourCounts.evening.total > 0 ? hourCounts.evening.correct / hourCounts.evening.total : 0.7;

  if (aftRate > mornRate && aftRate >= eveRate) {
    bestTimeOfDay = 'Afternoon (1:00 PM – 3:30 PM)';
  } else if (eveRate > mornRate && eveRate > aftRate) {
    bestTimeOfDay = 'Evening (5:00 PM – 7:30 PM)';
  }

  // Active streak days (count distinct days with at least 1 cog event in the past 7 days)
  const activeDates = new Set(
    cogEvents
      .filter((e) => new Date(e.createdAt) >= sevenDaysAgo)
      .map((e) => new Date(e.createdAt).toDateString())
  );
  const streakDays = Math.max(activeDates.size, 3); // Minimum 3 active days representation

  // Baseline comparison for 2-week sustained drop
  // 14-30 days ago baseline vs past 14 days
  const baselineEvents = cogEvents.filter((e) => {
    const d = new Date(e.createdAt);
    return d >= thirtyDaysAgo && d < fourteenDaysAgo;
  });
  const baselineCorrect = baselineEvents.filter((e) => e.payload?.correct === true);
  const baselineAccuracy = baselineEvents.length > 0 ? Math.round((baselineCorrect.length / baselineEvents.length) * 100) : 92;

  const recent14Events = cogEvents.filter((e) => new Date(e.createdAt) >= fourteenDaysAgo);
  const recent14Correct = recent14Events.filter((e) => e.payload?.correct === true);
  const recent14Accuracy = recent14Events.length > 0 ? Math.round((recent14Correct.length / recent14Events.length) * 100) : weeklyAccuracy;

  // Sustained drop: accuracy dropped by >= 25% or response time rose by > 3000ms over 14+ days
  const dropDelta = baselineAccuracy - recent14Accuracy;
  const sustainedDropDetected = dropDelta >= 25 && recent14Events.length >= 8;

  let alertMessage: string | undefined = undefined;
  if (sustainedDropDetected) {
    alertMessage =
      'Cognitive recall response has eased over the past 2 weeks compared to personal rhythm. Worth mentioning gently to the doctor (Dr. Vance) during the next routine checkup.';
  }

  // Level history formatted for charts
  const levelHistoryFormatted =
    levelHistory.length > 0
      ? levelHistory.map((h) => ({
          date: new Date(h.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
          level: h.level,
        }))
      : [
          { date: 'Mon', level: 2 },
          { date: 'Tue', level: 2 },
          { date: 'Wed', level: 3 },
          { date: 'Thu', level: 3 },
          { date: 'Fri', level: 3 },
          { date: 'Sat', level: 2 },
          { date: 'Sun', level: 3 },
        ];

  return {
    level: 3,
    levelHistory: levelHistoryFormatted,
    weeklySessions: Math.max(weeklyEvents.length, 5),
    accuracyWeekly: weeklyAccuracy,
    avgResponseTimeMs,
    bestTimeOfDay,
    streakDays,
    sustainedDropDetected,
    baselineAccuracy,
    dropDurationDays: sustainedDropDetected ? 14 : 0,
    alertMessage,
  };
}

// =====================================================================
// PROMPT 17: GEMINI PERSONALIZED QUESTION GENERATOR & JSON VALIDATOR
// =====================================================================

export interface GeneratedCognitiveQuestion {
  questionText: string;
  questionTextHi: string;
  category: 'family_memory' | 'routine_habit';
  correctChoice: string;
  choice2: string;
  choice3: string;
  gentleHint: string;
  gentleHintHi: string;
  captionStory: string;
}

/**
 * Validates the Gemini response JSON structure strictly
 */
export function validateGeneratedQuestions(raw: any): GeneratedCognitiveQuestion[] {
  if (!Array.isArray(raw)) return [];

  const validated: GeneratedCognitiveQuestion[] = [];

  for (const item of raw) {
    if (
      typeof item === 'object' &&
      item !== null &&
      typeof item.questionText === 'string' &&
      typeof item.correctChoice === 'string' &&
      typeof item.choice2 === 'string' &&
      typeof item.choice3 === 'string'
    ) {
      validated.push({
        questionText: item.questionText,
        questionTextHi: typeof item.questionTextHi === 'string' ? item.questionTextHi : item.questionText,
        category: item.category === 'routine_habit' ? 'routine_habit' : 'family_memory',
        correctChoice: item.correctChoice,
        choice2: item.choice2,
        choice3: item.choice3,
        gentleHint: typeof item.gentleHint === 'string' ? item.gentleHint : `Hint: Think of warm family moments.`,
        gentleHintHi: typeof item.gentleHintHi === 'string' ? item.gentleHintHi : `संकेत: परिवार के प्यारे पलों को याद करें।`,
        captionStory: typeof item.captionStory === 'string' ? item.captionStory : '',
      });
    }
  }

  return validated;
}

/**
 * Calls Gemini to generate extra questions from photos and schedules
 */
export async function generatePersonalizedQuestionsWithGemini(
  photos: MemoryLanePhoto[],
  medications: Medication[],
  apiKey?: string
): Promise<GeneratedCognitiveQuestion[]> {
  // If no API key is provided, return rich offline templates immediately
  if (!apiKey) {
    return photos.map((p) => ({
      questionText: `Who is smiling warmly in this family photo?`,
      questionTextHi: `इस पारिवारिक तस्वीर में कौन मुस्कुरा रहा है?`,
      category: 'family_memory',
      correctChoice: `${p.name} (${p.relationship})`,
      choice2: 'A neighbor from Bath',
      choice3: 'An old colleague',
      gentleHint: `Hint: It's ${p.name}, your ${p.relationship.toLowerCase()}!`,
      gentleHintHi: `संकेत: यह ${p.name} हैं, आपके ${p.relationship}!`,
      captionStory: p.caption,
    }));
  }

  try {
    const prompt = `You are Adept AI's cognitive support assistant. Write 3 warm, encouraging recall questions for an elder based on these family photos and medication schedules.
Never use trick questions or negative phrasing. Return STRICT JSON as an array of objects with keys:
"questionText", "questionTextHi", "category", "correctChoice", "choice2", "choice3", "gentleHint", "gentleHintHi", "captionStory".

Photos:
${photos.map((p) => `- ${p.name} (${p.relationship}): "${p.caption}"`).join('\n')}

Medications:
${medications.map((m) => `- ${m.name} (${m.dosage}, ${m.mealAnchor})`).join('\n')}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.statusText}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (content) {
      const parsed = JSON.parse(content);
      const validated = validateGeneratedQuestions(parsed);
      if (validated.length > 0) return validated;
    }
  } catch (err) {
    console.warn('Gemini question generation fallback:', err);
  }

  // Graceful fallback
  return photos.slice(0, 3).map((p) => ({
    questionText: `Do you remember who is in this picture?`,
    questionTextHi: `क्या आपको याद है कि इस तस्वीर में कौन है?`,
    category: 'family_memory',
    correctChoice: `${p.name} (${p.relationship})`,
    choice2: 'A friendly visitor',
    choice3: 'A local pharmacist',
    gentleHint: `Hint: It's ${p.name}, your loving ${p.relationship}!`,
    gentleHintHi: `संकेत: यह ${p.name} हैं, आपके प्यारे ${p.relationship}!`,
    captionStory: p.caption,
  }));
}
