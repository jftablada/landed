import { describe, expect, it } from 'vitest';

import type { RoadmapOutput } from './generateRoadmapForIntake';
import { deriveWeeklyTasks } from './deriveWeeklyTasks';

function roadmapOutput(
  overrides: Partial<RoadmapOutput> = {},
): RoadmapOutput {
  return {
    acknowledgment_line: 'You have room to choose your next move.',
    pressure_points: [],
    next_move: {
      action: 'Make a focused company list.',
      why_first: 'Focus improves the search.',
      boundary_note: null,
    },
    roadmap: {
      show: true,
      phases: [
        {
          title: 'This week',
          actions: ['Choose ten companies.', 'Contact two people.'],
        },
      ],
    },
    tools_surfaced: [],
    ...overrides,
  };
}

describe('deriveWeeklyTasks', () => {
  it('uses the adaptive priority first when one exists', () => {
    const output = roadmapOutput({
      adaptive: {
        what_changed: 'Applications increased.',
        what_this_suggests: 'Targeting may need attention.',
        this_weeks_priority: 'Tighten the roles you target.',
        why: 'A clearer target can improve response quality.',
        rule_fired: 'low_response_rate',
        diagnosis_withheld: false,
      },
    });

    expect(deriveWeeklyTasks(output)).toEqual([
      {
        key: 'adaptive_priority',
        label: 'Tighten the roles you target.',
        order: 1,
      },
      { key: 'phase_0_action_0', label: 'Choose ten companies.', order: 2 },
      { key: 'phase_0_action_1', label: 'Contact two people.', order: 3 },
    ]);
  });

  it('uses the next move when there is no adaptive priority', () => {
    expect(deriveWeeklyTasks(roadmapOutput())[0]).toEqual({
      key: 'next_move',
      label: 'Make a focused company list.',
      order: 1,
    });
  });

  it('returns only the priority task when roadmap phases are hidden', () => {
    const output = roadmapOutput({
      roadmap: {
        show: false,
        phases: [{ title: 'Hidden', actions: ['Do not show this.'] }],
      },
    });

    expect(deriveWeeklyTasks(output)).toEqual([
      {
        key: 'next_move',
        label: 'Make a focused company list.',
        order: 1,
      },
    ]);
  });

  it('removes duplicate and blank actions while preserving source keys', () => {
    const output = roadmapOutput({
      roadmap: {
        show: true,
        phases: [
          {
            title: 'This week',
            actions: [
              '  Make a focused company list.  ',
              'MAKE A FOCUSED COMPANY LIST.',
              ' ',
              'Contact two people.',
            ],
          },
        ],
      },
    });

    expect(deriveWeeklyTasks(output)).toEqual([
      {
        key: 'next_move',
        label: 'Make a focused company list.',
        order: 1,
      },
      { key: 'phase_0_action_3', label: 'Contact two people.', order: 2 },
    ]);
  });

  it('returns no more than three tasks across multiple phases', () => {
    const output = roadmapOutput({
      roadmap: {
        show: true,
        phases: [
          { title: 'First', actions: ['One', 'Two'] },
          { title: 'Second', actions: ['Three', 'Four'] },
        ],
      },
    });

    expect(deriveWeeklyTasks(output)).toHaveLength(3);
    expect(deriveWeeklyTasks(output).map((task) => task.label)).toEqual([
      'Make a focused company list.',
      'One',
      'Two',
    ]);
  });
});
