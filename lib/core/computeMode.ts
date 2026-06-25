// computeMode.ts
// Pure, deterministic mode + runway calculation for Landed.
// CRITICAL: This runs BEFORE any AI call. The AI never computes mode,
// runway, or emergency program names. Those are all resolved here.
//
// ─────────────────────────────────────────────────────────────────────
// UNITS — read this before touching the math.
//
//   confirmed_cash   is a DOLLAR amount        ($)
//   essential_burn   is DOLLARS PER MONTH       ($/month)
//
//   cash / burn      => MONTHS of runway        (dollars ÷ dollars/month)
//   months * 4.345   => WEEKS of runway         (avg weeks per month)
//
// The earlier bug: dividing cash by monthly burn and reading the result
// as WEEKS. It is MONTHS. Always convert months → weeks explicitly via
// WEEKS_PER_MONTH before comparing against the week thresholds below.
// ─────────────────────────────────────────────────────────────────────

export type Mode = 'critical' | 'survival' | 'balanced' | 'strategic';

export type TaxStatus = 'none' | 'has_amount' | 'unsure' | 'on_plan';
export type EIStatus =
  | 'not_applied'
  | 'applied'
  | 'approved'
  | 'receiving'
  | 'not_eligible';
export type EmploymentType = 'employee' | 'sole_proprietor' | 'incorporated';

export interface Intake {
  province: string; // e.g. "ON", "QC", "BC"
  employment_type: EmploymentType;

  confirmed_cash: number; // dollars
  essential_burn: number; // dollars PER MONTH, must be > 0
  debt_minimums: number;

  tax_obligation_status: TaxStatus;
  tax_obligation_amount?: number | null;
  tax_plan_monthly?: number | null;

  ei_status: EIStatus;
  ei_monthly_amount?: number | null;

  pending_invoice_amount?: number | null;
  pending_invoice_confirmed?: boolean;
}

export interface ModeResultBlocked {
  blocked: true;
  reason: 'tax_unsure';
  // No mode/runway is computed when blocked — AI must not be called.
}

export interface ModeResultOk {
  blocked: false;
  mode: Mode;

  // Numbers that DRIVE the mode (confirmed cash only)
  adjustedCash: number;
  effectiveBurn: number; // dollars per month
  baseRunwayMonths: number; // cash / burn   (intermediate, documented)
  baseRunwayWeeks: number; // months * WEEKS_PER_MONTH  (drives thresholds)
  runwayDate: string; // ISO date

  // Display-only numbers (confirmed recurring income included)
  confirmedMonthlyIncome: number;
  netMonthlyGap: number;
  effectiveRunwayWeeks: number; // Infinity allowed if income covers burn

  // Flags consumed by the roadmap renderer, NOT by mode logic
  suppressSearchPhases: boolean;

  // Hardcoded, never AI-generated
  emergencyPrograms: string[] | null; // populated only in critical mode
}

export type ModeResult = ModeResultBlocked | ModeResultOk;

// Average weeks per month (365.25 / 7 / 12). The ONLY months→weeks bridge.
export const WEEKS_PER_MONTH = 4.345;

// Mode thresholds, expressed in WEEKS (Decision 2: keep weeks for UX).
//   Critical:  < 1 week
//   Survival:  1  to 4 weeks   (inclusive of 1 and 4)
//   Balanced:  > 4 to 10 weeks (inclusive of 10)
//   Strategic: > 10 weeks
export const THRESHOLDS = {
  CRITICAL_MAX_WEEKS: 1, // strictly below this = critical
  SURVIVAL_MAX_WEEKS: 4, // <= this (and >= 1) = survival
  BALANCED_MAX_WEEKS: 10, // <= this (and > 4) = balanced
} as const;

// Hardcoded province → emergency program lookup.
// The AI must never generate these. Wrong program name = real harm.
const EMERGENCY_PROGRAMS: Record<string, string> = {
  ON: 'Ontario Works',
  BC: 'BC Employment and Assistance',
  AB: 'Alberta Works',
  QC: 'Aide sociale (Social Assistance Program) and Services Québec',
  MB: 'Employment and Income Assistance (EIA)',
  SK: 'Saskatchewan Income Support (SIS)',
  NS: 'Employment Support and Income Assistance (ESIA)',
  NB: 'Social Development income assistance',
  NL: 'Income Support',
  PE: 'Social Assistance Program',
  NT: 'Income Assistance',
  YT: 'Yukon Social Assistance',
  NU: 'Income Assistance',
};

function resolveEmergencyPrograms(province: string): string[] {
  const universal = '211 (free, confidential, 24/7)';
  const provincial = EMERGENCY_PROGRAMS[province];
  return provincial ? [universal, provincial] : [universal];
}

