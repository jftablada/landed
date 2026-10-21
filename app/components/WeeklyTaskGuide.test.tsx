import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WeeklyTaskGuide from './WeeklyTaskGuide';
import { getWeeklyTaskGuidance } from '../../lib/core/weeklyTaskGuidance';

describe('expanded action guide', () => {
  it('opens the company workspace without competing copy actions', () => {
    const html = renderToStaticMarkup(
      <WeeklyTaskGuide
        guide={getWeeklyTaskGuidance('Build a 10-company target list')}
      />,
    );
    expect(html).toContain('A shortlist with a reason');
    expect(html.match(/<li /g)).toHaveLength(3);
    expect(html).toContain('Open company workspace');
    expect(html).toContain('href="/companies"');
    expect(html).toContain('A useful finish line');
    expect(html).not.toContain('Copy starter');
    expect(html).not.toContain('<form');
  });

  it('does not offer a fabricated starter for sensitive support tasks', () => {
    const html = renderToStaticMarkup(
      <WeeklyTaskGuide
        guide={getWeeklyTaskGuidance('Confirm your EI status')}
      />,
    );
    expect(html).toContain('official resource');
    expect(html).not.toContain('Copy starter');
  });
});
