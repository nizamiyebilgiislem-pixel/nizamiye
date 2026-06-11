create table if not exists public.term_closure_runs (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.academic_terms(id) on delete restrict,
  status text not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  started_by uuid references public.profiles(id) on delete set null,
  completed_by uuid references public.profiles(id) on delete set null,
  simulation_result jsonb,
  summary_json jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint term_closure_runs_status_check check (status in ('pending', 'running', 'completed', 'failed'))
);

create index if not exists term_closure_runs_term_id_idx on public.term_closure_runs(term_id);
create index if not exists term_closure_runs_status_idx on public.term_closure_runs(status);
create index if not exists term_closure_runs_started_by_idx on public.term_closure_runs(started_by);
create index if not exists term_closure_runs_created_at_idx on public.term_closure_runs(created_at desc);

create unique index if not exists term_closure_runs_active_term_unique_idx
  on public.term_closure_runs(term_id)
  where status in ('pending', 'running');

drop trigger if exists term_closure_runs_set_updated_at on public.term_closure_runs;
create trigger term_closure_runs_set_updated_at
before update on public.term_closure_runs
for each row execute function public.set_updated_at();

alter table public.term_closure_runs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'term_closure_runs'
      and policyname = 'term_closure_runs_select_top_managers'
  ) then
    create policy "term_closure_runs_select_top_managers"
    on public.term_closure_runs
    for select
    to authenticated
    using (exists (
      select 1 from public.profiles
      where profiles.auth_user_id = auth.uid()
        and profiles.is_active = true
        and profiles.role in ('admin', 'genel_mudur')
    ));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'term_closure_runs'
      and policyname = 'term_closure_runs_insert_top_managers'
  ) then
    create policy "term_closure_runs_insert_top_managers"
    on public.term_closure_runs
    for insert
    to authenticated
    with check (exists (
      select 1 from public.profiles
      where profiles.auth_user_id = auth.uid()
        and profiles.is_active = true
        and profiles.role in ('admin', 'genel_mudur')
    ));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'term_closure_runs'
      and policyname = 'term_closure_runs_update_top_managers'
  ) then
    create policy "term_closure_runs_update_top_managers"
    on public.term_closure_runs
    for update
    to authenticated
    using (exists (
      select 1 from public.profiles
      where profiles.auth_user_id = auth.uid()
        and profiles.is_active = true
        and profiles.role in ('admin', 'genel_mudur')
    ))
    with check (exists (
      select 1 from public.profiles
      where profiles.auth_user_id = auth.uid()
        and profiles.is_active = true
        and profiles.role in ('admin', 'genel_mudur')
    ));
  end if;
end $$;

grant select, insert, update on public.term_closure_runs to authenticated;

alter table public.student_term_snapshots
  add column if not exists attendance_summary jsonb;
