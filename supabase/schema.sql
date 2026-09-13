-- ════════════════════════════════════════════════════════════════════
-- Landed — V1 Supabase Schema
-- Append-only. Intake snapshots are immutable. Roadmaps reference a
-- specific snapshot. Check-ins link the previous roadmap to the new one.
--
-- Design rules encoded here:
--   • Intakes are NEVER updated — each financial change = new row.
--   • burn_items belong to an intake snapshot (re-created each snapshot).
--   • roadmaps reference exactly one intake snapshot.
--   • check_ins record the transition: previous roadmap → new roadmap.
--   • A "journey" groups all snapshots of one recovery episode.
--   • All financial data is user-owned and RLS-locked to the owner.
--
-- V1 ONLY. No fragility, Days Bought Back, identity, or shock tables.
-- ════════════════════════════════════════════════════════════════════

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────────
-- profiles — 1:1 extension of auth.users
-- ────────────────────────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  email       text,
  province    text                       -- default province, may be overridden per intake
);

-- ────────────────────────────────────────────────────────────────────
-- journeys — one recovery episode. Groups all snapshots over time.
-- A user can have more than one over their life (re-layoff = new journey).
-- ────────────────────────────────────────────────────────────────────
create table journeys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  status      text not null default 'active',  -- active | landed | abandoned
  -- The situation that opened this journey (laid_off, non_renewal, ...).
  -- Captured once; subsequent snapshots inherit the journey context.
  situation_type text not null
);

create index idx_journeys_user on journeys(user_id);

-- ────────────────────────────────────────────────────────────────────
-- intakes — IMMUTABLE financial + situation snapshots (append-only).
-- One row per submission or check-in. NEVER updated after insert.
-- ────────────────────────────────────────────────────────────────────
create table intakes (
  id          uuid primary key default gen_random_uuid(),
  journey_id  uuid not null references journeys(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),

  -- Source of this snapshot: the first intake, or a later check-in.
  -- V1 reaches only these two values; no 'update' path exists.
  source      text not null default 'intake'
    check (source in ('intake', 'checkin')),

  -- Situation / context
  -- NOTE: situation_type is intentionally NOT here. It is journey-level
  -- (see journeys.situation_type) and immutable for the episode. The
  -- /api/intake payload carries it only to create/find the journey.
  employment_type text not null,   -- employee | sole_proprietor | incorporated
  housing_type    text not null,   -- rent | own
  province        text not null,
  dependents_count int not null default 0,
  job_target      text,

  -- Financial inputs (the runway-critical fields)
  confirmed_cash  numeric not null,
  essential_burn  numeric not null check (essential_burn > 0),
  debt_minimums   numeric not null default 0,

  -- Tax obligation
  tax_obligation_status text not null,          -- none | has_amount | unsure | on_plan
  tax_obligation_amount numeric,                -- required when status = has_amount
  tax_plan_monthly      numeric,                -- required when status = on_plan

  -- Income signals
  ei_status         text not null default 'not_applied', -- not_applied|applied|approved|receiving|not_eligible
  ei_monthly_amount numeric,

  -- Contractor upside
  pending_invoice_amount    numeric,
  pending_invoice_confirmed boolean not null default false,

  upside_notes text,

  -- Conditional integrity: enforce the fields each tax status requires.
  constraint tax_amount_required
    check (tax_obligation_status <> 'has_amount' or tax_obligation_amount is not null),
  constraint tax_plan_required
    check (tax_obligation_status <> 'on_plan' or tax_plan_monthly is not null)
);

create index idx_intakes_journey on intakes(journey_id, created_at);
create index idx_intakes_user on intakes(user_id);

-- Guard immutability at the DB level: block UPDATE on intakes.
-- Append-only means corrections are new rows, never edits.
create or replace function block_intake_update()
returns trigger language plpgsql as $$
begin
  raise exception 'intakes are append-only and cannot be updated';
end;
$$;

create trigger trg_intakes_no_update
  before update on intakes
  for each row execute function block_intake_update();

