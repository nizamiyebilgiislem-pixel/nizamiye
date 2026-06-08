grant select, insert, update on public.class_courses to authenticated;
grant select, insert, update on public.weekly_schedule_slots to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'class_courses'
      and policyname = 'authenticated can read class_courses'
  ) then
    create policy "authenticated can read class_courses"
    on public.class_courses
    for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'class_courses'
      and policyname = 'authenticated can insert class_courses'
  ) then
    create policy "authenticated can insert class_courses"
    on public.class_courses
    for insert
    to authenticated
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'class_courses'
      and policyname = 'authenticated can update class_courses'
  ) then
    create policy "authenticated can update class_courses"
    on public.class_courses
    for update
    to authenticated
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weekly_schedule_slots'
      and policyname = 'authenticated can read weekly_schedule_slots'
  ) then
    create policy "authenticated can read weekly_schedule_slots"
    on public.weekly_schedule_slots
    for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weekly_schedule_slots'
      and policyname = 'authenticated can insert weekly_schedule_slots'
  ) then
    create policy "authenticated can insert weekly_schedule_slots"
    on public.weekly_schedule_slots
    for insert
    to authenticated
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'weekly_schedule_slots'
      and policyname = 'authenticated can update weekly_schedule_slots'
  ) then
    create policy "authenticated can update weekly_schedule_slots"
    on public.weekly_schedule_slots
    for update
    to authenticated
    using (true)
    with check (true);
  end if;
end $$;
