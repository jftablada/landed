-- roadmap_task_progress — deployable current definition
--
-- Task wording stays in the immutable roadmap output. This table stores
-- only mutable completion state for the stable task keys derived from it.

begin;

create table if not exists public.roadmap_task_progress (
  id           uuid primary key default gen_random_uuid(),
  roadmap_id   uuid not null references public.roadmaps(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
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

create index if not exists idx_roadmap_task_progress_user
  on public.roadmap_task_progress(user_id, roadmap_id);

alter table public.roadmap_task_progress enable row level security;

revoke all on table public.roadmap_task_progress from anon;
grant select, insert, update on table public.roadmap_task_progress
  to authenticated;

drop policy if exists roadmap_task_progress_select
  on public.roadmap_task_progress;
create policy roadmap_task_progress_select on public.roadmap_task_progress
  for select using (user_id = auth.uid());

drop policy if exists roadmap_task_progress_insert
  on public.roadmap_task_progress;
create policy roadmap_task_progress_insert on public.roadmap_task_progress
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.roadmaps
      where roadmaps.id = roadmap_task_progress.roadmap_id
        and roadmaps.user_id = auth.uid()
    )
  );

drop policy if exists roadmap_task_progress_update
  on public.roadmap_task_progress;
create policy roadmap_task_progress_update on public.roadmap_task_progress
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.roadmaps
      where roadmaps.id = roadmap_task_progress.roadmap_id
        and roadmaps.user_id = auth.uid()
    )
  );

commit;
