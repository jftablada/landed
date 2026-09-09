type AnalyticsParameters = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  eventName: string,
  parameters?: AnalyticsParameters,
) {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', eventName, parameters);
}

export function trackPageView(pathname: string) {
  if (typeof window === 'undefined') return;
  const safePath = pathname.replace(/^\/roadmap\/[^/]+$/, '/roadmap/:id');
  window.gtag?.('event', 'page_view', {
    page_location: `${window.location.origin}${safePath}`,
    page_path: safePath,
  });
}
