import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CompanyWorkspace from './CompanyWorkspace';

describe('company workspace presentation', () => {
  it('starts with one company and does not require optional profile details', () => {
    const html = renderToStaticMarkup(<CompanyWorkspace initialCompanies={[]} />);
    expect(html).toContain('Start with one company.');
    expect(html).toContain('Save company');
    expect(html).toContain('Why it interests you');
    expect(html.match(/required=""/g)).toHaveLength(1);
  });
  it('shows saved context and a single edit action without an open form', () => {
    const html = renderToStaticMarkup(<CompanyWorkspace initialCompanies={[{ id: 'test', company_name: '<Example>', target_role: 'Designer', why_fit: 'Meaningful work', next_step: 'contact', created_at: '', updated_at: '' }]} />);
    expect(html).toContain('&lt;Example&gt;');
    expect(html).toContain('Designer');
    expect(html).toContain('Meaningful work');
    expect(html).toContain('Reach out');
    expect(html).toContain('Edit details');
    expect(html).not.toContain('<form');
  });
});
