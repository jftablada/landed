// lib/ai/stubAiClient.ts
// TEMPORARY stub AI client for V1 pipeline testing.
//
// Returns a fixed, schema-valid roadmap JSON without calling any real
// model. This lets us prove the whole chain (auth → computeMode → DB
// write → response) works with zero API key and zero cost.
//
// SWAP LATER: when you have an Anthropic/OpenAI key, replace this with a
// real client that implements the same one-method interface:
//     generate(prompt: string): Promise<string>
// The route and orchestrator do not change — only this file is swapped.

import type { AiClient } from '@/lib/core/generateRoadmapForIntake.impl';

// A valid RoadmapOutput shape (see validateRoadmapOutput in the orchestrator):
//   acknowledgment_line: string
//   pressure_points: string[]            (max 3)
//   next_move: { action, why_first, boundary_note }
//   roadmap: { show: boolean, phases: [{ title, actions[] }] }  (max 3 phases)
//   tools_surfaced: string[]
//
// The orchestrator applies server-side rules AFTER this (e.g. forcing
// roadmap.show=false in critical mode), so this generic output is safe
// across modes — the server corrects mode-specific bits deterministically.
const STUB_ROADMAP = {
  acknowledgment_line:
    'You have some room to plan, and your plan is built around making the most of it.',
  pressure_points: [
    'Housing is your largest fixed cost',
    'No confirmed income source yet',
  ],
  next_move: {
    action: 'Write down the three roles you would most want and could realistically land.',
    why_first:
      'Clarity now prevents an unfocused search that wastes the runway you have.',
    boundary_note: null,
  },
  roadmap: {
    show: true,
    phases: [
      {
        title: 'This week: get clear',
        actions: [
          'Define your target roles and the minimum salary you need',
          'List five companies you would want to work for',
        ],
      },
      {
        title: 'Next two weeks: start moving',
        actions: ['Reach out to three people in your network', 'Begin focused applications'],
      },
    ],
  },
  tools_surfaced: [],
};

export const stubAiClient: AiClient = {
  async generate(_prompt: string): Promise<string> {
    // Return the fixed roadmap as a JSON string, exactly like a real model
    // instructed to reply with strict JSON would.
    return JSON.stringify(STUB_ROADMAP);
  },
};