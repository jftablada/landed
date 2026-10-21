import { describe, expect, it } from 'vitest';
import { getWeeklyTaskGuidance } from './weeklyTaskGuidance';

describe('curated weekly action guidance', () => {
  it.each([
    ['Build a 10-company target list', 'A shortlist with a reason'],
    [
      'Draft a list of 10 organizations you’d genuinely want to work for — not job postings, companies.',
      'A shortlist with a reason',
    ],
    [
      'Sharpen how you describe the value you bring',
      'Make your value easy to picture',
    ],
    [
      'Define the three roles you’d most want and could realistically land.',
      'Give your search a shape',
    ],
    [
      'Reconnect with people who know your work',
      'Start a conversation, not a pitch',
    ],
    [
      'Put more weight on interview preparation while keeping your application activity moving.',
      'Bring evidence, not a script',
    ],
    [
      'Maintain your application strategy and prepare carefully for recruiter and interview conversations.',
      'Bring evidence, not a script',
    ],
    [
      'Review the roles you are targeting and tighten how each application matches the job.',
      'Make the match visible',
    ],
    [
      'Keep building a focused sample of applications and record what comes back.',
      'Make the next check-in easier',
    ],
    [
      'Choose a smaller, sustainable search target and protect the time needed to complete it.',
      'Choose a small enough start',
    ],
  ])('matches the existing action: %s', (label, topic) => {
    const guide = getWeeklyTaskGuidance(label);
    expect(guide.topic).toBe(topic);
    expect(guide.steps).toHaveLength(3);
    expect(guide.finishLine.length).toBeGreaterThan(20);
  });

  it.each([
    'Apply for EI today — it can take weeks to process, so every day counts.',
    'Ask your landlord about hardship or deferral options',
    'Confirm your runway and any incoming support',
    'Stabilize your immediate finances before increasing job-search intensity.',
    'Contact 211 today to find emergency support in BC.',
    'Discuss EI at an interview',
  ])(
    'routes sensitive actions to preparation, not eligibility or financial decisions: %s',
    (label) => {
      const guide = getWeeklyTaskGuidance(label);
      expect(guide.topic).toBe('Get the right information first');
      expect(guide.introduction).toContain(
        'does not assess benefits eligibility',
      );
      expect(guide.starter).toBeUndefined();
      expect(guide.steps.join(' ')).toContain(
        'organization decides what applies',
      );
    },
  );

  it.each([
    'Review an offer for an interview role',
    'Ask about severance',
    'An unfamiliar future action',
  ])(
    'uses neutral guidance for unsupported or legal decisions: %s',
    (label) => {
      expect(getWeeklyTaskGuidance(label).topic).toBe(
        'Turn the action into a first step',
      );
    },
  );

  it('keeps copied starters as explicit placeholders rather than invented personal history', () => {
    const pitch = getWeeklyTaskGuidance(
      'Sharpen how you describe the value you bring',
    );
    expect(pitch.starter?.text).toContain('[real example or result]');
    const outreach = getWeeklyTaskGuidance(
      'Reconnect with people who know your work',
    );
    expect(outreach.starter?.text).toContain(
      '[our connection or specific reason for reaching out]',
    );
  });
});
