import { describe, expect, it } from 'vitest';
import {
  buildAdaptivePayload,
  type AdaptiveRuleInput,
} from './buildAdaptivePayload';

function input(overrides: Partial<AdaptiveRuleInput> = {}): AdaptiveRuleInput {
  return {
    applicationsSubmitted: 20,
    employerResponses: 2,
    interviewsSecured: 0,
    biggestBarrier: 'Something else',
    elapsedDays: 14,
    previousMode: 'balanced',
    currentMode: 'balanced',
    ...overrides,
  };
}

describe('buildAdaptivePayload', () => {
  it('returns null when the activity report is incomplete', () => {
    expect(buildAdaptivePayload(input({ employerResponses: null }))).toBeNull();
  });

  it('prioritizes financial deterioration over every activity signal', () => {
    const result = buildAdaptivePayload(
      input({
        interviewsSecured: 4,
        biggestBarrier: 'Motivation/energy',
        previousMode: 'strategic',
        currentMode: 'survival',
      }),
    );

    expect(result?.rule_fired).toBe('financial_deterioration');
  });

  it('fires interviews_occurring at three interviews', () => {
    const result = buildAdaptivePayload(input({ interviewsSecured: 3 }));

    expect(result?.rule_fired).toBe('interviews_occurring');
    expect(result?.what_this_suggests).not.toMatch(/offer/i);
  });

  it('prioritizes a low-capacity barrier over the volume gate', () => {
    const result = buildAdaptivePayload(
      input({
        applicationsSubmitted: 4,
        elapsedDays: 5,
        biggestBarrier: 'Personal responsibilities',
      }),
    );

    expect(result?.rule_fired).toBe('barrier_low_capacity');
  });

  it('withholds diagnosis below 15 applications', () => {
    const result = buildAdaptivePayload(input({ applicationsSubmitted: 14 }));

    expect(result?.rule_fired).toBe('volume_gate_insufficient');
    expect(result?.diagnosis_withheld).toBe(true);
  });

  it('withholds diagnosis before 14 elapsed days', () => {
    const result = buildAdaptivePayload(input({ elapsedDays: 13 }));

    expect(result?.rule_fired).toBe('volume_gate_insufficient');
  });

  it('fires low_response_rate below 10%', () => {
    const result = buildAdaptivePayload(
      input({ applicationsSubmitted: 20, employerResponses: 1 }),
    );

    expect(result?.rule_fired).toBe('low_response_rate');
  });

  it('treats exactly 10% as the neutral range', () => {
    const result = buildAdaptivePayload(
      input({ applicationsSubmitted: 20, employerResponses: 2 }),
    );

    expect(result?.rule_fired).toBe('neutral_progress');
  });

  it('fires healthy_response_rate at exactly 15%', () => {
    const result = buildAdaptivePayload(
      input({ applicationsSubmitted: 20, employerResponses: 3 }),
    );

    expect(result?.rule_fired).toBe('healthy_response_rate');
  });

  it('uses role targeting in the neutral response-rate range', () => {
    const result = buildAdaptivePayload(
      input({
        applicationsSubmitted: 15,
        employerResponses: 2,
        biggestBarrier: "Couldn't find enough suitable jobs",
      }),
    );

    expect(result?.rule_fired).toBe('barrier_role_targeting');
  });

  it('returns neutral_progress when no stronger rule fires', () => {
    const result = buildAdaptivePayload(input());

    expect(result?.rule_fired).toBe('neutral_progress');
    expect(result?.diagnosis_withheld).toBe(false);
  });
});
