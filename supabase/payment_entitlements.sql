-- Stripe-backed access to Landed's paid roadmap. Rerunnable.
create table if not exists public.purchase_entitlements (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  stripe_checkout_session_id text not null unique,
  stripe_payment_link_id text not null,
  payment_status text not null,
  amount_total integer,
  currency text,
  purchased_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint purchase_entitlements_email_normalized
    check (email = lower(trim(email)))
);

create index if not exists idx_purchase_entitlements_email
  on public.purchase_entitlements(email);

alter table public.purchase_entitlements enable row level security;
revoke all on table public.purchase_entitlements from anon, authenticated;

create or replace function public.has_landed_access()
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select
    exists (
      select 1 from public.purchase_entitlements
      where email = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
        and payment_status <> 'unpaid'
    )
    or exists (
      select 1 from public.intakes where user_id = auth.uid()
    );
$$;

revoke all on function public.has_landed_access() from public, anon;
grant execute on function public.has_landed_access() to authenticated;
