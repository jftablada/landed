import Link from 'next/link';

const STRIPE_URL = 'https://buy.stripe.com/3cIdR1eHx9LS9Un9Ez5gc00';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas text-text">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
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
      <section className="relative overflow-hidden">
        {/* ambient brand-soft glow for depth, not decoration */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 0%, rgba(20,84,63,0.55) 0%, rgba(20,84,63,0) 70%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-5 pt-16 pb-20 text-center">
          <p className="mb-4 text-sm uppercase tracking-widest text-brand">
            90-day career recovery sprint
          </p>
          <h1 className="font-display text-5xl leading-[1.05] text-text sm:text-6xl">
            You just got the call.
            <br />
            Now what?
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
            A structured 90-day sprint for people dealing with a layoff,
            contract ending, or sudden job-search pressure. A clear plan, weekly
            momentum, and Canadian context — instead of “just keep applying.”
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <a
              href={STRIPE_URL}
              className="inline-block rounded-lg bg-brand px-8 py-4 text-base font-semibold text-black transition-opacity hover:opacity-90"
            >
              Start my 90-day recovery
            </a>
            <p className="text-sm text-muted">
              $79 CAD · one-time · 14-day full refund
            </p>
          </div>

          <p className="mx-auto mt-10 max-w-md border-t border-hair pt-6 text-sm leading-relaxed text-muted">
            Built by someone who got non-renewed and needed a clearer plan than
            “just keep applying.”
          </p>
        </div>
      </section>

      {/* ── The promise ─────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="rounded-2xl border border-hair bg-surface p-8 sm:p-10">
          <p className="text-sm uppercase tracking-widest text-muted">
            The 90-day promise
          </p>
          <p className="mt-4 text-xl leading-relaxed text-text sm:text-2xl">
            In 90 days, you go from blindsided and scrambling to running a job
            search you actually control — with a clear plan, real momentum, and
            your confidence back.
          </p>
        </div>
      </section>

      {/* ── What happens after you pay ──────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-3xl tracking-wide text-text">
          What happens after you pay
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              n: '01',
              title: 'Pay securely through Stripe',
              body: 'One-time $79 CAD. No subscription, no account to cancel later.',
            },
            {
              n: '02',
              title: 'Founder onboarding within 24 hours',
              body: 'A direct welcome and a 15-minute walkthrough call to start you off right.',
            },
            {
              n: '03',
              title: 'Complete intake, get your roadmap',
              body: 'Answer a focused intake and receive your personalized 90-day recovery plan.',
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

      {/* ── Roadmap preview (the signature element) ─────────── */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-3xl tracking-wide text-text">
          What your 90 days look like
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Your plan adapts to your situation and updates as you check in. Here is
          the shape it follows.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-hair bg-surface">
          {[
            {
              phase: 'First week',
              label: 'Stabilize',
              items: [
                'Steady your cash and immediate pressure',
                'Sort EI and ROE so nothing stalls',
                'Take the first controlled step',
              ],
            },
            {
              phase: 'Weeks 2–4',
              label: 'Focus',
              items: [
                'Narrow your search to what fits',
                'Tighten how you tell your story',
                'Start deliberate outreach',
              ],
            },
            {
              phase: 'Weeks 5–12',
              label: 'Momentum',
              items: [
                'Keep several opportunities moving',
                'Track interviews as they come',
                'Adjust the plan every week',
              ],
            },
          ].map((row, i) => (
            <div
              key={row.phase}
              className={`grid gap-4 p-6 sm:grid-cols-[160px_1fr] ${
                i > 0 ? 'border-t border-hair' : ''
              }`}
            >
              <div>
                <p className="text-sm uppercase tracking-widest text-brand">
                  {row.phase}
                </p>
                <p className="font-display mt-1 text-2xl text-text">
                  {row.label}
                </p>
              </div>
              <ul className="space-y-2">
                {row.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-muted"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand"
                    />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-5 py-16">
        <div className="rounded-2xl border border-hair bg-surface p-8 sm:p-10">
          <p className="text-sm uppercase tracking-widest text-muted">
            Landed — 90-Day Career Recovery Sprint
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-6xl text-text">$79</span>
            <span className="text-muted">CAD · one-time</span>
          </div>

          <ul className="mt-8 space-y-3">
            {[
              '90-Day Recovery Roadmap',
              'Check-ins that update the plan',
              'Canadian context layer',
              'Direct founder onboarding within 24 hours',
              '15-minute walkthrough call at the start',
              'Week-2 and Week-4 check-ins',
              '14-day full refund, no questions',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-text">
                <span
                  aria-hidden
                  className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
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
            14-day full refund, no questions. You keep your roadmap after a
            refund.
          </p>
        </div>
      </section>

      {/* ── What's available today ──────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-3xl tracking-wide text-text">
          What’s available today
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              name: 'Recovery Roadmap',
              status: 'Available now',
              available: true,
              body: 'Your structured 90-day plan, with check-ins and Canadian context.',
            },
            {
              name: 'Interview Prep Studio',
              status: 'In development',
              available: false,
              body: 'Not part of the current sprint. In development.',
            },
            {
              name: 'Contractor-to-Permanent Playbook',
              status: 'In development',
              available: false,
              body: 'Not part of the current sprint. In development.',
            },
          ].map((product) => (
            <div
              key={product.name}
              className="flex flex-col rounded-xl border border-hair bg-surface p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-text">
                  {product.name}
                </h3>
              </div>
              <span
                className={`mt-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                  product.available
                    ? 'bg-brand-soft text-brand'
                    : 'border border-hair bg-surface-2 text-muted'
                }`}
              >
                {product.status}
              </span>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {product.body}
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
            $79 CAD · one-time · 14-day full refund
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="mx-auto max-w-5xl px-5 py-10 text-center">
        <p className="text-sm text-muted">
          Landed · A 90-day career recovery sprint ·{' '}
          <Link href="/login" className="text-muted underline hover:text-text">
            Sign in
          </Link>
        </p>
      </footer>
    </main>
  );
}