-- ────────────────────────────────────────────────────────────────────
-- burn_items — itemized burn for ONE intake snapshot.
-- Re-created with each snapshot (append-only, like its parent intake).
-- ────────────────────────────────────────────────────────────────────
create table burn_items (
  id          uuid primary key default gen_random_uuid(),
  intake_id   uuid not null references intakes(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  category    text not null,   -- housing|groceries|phone|transport|utilities|internet|debt|dependents|other
  amount      numeric,
  skipped     boolean not null default false,
  is_estimate boolean not null default false
);

create index idx_burn_items_intake on burn_items(intake_id);

-- ────────────────────────────────────────────────────────────────────
-- roadmaps — output generated FROM a specific intake snapshot.
-- Immutable record of what the user was shown and the computed state.
-- ────────────────────────────────────────────────────────────────────
create table roadmaps (
  id          uuid primary key default gen_random_uuid(),
  intake_id   uuid not null references intakes(id) on delete cascade,
  journey_id  uuid not null references journeys(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),

  -- Computed by computeMode (server-side, hardcoded — never the AI).
  -- NULLABLE because a blocked roadmap (tax_unsure) has neither a mode
  -- nor a runway. The check constraint below enforces the relationship:
  -- non-blocked rows MUST have both; blocked rows may have neither.
  computed_mode      text,                 -- critical|survival|balanced|strategic
  runway_weeks       numeric,
  runway_date        date,
  net_monthly_gap    numeric,
  display_state      text,                 -- exhausted|critical|normal (presentation)

  -- Blocked state (tax unsure → no AI call, holding response shown).
  blocked      boolean not null default false,
  block_reason text,

  -- Full structured AI output (acknowledgment, pressure points, next move,
  -- phases, tools surfaced). Stored verbatim for history + diffing.
  output_json  jsonb,

  -- A non-blocked roadmap must carry a computed mode and runway.
  -- A blocked roadmap may have neither. This makes the audit-trail
  -- decision (blocked rows are real rows) a database guarantee.
  constraint roadmap_mode_runway_unless_blocked
    check (
      blocked = true
      or (computed_mode is not null and runway_weeks is not null)
    )
);

create index idx_roadmaps_journey on roadmaps(journey_id, created_at);
create index idx_roadmaps_intake on roadmaps(intake_id);

-- One roadmap per intake snapshot in V1 (regenerate = new intake).
create unique index uniq_roadmap_per_intake on roadmaps(intake_id);

-- ────────────────────────────────────────────────────────────────────
-- check_ins — the transition record. Links previous roadmap → new one.
-- This is what the "reality changed, so the plan changed" logic reads.
-- ────────────────────────────────────────────────────────────────────
create table check_ins (
  id                  uuid primary key default gen_random_uuid(),
  journey_id          uuid not null references journeys(id) on delete cascade,
  user_id             uuid not null references profiles(id) on delete cascade,
  created_at          timestamptz not null default now(),

  -- The roadmap the user was on before this check-in (null for the first).
  previous_roadmap_id uuid references roadmaps(id) on delete set null,
  -- The roadmap generated after this check-in.
  new_roadmap_id      uuid not null references roadmaps(id) on delete cascade,

  -- Did the mode change between previous and new? (for transition copy)
  mode_changed        boolean not null default false,
  previous_mode       text,
  new_mode            text,

  -- What the user reported changing (free-form note or structured later).
  change_summary      text,

  -- Job-search activity reported for this check-in period.
  applications_submitted integer,
  employer_responses     integer,
  interviews_secured     integer,
  offers_received        integer
    constraint check_ins_offers_received_range
    check (offers_received is null or offers_received between 0 and 10000),
  biggest_barrier        text
);

create index idx_check_ins_journey on check_ins(journey_id, created_at);

-- ────────────────────────────────────────────────────────────────────
-- roadmap_task_progress — mutable completion state for tasks derived
-- from an immutable roadmap. Task wording remains in output_json.
-- ────────────────────────────────────────────────────────────────────
create table roadmap_task_progress (
  id           uuid primary key default gen_random_uuid(),
  roadmap_id   uuid not null references roadmaps(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  task_key     text not null,
  completed    boolean not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint roadmap_task_progress_key_format
    check (
      task_key in ('adaptive_priority', 'next_move')
      or task_key ~ '^phase_[0-9]+_action_[0-9]+$'
    ),
  constraint roadmap_task_progress_completed_at
    check (
      (completed = true and completed_at is not null)
      or (completed = false and completed_at is null)
    ),
  constraint uniq_roadmap_task_progress unique (roadmap_id, task_key)
);

create index idx_roadmap_task_progress_user
  on roadmap_task_progress(user_id, roadmap_id);

-- ────────────────────────────────────────────────────────────────────
-- purchase_entitlements — server-written Stripe fulfillment records.
-- Clients never read this table directly; has_landed_access() exposes
-- only the boolean needed to gate paid product creation.
-- ────────────────────────────────────────────────────────────────────
create table purchase_entitlements (
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

create index idx_purchase_entitlements_email
  on purchase_entitlements(email);

-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Every table holds user-owned financial data. Lock all access to the
-- authenticated owner. No cross-user reads, ever.
-- ════════════════════════════════════════════════════════════════════

alter table profiles   enable row level security;
alter table journeys   enable row level security;
alter table intakes    enable row level security;
alter table burn_items enable row level security;
alter table roadmaps   enable row level security;
alter table check_ins  enable row level security;
alter table roadmap_task_progress enable row level security;
alter table purchase_entitlements enable row level security;

revoke all on table roadmap_task_progress from anon;
grant select, insert, update on table roadmap_task_progress to authenticated;
revoke all on table purchase_entitlements from anon, authenticated;

create or replace function has_landed_access()
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

revoke all on function has_landed_access() from public, anon;
grant execute on function has_landed_access() to authenticated;

-- profiles: a user sees and edits only their own profile row.
create policy profiles_select on profiles
  for select using (id = auth.uid());
create policy profiles_insert on profiles
  for insert with check (id = auth.uid());
create policy profiles_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Generic owner policies for the rest. SELECT + INSERT only by default;
-- intakes get NO update (immutable, also enforced by trigger); we omit
-- UPDATE/DELETE policies so they are denied unless explicitly added.

-- journeys
create policy journeys_select on journeys
  for select using (user_id = auth.uid());
create policy journeys_insert on journeys
  for insert with check (user_id = auth.uid());
create policy journeys_update on journeys
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- intakes — insert + select only. No update policy (append-only).
create policy intakes_select on intakes
  for select using (user_id = auth.uid());
create policy intakes_insert on intakes
  for insert with check (user_id = auth.uid());

-- burn_items — insert + select only (immutable with their parent intake).
create policy burn_items_select on burn_items
  for select using (user_id = auth.uid());
create policy burn_items_insert on burn_items
  for insert with check (user_id = auth.uid());

-- roadmaps — insert + select only (immutable record).
create policy roadmaps_select on roadmaps
  for select using (user_id = auth.uid());
create policy roadmaps_insert on roadmaps
  for insert with check (user_id = auth.uid());

-- check_ins — insert + select only.
create policy check_ins_select on check_ins
  for select using (user_id = auth.uid());
create policy check_ins_insert on check_ins
  for insert with check (user_id = auth.uid());

-- roadmap task progress — mutable, but only for tasks on the owner's roadmap.
create policy roadmap_task_progress_select on roadmap_task_progress
  for select using (user_id = auth.uid());
create policy roadmap_task_progress_insert on roadmap_task_progress
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_task_progress.roadmap_id
        and roadmaps.user_id = auth.uid()
    )
  );
create policy roadmap_task_progress_update on roadmap_task_progress
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_task_progress.roadmap_id
        and roadmaps.user_id = auth.uid()
    )
  );

-- ════════════════════════════════════════════════════════════════════
-- NOTES / ASSUMPTIONS
--
-- 1. user_id is denormalized onto every table (not just journey) so RLS
--    policies are a single-column check with no joins. Faster + simpler
--    policies. The tradeoff is you must set user_id on insert everywhere;
--    do it server-side from auth.uid(), never from client input.
--
-- 2. Writes should go through server routes (service layer) that set
--    user_id = the authenticated user. RLS is the backstop, not the only
--    line of defense.
--
-- 3. computeMode runs server-side BEFORE any AI call. roadmaps.computed_mode
--    / runway_weeks / display_state are written from its output, never the
--    AI's. A blocked intake (tax unsure) writes a roadmap row with
--    blocked = true and no output_json.
--
-- 4. Regeneration in V1 = new intake snapshot + new roadmap. The unique
--    index uniq_roadmap_per_intake enforces one roadmap per snapshot.
--
-- 5. on delete cascade everywhere a child cannot outlive its parent.
--    Deleting a profile removes the user's entire financial history —
--    intended for account deletion / right-to-erasure.
-- ════════════════════════════════════════════════════════════════════
