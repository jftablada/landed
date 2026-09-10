import { describe, expect, it } from 'vitest';
import { calculateRunwayScenario } from './exploreRunway';

const now = new Date('2026-09-10T12:00:00Z');

describe('calculateRunwayScenario', () => {
  it('matches the baseline when no scenario changes are entered', () => {
    const result = calculateRunwayScenario({
      baselineCash: 8000,
      baselineMonthlyCosts: 3000,
      baselineMonthlyIncome: 0,
      monthlyCostReduction: 0,
      addedMonthlyIncome: 0,
      addedCashCushion: 0,
      now,
    });

    expect(result.runwayWeeks).toBeCloseTo(11.5867, 3);
    expect(result.weeksChanged).toBeCloseTo(0);
    expect(result.runwayDate).toBe('2026-11-30');
  });

  it('extends runway when costs fall and monthly income rises', () => {
    const result = calculateRunwayScenario({
      baselineCash: 8000,
      baselineMonthlyCosts: 3000,
      baselineMonthlyIncome: 0,
      monthlyCostReduction: 500,
      addedMonthlyIncome: 500,
      addedCashCushion: 0,
      now,
    });

    expect(result.monthlyGap).toBe(2000);
    expect(result.runwayWeeks).toBeCloseTo(17.38, 2);
    expect(result.weeksChanged).toBeGreaterThan(5);
  });

  it('reports ongoing monthly costs as covered without using Infinity', () => {
    const result = calculateRunwayScenario({
      baselineCash: 1000,
      baselineMonthlyCosts: 2000,
      baselineMonthlyIncome: 500,
      monthlyCostReduction: 500,
      addedMonthlyIncome: 1000,
      addedCashCushion: 0,
      now,
    });

    expect(result.costsCovered).toBe(true);
    expect(result.monthlyGap).toBe(0);
    expect(result.runwayWeeks).toBeNull();
    expect(result.runwayDate).toBeNull();
  });

  it('clamps negative and invalid scenario values to zero', () => {
    const result = calculateRunwayScenario({
      baselineCash: 4000,
      baselineMonthlyCosts: 2000,
      baselineMonthlyIncome: 0,
      monthlyCostReduction: -100,
      addedMonthlyIncome: Number.NaN,
      addedCashCushion: -500,
      now,
    });

    expect(result.scenarioCash).toBe(4000);
    expect(result.scenarioMonthlyCosts).toBe(2000);
    expect(result.scenarioMonthlyIncome).toBe(0);
  });
});
