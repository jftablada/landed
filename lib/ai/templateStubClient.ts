// lib/ai/templateStubClient.ts
// Mode-based template "AI" client. No real AI, no API cost, no randomness.
//
// Reads the FIXED CONTEXT JSON block that assemblePrompt injects into the
// prompt, picks a fixed template per mode (critical/survival/balanced/
// strategic), and interpolates a few real values so the text AGREES with
// the math the user sees. Deterministic: same input → same output.
//
// Interpolated values only: province, runway_figure, runway_date,
// net_monthly_gap, ei_status. Structure per mode is fixed.
//
// Swaps in for stubAiClient with one line in the routes. The real-AI seam
// is unchanged — this is still just an AiClient returning a JSON string.

import type { AiClient } from '@/lib/core/generateRoadmapForIntake.impl';

interface InjectedContext {
  mode: 'critical' | 'survival' | 'balanced' | 'strategic';
  runway_figure: string | null;
  runway_date: string | null;
  net_monthly_gap: number | null;
  emergency_programs: string[] | null;
  context: {
    province: string;
    ei_status: string;
    housing_type: 'rent' | 'own';
  };
}

// Pull the FIXED CONTEXT JSON back out of the assembled prompt.
function parseInjected(prompt: string): InjectedContext | null {
  const marker = '=== FIXED CONTEXT (do not alter these values) ===';
  const start = prompt.indexOf(marker);
  if (start === -1) return null;
  const after = prompt.slice(start + marker.length);
  // The JSON runs from the first "{" to the final "}" before the trailing
  // "Generate the roadmap output as JSON." line.
  const firstBrace = after.indexOf('{');
  const lastBrace = after.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) return null;
  try {
    return JSON.parse(after.slice(firstBrace, lastBrace + 1));
  } catch {
    return null;
  }
}

// Human EI phrasing depending on where they are with it.
function eiLine(eiStatus: string): string {
  switch (eiStatus) {
    case 'not_applied':
      return 'Apply for EI today — it can take weeks to process, so every day counts.';
    case 'applied':
      return 'Follow up on your EI application to confirm where it stands.';
    case 'approved':
      return 'Your EI is approved — confirm the first payment date so you can plan around it.';
    case 'receiving':
      return 'Your EI is arriving, which steadies your monthly picture.';
    case 'not_eligible':
      return 'Since EI isn’t available to you, bridge income matters more — look at short-term options.';
    default:
      return 'Check your EI status so we can factor it in.';
  }
}

