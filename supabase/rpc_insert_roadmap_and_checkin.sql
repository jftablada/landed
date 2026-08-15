-- ════════════════════════════════════════════════════════════════════
-- insert_roadmap_and_checkin — atomic roadmap + check_in insert (V1)
--
-- WHY AN RPC: the Supabase JS client cannot run a true multi-statement
-- transaction. Two separate .insert() calls are two auto-committed
-- statements; a crash between them orphans the roadmap and breaks the
-- idempotency guarantee (roadmap-exists must imply check_in-exists).
-- A Postgres function body runs as ONE transaction, so both inserts
-- commit together or not at all. This is the load-bearing guarantee.
--
-- IDEMPOTENCY: the function first checks for an existing roadmap on the
-- intake. If one exists, it returns it and inserts NOTHING — no duplicate
-- roadmap, no duplicate check_in. The unique index uniq_roadmap_per_intake
-- is the hard backstop if two calls race.
--
-- SECURITY: SECURITY INVOKER (default) so RLS applies as the calling user.
-- The function never trusts a passed user_id beyond matching auth.uid();
-- it asserts p_user_id = auth.uid() and refuses otherwise.
-- ════════════════════════════════════════════════════════════════════

begin;

-- Replacing the old signature requires an explicit drop. Otherwise Postgres
-- keeps both signatures as overloads and PostgREST cannot resolve the RPC.
drop function if exists public.insert_roadmap_and_checkin(
  uuid, uuid, uuid, text, numeric, date, numeric, text, boolean, text, jsonb,
  uuid, boolean, text, text, text
);

create or replace function public.insert_roadmap_and_checkin(
  -- roadmap fields
  p_intake_id       uuid,
  p_journey_id      uuid,
  p_user_id         uuid,
  p_computed_mode   text,        -- null allowed only when p_blocked = true
  p_runway_weeks    numeric,     -- null allowed only when p_blocked = true
  p_runway_date     date,
  p_net_monthly_gap numeric,
  p_display_state   text,
  p_blocked         boolean,
  p_block_reason    text,
  p_output_json     jsonb,
  -- check_in fields
  p_previous_roadmap_id uuid,
  p_mode_changed        boolean,
  p_previous_mode       text,
  p_new_mode            text,
  p_change_summary      text,
  p_applications_submitted integer default null,
  p_employer_responses     integer default null,
  p_interviews_secured     integer default null,
  p_biggest_barrier        text default null
)
returns jsonb
language plpgsql
-- SECURITY INVOKER is the default; stated explicitly for intent.
security invoker
as $$
declare
  v_existing_roadmap roadmaps%rowtype;
  v_new_roadmap_id   uuid;
  v_new_checkin_id   uuid;
  v_result           jsonb;
begin
  -- ── Identity guard: the caller's user_id MUST be the authenticated user.
  -- auth.uid() is the session user; p_user_id must match it. This blocks
  -- any attempt to write rows on behalf of another user.
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'forbidden: user mismatch'
      using errcode = '42501'; -- insufficient_privilege
  end if;

  -- ── Ownership guard: the intake must belong to the caller. Selecting
  -- under RLS already restricts to owned rows, but assert explicitly so a
  -- missing/foreign intake fails loudly rather than inserting an orphan.
  perform 1 from intakes
    where id = p_intake_id and user_id = p_user_id;
  if not found then
    raise exception 'not found: intake'
      using errcode = 'P0002'; -- no_data_found
  end if;

  -- ── IDEMPOTENCY: if a roadmap already exists for this intake, return it
  -- and insert nothing. One roadmap per intake (also enforced by index).
  select * into v_existing_roadmap
    from roadmaps
    where intake_id = p_intake_id and user_id = p_user_id
    limit 1;

  if found then
    return jsonb_build_object(
      'status', 'existing',
      'roadmap_id', v_existing_roadmap.id,
      'blocked', v_existing_roadmap.blocked
    );
  end if;

  -- ── Defensive integrity: mirror the table check constraint so a bad
  -- call fails here with a clear message rather than a constraint error.
  if not p_blocked and (p_computed_mode is null or p_runway_weeks is null) then
    raise exception 'invalid: non-blocked roadmap requires mode and runway'
      using errcode = '23514'; -- check_violation
  end if;

  -- ── INSERT roadmap (append-only) ──────────────────────────────────
  insert into roadmaps (
    intake_id, journey_id, user_id,
    computed_mode, runway_weeks, runway_date, net_monthly_gap, display_state,
    blocked, block_reason, output_json
  ) values (
    p_intake_id, p_journey_id, p_user_id,
    p_computed_mode, p_runway_weeks, p_runway_date, p_net_monthly_gap, p_display_state,
    p_blocked, p_block_reason, p_output_json
  )
  returning id into v_new_roadmap_id;

  -- ── INSERT check_in in the SAME transaction (this function body) ────
  insert into check_ins (
    journey_id, user_id,
    previous_roadmap_id, new_roadmap_id,
    mode_changed, previous_mode, new_mode, change_summary,
    applications_submitted, employer_responses, interviews_secured, biggest_barrier
  ) values (
    p_journey_id, p_user_id,
    p_previous_roadmap_id, v_new_roadmap_id,
    p_mode_changed, p_previous_mode, p_new_mode, p_change_summary,
    p_applications_submitted, p_employer_responses, p_interviews_secured, p_biggest_barrier
  )
  returning id into v_new_checkin_id;

  -- ── Return the freshly created ids and the check_in shape the
  -- orchestrator expects (CheckInRecord).
  v_result := jsonb_build_object(
    'status', 'inserted',
    'roadmap_id', v_new_roadmap_id,
    'check_in', jsonb_build_object(
      'id', v_new_checkin_id,
      'previous_roadmap_id', p_previous_roadmap_id,
      'new_roadmap_id', v_new_roadmap_id,
      'mode_changed', p_mode_changed,
      'previous_mode', p_previous_mode,
      'new_mode', p_new_mode
    )
  );

  return v_result;

exception
  -- If the unique index fires because a concurrent call inserted the
  -- roadmap first, fall back to returning the existing one. This makes
  -- the race safe: both callers end up with the same roadmap, no dup.
  when unique_violation then
    select * into v_existing_roadmap
      from roadmaps
      where intake_id = p_intake_id and user_id = p_user_id
      limit 1;
    return jsonb_build_object(
      'status', 'existing',
      'roadmap_id', v_existing_roadmap.id,
      'blocked', v_existing_roadmap.blocked
    );
end;
$$;

-- Preserve the live execute privileges. RLS and the auth.uid() guard still
-- scope every call to the authenticated owner.
grant execute on function public.insert_roadmap_and_checkin(
  uuid, uuid, uuid, text, numeric, date, numeric, text, boolean, text, jsonb,
  uuid, boolean, text, text, text, integer, integer, integer, text
) to public;

grant execute on function public.insert_roadmap_and_checkin(
  uuid, uuid, uuid, text, numeric, date, numeric, text, boolean, text, jsonb,
  uuid, boolean, text, text, text, integer, integer, integer, text
) to authenticated;

commit;
