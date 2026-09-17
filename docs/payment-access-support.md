# Payment access support

Use this procedure only when a customer has paid through Landed's Stripe
Payment Link but created their Landed account with a different email address.

1. In Stripe, confirm that the Checkout Session is paid and came from Landed's
   current Payment Link.
2. In Supabase, find the entitlement using the normalized Stripe checkout
   email:

   ```sql
   select id, email, stripe_checkout_session_id, stripe_payment_link_id,
          payment_status, amount_total, currency, purchased_at
   from public.purchase_entitlements
   where email = lower(trim('<stripe-email>'));
   ```

3. Confirm the customer controls the Landed account email they want to use.
4. Link the verified purchase to that account by changing only the entitlement
   email:

   ```sql
   update public.purchase_entitlements
   set email = lower(trim('<landed-account-email>'))
   where stripe_checkout_session_id = '<verified-checkout-session-id>'
     and payment_status <> 'unpaid'
   returning email, stripe_checkout_session_id, payment_status;
   ```

5. Confirm exactly one row was returned. Ask the customer to sign out and back
   in before retrying.

Never create an entitlement without first verifying the paid Checkout Session
in Stripe. Never copy passwords, authentication codes, or payment-card details
into Supabase.

## Missed or delayed webhook

If a paid customer has no entitlement row, first check the matching event in
Stripe Workbench and its webhook delivery status. Stripe retries failed
deliveries. If the event is permanently missed, use its verified Checkout
Session values to insert the entitlement, then confirm the inserted row before
replying to the customer.

## Grandfather access

`has_landed_access()` also permits users who own an intake created before
`2026-09-13 21:41:04 UTC`, when payment enforcement reached production. This
timestamp makes the legacy cohort permanent and fixed: a newer intake can never
grant access on its own. `POST /api/intake` still checks entitlement before it
writes any intake row.
