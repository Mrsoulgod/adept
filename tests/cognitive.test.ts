import { describe, it, expect } from 'vitest';
import {
  calculateNextDifficulty,
  generateRoutineRecallQuestions,
  computeCognitiveMetrics,
  validateGeneratedQuestions,
} from '../src/lib/cognitiveEngine';
import type {
  CognitiveGameLevel,
  AdeptEvent,
  Medication,
  DoseLog,
} from '../src/lib/types';

describe('Cognitive Engine Suite - Prompts 15, 16, 17, 18', () => {
  describe('Adaptive Difficulty Progression Engine (Prompt 17)', () => {
    const baseLevel: CognitiveGameLevel = {
      game: 'memory_lane',
      level: 2,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      history: [],
    };

    it('1. Increments consecutiveCorrect on rapid correct response without hints', () => {
      const res = calculateNextDifficulty(baseLevel, true, 2500, false);
      expect(res.consecutiveCorrect).toBe(1);
      expect(res.consecutiveWrong).toBe(0);
      expect(res.nextLevel).toBe(2);
    });

    it('2. Advances level by +1 after 3 consecutive correct answers without hints', () => {
      const level2With2Correct: CognitiveGameLevel = {
        ...baseLevel,
        level: 2,
        consecutiveCorrect: 2,
      };
      const res = calculateNextDifficulty(level2With2Correct, true, 2200, false);
      expect(res.nextLevel).toBe(3);
      expect(res.consecutiveCorrect).toBe(0);
      expect(res.encouragementMessage).toContain('Brilliant work');
    });

    it('3. Does not exceed maximum difficulty ceiling of level 5', () => {
      const maxLevel: CognitiveGameLevel = {
        ...baseLevel,
        level: 5,
        consecutiveCorrect: 2,
      };
      const res = calculateNextDifficulty(maxLevel, true, 1800, false);
      expect(res.nextLevel).toBe(5);
    });

    it('4. Dampens level progression when a gentle hint was used', () => {
      const levelWith2Correct: CognitiveGameLevel = {
        ...baseLevel,
        consecutiveCorrect: 2,
      };
      // Correct with hint
      const res = calculateNextDifficulty(levelWith2Correct, true, 3000, true);
      expect(res.nextLevel).toBe(2); // Does not jump
      expect(res.consecutiveCorrect).toBe(1);
    });

    it('5. Decrements level by -1 after 2 consecutive wrong answers', () => {
      const level3With1Wrong: CognitiveGameLevel = {
        ...baseLevel,
        level: 3,
        consecutiveWrong: 1,
      };
      const res = calculateNextDifficulty(level3With1Wrong, false, 4000, false);
      expect(res.nextLevel).toBe(2);
      expect(res.consecutiveWrong).toBe(0);
    });

    it('6. Does not drop below minimum difficulty floor of level 1', () => {
      const level1With1Wrong: CognitiveGameLevel = {
        ...baseLevel,
        level: 1,
        consecutiveWrong: 1,
      };
      const res = calculateNextDifficulty(level1With1Wrong, false, 4000, false);
      expect(res.nextLevel).toBe(1);
    });

    it('7. Delivers positive, encouraging messages in both English and Hindi with no failure state', () => {
      const res = calculateNextDifficulty(baseLevel, false, 3000, false);
      expect(res.encouragementMessage).toBeDefined();
      expect(res.encouragementMessageHi).toBeDefined();
      expect(res.encouragementMessage).not.toContain('Failed');
      expect(res.encouragementMessage).not.toContain('Wrong');
    });
  });

  describe('Data-Driven Routine Recall Generator (Prompt 16)', () => {
    const sampleMeds: Medication[] = [
      {
        id: 'med-1',
        name: 'Ramipril ACE Inhibitor',
        friendlyName: 'Ramipril Blood Pressure Pill',
        dosage: '5 mg',
        mealAnchor: 'morning_breakfast',
        scheduleTime: '08:30 AM',
        isActive: true,
        instructions: 'Take 1 tablet every morning with breakfast for blood pressure',
      },
      {
        id: 'med-2',
        name: 'Glucosamine Complex',
        friendlyName: 'Glucosamine Joint Capsule',
        dosage: '1000 mg',
        mealAnchor: 'after_lunch',
        scheduleTime: '01:00 PM',
        isActive: true,
        instructions: 'Take 1 capsule midday with or after lunch',
      },
    ];

    const sampleLogs: DoseLog[] = [
      {
        id: 'log-1',
        medicationId: 'med-1',
        mealAnchor: 'morning_breakfast',
        scheduledDate: '2026-11-15',
        status: 'taken',
        loggedAt: '2026-11-15T08:25:00Z',
      },
    ];

    it('8. Generates routine questions dynamically from active medication schedule', () => {
      const questions = generateRoutineRecallQuestions(sampleMeds, sampleLogs, 'Arthur', 'en');
      expect(questions.length).toBeGreaterThanOrEqual(2);
      const lunchQ = questions.find((q) => q.id === 'routine-lunch-med');
      expect(lunchQ).toBeDefined();
      expect(lunchQ?.options.some((o) => o.isCorrect)).toBe(true);
    });

    it('9. Formulates data-driven question checking real dose logs from breakfast', () => {
      const questions = generateRoutineRecallQuestions(sampleMeds, sampleLogs, 'Arthur', 'en');
      const morningQ = questions.find((q) => q.id === 'routine-morning-status');
      expect(morningQ).toBeDefined();
      expect(morningQ?.questionText).toContain('morning');
      const correctOpt = morningQ?.options.find((o) => o.isCorrect);
      expect(correctOpt?.text).toContain('Yes');
    });

    it('10. Provides source citations anchoring question facts to medical records', () => {
      const questions = generateRoutineRecallQuestions(sampleMeds, sampleLogs, 'Arthur', 'en');
      for (const q of questions) {
        expect(q.sourceFact).toBeDefined();
        expect(q.sourceFact?.length).toBeGreaterThan(5);
      }
    });
  });

  describe('Cognitive Baseline & Sustained Drop Alerts (Prompt 18)', () => {
    it('11. Computes engagement metrics, accuracy, and average response time', () => {
      const now = new Date();
      const events: AdeptEvent[] = [
        {
          id: 'ev-1',
          circleId: 'circle-1',
          actorRole: 'elder',
          type: 'cog_event',
          payload: { game: 'memory_lane', correct: true, responseMs: 3200 },
          source: 'mind_tab',
          createdAt: now.toISOString(),
        },
        {
          id: 'ev-2',
          circleId: 'circle-1',
          actorRole: 'elder',
          type: 'cog_event',
          payload: { game: 'routine_recall', correct: true, responseMs: 2800 },
          source: 'mind_tab',
          createdAt: now.toISOString(),
        },
      ];

      const metrics = computeCognitiveMetrics(events);
      expect(metrics.accuracyWeekly).toBe(100);
      expect(metrics.avgResponseTimeMs).toBe(3000);
      expect(metrics.bestTimeOfDay).toBeDefined();
    });

    it('12. Alerts only on sustained drop >= 25% over 14+ days vs personal baseline', () => {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const events: AdeptEvent[] = [];

      // Historical baseline (15 to 25 days ago) - 100% correct
      for (let i = 15; i <= 25; i++) {
        events.push({
          id: `hist-${i}`,
          circleId: 'circle-1',
          actorRole: 'elder',
          type: 'cog_event',
          payload: { correct: true, responseMs: 2500 },
          source: 'mind_tab',
          createdAt: new Date(now - i * dayMs).toISOString(),
        });
      }

      // Recent 14 days - dropped to 30% correct across 10 sessions
      for (let i = 1; i <= 10; i++) {
        events.push({
          id: `rec-${i}`,
          circleId: 'circle-1',
          actorRole: 'elder',
          type: 'cog_event',
          payload: { correct: i <= 3, responseMs: 5500 },
          source: 'mind_tab',
          createdAt: new Date(now - i * dayMs).toISOString(),
        });
      }

      const metrics = computeCognitiveMetrics(events);
      expect(metrics.sustainedDropDetected).toBe(true);
      expect(metrics.alertMessage).toBeDefined();
      expect(metrics.alertMessage?.toLowerCase()).toContain('doctor');
      expect(metrics.alertMessage?.toLowerCase()).toContain('worth mentioning');
    });

    it('13. Does not trigger alert on transient or single-day variation', () => {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const events: AdeptEvent[] = [];

      // High baseline
      for (let i = 15; i <= 25; i++) {
        events.push({
          id: `hist-${i}`,
          circleId: 'circle-1',
          actorRole: 'elder',
          type: 'cog_event',
          payload: { correct: true, responseMs: 2500 },
          source: 'mind_tab',
          createdAt: new Date(now - i * dayMs).toISOString(),
        });
      }

      // Only 1 bad day recently
      events.push({
        id: 'rec-single',
        circleId: 'circle-1',
        actorRole: 'elder',
        type: 'cog_event',
        payload: { correct: false, responseMs: 4000 },
        source: 'mind_tab',
        createdAt: new Date(now - 1 * dayMs).toISOString(),
      });

      const metrics = computeCognitiveMetrics(events);
      expect(metrics.sustainedDropDetected).toBe(false);
    });
  });

  describe('Gemini Question Generation Schema Validation (Prompt 17)', () => {
    it('14. Strictly validates structured JSON questions from Gemini API', () => {
      const rawJson = [
        {
          questionText: 'Who visited Arthur last Sunday?',
          questionTextHi: 'पिछले रविवार को आर्थर से मिलने कौन आया था?',
          category: 'family_memory',
          correctChoice: 'Rahul (Grandson)',
          choice2: 'David (Neighbor)',
          choice3: 'Sarah (Daughter)',
          gentleHint: 'He brought fresh flowers.',
          gentleHintHi: 'वह ताजे फूल लाया था।',
          captionStory: 'Rahul came for afternoon tea.',
        },
      ];

      const validated = validateGeneratedQuestions(rawJson);
      expect(validated.length).toBe(1);
      expect(validated[0].correctChoice).toBe('Rahul (Grandson)');
      expect(validated[0].category).toBe('family_memory');
    });

    it('15. Discards incomplete or malformed JSON payloads safely', () => {
      const malformed = [
        { incomplete: true },
        null,
        'string instead of object',
        { questionText: 'No choices provided' },
      ];

      const validated = validateGeneratedQuestions(malformed);
      expect(validated.length).toBe(0);
    });
  });
});
