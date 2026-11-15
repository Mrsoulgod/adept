import { describe, it, expect } from 'vitest';
import { predictMedicationStockOut } from '../src/lib/inventory';
import type { Medication } from '../src/lib/types';

describe('Inventory & Stock-Out Prediction Suite - Prompt 2', () => {
  const baseMed: Medication = {
    id: 'med-ramipril',
    name: 'Ramipril ACE Inhibitor',
    friendlyName: 'Ramipril Blood Pressure Pill',
    dosage: '5 mg',
    mealAnchor: 'morning_breakfast',
    scheduleTime: '08:30 AM',
    stockCount: 20,
    dailyDoseUnits: 1,
    isActive: true,
  };

  it('1. Calculates exact days remaining from stockCount and dailyDoseUnits', () => {
    const med: Medication = { ...baseMed, stockCount: 28, dailyDoseUnits: 1 };
    const prediction = predictMedicationStockOut(med, new Date('2026-11-15T10:00:00Z'));
    expect(prediction.daysRemaining).toBe(28);
    expect(prediction.currentStock).toBe(28);
  });

  it('2. Correctly handles multiple doses per day (e.g., 2 units daily)', () => {
    const med: Medication = { ...baseMed, stockCount: 30, dailyDoseUnits: 2 };
    const prediction = predictMedicationStockOut(med, new Date('2026-11-15T10:00:00Z'));
    expect(prediction.daysRemaining).toBe(15);
  });

  it('3. Computes accurate projected calendar date of stock-out', () => {
    const med: Medication = { ...baseMed, stockCount: 10, dailyDoseUnits: 1 };
    const refDate = new Date('2026-11-10T12:00:00Z');
    const prediction = predictMedicationStockOut(med, refDate);
    expect(prediction.stockOutDateStr).toBe('2026-11-20');
  });

  it('4. Flags weekend stockout risk when supply depletes on Saturday or Sunday', () => {
    // 2026-11-18 is Wednesday. 3 days remaining -> 2026-11-21 is Saturday!
    const med: Medication = { ...baseMed, stockCount: 3, dailyDoseUnits: 1 };
    const wednesday = new Date('2026-11-18T10:00:00Z');
    const prediction = predictMedicationStockOut(med, wednesday);
    expect(prediction.isWeekendStockOut).toBe(true);
    expect(prediction.needsRefillNudge).toBe(true);
  });

  it('5. Flags holiday stockout risk near known closures (e.g., Christmas December 25)', () => {
    // 2026-12-20 with 5 days remaining -> 2026-12-25 (Christmas)
    const med: Medication = { ...baseMed, stockCount: 5, dailyDoseUnits: 1 };
    const dec20 = new Date('2026-12-20T10:00:00Z');
    const prediction = predictMedicationStockOut(med, dec20);
    expect(prediction.isHolidayStockOut).toBe(true);
    expect(prediction.holidayName).toContain('Christmas');
    expect(prediction.needsRefillNudge).toBe(true);
  });

  it('6. Activates refill nudge whenever supply falls below 7 days', () => {
    const med: Medication = { ...baseMed, stockCount: 6, dailyDoseUnits: 1 };
    const prediction = predictMedicationStockOut(med, new Date('2026-11-15T10:00:00Z'));
    expect(prediction.needsRefillNudge).toBe(true);
  });

  it('7. Does not trigger urgent refill nudge when supply is healthy (> 14 days and no closures)', () => {
    const med: Medication = { ...baseMed, stockCount: 45, dailyDoseUnits: 1 };
    const prediction = predictMedicationStockOut(med, new Date('2026-11-15T10:00:00Z'));
    expect(prediction.needsRefillNudge).toBe(false);
    expect(prediction.severity).toBe('comfortable');
  });

  it('8. Identifies critical stock-out status when remaining supply is <= 3 days', () => {
    const med: Medication = { ...baseMed, stockCount: 2, dailyDoseUnits: 1 };
    const prediction = predictMedicationStockOut(med, new Date('2026-11-15T10:00:00Z'));
    expect(prediction.severity).toBe('urgent');
  });

  it('9. Gracefully handles zero stock or missing stockCount with safe fallbacks', () => {
    const med: Medication = { ...baseMed, stockCount: 0 };
    const prediction = predictMedicationStockOut(med, new Date('2026-11-15T10:00:00Z'));
    expect(prediction.daysRemaining).toBe(0);
    expect(prediction.severity).toBe('urgent');
  });

  it('10. Produces actionable recommendation message for the Care Team', () => {
    const med: Medication = { ...baseMed, stockCount: 4, dailyDoseUnits: 1 };
    const prediction = predictMedicationStockOut(med, new Date('2026-11-15T10:00:00Z'));
    expect(prediction.nudgeReason).toBeDefined();
    expect(prediction.nudgeReason?.length).toBeGreaterThan(10);
  });
});