// The four templates. Each returns the RoadmapOutput object.
function buildOutput(inj: InjectedContext) {
  const province = inj.context.province;
  const runway = inj.runway_figure ?? 'a short time';
  const date = inj.runway_date;
  const gap = inj.net_monthly_gap;
  const ei = inj.context.ei_status;
  const datePhrase = date ? ` (until around ${date})` : '';
  const gapPhrase = gap != null ? ` Your monthly shortfall is about $${gap}.` : '';

  switch (inj.mode) {
    // ── CRITICAL ──────────────────────────────────────────────────────
    // Orchestrator forces roadmap.show=false here; we don't fight it.
    case 'critical': {
      const programs = inj.emergency_programs ?? ['211 (free, confidential, 24/7)'];
      return {
        acknowledgment_line:
          'Right now the priority is immediate stability — not a job search.',
        pressure_points: [
          'Confirmed cash can’t cover your immediate essentials',
          'Stabilizing support comes before any career steps',
        ],
        next_move: {
          action: `Contact ${programs.join(' and ')} today to find emergency support in ${province}.`,
          why_first:
            'Before anything else, you need to know what immediate help is available to you. That comes first.',
          boundary_note:
            'These programs decide eligibility — we point you to them, we don’t decide for you.',
        },
        roadmap: { show: false, phases: [] },
        tools_surfaced: [],
      };
    }

    // ── SURVIVAL ──────────────────────────────────────────────────────
    case 'survival':
      return {
        acknowledgment_line: `You have ${runway}${datePhrase}. That’s tight, so your plan starts with stabilizing.`,
        pressure_points: [
          'Your confirmed runway is short',
          gap != null ? `A monthly shortfall of about $${gap}` : 'A monthly shortfall to close',
          'Job search comes after immediate pressure eases',
        ],
        next_move: {
          action: eiLine(ei),
          why_first:
            'Stabilizing your income picture buys time. Everything in your search gets easier once the immediate pressure is lower.',
          boundary_note: null,
        },
        roadmap: {
          show: true,
          phases: [
            {
              title: 'This week: stop the bleeding',
              actions: [
                'Confirm what’s actually committed vs. flexible in your monthly costs',
                `Ask your ${inj.context.housing_type === 'own' ? 'mortgage lender' : 'landlord'} about hardship or deferral options`,
              ],
            },
            {
              title: 'Next: extend your runway',
              actions: [
                eiLine(ei),
                'Identify any fast, short-term income to bridge the gap',
              ],
            },
            {
              title: 'When stable: re-enter the search',
              actions: ['Define the roles you’ll target once you’re steady'],
            },
          ],
        },
        tools_surfaced: [],
      };

    // ── BALANCED ──────────────────────────────────────────────────────
    case 'balanced':
      return {
        acknowledgment_line: `You have ${runway}${datePhrase} — enough room to act, not enough to drift.`,
        pressure_points: [
          'Enough runway to search deliberately',
          gap != null ? `A monthly shortfall of about $${gap} to keep in view` : 'A shortfall to keep in view',
          'Stability and search can run in parallel now',
        ],
        next_move: {
          action: 'Define the three roles you’d most want and could realistically land.',
          why_first:
            'You have room to be focused rather than frantic. Clarity now makes every application and conversation more effective.',
          boundary_note: null,
        },
        roadmap: {
          show: true,
          phases: [
            {
              title: 'This week: lock stability + clarity',
              actions: [
                'Confirm your runway and any incoming support',
                'Define your target roles and a realistic salary floor',
              ],
            },
            {
              title: 'Next two weeks: active, focused search',
              actions: [
                'Begin targeted applications',
                'Reconnect with people who know your work',
              ],
            },
            {
              title: 'Build momentum',
              actions: ['Keep several opportunities moving at once'],
            },
          ],
        },
        tools_surfaced: [],
      };

    // ── STRATEGIC ─────────────────────────────────────────────────────
    case 'strategic':
    default:
      return {
        acknowledgment_line: `You have ${runway}${datePhrase}. You’re choosing your next move, not just reacting.`,
        pressure_points: [
          'Strong runway — you can be selective',
          'Fit matters more than speed here',
          'Keep more than one path open',
        ],
        next_move: {
          action: 'Draft a list of 10 organizations you’d genuinely want to work for — not job postings, companies.',
          why_first:
            'At your runway you can afford to target rather than spray. A focused list makes networking and applications far stronger.',
          boundary_note: null,
        },
        roadmap: {
          show: true,
          phases: [
            {
              title: 'This week: define your target',
              actions: [
                'Build a 10-company target list',
                'Sharpen how you describe the value you bring',
              ],
            },
            {
              title: 'Next: activate your network with intention',
              actions: [
                'Reach out to people connected to your targets',
                'Prepare for interviews as they come',
              ],
            },
            {
              title: 'Evaluate and choose',
              actions: ['Compare opportunities on fit, not just offer'],
            },
          ],
        },
        tools_surfaced: [],
      };
  }
}

export const templateStubClient: AiClient = {
  async generate(prompt: string): Promise<string> {
    const inj = parseInjected(prompt);
    if (!inj) {
      // If we somehow can't read the context, fall back to a safe generic
      // balanced-style output rather than throwing (keeps the loop alive).
      return JSON.stringify({
        acknowledgment_line: 'Here’s your plan based on what you shared.',
        pressure_points: ['Your situation is being tracked'],
        next_move: {
          action: 'Review your runway and take the first step that fits.',
          why_first: 'Starting with one clear action keeps momentum.',
          boundary_note: null,
        },
        roadmap: { show: true, phases: [] },
        tools_surfaced: [],
      });
    }
    return JSON.stringify(buildOutput(inj));
  },
};