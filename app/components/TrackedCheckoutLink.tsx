'use client';

import type { ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';

export default function TrackedCheckoutLink({
  href,
  className,
  children,
}: {
  href: string | null;
  className: string;
  children: ReactNode;
}) {
  if (!href) {
    return (
      <p className="mt-8 text-sm text-muted">
        Test checkout is being configured.
      </p>
    );
  }

  return (
    <a
      href={href}
      className={className}
      onClick={() => trackEvent('begin_checkout')}
    >
      {children}
    </a>
  );
}
