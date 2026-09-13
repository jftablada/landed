import { beforeEach, describe, expect, it, vi } from 'vitest';
import Stripe from 'stripe';

const upsert = vi.fn();
vi.mock('@supabase/supabase-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
  return {
    ...actual,
    createClient: () => ({ from: () => ({ upsert }) }),
  };
});

import { POST } from './route';

const secret = 'whsec_test_secret';

function eventPayload(paymentLink = 'plink_landed') {
  return JSON.stringify({
    id: 'evt_1',
    object: 'event',
    api_version: '2026-08-27.basil',
    created: 1_700_000_000,
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_1',
        object: 'checkout.session',
        payment_link: paymentLink,
        payment_status: 'paid',
        amount_total: 499,
        currency: 'cad',
        customer_details: { email: ' Buyer@Example.com ' },
      },
    },
  });
}

function signedRequest(payload: string) {
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return new Request('https://www.getlanded.ca/api/stripe/webhook', {
    method: 'POST',
    body: payload,
    headers: { 'stripe-signature': signature },
  });
}

describe('Stripe entitlement webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    process.env.STRIPE_PAYMENT_LINK_ID = 'plink_landed';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_placeholder';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    upsert.mockResolvedValue({ error: null });
  });

  it('rejects an invalid Stripe signature', async () => {
    const response = await POST(
      new Request('https://www.getlanded.ca/api/stripe/webhook', {
        method: 'POST',
        body: eventPayload(),
        headers: { 'stripe-signature': 'invalid' },
      }),
    );
    expect(response.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('ignores purchases from another payment link', async () => {
    const response = await POST(signedRequest(eventPayload('plink_other')));
    expect(response.status).toBe(200);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('records a paid Landed checkout idempotently by session id', async () => {
    const response = await POST(signedRequest(eventPayload()));
    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'buyer@example.com',
        stripe_checkout_session_id: 'cs_1',
        stripe_payment_link_id: 'plink_landed',
        payment_status: 'paid',
      }),
      { onConflict: 'stripe_checkout_session_id', ignoreDuplicates: true },
    );
  });
});
