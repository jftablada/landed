-- Private paid-user company workspace. Additive; no customer rows are changed.
begin;
create table if not exists public.target_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null check (char_length(btrim(company_name)) between 1 and 120),
  why_fit text not null default '' check (char_length(why_fit) <= 600),
  target_role text not null default '' check (char_length(target_role) <= 120),
  next_step text not null default 'research' check (next_step in ('research', 'contact', 'apply')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists target_companies_owner_name on public.target_companies (user_id, lower(btrim(company_name)));
alter table public.target_companies enable row level security;
revoke all on public.target_companies from anon, authenticated;
grant select, insert, update on public.target_companies to authenticated;
drop policy if exists companies_read_own on public.target_companies;
create policy companies_read_own on public.target_companies for select to authenticated using ((select auth.uid()) = user_id and (select public.has_landed_access()));
drop policy if exists companies_insert_own on public.target_companies;
create policy companies_insert_own on public.target_companies for insert to authenticated with check ((select auth.uid()) = user_id and (select public.has_landed_access()));
drop policy if exists companies_update_own on public.target_companies;
create policy companies_update_own on public.target_companies for update to authenticated using ((select auth.uid()) = user_id and (select public.has_landed_access())) with check ((select auth.uid()) = user_id and (select public.has_landed_access()));
commit;
