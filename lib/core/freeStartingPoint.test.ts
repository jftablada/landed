import { describe, expect, it } from 'vitest';
import {
  getThisWeekLinks,
  getTodayActions,
  SITUATION_FRAMING,
} from './freeStartingPoint';

describe('free starting point', () => {
  it('keeps situation input limited to framing', () => {
    expect(Object.keys(SITUATION_FRAMING)).toEqual([
      'laid_off',
      'non_renewal',
      'contract_ending',
      'pivot',
    ]);
  });

  it('gives each employment type three concrete actions for today', () => {
    expect(getTodayActions('employee')).toHaveLength(3);
    expect(getTodayActions('sole_proprietor')).toHaveLength(3);
    expect(getTodayActions('incorporated')).toHaveLength(3);
  });

  it('routes employees to official EI and ROE information', () => {
    const links = getThisWeekLinks('employee');

    expect(links.map(({ label }) => label)).toEqual([
      'Review the EI application process',
      'Check how Records of Employment work',
    ]);
    expect(links.every(({ url }) => url.startsWith('https://www.canada.ca/'))).toBe(
      true,
    );
  });

  it('routes independent workers to information without deciding eligibility', () => {
    for (const employmentType of [
      'sole_proprietor',
      'incorporated',
    ] as const) {
      const links = getThisWeekLinks(employmentType);
      const combinedCopy = links
        .flatMap(({ label, description }) => [label, description])
        .join(' ')
        .toLowerCase();

      expect(combinedCopy).not.toContain('you qualify');
      expect(combinedCopy).not.toContain('you are eligible');
      expect(links.every(({ url }) => url.startsWith('https://www.canada.ca/'))).toBe(
        true,
      );
    }
  });
});
