'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import OnboardingProgress from '@/app/components/OnboardingProgress';
import { trackEvent } from '@/lib/analytics';

export default function WelcomeClient() {
  useEffect(() => {
    trackEvent('checkout_welcome_viewed');
  }, []);

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-12 sm:py-20">
      <OnboardingProgress
        currentStep={2}
        detail="Your payment is complete. Next, create the private account where your roadmap will live."
      />

      <p className="text-sm uppercase tracking-widest text-brand">
        Payment received
      </p>
      <h1 className="mt-3 font-display text-5xl leading-tight text-text">
        Welcome to Landed.
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        Your next step is to create your Landed account. It usually takes about
        two minutes.
      </p>

      <section className="mt-8 rounded-2xl border border-hair bg-surface p-6 sm:p-8">
        <ol className="space-y-6">
          {[
            {
              title: 'Use the email from checkout',
              body: 'This keeps your payment and Landed access easy to match if you need support.',
            },
            {
              title: 'Create a password',
              body: 'Choose Create account on the next screen, then check your inbox or junk folder for the confirmation email.',
            },
            {
              title: 'Build your private roadmap',
              body: 'Answer the focused intake and Landed will generate your runway, priorities, and first tasks.',
            },
          ].map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                {index + 1}
              </span>
              <div>
                <h2 className="font-semibold text-text">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/login?checkout=success"
          onClick={() => trackEvent('checkout_account_setup_clicked')}
          className="mt-8 block rounded-lg bg-brand px-6 py-4 text-center font-semibold text-black transition-opacity hover:opacity-90"
        >
          Create my Landed account
        </Link>
        <p className="mt-3 text-center text-xs leading-relaxed text-muted">
          Already created your account? Use the same button, then choose Sign
          in.
        </p>
      </section>

      <div className="mt-6 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-center sm:gap-5">
        <Link href="/forgot-password" className="underline hover:text-text">
          Reset my password
        </Link>
        <a
          href="mailto:hello@getlanded.ca"
          className="underline hover:text-text"
        >
          Email hello@getlanded.ca
        </a>
      </div>
    </main>
  );
}
