'use client';

import { useState } from 'react';
import type { WeeklyTaskGuidance } from '../../lib/core/weeklyTaskGuidance';

export default function WeeklyTaskGuide({
  guide,
}: {
  guide: WeeklyTaskGuidance;
}) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );

  async function copyStarter() {
    if (!guide.starter) return;
    try {
      await navigator.clipboard.writeText(guide.starter.text);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  }

  return (
    <div className="mb-5 rounded-xl bg-surface-2/60 p-5 sm:p-6">
      <p className="text-sm font-medium text-brand">{guide.topic}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        {guide.introduction}
      </p>
      <ol className="mt-5 space-y-4" aria-label="A practical starting point">
        {guide.steps.map((step, index) => (
          <li
            key={step}
            className="flex gap-3 text-sm leading-relaxed text-text"
          >
            <span aria-hidden="true" className="shrink-0 text-brand/80">
              {index + 1}.
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {guide.starter ? (
        <div className="mt-6 border-l-2 border-brand/40 pl-4">
          <p className="text-xs uppercase tracking-wider text-muted">
            {guide.starter.label}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text">
            {guide.starter.text}
          </p>
          <button
            type="button"
            onClick={copyStarter}
            className="mt-3 min-h-10 rounded-md px-2 text-sm font-medium text-brand hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {copyStatus === 'copied' ? 'Copied' : 'Copy starter'}
          </button>
          <span className="sr-only" role="status">
            {copyStatus === 'copied' ? 'Starter copied to your clipboard.' : ''}
          </span>
          {copyStatus === 'failed' ? (
            <p role="status" className="mt-1 text-sm text-muted">
              Couldn’t copy automatically. You can select and copy the text
              above.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-6 border-t border-hair/60 pt-4">
        <p className="text-xs uppercase tracking-wider text-brand">
          A useful finish line
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {guide.finishLine}
        </p>
      </div>
    </div>
  );
}
