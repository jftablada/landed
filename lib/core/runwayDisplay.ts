// runwayDisplay.ts
// PRESENTATION LAYER ONLY.
//
// These helpers decide what the human SEES. They read the output of
// computeMode and never change it. No math, no thresholds, no mode
// assignment lives here — those belong to computeMode.ts and stay locked.
//
// Core design rule:
//   In Critical Mode the runway number is NOT the message — the referral
//   is. So these helpers demote (or remove) the figure and route the eye
//   to the action. Everywhere else, the figure leads.

import type { ModeResultOk } from './computeMode';

// ─────────────────────────────────────────────────────────────────────
// Display states (derived, presentation-only)
//
//   exhausted → adjustedCash <= 0
//               cash is already committed to obligations; show NO figure,
//               NO date, NO negative number. Status line + referral.
//
//   critical  → adjustedCash > 0 AND baseRunwayWeeks < 1
//               a few days left; show a small "about X days" figure,
//               demoted beneath the action. No date.
//
//   normal    → baseRunwayWeeks >= 1
//               figure leads, shown with its calendar date.
// ─────────────────────────────────────────────────────────────────────
export type RunwayDisplayState = 'exhausted' | 'critical' | 'normal';

export function getRunwayDisplayState(r: ModeResultOk): RunwayDisplayState {
  if (r.adjustedCash <= 0) return 'exhausted';
  if (r.baseRunwayWeeks < 1) return 'critical';
  return 'normal';
}

// ─────────────────────────────────────────────────────────────────────
// formatRunway — the human-readable runway figure.
//
//   exhausted        → null  (caller renders the exhausted copy, no figure)
//   < 1 day          → "less than a day"
//   exactly 1 day    → "about 1 day"
//   2–6 days         → "about X days"
//   >= 7 days        → "about X weeks"
//
// Days are floored from baseRunwayWeeks * 7. We never show "0 weeks",
// raw decimals of a week below 4 weeks beyond one place, or any negative.
// ─────────────────────────────────────────────────────────────────────
export function formatRunway(r: ModeResultOk): string | null {
  // Exhausted: no figure at all. The exhausted copy carries the meaning.
  if (r.adjustedCash <= 0) return null;

  const days = Math.floor(r.baseRunwayWeeks * 7);

  if (days < 1) return 'less than a day';
  if (days === 1) return 'about 1 day';
  if (days < 7) return `about ${days} days`;

  // Exactly 1 week (7 days = 1.0 weeks) reads better as "about 1 week"
  // than "about 1.0 weeks". Singular, no decimal. 8 days is 1.1 weeks and
  // correctly falls through to the decimal path below.
  const weeks = r.baseRunwayWeeks;
  if (weeks < 4 && Number(weeks.toFixed(1)) === 1.0) return 'about 1 week';

  // 7+ days → weeks. One decimal under 4 weeks, whole numbers at/above 4.
  const rounded = weeks < 4 ? weeks.toFixed(1) : Math.round(weeks).toString();
  return `about ${rounded} weeks`;
}

// ─────────────────────────────────────────────────────────────────────
// shouldShowRunwayDate — calendar date appears only in the normal state.
//
// In Critical (exhausted or critical), a date either reads as a
// countdown-to-disaster or points at today/the past. Suppress it.
// ─────────────────────────────────────────────────────────────────────
export function shouldShowRunwayDate(r: ModeResultOk): boolean {
  return getRunwayDisplayState(r) === 'normal';
}

// ─────────────────────────────────────────────────────────────────────
// User-facing copy constants.
//
// {figure} is replaced with formatRunway() output where present.
// Critical copy demotes the number and pivots to the action.
// Exhausted copy never references a number, a zero, or a negative.
// ─────────────────────────────────────────────────────────────────────
export const RUNWAY_COPY = {
  exhausted: {
    heading: 'Where things stand',
    body:
      "Right now, your confirmed cash is already committed to what you owe. " +
      "That doesn't mean you're out of options — it means the next step " +
      "isn't a job plan, it's getting the right support in place today.",
    showFigure: false,
    showDate: false,
  },

  critical: {
    heading: 'Where things stand',
    // {figure} = e.g. "about 3 days"
    body:
      "You have {figure} of confirmed cash. That's not much time, so your " +
      "plan starts with stabilizing — not searching.",
    showFigure: true,
    showDate: false,
  },

  normal: {
    heading: 'Your runway',
    // Rendered as a labelled block; {figure} = e.g. "about 6 weeks",
    // {date} = e.g. "August 3". Date only shown when shouldShowRunwayDate.
    body: '{figure} — until around {date}',
    showFigure: true,
    showDate: true,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────
// buildRunwayView — convenience assembler the UI can render directly.
// Returns everything the runway block needs, already resolved.
// ─────────────────────────────────────────────────────────────────────
export interface RunwayView {
  state: RunwayDisplayState;
  heading: string;
  body: string; // figure/date already interpolated
  figure: string | null; // null in exhausted
  showDate: boolean;
  // Raw confirmed numbers for the normal block's $ line.
  // Intentionally omitted (not surfaced) in exhausted/critical.
  confirmedCash: number | null;
  essentialBurn: number | null;
}

export function buildRunwayView(
  r: ModeResultOk,
  runwayDateLabel?: string, // e.g. "August 3" — caller formats the date string
): RunwayView {
  const state = getRunwayDisplayState(r);
  const figure = formatRunway(r);
  const copy = RUNWAY_COPY[state];

  let body = copy.body;
  if (figure) body = body.replace('{figure}', figure);
  if (copy.showDate && runwayDateLabel) {
    body = body.replace('{date}', runwayDateLabel);
  }

  const showDate = copy.showDate && state === 'normal';

  return {
    state,
    heading: copy.heading,
    body,
    figure,
    showDate,
    // Never surface raw cash/burn $ figures outside the normal state.
    confirmedCash: state === 'normal' ? r.adjustedCash : null,
    essentialBurn: state === 'normal' ? r.effectiveBurn : null,
  };
}
