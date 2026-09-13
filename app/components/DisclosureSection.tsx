import type { ReactNode } from 'react';

export default function DisclosureSection({
  eyebrow,
  title,
  summary,
  children,
  open = false,
  id,
}: {
  eyebrow?: string;
  title: string;
  summary?: string;
  children: ReactNode;
  open?: boolean;
  id?: string;
}) {
  return (
    <details id={id} open={open} className="group scroll-mt-6 overflow-hidden rounded-2xl bg-surface shadow-[0_18px_55px_rgba(0,0,0,0.16)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 transition-colors hover:bg-surface-2/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-7">
        <div>
          {eyebrow ? <p className="text-xs uppercase tracking-[0.18em] text-muted">{eyebrow}</p> : null}
          <h2 className="mt-1 font-display text-2xl text-text">{title}</h2>
          {summary ? <p className="mt-1 text-sm leading-relaxed text-muted">{summary}</p> : null}
        </div>
        <span aria-hidden className="text-xl text-brand transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="border-t border-hair/70 px-6 py-6 sm:px-7">{children}</div>
    </details>
  );
}
