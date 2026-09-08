import Link from 'next/link';

export const metadata = {
  title: 'About Landed',
  description:
    'Learn why Landed was built and how it helps Canadians navigate an income change.',
};

const capabilities = [
  'Turn your cash and essential monthly costs into a clear view of your financial runway.',
  'Prioritize the next steps that matter most for your current level of pressure.',
  'Adapt your roadmap as your finances and job search change.',
  'Point you toward official Canadian resources without making eligibility claims.',
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-canvas text-text">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-6">
        <Link
          href="/"
          className="font-display text-xl tracking-widest text-text"
        >
          LANDED
        </Link>
        <Link
          href="/login"
          className="text-sm text-muted transition-colors hover:text-text"
        >
          Sign in
        </Link>
      </nav>

      <section className="border-y border-hair">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
          <p className="text-sm uppercase tracking-[0.2em] text-brand">
            About Landed
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-none text-text sm:text-7xl">
            A steadier next step after income changes.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Landed is a Canadian planning tool for people navigating a layoff,
            contract ending, or career transition. It turns the facts you
            provide into a clear view of your financial runway and a focused
            plan for what to do next.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
        <section className="grid gap-8 border-b border-hair pb-16 md:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-display text-3xl text-text">What Landed does</h2>
          <ul className="space-y-4">
            {capabilities.map((capability) => (
              <li
                key={capability}
                className="flex gap-3 text-base leading-relaxed text-muted"
              >
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>{capability}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-8 border-b border-hair py-16 md:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-display text-3xl text-text">Why it exists</h2>
          <div className="space-y-5 text-base leading-relaxed text-muted">
            <p>
              Losing income creates two problems at once: financial decisions
              become urgent while the work of finding what comes next is just
              beginning.
            </p>
            <p>
              Landed was built to replace a pile of generic advice with a
              short, situation-aware sequence of next steps. The goal is not to
              predict the future. It is to help you see your position clearly
              and make the next useful move.
            </p>
          </div>
        </section>

        <section className="grid gap-8 border-b border-hair py-16 md:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-display text-3xl text-text">Founder-led support</h2>
          <div className="space-y-5 text-base leading-relaxed text-muted">
            <p>
              Landed is led by founder Justin Tablada. It is an early product,
              built carefully and improved through direct feedback from the
              people using it.
            </p>
            <p>
              Questions sent to{' '}
              <a
                href="mailto:hello@getlanded.ca"
                className="text-text underline decoration-brand underline-offset-4 hover:text-brand"
              >
                hello@getlanded.ca
              </a>{' '}
              reach the founder directly.
            </p>
          </div>
        </section>

        <section className="grid gap-8 border-b border-hair py-16 md:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-display text-3xl text-text">Your information</h2>
          <div className="space-y-5 text-base leading-relaxed text-muted">
            <p>
              Your roadmap is tied to your signed-in account. Landed uses the
              information you submit to calculate and update your plan.
            </p>
            <p>
              Financial snapshots and roadmaps are kept as a record of what you
              were shown at that moment, rather than being silently rewritten
              when the product changes.
            </p>
          </div>
        </section>

        <section className="grid gap-8 py-16 md:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-display text-3xl text-text">An important boundary</h2>
          <div className="rounded-xl border border-hair bg-surface p-6 text-sm leading-relaxed text-muted">
            Landed provides general planning information. It is not legal,
            financial, tax, or eligibility advice. Government agencies and
            qualified professionals make eligibility decisions and can provide
            advice for your circumstances.
          </div>
        </section>

        <section className="rounded-xl border border-brand/30 bg-surface px-6 py-10 text-center sm:px-10">
          <h2 className="font-display text-4xl text-text">
            Ready to see your starting point?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
            See how Landed works, or sign in to continue an existing plan.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="rounded-lg bg-brand px-6 py-3 font-medium text-black transition-opacity hover:opacity-90"
            >
              See how Landed works
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted underline underline-offset-4 hover:text-text"
            >
              Sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
