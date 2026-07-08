import Link from 'next/link';

const STRIPE_URL = 'https://buy.stripe.com/00wbITdDtgag2rV9Ez5gc02';

/* ── Hand-written inline icons (no dependency) ──────────────── */
const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function MapIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg {...iconProps}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}

function LifeIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 2c1.5 3 3 4.2 4.5 5.5C18 9 18.5 11 18 13l1.5 1-2 .3.4 2-2.2-1.3L14 17v3h-4v-3l-1.7-1.7-2.2 1.3.4-2-2-.3L6 13c-.5-2 0-4 1.5-5.5C9 6.2 10.5 5 12 2Z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas text-text">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <span className="font-display text-xl tracking-widest text-text">
          LANDED
        </span>
        <Link
          href="/login"
          className="text-sm text-muted transition-colors hover:text-text"
        >
          Sign in
        </Link>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-hair">
        {/* background image — atmosphere only */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center sm:bg-right"
          style={{
            backgroundImage: 'url(/images/landed/hero-background.png)',
          }}
        />

        {/* readability overlay: dark left, warmer right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(11,12,13,0.97) 0%, rgba(11,12,13,0.85) 35%, rgba(11,12,13,0.45) 70%, rgba(11,12,13,0.25) 100%)',
          }}
        />

        {/* mobile-only extra darkening — desktop unaffected */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{
            background: 'rgba(11,12,13,0.55)',
          }}
        />

        {/* subtle green brand glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 80% 15%, rgba(29,158,117,0.14) 0%, rgba(11,12,13,0) 60%)',
          }}
        />

        {/* bottom fade into trust strip */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,12,13,0) 0%, rgba(11,12,13,1) 100%)',
          }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pt-14 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left: message */}
          <div>
            <p className="mb-5 text-sm uppercase tracking-widest text-brand">
              90-day career recovery sprint
            </p>
            <h1 className="font-display text-5xl leading-[1.02] text-text sm:text-6xl">
              You just got the call.
              <br />
              <span className="text-brand">Now what?</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              A structured 90-day sprint for people dealing with a layoff,
              contract ending, or sudden job-search pressure. A clear plan,
              weekly momentum, and Canadian context — instead of “just keep
              applying.”
            </p>

            {/* three value points */}
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                {
                  icon: <MapIcon />,
                  title: 'A clear 90-day roadmap',
                  body: 'Guidance that keeps you moving.',
                },
                {
                  icon: <BoltIcon />,
                  title: 'Momentum, not busywork',
                  body: 'Focused steps, weekly check-ins.',
                },
                {
                  icon: <LifeIcon />,
                  title: 'Built for real disruption',
                  body: 'Layoffs, non-renewals, pivots.',
                },
              ].map((v) => (
                <div key={v.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    {v.icon}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-text">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {v.body}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={STRIPE_URL}
                className="inline-flex w-fit items-center gap-4 rounded-lg bg-brand px-6 py-3.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                Start my 90-day recovery
                <span aria-hidden>→</span>
              </a>
              <div className="text-sm text-muted">
              <p className="font-medium text-text">
                One-time founding customer price.
                </p>
                <p>Secure checkout through Stripe. No subscription.</p>
              </div>
            </div>
          </div>

          {/* Right: coded "path forward" panel (abstract, no image) */}
          <div className="relative">
            <div
              className="relative overflow-hidden rounded-2xl border border-hair p-8"
              style={{
                background:
                  'linear-gradient(160deg, rgba(29,158,117,0.14) 0%, rgba(21,23,26,1) 55%)',
              }}
            >
              <span className="mb-6 block font-display text-5xl text-brand">
                “
              </span>
              <p className="font-display text-2xl leading-snug text-text">
                A system to help you go from blindsided to{' '}
                <span className="text-brand">back on track.</span>
              </p>
              <div className="my-6 h-px w-12 bg-brand" />
              <p className="text-sm leading-relaxed text-muted">
                Built by someone who got non-renewed and needed a clearer plan
                than “just keep applying.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ─────────────────────────────────────── */}
      <section className="border-b border-hair bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:grid-cols-3">
          {[
            {
              icon: <ShieldIcon />,
              title: 'No subscription',
              body: 'One-time founding customer price. No hidden renewal.',
            },
            {
              icon: <LockIcon />,
              title: 'Secure & private',
              body: 'Checkout through Stripe. No hidden renewal.',
            },
            {
              icon: <LeafIcon />,
              title: 'Built for Canadians',
              body: 'Made for layoffs, non-renewals, and career pivots.',
            },
          ].map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <span className="mt-0.5 text-brand">{t.icon}</span>
              <div>
                <p className="font-semibold text-text">{t.title}</p>
                <p className="text-sm leading-relaxed text-muted">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── What happens after you pay ──────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl tracking-wide text-text">
          What happens after you pay
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Pay securely through Stripe',
              body: 'One-time $5 CAD founding customer price. No subscription, nothing to cancel later.',
            },
            {
              n: '02',
              title: 'Founder onboarding within 24 hours',
              body: 'A direct welcome and a 15-minute walkthrough call to start.',
            },
            {
              n: '03',
              title: 'Complete intake, get your roadmap',
              body: 'Answer a focused intake and receive your 90-day plan.',
            },
          ].map((step) => (
            <div
              key={step.n}
              className="rounded-xl border border-hair bg-surface p-6"
            >
              <span className="font-display text-2xl text-brand">{step.n}</span>
              <h3 className="mt-3 text-lg font-semibold text-text">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roadmap preview (signature coded card) ──────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-3xl tracking-wide text-text">
              What your 90 days look like
            </h2>
            <p className="mt-4 max-w-md text-muted">
              Your plan adapts to your situation and updates as you check in.
              This is the shape it follows — not a fixed script, a moving plan.
            </p>
          </div>

          {/* coded dashboard-style preview */}
          <div className="overflow-hidden rounded-2xl border border-hair bg-surface">
            <div className="flex items-center justify-between border-b border-hair px-5 py-3">
              <span className="text-sm font-semibold text-text">
                Your 90-Day Roadmap
              </span>
              <span className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 rounded-full bg-surface-2" />
                <span className="h-2.5 w-2.5 rounded-full bg-surface-2" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand-soft" />
              </span>
            </div>
            <div className="divide-y divide-hair">
              {[
                {
                  phase: 'Stabilize',
                  days: 'First week',
                  body: 'Steady your cash, sort EI/ROE, ease immediate pressure.',
                  active: true,
                },
                {
                  phase: 'Focus',
                  days: 'Weeks 2–4',
                  body: 'Narrow your search, tighten your story, start outreach.',
                  active: false,
                },
                {
                  phase: 'Momentum',
                  days: 'Weeks 5–12',
                  body: 'Keep opportunities moving, track interviews, adjust weekly.',
                  active: false,
                },
              ].map((row) => (
                <div
                  key={row.phase}
                  className="flex items-start gap-4 px-5 py-4"
                >
                  <span
                    className={`mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      row.active
                        ? 'bg-brand text-black'
                        : 'bg-surface-2 text-muted'
                    }`}
                  >
                    ✓
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-text">{row.phase}</p>
                      <span className="text-xs uppercase tracking-widest text-muted">
                        {row.days}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {row.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-5 py-16">
        <div className="rounded-2xl border border-hair bg-surface p-8 sm:p-10">
          <p className="text-sm uppercase tracking-widest text-muted">
            Landed — 90-Day Career Recovery Sprint
          </p>
          <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-6xl text-text">$5</span>
          <span className="text-muted">CAD · one-time founding customer price</span>
          </div>

          <ul className="mt-8 space-y-3">
            {[
              '90-Day Recovery Roadmap',
              'Check-ins that update your plan',
              'Canadian context layer',
              'Founder onboarding within 24 hours',
              '15-minute walkthrough call at the start',
              'Week-2 and Week-4 check-ins',
              'One-time founding customer price',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-text">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
                >
                  ✓
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          <a
            href={STRIPE_URL}
            className="mt-8 block rounded-lg bg-brand px-8 py-4 text-center text-base font-semibold text-black transition-opacity hover:opacity-90"
          >
            Start my 90-day recovery
          </a>
          <p className="mt-4 text-center text-sm text-muted">
            Secure checkout through Stripe. No subscription. No hidden renewal.
          </p>
          <p className="mt-2 text-center text-sm text-muted">
          Kept intentionally low-cost while Landed is founder-led.
          </p>
        </div>
      </section>

      {/* ── What's available today ──────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl tracking-wide text-text">
          What’s available today
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {/* available card — visually stronger */}
          <div className="rounded-xl border border-brand/40 bg-surface p-6 ring-1 ring-brand/20">
            <span className="inline-flex w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
              Available now
            </span>
            <h3 className="mt-4 text-lg font-semibold text-text">
              Recovery Roadmap
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your structured 90-day plan, with check-ins and Canadian context.
              This is what your founding customer price gets you today.
            </p>
          </div>

          {/* in-development cards — quieter */}
          {[
            {
              name: 'Interview Prep Studio',
              body: 'Not part of the current sprint. In development.',
            },
            {
              name: 'Contractor-to-Permanent Playbook',
              body: 'Not part of the current sprint. In development.',
            },
          ].map((p) => (
            <div
              key={p.name}
              className="rounded-xl border border-hair bg-surface/50 p-6"
            >
              <span className="inline-flex w-fit rounded-full border border-hair bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
                In development
              </span>
              <h3 className="mt-4 text-lg font-semibold text-muted">
                {p.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="font-display text-4xl leading-tight text-text sm:text-5xl">
          Take back control of what’s next.
        </h2>
        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href={STRIPE_URL}
            className="inline-block rounded-lg bg-brand px-8 py-4 text-base font-semibold text-black transition-opacity hover:opacity-90"
          >
            Start my 90-day recovery
          </a>
          <p className="text-sm text-muted">
          $5 CAD · one-time founding customer price · no subscription
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-hair">
        <div className="mx-auto max-w-6xl px-5 py-10 text-center">
          <p className="text-sm text-muted">
            Landed · A 90-day career recovery sprint ·{' '}
            <Link href="/login" className="underline hover:text-text">
              Sign in
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}