-- Announcements Module - RLS Policies
-- Enables row-level security for the announcements table

alter table public.announcements enable row level security;

-- Staff can view all published announcements
create policy "announcements_select_staff"
  on public.announcements for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru', 'hoca')
  ));

-- Admin/genel_mudur can create announcements
create policy "announcements_insert_admin"
  on public.announcements for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- Admin/genel_mudur can update announcements
create policy "announcements_update_admin"
  on public.announcements for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- Admin/genel_mudur can delete announcements
create policy "announcements_delete_admin"
  on public.announcements for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));
