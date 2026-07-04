import Link from 'next/link';

const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/3cIdR1eHx9LS9Un9Ez5gc00';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center px-5 pt-16 pb-32 text-center">
      <p className="text-muted mb-2 text-sm uppercase tracking-widest">Landed</p>
      <h1 className="font-display mb-6 text-4xl leading-tight text-balance">
        You just got the call. Now what?
      </h1>
      <p className="text-muted mb-8">
        Landed helps you build a real plan for what&apos;s next.
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-brand px-6 py-3 font-medium text-black"
      >
        Sign in / Get started
      </Link>

      <section className="mt-20 w-full text-left">
        <h2 className="font-display text-2xl">What&apos;s inside Landed</h2>
        <p className="text-muted mt-2 mb-6 text-sm">
          The Recovery Roadmap is live today. Two more tools are in development.
        </p>
        <ul className="space-y-3">
          <li className="border-hair bg-surface flex items-start justify-between gap-3 rounded-lg border p-4">
            <span className="font-medium">Recovery Roadmap</span>
            <span className="bg-brand-soft text-brand shrink-0 rounded-full px-2 py-0.5 text-xs whitespace-nowrap">
              Available now
            </span>
          </li>
          <li className="border-hair bg-surface flex items-start justify-between gap-3 rounded-lg border p-4">
            <span className="font-medium">Interview Prep Studio</span>
            <span className="bg-surface-2 text-muted shrink-0 rounded-full px-2 py-0.5 text-xs whitespace-nowrap">
              In development
            </span>
          </li>
          <li className="border-hair bg-surface flex items-start justify-between gap-3 rounded-lg border p-4">
            <span className="font-medium">Contractor-to-Permanent Playbook</span>
            <span className="bg-surface-2 text-muted shrink-0 rounded-full px-2 py-0.5 text-xs whitespace-nowrap">
              In development
            </span>
          </li>
        </ul>
      </section>

      <section className="border-hair bg-surface mt-20 w-full rounded-xl border p-6 text-left">
        <h2 className="font-display text-3xl leading-tight text-balance">
          The layoff wasn&apos;t your decision. What happens next is.
        </h2>
        <p className="text-muted mt-4">
          Landed turns career disruption into a structured 90-day recovery —
          so you go from blindsided and scrambling to running a job search
          you actually control, with a clear plan, real momentum, and your
          confidence back.
        </p>
        <p className="mt-6 font-medium">
          One sprint. One price. $79 CAD — one-time.
        </p>
        <ul className="text-muted divide-hair mt-6 divide-y text-sm">
          <li className="py-3 first:pt-0 last:pb-0">
            A Recovery Roadmap built from your actual situation — runway,
            pressure points, timeline. Not a generic checklist.
          </li>
          <li className="py-3 first:pt-0 last:pb-0">
            Check-ins that keep the plan current as things change over the
            90 days.
          </li>
          <li className="py-3 first:pt-0 last:pb-0">
            Canadian-specific ground truth — severance, ROE, EI, and when a
            lawyer is worth the call. Built here, for here.
          </li>
          <li className="py-3 first:pt-0 last:pb-0">
            The founder walks you in personally — 15-minute walkthrough at
            the start, check-ins at week 2 and week 4. First contact within
            24 hours of joining.
          </li>
        </ul>
        <p className="mt-8 text-sm">
          Try it for 14 days. Full refund, no questions asked, and the
          roadmap stays yours.
        </p>
        <a
          href={STRIPE_CHECKOUT_URL}
          className="mt-4 block rounded-lg bg-brand px-6 py-3 text-center font-medium text-black"
        >
          Start my 90-day recovery
        </a>
      </section>
    </main>
  );
}