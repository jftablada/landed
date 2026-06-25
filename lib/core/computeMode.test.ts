// computeMode.test.ts
// Run with: npx vitest run
//
// Locks down the highest-risk logic in Landed: mode + runway.
//
// THRESHOLDS (in weeks):
//   Critical:  < 1 week
//   Survival:  1 to 4 weeks    (inclusive both ends)
//   Balanced:  > 4 to 10 weeks (inclusive of 10)
//   Strategic: > 10 weeks
//
// UNITS REMINDER: cash / monthly_burn = MONTHS. Convert to WEEKS via
// WEEKS_PER_MONTH before comparing to thresholds. The earlier bug read
// months as weeks; these tests assert the corrected arithmetic.
//
// A fixed `now` is injected everywhere so runwayDate is deterministic.

import { describe, it, expect } from 'vitest';
import {
  computeMode,
  WEEKS_PER_MONTH,
  type Intake,
  type ModeResultOk,
} from './computeMode';

const NOW = new Date('2026-06-16T00:00:00.000Z');

function makeIntake(overrides: Partial<Intake> = {}): Intake {
  return {
    province: 'ON',
    employment_type: 'employee',
    confirmed_cash: 0,
    essential_burn: 1, // never 0 (guard)
    debt_minimums: 0,
    tax_obligation_status: 'none',
    tax_obligation_amount: null,
    tax_plan_monthly: null,
    ei_status: 'not_applied',
    ei_monthly_amount: null,
    pending_invoice_amount: null,
    pending_invoice_confirmed: false,
    ...overrides,
  };
}

function ok(r: ReturnType<typeof computeMode>): ModeResultOk {
  if (r.blocked) throw new Error('expected non-blocked result');
  return r;
}

// Convenience: cash needed to hit an exact number of WEEKS at a given burn.
//   weeks = (cash / burn) * WEEKS_PER_MONTH  →  cash = weeks/WEEKS_PER_MONTH * burn
function cashForWeeks(weeks: number, burn: number): number {
  return (weeks / WEEKS_PER_MONTH) * burn;
}

describe('computeMode — guard rails', () => {
  it('throws if essential_burn <= 0', () => {
    expect(() => computeMode(makeIntake({ essential_burn: 0 }), NOW)).toThrow();
  });
});

describe('units: cash/burn is MONTHS, converted to WEEKS', () => {
  it('exposes both months and weeks, weeks = months * WEEKS_PER_MONTH', () => {
    const r = ok(
      computeMode(makeIntake({ confirmed_cash: 6000, essential_burn: 3000 }), NOW),
    );
    expect(r.baseRunwayMonths).toBeCloseTo(2.0, 5); // 6000/3000 = 2 months
    expect(r.baseRunwayWeeks).toBeCloseTo(2 * WEEKS_PER_MONTH, 5); // ≈8.69 wk
  });
});

// ─────────────────────────────────────────────────────────────────────
// SCENARIO 1 — Critical: ~2 days of cash (now correctly Critical)
// ─────────────────────────────────────────────────────────────────────
describe('Scenario 1 — Critical (sub-1-week runway)', () => {
  const intake = makeIntake({
    province: 'ON',
    confirmed_cash: 180,
    essential_burn: 3200,
    debt_minimums: 680,
    ei_status: 'applied', // pending → does NOT count
  });

  it('assigns critical mode (≈0.24 weeks < 1)', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.baseRunwayWeeks).toBeLessThan(1);
    expect(r.mode).toBe('critical');
  });

  it('surfaces hardcoded Ontario emergency programs', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.emergencyPrograms).toEqual([
      '211 (free, confidential, 24/7)',
      'Ontario Works',
    ]);
  });

  it('pending EI is not counted as income', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.confirmedMonthlyIncome).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// SCENARIO 2 — Balanced: laid off, EI pending  ($3,800 / $3,100)
