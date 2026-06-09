create table public.talepler (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  type text not null default 'talep',
  priority text not null default 'normal' check (priority in ('normal', 'acil')),
  requested_unit text not null,
  requested_by uuid not null references public.profiles(id),
  assigned_to uuid references public.profiles(id),
  target_person uuid references public.profiles(id),
  status text not null default 'bekliyor' check (status in ('bekliyor', 'incelemede', 'isleme_alindi', 'onaylandi', 'reddedildi', 'tamamlandi', 'iptal_edildi')),
  deadline date,
  response_note text,
  rejection_reason text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_talepler_requested_by on public.talepler(requested_by);
create index idx_talepler_assigned_to on public.talepler(assigned_to);
create index idx_talepler_status on public.talepler(status);
create index idx_talepler_requested_unit on public.talepler(requested_unit);
create index idx_talepler_priority on public.talepler(priority);
