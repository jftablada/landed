import { describe, expect, it } from 'vitest';

import type { AdaptivePayload } from '@/lib/core/generateRoadmapForIntake';
import { selectHighlightedMove } from './selectHighlightedMove';

const originalMove = {
  action: 'Build a ten-company list.',
  why_first: 'Focus helps your search.',
  boundary_note: 'Keep this manageable.',
};

const adaptive: AdaptivePayload = {
  what_changed: 'Three interviews secured.',
  what_this_suggests: 'Applications are creating opportunities.',
  this_weeks_priority: 'Put more weight on interview preparation.',
  why: 'Prepare for the opportunities already appearing.',
  rule_fired: 'interviews_occurring',
  diagnosis_withheld: false,
};

describe('selectHighlightedMove', () => {
  it('uses the check-in priority and reason instead of outdated roadmap advice', () => {
    expect(selectHighlightedMove(originalMove, adaptive)).toEqual({
      action: adaptive.this_weeks_priority,
      why_first: adaptive.why,
      boundary_note: null,
    });
  });

  it('keeps the original move when there is no adaptive guidance', () => {
    expect(selectHighlightedMove(originalMove, undefined)).toEqual(originalMove);
  });
});
