import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const runtime = 'nodejs';

function paymentLinkId(
  paymentLink: string | Stripe.PaymentLink | null,
): string | null {
  if (!paymentLink) return null;
  return typeof paymentLink === 'string' ? paymentLink : paymentLink.id;
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const expectedPaymentLink = process.env.STRIPE_PAYMENT_LINK_ID;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!signature || !webhookSecret || !stripeSecret || !expectedPaymentLink || !serviceRoleKey) {
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeSecret);
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'checkout.session.async_payment_succeeded'
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const linkId = paymentLinkId(session.payment_link);
  const email = session.customer_details?.email?.trim().toLowerCase();

  if (linkId !== expectedPaymentLink) {
    return NextResponse.json({ received: true });
  }
  if (session.payment_status === 'unpaid' || !email) {
    return NextResponse.json({ error: 'Purchase is not fulfilled' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await admin.from('purchase_entitlements').upsert(
    {
      email,
      stripe_checkout_session_id: session.id,
      stripe_payment_link_id: linkId,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      purchased_at: new Date(event.created * 1000).toISOString(),
    },
    { onConflict: 'stripe_checkout_session_id', ignoreDuplicates: true },
  );

  if (error) {
    return NextResponse.json({ error: 'Could not record purchase' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
