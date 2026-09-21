import { describe, expect, it } from 'vitest';

import { hasPendingInitialRoadmap } from './pendingInitialRoadmap';

const intake = { id: 'intake-1', created_at: '2026-09-18T12:00:00Z' };

describe('pending first roadmap detection', () => {
  it('does not show recovery without a saved intake', () => {
    expect(hasPendingInitialRoadmap(null, null)).toBe(false);
  });

  it('shows recovery for a saved intake with no roadmap', () => {
    expect(hasPendingInitialRoadmap(intake, null)).toBe(true);
  });

  it('shows recovery when a newly saved intake follows an older roadmap', () => {
    expect(hasPendingInitialRoadmap(intake, {
      intake_id: 'older-intake',
      created_at: '2026-09-01T12:00:00Z',
    })).toBe(true);
  });

  it('keeps a completed or later roadmap as the current experience', () => {
    expect(hasPendingInitialRoadmap(intake, {
      intake_id: 'intake-1',
      created_at: '2026-09-18T12:00:01Z',
    })).toBe(false);
  });

  it('does not flag the saved intake once its roadmap exists', () => {
    expect(hasPendingInitialRoadmap(intake, {
      intake_id: 'intake-1',
      created_at: '2026-09-18T12:00:00Z',
    })).toBe(false);
  });
});
