alter table public.live_sessions
  add column if not exists is_all_staff boolean not null default false;

create index if not exists live_sessions_is_all_staff_idx
  on public.live_sessions (is_all_staff);
