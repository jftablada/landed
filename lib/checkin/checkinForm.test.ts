import { describe, expect, it } from 'vitest';
import {
  activityPeriod,
  validateFinancialDetails,
  validateSearchActivity,
  type FinancialDetails,
  type SearchActivity,
} from './checkinForm';

const details: FinancialDetails = {
  province: 'ON',
  confirmedCash: '8000',
  essentialBurn: '3000',
  debtMinimums: '500',
  eiStatus: 'not_applied',
  eiAmount: '',
};
const activity: SearchActivity = {
  applicationsSubmitted: '0',
  employerResponses: '0',
  interviewsSecured: '0',
  offersReceived: '0',
  biggestBarrier: 'Motivation/energy',
};

describe('guided check-in validation', () => {
  it('accepts explicitly entered zero activity and unchanged financial details', () => {
    expect(validateSearchActivity(activity)).toBeNull();
    expect(validateFinancialDetails(details)).toBeNull();
  });
  it.each([
    'applicationsSubmitted',
    'employerResponses',
    'interviewsSecured',
    'offersReceived',
  ] as const)('requires a whole nonnegative count for %s', (key) => {
    for (const value of ['', '-1', '1.5', 'NaN', 'Infinity'])
      expect(
        validateSearchActivity({ ...activity, [key]: value }),
      ).not.toBeNull();
    expect(validateSearchActivity({ ...activity, [key]: '18' })).toBeNull();
  });
  it('requires an explicit barrier selection', () =>
    expect(validateSearchActivity({ ...activity, biggestBarrier: '' })).toBe(
      'Choose your biggest barrier.',
    ));
  it.each([
    { province: '' },
    { province: 'XX' },
    { confirmedCash: '' },
    { confirmedCash: '-1' },
    { essentialBurn: '0' },
    { essentialBurn: 'Infinity' },
    { debtMinimums: '-1' },
    { eiStatus: 'approved', eiAmount: '' },
    { eiStatus: 'receiving', eiAmount: '' },
  ])('keeps the existing financial validation for %j', (change) =>
    expect(validateFinancialDetails({ ...details, ...change })).not.toBeNull(),
  );
  it('does not require an EI amount for inactive EI status', () =>
    expect(validateFinancialDetails(details)).toBeNull());
  it('requires financial review without requiring a financial change', () =>
    expect(validateFinancialDetails({ ...details })).toBeNull());
  it('uses the latest snapshot date and safely falls back if unavailable', () => {
    expect(activityPeriod('2026-10-20T12:00:00Z')).toContain('October');
    expect(activityPeriod('2026-10-20T12:00:00Z')).toContain('2026');
    expect(activityPeriod(null)).toBe('Since your latest plan update');
    expect(activityPeriod('not a date')).toBe('Since your latest plan update');
  });
});
