import { isCanadianProvinceCode } from '../core/canadianProvinces';
import { validateRunwayInputs } from '../core/validateIntakeSnapshot';

export type FinancialDetails = {
  province: string;
  confirmedCash: string;
  essentialBurn: string;
  debtMinimums: string;
  eiStatus: string;
  eiAmount: string;
};
export type SearchActivity = {
  applicationsSubmitted: string;
  employerResponses: string;
  interviewsSecured: string;
  offersReceived: string;
  biggestBarrier: string;
};

export const ACTIVITY_FIELDS = [
  ['applicationsSubmitted', 'Applications', 'applications submitted'],
  ['employerResponses', 'Responses', 'employer responses'],
  ['interviewsSecured', 'Interviews', 'interviews secured'],
  ['offersReceived', 'Offers', 'offers received'],
] as const;

export const EI_LABELS: Record<string, string> = {
  not_applied: 'Haven’t applied yet',
  applied: 'Applied, waiting to hear',
  approved: 'Approved, payments haven’t started',
  receiving: 'Receiving payments now',
  not_eligible: 'I don’t qualify',
};

export function validateSearchActivity(
  activity: SearchActivity,
): string | null {
  for (const [key, , label] of ACTIVITY_FIELDS) {
    const value = activity[key];
    if (value === '' || !Number.isInteger(Number(value)) || Number(value) < 0)
      return `Enter ${label} as a whole number.`;
  }
  return activity.biggestBarrier ? null : 'Choose your biggest barrier.';
}

export function validateFinancialDetails(
  details: FinancialDetails,
): string | null {
  if (!isCanadianProvinceCode(details.province))
    return 'Choose your province or territory.';
  if (details.confirmedCash === '' || isNaN(Number(details.confirmedCash)))
    return 'Enter your confirmed cash.';
  if (details.essentialBurn === '' || Number(details.essentialBurn) <= 0)
    return 'Enter your monthly essential costs.';
  const error = validateRunwayInputs(
    Number(details.confirmedCash),
    Number(details.essentialBurn),
    Number(details.debtMinimums),
  );
  if (error) return error;
  if (
    (details.eiStatus === 'approved' || details.eiStatus === 'receiving') &&
    (details.eiAmount === '' || isNaN(Number(details.eiAmount)))
  )
    return 'Enter your monthly EI amount.';
  return null;
}

export function activityPeriod(iso: string | null): string {
  if (!iso || !Number.isFinite(new Date(iso).getTime()))
    return 'Since your latest plan update';
  return `Since ${new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso))}`;
}
