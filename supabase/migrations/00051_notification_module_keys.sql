alter table public.notifications
  add column if not exists module_key text;

create index if not exists notifications_module_key_idx
  on public.notifications (module_key);
