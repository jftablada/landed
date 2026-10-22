import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CheckinReview, { FinancialSummary } from './CheckinReview';

const details = {
  province: 'ON',
  confirmedCash: '8000',
  essentialBurn: '3000',
  debtMinimums: '500',
  eiStatus: 'not_applied',
  eiAmount: '',
};
const activity = {
  applicationsSubmitted: '18',
  employerResponses: '1',
  interviewsSecured: '0',
  offersReceived: '0',
  biggestBarrier: '<Unsure>',
};

describe('check-in review', () => {
  it('shows the actual activity period, all counts, finances and edit controls', () => {
    const html = renderToStaticMarkup(
      <CheckinReview
        activity={activity}
        details={details}
        original={details}
        period="Since October 20, 2026"
        onEdit={vi.fn()}
      />,
    );
    for (const value of [
      'Since October 20, 2026',
      'Applications',
      'Responses',
      'Interviews',
      'Offers',
      '$8,000.00',
      'Ontario',
      'Edit search',
      'Edit situation',
      'previous plan stays',
    ])
      expect(html).toContain(value);
    expect(html).toContain('&lt;Unsure&gt;');
    expect(html).not.toContain('type="submit"');
    expect(html).not.toContain('Updated');
  });
  it('marks changed values without altering the original snapshot', () => {
    const changed = {
      ...details,
      confirmedCash: '7500',
      eiStatus: 'receiving',
      eiAmount: '1600',
    };
    const html = renderToStaticMarkup(
      <FinancialSummary details={changed} original={details} />,
    );
    expect(html).toContain('$7,500.00');
    expect(html).toContain('Updated');
    expect(html).toContain('$1,600.00');
    expect(details.confirmedCash).toBe('8000');
  });
  it('never displays an inactive EI amount or NaN while editing', () => {
    const html = renderToStaticMarkup(
      <FinancialSummary
        details={{ ...details, confirmedCash: '', eiAmount: '999' }}
      />,
    );
    expect(html).toContain('Check amount');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Monthly EI amount');
  });
});
