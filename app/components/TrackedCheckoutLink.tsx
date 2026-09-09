'use client';

import type { ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';

export default function TrackedCheckoutLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
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
