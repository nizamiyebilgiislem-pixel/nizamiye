-- Bildirim Sistemi
-- Kullanıcıya özel bildirimler ve SMS entegrasyonu

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('info', 'success', 'warning', 'error', 'sms')),
  title text not null,
  message text,
  is_read boolean not null default false,
  sent_via text check (sent_via in ('app', 'sms', 'email')),
  created_at timestamptz not null default now()
);

-- Bildirimler için index
create index if not exists notifications_profile_id_idx on public.notifications (profile_id);
create index if not exists notifications_is_read_idx on public.notifications (is_read);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);

-- RLS policies
alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using (profile_id = auth.uid());

create policy "System can insert notifications"
  on notifications for insert
  with check (true);

create policy "Users can update their own notifications"
  on notifications for update
  using (profile_id = auth.uid());