// (Originally mislabeled Survival. ≈5.33 weeks = Balanced.)
// ─────────────────────────────────────────────────────────────────────
describe('Scenario 2 — Balanced, EI pending', () => {
  const intake = makeIntake({
    province: 'BC',
    confirmed_cash: 3800,
    essential_burn: 3100,
    debt_minimums: 290,
    ei_status: 'applied',
  });

  it('assigns balanced mode (≈5.33 weeks)', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.baseRunwayWeeks).toBeCloseTo(5.33, 1);
    expect(r.mode).toBe('balanced');
  });

  it('pending EI excluded from confirmed income', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.confirmedMonthlyIncome).toBe(0);
    expect(r.netMonthlyGap).toBe(3100);
  });
});

// ─────────────────────────────────────────────────────────────────────
// SCENARIO 3 — Contractor, unconfirmed invoice, low cash  ($1,200/$2,900)
// ≈1.8 weeks = Survival. Search phases suppressed.
// ─────────────────────────────────────────────────────────────────────
describe('Scenario 3 — Survival contractor, unconfirmed invoice', () => {
  const intake = makeIntake({
    province: 'AB',
    employment_type: 'incorporated',
    confirmed_cash: 1200,
    essential_burn: 2900,
    pending_invoice_amount: 6800,
    pending_invoice_confirmed: false,
    ei_status: 'not_eligible',
  });

  it('unconfirmed invoice excluded; survival mode (≈1.8 weeks)', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.baseRunwayWeeks).toBeCloseTo(1.8, 1);
    expect(r.mode).toBe('survival');
  });

  it('suppresses search phases (survival + unconfirmed invoice)', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.suppressSearchPhases).toBe(true);
  });

  it('does NOT suppress once invoice confirmed', () => {
    const r = ok(
      computeMode({ ...intake, pending_invoice_confirmed: true }, NOW),
    );
    expect(r.suppressSearchPhases).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────
// SCENARIO 4 — Strategic: $11,000 / $4,200, EI approved (not receiving)
// (Originally mislabeled Balanced. ≈11.38 weeks = Strategic.)
// ─────────────────────────────────────────────────────────────────────
describe('Scenario 4 — Strategic, EI approved but not receiving', () => {
  const intake = makeIntake({
    province: 'ON',
    confirmed_cash: 11000,
    essential_burn: 4200,
    debt_minimums: 520,
    ei_status: 'approved',
    ei_monthly_amount: 2100,
  });

  it('assigns strategic mode (≈11.38 weeks)', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.baseRunwayWeeks).toBeCloseTo(11.38, 1);
    expect(r.mode).toBe('strategic');
  });

  it('approved-but-not-receiving EI is NOT counted as income', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.confirmedMonthlyIncome).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// SCENARIO 5 — High cash / high burn  ($48,000 / $14,200)
// ≈14.69 weeks = Strategic. The "trap" is emotional, not mathematical.
// ─────────────────────────────────────────────────────────────────────
describe('Scenario 5 — High cash, high burn (≈14.69 weeks)', () => {
  const intake = makeIntake({
    province: 'BC',
    confirmed_cash: 48000,
    essential_burn: 14200,
    ei_status: 'not_applied',
  });

  it('runway is genuinely strategic; number is real', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.baseRunwayWeeks).toBeCloseTo(14.69, 1);
    expect(r.mode).toBe('strategic');
  });
});

// ─────────────────────────────────────────────────────────────────────
// SCENARIO 6 — Strategic: ghosted, strong runway, EI receiving
// ─────────────────────────────────────────────────────────────────────
describe('Scenario 6 — Strategic, EI receiving', () => {
  const intake = makeIntake({
    province: 'ON',
    confirmed_cash: 31000,
    essential_burn: 3800,
    ei_status: 'receiving',
    ei_monthly_amount: 1980,
  });

  it('assigns strategic mode', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.mode).toBe('strategic');
  });

  it('EI receiving reduces net gap (display only, mode unaffected)', () => {
    const r = ok(computeMode(intake, NOW));
    expect(r.confirmedMonthlyIncome).toBe(1980);
    expect(r.netMonthlyGap).toBe(1820);
    expect(r.effectiveRunwayWeeks).toBeGreaterThan(r.baseRunwayWeeks);
  });

  it('income covering burn yields Infinity effective runway', () => {
    const r = ok(
      computeMode(
        makeIntake({
          confirmed_cash: 5000,
          essential_burn: 1900,
          ei_status: 'receiving',
          ei_monthly_amount: 2000,
        }),
        NOW,
      ),
    );
    expect(r.netMonthlyGap).toBeLessThanOrEqual(0);
    expect(r.effectiveRunwayWeeks).toBe(Infinity);
  });
});