function addWeeks(from: Date, weeks: number): string {
  // Negative/zero runway clamps to "today" for display purposes.
  const safeWeeks = Math.max(weeks, 0);
  const ms = from.getTime() + safeWeeks * 7 * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * computeMode — single source of truth for mode + runway.
 *
 * @param intake validated intake
 * @param now    injected for deterministic tests (defaults to real now)
 */
export function computeMode(intake: Intake, now: Date = new Date()): ModeResult {
  // ── Step 0: guard rails ──────────────────────────────────────────────
  if (intake.essential_burn <= 0) {
    throw new Error('essential_burn must be > 0');
  }

  // ── Step 1: tax holding check (runs BEFORE anything else) ────────────
  // If we don't know the tax obligation, we cannot compute a trustworthy
  // runway. Return blocked. The caller must NOT invoke the AI.
  if (intake.tax_obligation_status === 'unsure') {
    return { blocked: true, reason: 'tax_unsure' };
  }

  // ── Step 2: adjust cash for an immediate, non-plan tax obligation ────
  let adjustedCash = intake.confirmed_cash;
  if (intake.tax_obligation_status === 'has_amount') {
    adjustedCash -= intake.tax_obligation_amount ?? 0;
  }
  // 'on_plan' does NOT deduct from cash — handled as recurring burn below.
  // 'none' → no adjustment.

  // ── Step 3: effective burn (adds tax payment plan if present) ────────
  let effectiveBurn = intake.essential_burn; // dollars / month
  if (intake.tax_obligation_status === 'on_plan') {
    effectiveBurn += intake.tax_plan_monthly ?? 0;
  }

  // ── Step 4: base runway (CONFIRMED CASH ONLY — drives the mode) ──────
  // Pending EI, unconfirmed invoices, possible gigs NEVER enter here.
  //
  // UNITS (do not skip):
  //   baseRunwayMonths = dollars ÷ (dollars/month) = MONTHS
  //   baseRunwayWeeks  = MONTHS × WEEKS_PER_MONTH   = WEEKS
  // Thresholds below are in WEEKS, so we MUST convert first.
  const baseRunwayMonths = adjustedCash / effectiveBurn;
  const baseRunwayWeeks = baseRunwayMonths * WEEKS_PER_MONTH;

  // ── Step 5: mode assignment by WEEK threshold ────────────────────────
  //   < 1 week        → critical
  //   1 to 4 weeks    → survival
  //   > 4 to 10 weeks → balanced
  //   > 10 weeks      → strategic
  let mode: Mode;
  if (baseRunwayWeeks < THRESHOLDS.CRITICAL_MAX_WEEKS) {
    mode = 'critical';
  } else if (baseRunwayWeeks <= THRESHOLDS.SURVIVAL_MAX_WEEKS) {
    mode = 'survival';
  } else if (baseRunwayWeeks <= THRESHOLDS.BALANCED_MAX_WEEKS) {
    mode = 'balanced';
  } else {
    mode = 'strategic';
  }

  // ── Step 6: display-only effective runway (confirmed income only) ────
  // Only EI that is actively being RECEIVED counts as confirmed income.
  // 'approved' is imminent but not yet in the bank → upside, not here.
  let confirmedMonthlyIncome = 0;
  if (intake.ei_status === 'receiving') {
    confirmedMonthlyIncome += intake.ei_monthly_amount ?? 0;
  }

  const netMonthlyGap = effectiveBurn - confirmedMonthlyIncome;
  const effectiveRunwayWeeks =
    netMonthlyGap > 0
      ? (adjustedCash / netMonthlyGap) * WEEKS_PER_MONTH
      : Infinity;

  // ── Step 7: contractor unconfirmed-invoice flag ──────────────────────
  // If a contractor is leaning on an unconfirmed invoice AND their
  // confirmed-cash runway is tight (critical/survival), suppress search
  // phases in the roadmap until invoice timing is confirmed.
  // This is a RENDER flag — it does not change the mode.
  const hasUnconfirmedInvoice =
    !!intake.pending_invoice_amount &&
    intake.pending_invoice_confirmed === false;
  const suppressSearchPhases =
    hasUnconfirmedInvoice && (mode === 'critical' || mode === 'survival');

  // ── Step 8: emergency programs (hardcoded, critical only) ────────────
  const emergencyPrograms =
    mode === 'critical' ? resolveEmergencyPrograms(intake.province) : null;

  return {
    blocked: false,
    mode,
    adjustedCash,
    effectiveBurn,
    baseRunwayMonths,
    baseRunwayWeeks,
    runwayDate: addWeeks(now, baseRunwayWeeks),
    confirmedMonthlyIncome,
    netMonthlyGap,
    effectiveRunwayWeeks,
    suppressSearchPhases,
    emergencyPrograms,
  };
}
