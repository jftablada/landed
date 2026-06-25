// runwayDisplay.test.ts
// Run with: npx vitest run
//
// Presentation-layer tests. These build ModeResultOk objects directly so
// the display logic is tested in isolation from computeMode's math.

import { describe, it, expect } from 'vitest';
import {
  getRunwayDisplayState,
  formatRunway,
  shouldShowRunwayDate,
  buildRunwayView,
  RUNWAY_COPY,
} from './runwayDisplay';
import { WEEKS_PER_MONTH, type ModeResultOk } from './computeMode';

// Build a ModeResultOk with only the fields the display layer reads.
// daysOfRunway lets us set runway precisely in days.
function result(opts: {
  adjustedCash: number;
  daysOfRunway?: number; // sets baseRunwayWeeks = days/7
  weeksOfRunway?: number;
}): ModeResultOk {
  const baseRunwayWeeks =
    opts.weeksOfRunway ?? (opts.daysOfRunway ?? 0) / 7;
  return {
    blocked: false,
    mode: 'survival', // irrelevant to display layer
    adjustedCash: opts.adjustedCash,
    effectiveBurn: 3000,
    baseRunwayMonths: baseRunwayWeeks / WEEKS_PER_MONTH,
    baseRunwayWeeks,
    runwayDate: '2026-08-03',
    confirmedMonthlyIncome: 0,
    netMonthlyGap: 3000,
    effectiveRunwayWeeks: baseRunwayWeeks,
    suppressSearchPhases: false,
    emergencyPrograms: null,
  };
}

// ─────────────────────────────────────────────────────────────────────
// getRunwayDisplayState
// ─────────────────────────────────────────────────────────────────────
describe('getRunwayDisplayState', () => {
  it('negative adjusted cash → exhausted', () => {
    expect(getRunwayDisplayState(result({ adjustedCash: -320, daysOfRunway: 0 })))
      .toBe('exhausted');
  });

  it('zero adjusted cash → exhausted', () => {
    expect(getRunwayDisplayState(result({ adjustedCash: 0, daysOfRunway: 0 })))
      .toBe('exhausted');
  });

  it('positive cash, under 1 week → critical', () => {
    expect(getRunwayDisplayState(result({ adjustedCash: 200, daysOfRunway: 3 })))
      .toBe('critical');
  });

  it('positive cash, exactly 1 week → normal', () => {
    expect(getRunwayDisplayState(result({ adjustedCash: 1000, daysOfRunway: 7 })))
      .toBe('normal');
  });

  it('positive cash, several weeks → normal', () => {
    expect(getRunwayDisplayState(result({ adjustedCash: 9000, weeksOfRunway: 6 })))
      .toBe('normal');
  });
});

// ─────────────────────────────────────────────────────────────────────
// formatRunway
// ─────────────────────────────────────────────────────────────────────
describe('formatRunway', () => {
  it('exhausted (cash <= 0) returns null — no figure', () => {
    expect(formatRunway(result({ adjustedCash: -1, daysOfRunway: 0 }))).toBeNull();
    expect(formatRunway(result({ adjustedCash: 0, daysOfRunway: 0 }))).toBeNull();
  });

  it('less than 1 day', () => {
    // 0.4 days → floor 0
    expect(formatRunway(result({ adjustedCash: 50, daysOfRunway: 0.4 })))
      .toBe('less than a day');
  });

  it('exactly 1 day', () => {
    expect(formatRunway(result({ adjustedCash: 100, daysOfRunway: 1 })))
      .toBe('about 1 day');
  });

  it('2 to 6 days', () => {
    expect(formatRunway(result({ adjustedCash: 200, daysOfRunway: 2 })))
      .toBe('about 2 days');
    expect(formatRunway(result({ adjustedCash: 200, daysOfRunway: 6 })))
      .toBe('about 6 days');
  });

  it('a fractional day floors down (6.8 days → about 6 days)', () => {
    expect(formatRunway(result({ adjustedCash: 200, daysOfRunway: 6.8 })))
      .toBe('about 6 days');
  });

  it('exactly 1 week → "about 1 week" (singular, no decimal)', () => {
    expect(formatRunway(result({ adjustedCash: 1000, daysOfRunway: 7 })))
      .toBe('about 1 week');
  });

  it('8 days rounds to 1.1 weeks (only exactly 7 days is "about 1 week")', () => {
    expect(formatRunway(result({ adjustedCash: 1000, daysOfRunway: 8 })))
      .toBe('about 1.1 weeks');
  });

  it('9+ days moves further into decimal weeks', () => {
    // 10 days ≈ 1.43 weeks → "about 1.4 weeks"
    expect(formatRunway(result({ adjustedCash: 1000, daysOfRunway: 10 })))
      .toBe('about 1.4 weeks');
  });

  it('several weeks, under 4 → one decimal', () => {
    expect(formatRunway(result({ adjustedCash: 5000, weeksOfRunway: 2.6 })))
      .toBe('about 2.6 weeks');
  });

  it('4+ weeks → whole number', () => {
    expect(formatRunway(result({ adjustedCash: 9000, weeksOfRunway: 5.49 })))
      .toBe('about 5 weeks');
    expect(formatRunway(result({ adjustedCash: 9000, weeksOfRunway: 5.5 })))
      .toBe('about 6 weeks');
  });

  it('never returns a negative or zero-week string', () => {
    const out = formatRunway(result({ adjustedCash: 1, daysOfRunway: 0.1 }));
    expect(out).toBe('less than a day');
    expect(out).not.toContain('0 weeks');
    expect(out).not.toContain('-');
  });
});