// ─────────────────────────────────────────────────────────────────────
// SCENARIO 7 — Hidden tax obligation: "unsure" → blocked, no AI
// ─────────────────────────────────────────────────────────────────────
describe('Scenario 7 — Tax unsure → blocked', () => {
  const intake = makeIntake({
    province: 'QC',
    employment_type: 'incorporated',
    confirmed_cash: 22000,
    essential_burn: 3100,
    tax_obligation_status: 'unsure',
  });

  it('returns blocked, does not compute mode', () => {
    const r = computeMode(intake, NOW);
    expect(r.blocked).toBe(true);
    if (r.blocked) expect(r.reason).toBe('tax_unsure');
  });

  it('blocked result has no mode/runway fields (AI must not run)', () => {
    const r = computeMode(intake, NOW);
    expect(r).not.toHaveProperty('mode');
    expect(r).not.toHaveProperty('baseRunwayWeeks');
  });
});

// ─────────────────────────────────────────────────────────────────────
// TAX TREATMENT — has_amount vs on_plan
// ─────────────────────────────────────────────────────────────────────
describe('Tax treatment rules', () => {
  it('has_amount deducts from cash', () => {
    const r = ok(
      computeMode(
        makeIntake({
          confirmed_cash: 22000,
          essential_burn: 3100,
          tax_obligation_status: 'has_amount',
          tax_obligation_amount: 15000,
        }),
        NOW,
      ),
    );
    expect(r.adjustedCash).toBe(7000);
    // 7000/3100 = 2.258 months → ≈9.81 weeks → balanced
    expect(r.baseRunwayWeeks).toBeCloseTo(9.81, 1);
    expect(r.mode).toBe('balanced');
  });

  it('has_amount can push adjusted cash negative → critical', () => {
    const r = ok(
      computeMode(
        makeIntake({
          confirmed_cash: 180,
          essential_burn: 3200,
          tax_obligation_status: 'has_amount',
          tax_obligation_amount: 500,
        }),
        NOW,
      ),
    );
    expect(r.adjustedCash).toBe(-320);
    expect(r.baseRunwayWeeks).toBeLessThan(1);
    expect(r.mode).toBe('critical');
  });

  it('on_plan adds monthly payment to burn, not a cash deduction', () => {
    const r = ok(
      computeMode(
        makeIntake({
          confirmed_cash: 22000,
          essential_burn: 3100,
          tax_obligation_status: 'on_plan',
          tax_plan_monthly: 600,
        }),
        NOW,
      ),
    );
    expect(r.adjustedCash).toBe(22000);
    expect(r.effectiveBurn).toBe(3700);
  });

  it('same total debt → different modes: lump sum vs plan', () => {
    const base = { confirmed_cash: 10000, essential_burn: 3000 };
    const lump = ok(
      computeMode(
        makeIntake({
          ...base,
          tax_obligation_status: 'has_amount',
          tax_obligation_amount: 6000,
        }),
        NOW,
      ),
    );
    const plan = ok(
      computeMode(
        makeIntake({
          ...base,
          tax_obligation_status: 'on_plan',
          tax_plan_monthly: 500,
        }),
        NOW,
      ),
    );
    // Lump: 4000/3000 = 1.33 mo → ≈5.79 wk → balanced
    // Plan: 10000/3500 = 2.86 mo → ≈12.41 wk → strategic
    expect(lump.mode).toBe('balanced');
    expect(plan.mode).toBe('strategic');
  });
});

