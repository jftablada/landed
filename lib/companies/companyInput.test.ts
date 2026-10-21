import { describe, expect, it } from 'vitest';
import { parseCompanyInput } from './companyInput';

const company = {
  company_name: '  Example Co  ',
  why_fit: '  Good work  ',
  target_role: '',
  next_step: 'research',
};
describe('company input', () => {
  it('trims fields and accepts optional empty details', () => {
    expect(parseCompanyInput(company)).toEqual({
      ...company,
      company_name: 'Example Co',
      why_fit: 'Good work',
    });
  });
  it.each([
    null,
    [],
    {},
    { ...company, company_name: '  ' },
    { ...company, company_name: 'x'.repeat(121) },
    { ...company, why_fit: 'x'.repeat(601) },
    { ...company, target_role: 'x'.repeat(121) },
    { ...company, next_step: 'toString' },
    { ...company, next_step: 'done' },
    { ...company, user_id: 'another-user' },
    { ...company, id: '123' },
  ])('rejects invalid or privileged fields: %j', (value) => {
    expect(parseCompanyInput(value)).toBeNull();
  });
  it('requires a valid id for edits', () => {
    expect(parseCompanyInput(company, true)).toBeNull();
    expect(parseCompanyInput({ ...company, id: 'bad' }, true)).toBeNull();
    expect(
      parseCompanyInput(
        { ...company, id: '12345678-1234-1234-1234-123456789abc' },
        true,
      ),
    ).not.toBeNull();
  });
});
