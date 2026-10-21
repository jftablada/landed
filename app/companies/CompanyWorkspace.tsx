'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { protectUnsavedForm } from '../../lib/forms/unsavedFormGuard';
import {
  NEXT_STEPS,
  type CompanyInput,
  type TargetCompany,
} from '../../lib/companies/companyInput';

function CompanyForm({
  company,
  onSaved,
  onCancel,
  onStateChange,
  navigationNotice,
}: {
  company?: TargetCompany;
  onSaved: (company: TargetCompany) => void;
  onCancel?: () => void;
  onStateChange: (state: 'clean' | 'dirty' | 'saving') => void;
  navigationNotice: string;
}) {
  const formId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputClass =
    'mt-2 w-full rounded-lg border border-hair bg-bg px-4 py-3 text-text focus:outline-2 focus:outline-brand';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    onStateChange('saving');
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
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.company)
        throw new Error(
          result?.message || 'Your changes weren’t saved. Please try again.',
        );
      onSaved(result.company);
    } catch (reason) {
      onStateChange('dirty');
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
    <form
      onSubmit={submit}
      onChange={() => {
        if (!busy) onStateChange('dirty');
      }}
      aria-busy={busy}
    >
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
        <div className="text-sm text-muted">
          <label htmlFor={`${formId}-name`} className="block">
            Company name <span className="text-text">(required)</span>
          </label>
          <input
            id={`${formId}-name`}
            name="company_name"
            required
            maxLength={120}
            defaultValue={company?.company_name}
            className={inputClass}
            autoComplete="off"
          />
        </div>
        <div className="text-sm text-muted">
          <label htmlFor={`${formId}-reason`} className="block">
            Why it interests you <span>(optional)</span>
          </label>
          <textarea
            id={`${formId}-reason`}
            name="why_fit"
            maxLength={600}
            rows={3}
            defaultValue={company?.why_fit}
            placeholder="A team, problem, or kind of work that appeals to you."
            className={inputClass}
          />
        </div>
        <div className="text-sm text-muted">
          <label htmlFor={`${formId}-role`} className="block">
            Target role <span>(optional)</span>
          </label>
          <input
            id={`${formId}-role`}
            name="target_role"
            maxLength={120}
            defaultValue={company?.target_role}
            placeholder="The role you would explore"
            className={inputClass}
          />
        </div>
        <div className="text-sm text-muted">
          <label htmlFor={`${formId}-step`} className="block">
            Next step
          </label>
          <select
            id={`${formId}-step`}
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
        </div>
        {navigationNotice ? (
          <p
            id="company-navigation-notice"
            tabIndex={-1}
            role="alert"
            className="rounded-lg bg-brand/10 p-4 text-sm leading-relaxed text-text"
          >
            {navigationNotice}
          </p>
        ) : null}
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
      </fieldset>
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
  const [editorState, setEditorState] = useState<'clean' | 'dirty' | 'saving'>(
    'clean',
  );
  const [navigationNotice, setNavigationNotice] = useState('');
  useEffect(() => {
    if (editorState === 'clean') return;
    return protectUnsavedForm(() => {
      setNavigationNotice(
        editorState === 'saving'
          ? 'Your company is still saving. Please wait before leaving.'
          : 'Your notes aren’t saved yet. Save your changes or choose Cancel before leaving.',
      );
    });
  }, [editorState]);
  useEffect(() => {
    if (navigationNotice)
      document.getElementById('company-navigation-notice')?.focus();
  }, [navigationNotice]);
  function switchEditor(nextId: string | null, add: boolean) {
    if (editorState !== 'clean') {
      setNavigationNotice(
        editorState === 'saving'
          ? 'Your company is still saving. Please wait before switching.'
          : 'Your notes aren’t saved yet. Save your changes or choose Cancel before switching.',
      );
      return;
    }
    setEditing(nextId);
    setAdding(add);
    setNotice('');
    setNavigationNotice('');
  }
  function cancelEditor() {
    setEditorState('clean');
    setNavigationNotice('');
    setEditing(null);
    setAdding(false);
  }
  function saved(company: TargetCompany) {
    setCompanies((previous) =>
      previous.some((item) => item.id === company.id)
        ? previous.map((item) => (item.id === company.id ? company : item))
        : [company, ...previous],
    );
    setAdding(false);
    setEditing(null);
    setNotice(`${company.company_name} saved.`);
    setEditorState('clean');
    setNavigationNotice('');
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
            onCancel={companies.length ? cancelEditor : undefined}
            onStateChange={setEditorState}
            navigationNotice={navigationNotice}
          />
        </section>
      ) : (
        <button
          onClick={() => switchEditor(null, true)}
          disabled={editorState === 'saving'}
          className="mb-8 min-h-12 rounded-lg bg-brand px-6 py-3 font-medium text-black hover:opacity-90 disabled:opacity-50"
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
                      onCancel={cancelEditor}
                      onStateChange={setEditorState}
                      navigationNotice={navigationNotice}
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
                      onClick={() => switchEditor(company.id, false)}
                      disabled={editorState === 'saving'}
                      aria-label={`Edit ${company.company_name}`}
                      className="mt-5 min-h-11 text-sm text-brand hover:text-text disabled:opacity-50"
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
