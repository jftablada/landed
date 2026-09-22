import { isCanadianProvinceCode } from './canadianProvinces';

const SITUATION_TYPES = new Set([
  'laid_off',
  'non_renewal',
  'contract_ending',
  'pivot',
]);
const EMPLOYMENT_TYPES = new Set([
  'employee',
  'sole_proprietor',
  'incorporated',
]);
const HOUSING_TYPES = new Set(['rent', 'own']);
const TAX_STATUSES = new Set(['none', 'has_amount', 'on_plan', 'unsure']);
const EI_STATUSES = new Set([
  'not_applied',
  'applied',
  'approved',
  'receiving',
  'not_eligible',
]);

const MAX_DOLLARS = 1_000_000_000;

function validMoney(value: unknown, positive = false): boolean {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    (positive ? value > 0 : value >= 0) &&
    value <= MAX_DOLLARS
  );
}

export function validateSituationType(value: unknown): string | null {
  return typeof value === 'string' && SITUATION_TYPES.has(value)
    ? null
    : 'Choose a supported situation.';
}

export function validateRunwayInputs(
  confirmedCash: unknown,
  essentialBurn: unknown,
  debtMinimums: unknown,
): string | null {
  if (!validMoney(confirmedCash)) {
    return 'Cash on hand must be a number from $0 to $1 billion.';
  }
  if (!validMoney(essentialBurn, true)) {
    return 'Monthly essential costs must be greater than $0 and no more than $1 billion.';
  }
  if ((confirmedCash as number) / (essentialBurn as number) > 1_200) {
    return 'Your cash and monthly essential costs imply more than 100 years of runway. Please check those amounts.';
  }
  if (!validMoney(debtMinimums)) {
    return 'Monthly debt minimums must be a number from $0 to $1 billion.';
  }
  return null;
}

export function validateIntakeSnapshot(
  intake: Record<string, unknown>,
): string | null {
  if (!isCanadianProvinceCode(intake.province)) {
    return 'Choose a supported Canadian province or territory.';
  }
  if (
    typeof intake.employment_type !== 'string' ||
    !EMPLOYMENT_TYPES.has(intake.employment_type)
  ) {
    return 'Choose a supported work type.';
  }
  if (
    typeof intake.housing_type !== 'string' ||
    !HOUSING_TYPES.has(intake.housing_type)
  ) {
    return 'Choose whether you rent or own.';
  }
  if (
    typeof intake.dependents_count !== 'number' ||
    !Number.isInteger(intake.dependents_count) ||
    intake.dependents_count < 0 ||
    intake.dependents_count > 100
  ) {
    return 'People depending on your income must be a whole number from 0 to 100.';
  }
  const runwayError = validateRunwayInputs(
    intake.confirmed_cash,
    intake.essential_burn,
    intake.debt_minimums,
  );
  if (runwayError) return runwayError;
  if (
    typeof intake.tax_obligation_status !== 'string' ||
    !TAX_STATUSES.has(intake.tax_obligation_status)
  ) {
    return 'Choose a supported tax status.';
  }
  if (
    intake.tax_obligation_status === 'has_amount' &&
    intake.tax_obligation_amount == null
  ) {
    return 'Enter roughly how much tax you owe.';
  }
  if (
    intake.tax_obligation_status === 'on_plan' &&
    intake.tax_plan_monthly == null
  ) {
    return 'Enter your monthly tax payment.';
  }
  if (
    intake.tax_obligation_amount != null &&
    !validMoney(intake.tax_obligation_amount)
  ) {
    return 'Tax owed must be a number from $0 to $1 billion.';
  }
  if (
    intake.tax_plan_monthly != null &&
    !validMoney(intake.tax_plan_monthly)
  ) {
    return 'Monthly tax payment must be a number from $0 to $1 billion.';
  }
  if (
    typeof intake.ei_status !== 'string' ||
    !EI_STATUSES.has(intake.ei_status)
  ) {
    return 'Choose a supported EI status.';
  }
  if (
    (intake.ei_status === 'approved' || intake.ei_status === 'receiving') &&
    intake.ei_monthly_amount == null
  ) {
    return 'Enter the monthly EI amount.';
  }
  if (
    intake.ei_monthly_amount != null &&
    !validMoney(intake.ei_monthly_amount)
  ) {
    return 'Monthly EI amount must be a number from $0 to $1 billion.';
  }
  if (
    intake.pending_invoice_amount != null &&
    !validMoney(intake.pending_invoice_amount)
  ) {
    return 'Pending invoice amount must be a number from $0 to $1 billion.';
  }
  if (typeof intake.pending_invoice_confirmed !== 'boolean') {
    return 'Pending invoice confirmation must be true or false.';
  }

  return null;
}
