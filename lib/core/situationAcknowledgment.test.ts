import { describe, expect, it } from 'vitest';

import { situationAcknowledgment } from './situationAcknowledgment';

describe('situation acknowledgment', () => {
  it.each([
    ['laid_off', 'You told us you were laid off.'],
    ['dismissed', 'You told us you were dismissed or fired.'],
    ['non_renewal', 'You told us your contract wasn’t renewed.'],
    ['contract_ending', 'You told us your contract is ending soon.'],
    ['pivot', 'You told us you’re changing careers.'],
  ])('uses neutral wording for %s', (situationType, expected) => {
    expect(situationAcknowledgment(situationType)).toBe(expected);
  });

  it('omits unknown or missing situations', () => {
    expect(situationAcknowledgment(null)).toBeUndefined();
    expect(situationAcknowledgment('unknown')).toBeUndefined();
  });
});
