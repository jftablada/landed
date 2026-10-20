import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import WeeklyTasksClient, {
  type WeeklyTaskProgress,
} from './WeeklyTasksClient';

const roadmapId = '8ad78f6b-2e69-4cc0-bee4-bcf3c1fc57c2';
const tasks: WeeklyTaskProgress[] = [
  {
    key: 'next_move',
    label: 'Choose ten companies.',
    order: 1,
    completed: true,
    completed_at: '2026-10-20T12:00:00Z',
  },
  {
    key: 'phase_0_action_0',
    label: 'Contact two people.',
    order: 2,
    completed: false,
    completed_at: null,
  },
  {
    key: 'phase_0_action_1',
    label: 'Review one application.',
    order: 3,
    completed: false,
    completed_at: null,
  },
];

describe('weekly tasks on Today', () => {
  it('shows the first unfinished action, saved checkboxes, and accessible progress', () => {
    const html = renderToStaticMarkup(
      <WeeklyTasksClient
        roadmapId={roadmapId}
        initialTasks={tasks}
        variant="today"
      />,
    );

    expect(html).toMatch(/<h2[^>]*>Contact two people\.<\/h2>/);
    expect(html).toContain('1 of 3 done');
    expect(html.match(/type="checkbox"/g)).toHaveLength(3);
    expect(html.match(/checked=""/g)).toHaveLength(1);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="3"');
    expect(html).toContain(`href="/roadmap/${roadmapId}"`);
    expect(html).not.toContain('Open this week’s tasks');
  });

  it('replaces the next move when every task is done, while keeping undo available', () => {
    const html = renderToStaticMarkup(
      <WeeklyTasksClient
        roadmapId={roadmapId}
        initialTasks={tasks.map((task) => ({ ...task, completed: true }))}
        variant="today"
        fallbackAction="Old next move"
      />,
    );

    expect(html).toMatch(/<h2[^>]*>You’re caught up\.<\/h2>/);
    expect(html).toContain('3 of 3 done');
    expect(html).toContain('aria-valuenow="3"');
    expect(html.match(/type="checkbox"/g)).toHaveLength(3);
    expect(html).not.toContain('Old next move');
  });

  it('does not claim completion when there are no derived tasks', () => {
    const html = renderToStaticMarkup(
      <WeeklyTasksClient
        roadmapId={roadmapId}
        initialTasks={[]}
        variant="today"
        fallbackAction="Review your plan."
      />,
    );

    expect(html).toContain('Review your plan.');
    expect(html).toContain('Open my roadmap');
    expect(html).not.toContain('caught up');
    expect(html).not.toContain('progressbar');
  });

  it('loads saved tasks when an initial snapshot is unavailable', () => {
    const html = renderToStaticMarkup(
      <WeeklyTasksClient roadmapId={roadmapId} variant="today" />,
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Loading this week’s steps…');
    expect(html).not.toContain('0 of 3 done');
  });

  it('preserves the roadmap heading anchor and existing checklist presentation', () => {
    const html = renderToStaticMarkup(
      <WeeklyTasksClient roadmapId={roadmapId} initialTasks={tasks} />,
    );

    expect(html).toContain('id="weekly-tasks-heading"');
    expect(html).toContain('Keep the next steps small and visible.');
    expect(html).not.toContain('Your next move');
    expect(html.match(/type="checkbox"/g)).toHaveLength(3);
  });
});
