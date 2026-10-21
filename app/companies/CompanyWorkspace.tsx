'use client';

import { useState, type FormEvent } from 'react';
import {
  NEXT_STEPS,
  type CompanyInput,
  type TargetCompany,
} from '../../lib/companies/companyInput';

function CompanyForm({
  company,
  onSaved,
  onCancel,
}: {
  company?: TargetCompany;
  onSaved: (company: TargetCompany) => void;
  onCancel?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputClass =
    'mt-2 w-full rounded-lg border border-hair bg-bg px-4 py-3 text-text focus:outline-2 focus:outline-brand';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const fields: CompanyInput = {
      company_name: String(form.get('company_name') ?? ''),
      why_fit: String(form.get('why_fit') ?? ''),
      target_role: String(form.get('target_role') ?? ''),
      next_step: String(form.get('next_step')) as CompanyInput['next_step'],
    };
    try {
      const response = await fetch('/api/companies', {
        method: company ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          ...(company ? { id: company.id } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.company)
        throw new Error(
          result.message || 'Your changes weren’t saved. Please try again.',
        );
      onSaved(result.company);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Couldn’t connect. Your changes weren’t saved.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm text-muted">
        Company name <span className="text-text">(required)</span>
        <input
          name="company_name"
          required
          maxLength={120}
          defaultValue={company?.company_name}
          className={inputClass}
          autoComplete="organization"
        />
      </label>
      <label className="block text-sm text-muted">
        Why it interests you <span>(optional)</span>
        <textarea
          name="why_fit"
          maxLength={600}
          rows={3}
          defaultValue={company?.why_fit}
          placeholder="A team, problem, or kind of work that appeals to you."
          className={inputClass}
        />
      </label>
      <label className="block text-sm text-muted">
        Target role <span>(optional)</span>
        <input
          name="target_role"
          maxLength={120}
          defaultValue={company?.target_role}
          placeholder="The role you would explore"
          className={inputClass}
        />
      </label>
      <label className="block text-sm text-muted">
        Next step
        <select
          name="next_step"
          defaultValue={company?.next_step ?? 'research'}
          className={inputClass}
        >
          {Object.entries(NEXT_STEPS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p role="alert" className="text-sm leading-relaxed text-text">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-5">
        <button
          disabled={busy}
          className="min-h-12 rounded-lg bg-brand px-6 py-3 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Saving…' : company ? 'Save changes' : 'Save company'}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-12 text-sm text-muted hover:text-text"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function CompanyWorkspace({
  initialCompanies,
}: {
  initialCompanies: TargetCompany[];
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [adding, setAdding] = useState(initialCompanies.length === 0);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  function saved(company: TargetCompany) {
    setCompanies((previous) =>
      previous.some((item) => item.id === company.id)
        ? previous.map((item) => (item.id === company.id ? company : item))
        : [company, ...previous],
    );
    setAdding(false);
    setEditing(null);
    setNotice(`${company.company_name} saved.`);
  }
  return (
    <div>
      <div role="status" aria-live="polite" className="mb-4 text-sm text-brand">
        {notice}
      </div>
      {adding ? (
        <section
          className="mb-8 rounded-2xl bg-surface p-6 sm:p-8"
          aria-labelledby="add-company"
        >
          <h2 id="add-company" className="font-display text-3xl text-text">
            {companies.length ? 'Add a company' : 'Start with one company.'}
          </h2>
          <p className="mb-7 mt-3 text-sm leading-relaxed text-muted">
            You don’t need a perfect list. Save one place you want to learn more
            about.
          </p>
          <CompanyForm
            onSaved={saved}
            onCancel={companies.length ? () => setAdding(false) : undefined}
          />
        </section>
      ) : (
        <button
          onClick={() => {
            setAdding(true);
            setEditing(null);
            setNotice('');
          }}
          className="mb-8 min-h-12 rounded-lg bg-brand px-6 py-3 font-medium text-black hover:opacity-90"
        >
          Add a company
        </button>
      )}
      {companies.length ? (
        <section aria-labelledby="saved-companies">
          <h2
            id="saved-companies"
            className="mb-5 text-sm uppercase tracking-widest text-muted"
          >
            Your shortlist · {companies.length}
          </h2>
          <div className="space-y-5">
            {companies.map((company) => (
              <article
                key={company.id}
                className="rounded-2xl bg-surface p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="break-words text-xl font-medium text-text">
                      {company.company_name}
                    </h3>
                    {company.target_role ? (
                      <p className="mt-2 break-words text-sm text-muted">
                        {company.target_role}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-sm text-brand">
                    Next: {NEXT_STEPS[company.next_step]}
                  </span>
                </div>
                {editing === company.id ? (
                  <div className="mt-7">
                    <CompanyForm
                      company={company}
                      onSaved={saved}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                ) : (
                  <>
                    {company.why_fit ? (
                      <p className="mt-5 whitespace-pre-line break-words text-sm leading-relaxed text-muted">
                        {company.why_fit}
                      </p>
                    ) : null}
                    <button
                      onClick={() => {
                        setEditing(company.id);
                        setAdding(false);
                        setNotice('');
                      }}
                      aria-label={`Edit ${company.company_name}`}
                      className="mt-5 min-h-11 text-sm text-brand hover:text-text"
                    >
                      Edit details →
                    </button>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