// ─────────────────────────────────────────────────────────────────────
// QUEBEC — emergency program differs and references Services Québec
// ─────────────────────────────────────────────────────────────────────
describe('Quebec handling', () => {
  it('critical QC user gets Quebec-specific emergency program', () => {
    const r = ok(
      computeMode(
        makeIntake({ province: 'QC', confirmed_cash: 0, essential_burn: 2000 }),
        NOW,
      ),
    );
    expect(r.mode).toBe('critical');
    expect(r.emergencyPrograms?.[1]).toContain('Services Québec');
  });
});

// ─────────────────────────────────────────────────────────────────────
// NO-AI GUARANTEE — structural assertions
// ─────────────────────────────────────────────────────────────────────
describe('No AI involvement in mode assignment', () => {
  it('is fully deterministic across repeated calls', () => {
    const intake = makeIntake({ confirmed_cash: 8000, essential_burn: 2500 });
    expect(ok(computeMode(intake, NOW))).toEqual(ok(computeMode(intake, NOW)));
  });

  it('unknown province does NOT fabricate a program — only 211', () => {
    const r = ok(
      computeMode(
        makeIntake({ province: 'ZZ', confirmed_cash: 0, essential_burn: 1000 }),
        NOW,
      ),
    );
    expect(r.emergencyPrograms).toEqual(['211 (free, confidential, 24/7)']);
  });
});

// ─────────────────────────────────────────────────────────────────────
// THRESHOLD BOUNDARIES — lock the exact edges at 1, 4, 10 weeks
// ─────────────────────────────────────────────────────────────────────
describe('Threshold boundaries', () => {
  const BURN = 1000;

  it('just below 1 week → critical', () => {
    const cash = cashForWeeks(0.99, BURN);
    const r = ok(computeMode(makeIntake({ confirmed_cash: cash, essential_burn: BURN }), NOW));
    expect(r.baseRunwayWeeks).toBeCloseTo(0.99, 5);
    expect(r.mode).toBe('critical');
  });

  it('exactly 1 week → survival (1 is inclusive)', () => {
    const cash = cashForWeeks(1, BURN);
    const r = ok(computeMode(makeIntake({ confirmed_cash: cash, essential_burn: BURN }), NOW));
    expect(r.baseRunwayWeeks).toBeCloseTo(1, 5);
    expect(r.mode).toBe('survival');
  });

  it('exactly 4 weeks → survival (4 is inclusive)', () => {
    const cash = cashForWeeks(4, BURN);
    const r = ok(computeMode(makeIntake({ confirmed_cash: cash, essential_burn: BURN }), NOW));
    expect(r.baseRunwayWeeks).toBeCloseTo(4, 5);
    expect(r.mode).toBe('survival');
  });

  it('just above 4 weeks → balanced', () => {
    const cash = cashForWeeks(4.01, BURN);
    const r = ok(computeMode(makeIntake({ confirmed_cash: cash, essential_burn: BURN }), NOW));
    expect(r.mode).toBe('balanced');
  });

  it('exactly 10 weeks → balanced (10 is inclusive)', () => {
    const cash = cashForWeeks(10, BURN);
    const r = ok(computeMode(makeIntake({ confirmed_cash: cash, essential_burn: BURN }), NOW));
    expect(r.baseRunwayWeeks).toBeCloseTo(10, 5);
    expect(r.mode).toBe('balanced');
  });

  it('just above 10 weeks → strategic', () => {
    const cash = cashForWeeks(10.01, BURN);
    const r = ok(computeMode(makeIntake({ confirmed_cash: cash, essential_burn: BURN }), NOW));
    expect(r.mode).toBe('strategic');
  });

  it('exactly 0 cash → critical', () => {
    const r = ok(computeMode(makeIntake({ confirmed_cash: 0, essential_burn: BURN }), NOW));
    expect(r.baseRunwayWeeks).toBe(0);
    expect(r.mode).toBe('critical');
  });
});