// ─────────────────────────────────────────────────────────────────────
// shouldShowRunwayDate — date only in normal
// ─────────────────────────────────────────────────────────────────────
describe('shouldShowRunwayDate', () => {
  it('no date in exhausted', () => {
    expect(shouldShowRunwayDate(result({ adjustedCash: -320, daysOfRunway: 0 })))
      .toBe(false);
  });

  it('no date in critical (under 7 days)', () => {
    expect(shouldShowRunwayDate(result({ adjustedCash: 200, daysOfRunway: 3 })))
      .toBe(false);
  });

  it('date shown in normal', () => {
    expect(shouldShowRunwayDate(result({ adjustedCash: 9000, weeksOfRunway: 6 })))
      .toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// buildRunwayView — assembled output the UI renders
// ─────────────────────────────────────────────────────────────────────
describe('buildRunwayView', () => {
  it('exhausted: no figure, no date, no raw cash surfaced, never negative', () => {
    const v = buildRunwayView(result({ adjustedCash: -320, daysOfRunway: 0 }));
    expect(v.state).toBe('exhausted');
    expect(v.figure).toBeNull();
    expect(v.showDate).toBe(false);
    expect(v.confirmedCash).toBeNull();
    expect(v.essentialBurn).toBeNull();
    expect(v.body).toBe(RUNWAY_COPY.exhausted.body); // no interpolation tokens
    expect(v.body).not.toContain('{figure}');
    expect(v.body).not.toContain('-');
    expect(v.body).not.toContain('$0');
  });

  it('critical: figure interpolated, no date, demote-to-action copy', () => {
    const v = buildRunwayView(result({ adjustedCash: 200, daysOfRunway: 3 }));
    expect(v.state).toBe('critical');
    expect(v.figure).toBe('about 3 days');
    expect(v.showDate).toBe(false);
    expect(v.body).toContain('about 3 days');
    expect(v.body).toContain('stabilizing'); // pivot to action
    expect(v.body).not.toContain('{figure}');
  });

  it('normal: figure + date interpolated, cash/burn surfaced', () => {
    const v = buildRunwayView(
      result({ adjustedCash: 9000, weeksOfRunway: 6 }),
      'August 3',
    );
    expect(v.state).toBe('normal');
    expect(v.figure).toBe('about 6 weeks');
    expect(v.showDate).toBe(true);
    expect(v.body).toBe('about 6 weeks — until around August 3');
    expect(v.confirmedCash).toBe(9000);
    expect(v.essentialBurn).toBe(3000);
  });

  it('normal without a date label leaves the token unresolved only if missing', () => {
    // Caller is expected to pass the label; if absent, {date} remains.
    const v = buildRunwayView(result({ adjustedCash: 9000, weeksOfRunway: 6 }));
    expect(v.showDate).toBe(true);
    expect(v.body).toContain('{date}'); // signals caller forgot the label
  });
});

// ─────────────────────────────────────────────────────────────────────
// Cross-cutting guarantee: exhausted state never leaks a number
// ─────────────────────────────────────────────────────────────────────
describe('exhausted never shows a number', () => {
  for (const cash of [-1000, -320, -1, 0]) {
    it(`adjustedCash=${cash} → null figure, no date`, () => {
      const r = result({ adjustedCash: cash, daysOfRunway: 0 });
      expect(formatRunway(r)).toBeNull();
      expect(shouldShowRunwayDate(r)).toBe(false);
      const v = buildRunwayView(r);
      expect(v.figure).toBeNull();
      expect(v.body).not.toMatch(/\d/); // exhausted copy contains no digits
    });
  }
});
