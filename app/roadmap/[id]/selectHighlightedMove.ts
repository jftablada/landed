import type { AdaptivePayload } from '@/lib/core/generateRoadmapForIntake';

export interface HighlightedMove {
  action: string;
  why_first: string;
  boundary_note: string | null;
}

export function selectHighlightedMove(
  nextMove: HighlightedMove | undefined,
  adaptive: AdaptivePayload | undefined,
): HighlightedMove | undefined {
  if (!adaptive) return nextMove;

  return {
    action: adaptive.this_weeks_priority,
    why_first: adaptive.why,
    boundary_note: null,
  };
}
