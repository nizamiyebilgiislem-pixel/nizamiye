-- Fix dormitory RLS policies: use auth_user_id instead of id for auth.uid() lookup

drop policy if exists "dormitories_insert_manager" on public.dormitories;
drop policy if exists "dormitories_update_manager" on public.dormitories;
drop policy if exists "dormitories_delete_topmanager" on public.dormitories;
drop policy if exists "dormitory_assignments_insert_manager" on public.dormitory_assignments;
drop policy if exists "dormitory_assignments_update_manager" on public.dormitory_assignments;
drop policy if exists "dormitory_assignments_delete_topmanager" on public.dormitory_assignments;

create policy "dormitories_insert_manager"
  on public.dormitories for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru')
  ));

create policy "dormitories_update_manager"
  on public.dormitories for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru')
  ));

create policy "dormitories_delete_topmanager"
  on public.dormitories for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

create policy "dormitory_assignments_insert_manager"
  on public.dormitory_assignments for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru')
  ));

create policy "dormitory_assignments_update_manager"
  on public.dormitory_assignments for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru')
  ));

create policy "dormitory_assignments_delete_topmanager"
  on public.dormitory_assignments for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));
