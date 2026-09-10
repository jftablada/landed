import { WEEKS_PER_MONTH } from './computeMode';

export interface RunwayScenarioInput {
  baselineCash: number;
  baselineMonthlyCosts: number;
  baselineMonthlyIncome: number;
  monthlyCostReduction: number;
  addedMonthlyIncome: number;
  addedCashCushion: number;
  now?: Date;
}

export interface RunwayScenarioResult {
  scenarioCash: number;
  scenarioMonthlyCosts: number;
  scenarioMonthlyIncome: number;
  monthlyGap: number;
  runwayWeeks: number | null;
  runwayDate: string | null;
  baselineRunwayWeeks: number | null;
  weeksChanged: number | null;
  costsCovered: boolean;
}

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function weeksOfRunway(cash: number, monthlyGap: number): number | null {
  if (monthlyGap <= 0) return null;
  return (cash / monthlyGap) * WEEKS_PER_MONTH;
}

function addWeeks(from: Date, weeks: number): string {
  const milliseconds = from.getTime() + weeks * 7 * 24 * 60 * 60 * 1000;
  return new Date(milliseconds).toISOString().slice(0, 10);
}

export function calculateRunwayScenario(
  input: RunwayScenarioInput,
): RunwayScenarioResult {
  const baselineCash = nonNegative(input.baselineCash);
  const baselineMonthlyCosts = nonNegative(input.baselineMonthlyCosts);
  const baselineMonthlyIncome = nonNegative(input.baselineMonthlyIncome);
  const scenarioCash = baselineCash + nonNegative(input.addedCashCushion);
  const scenarioMonthlyCosts = Math.max(
    0,
    baselineMonthlyCosts - nonNegative(input.monthlyCostReduction),
  );
  const scenarioMonthlyIncome =
    baselineMonthlyIncome + nonNegative(input.addedMonthlyIncome);
  const monthlyGap = scenarioMonthlyCosts - scenarioMonthlyIncome;
  const runwayWeeks = weeksOfRunway(scenarioCash, monthlyGap);
  const baselineRunwayWeeks = weeksOfRunway(
    baselineCash,
    baselineMonthlyCosts - baselineMonthlyIncome,
  );
  const now = input.now ?? new Date();

  return {
    scenarioCash,
    scenarioMonthlyCosts,
    scenarioMonthlyIncome,
    monthlyGap,
    runwayWeeks,
    runwayDate: runwayWeeks === null ? null : addWeeks(now, runwayWeeks),
    baselineRunwayWeeks,
    weeksChanged:
      runwayWeeks === null || baselineRunwayWeeks === null
        ? null
        : runwayWeeks - baselineRunwayWeeks,
    costsCovered: monthlyGap <= 0,
  };
}
