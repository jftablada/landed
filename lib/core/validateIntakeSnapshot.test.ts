import { describe, expect, it } from 'vitest';

import {
  validateIntakeSnapshot,
  validateSituationType,
} from './validateIntakeSnapshot';

const valid = {
  province: 'ON',
  employment_type: 'employee',
  housing_type: 'rent',
  dependents_count: 0,
  confirmed_cash: 8000,
  essential_burn: 3000,
  debt_minimums: 500,
  tax_obligation_status: 'none',
  tax_obligation_amount: null,
  tax_plan_monthly: null,
  ei_status: 'not_applied',
  ei_monthly_amount: null,
  pending_invoice_amount: null,
  pending_invoice_confirmed: false,
};

describe('intake snapshot validation', () => {
  it('accepts a complete supported snapshot', () => {
    expect(validateIntakeSnapshot(valid)).toBeNull();
    expect(validateSituationType('laid_off')).toBeNull();
  });

  it.each([
    [{ province: 'XX' }, 'province'],
    [{ employment_type: 'unknown' }, 'work type'],
    [{ housing_type: 'unknown' }, 'rent or own'],
    [{ dependents_count: -1 }, 'People depending'],
    [{ dependents_count: 1.5 }, 'People depending'],
    [{ confirmed_cash: -100 }, 'Cash on hand'],
    [{ confirmed_cash: '8000' }, 'Cash on hand'],
    [{ confirmed_cash: Infinity }, 'Cash on hand'],
    [{ essential_burn: 0 }, 'Monthly essential costs'],
    [{ essential_burn: Number.NaN }, 'Monthly essential costs'],
    [{ confirmed_cash: 1_000_000, essential_burn: 1 }, 'more than 100 years'],
    [{ debt_minimums: -50 }, 'Monthly debt minimums'],
    [{ tax_obligation_status: 'unknown' }, 'tax status'],
    [{ tax_obligation_status: 'has_amount' }, 'tax you owe'],
    [{ tax_obligation_status: 'on_plan' }, 'monthly tax payment'],
    [{ tax_obligation_amount: -1 }, 'Tax owed'],
    [{ tax_plan_monthly: -1 }, 'Monthly tax payment'],
    [{ ei_status: 'unknown' }, 'EI status'],
    [{ ei_status: 'receiving' }, 'monthly EI amount'],
    [{ ei_monthly_amount: -1 }, 'Monthly EI amount'],
    [{ pending_invoice_amount: -1 }, 'Pending invoice amount'],
    [{ pending_invoice_confirmed: 'yes' }, 'Pending invoice confirmation'],
  ] as const)('rejects invalid %j', (change, message) => {
    expect(validateIntakeSnapshot({ ...valid, ...change })).toContain(message);
  });

  it('rejects an unsupported situation', () => {
    expect(validateSituationType('unknown')).toContain('situation');
  });
});
