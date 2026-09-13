import { describe, expect, it } from 'vitest';
import {
  estimateRoughRunwayWeeks,
  formatRoughRunway,
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

  it('estimates rough cash runway in weeks without assigning a mode', () => {
    expect(estimateRoughRunwayWeeks(6000, 3000)).toBeCloseTo(8.69, 2);
    expect(formatRoughRunway(8.69)).toBe('about 9 weeks');
  });

  it('handles short runway without displaying zero weeks', () => {
    expect(formatRoughRunway(0)).toBe('less than a day');
    expect(formatRoughRunway(0.5)).toBe('about 3 days');
  });

  it('rejects invalid rough runway inputs', () => {
    expect(estimateRoughRunwayWeeks(-1, 3000)).toBeNull();
    expect(estimateRoughRunwayWeeks(6000, 0)).toBeNull();
    expect(estimateRoughRunwayWeeks(Number.NaN, 3000)).toBeNull();
  });
});
