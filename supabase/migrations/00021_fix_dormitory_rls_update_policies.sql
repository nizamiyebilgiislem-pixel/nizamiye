-- Fix dormitory RLS UPDATE policies: add explicit WITH CHECK clause
-- Ensures post-update rows are also validated for authorization

drop policy if exists "dormitories_update_manager" on public.dormitories;
drop policy if exists "dormitory_assignments_update_manager" on public.dormitory_assignments;

create policy "dormitories_update_manager"
  on public.dormitories for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru')
  ))
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
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru')
  ));
