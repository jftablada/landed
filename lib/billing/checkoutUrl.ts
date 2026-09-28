const LIVE_CHECKOUT_URL = 'https://buy.stripe.com/00wbITdDtgag2rV9Ez5gc02';

export function resolveCheckoutUrl(
  deploymentEnvironment: string | undefined,
  testCheckoutUrl: string | undefined,
): string | null {
  if (deploymentEnvironment === 'production') return LIVE_CHECKOUT_URL;

  const candidate = testCheckoutUrl?.trim();
  if (!candidate) return null;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('Test checkout URL is invalid');
  }

  if (url.origin !== 'https://buy.stripe.com' || !url.pathname.startsWith('/test_')) {
    throw new Error('Non-production checkout must use a Stripe test payment link');
  }

  return candidate;
}
