import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WeeklyTaskGuide from './WeeklyTaskGuide';
import { getWeeklyTaskGuidance } from '../../lib/core/weeklyTaskGuidance';

describe('expanded action guide', () => {
  it('shows a practical path, an optional starter, and a finish line', () => {
    const html = renderToStaticMarkup(
      <WeeklyTaskGuide
        guide={getWeeklyTaskGuidance('Build a 10-company target list')}
      />,
    );
    expect(html).toContain('A shortlist with a reason');
    expect(html.match(/<li /g)).toHaveLength(3);
    expect(html).toContain('Copy starter');
    expect(html).toContain('A useful finish line');
    expect(html).toContain('Organization | Why it interests me');
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
