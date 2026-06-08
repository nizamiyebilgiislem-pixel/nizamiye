grant select, insert, update on public.academic_terms to authenticated;
grant select, insert, update on public.exam_types to authenticated;
grant select, insert, update on public.grades to authenticated;
grant select, insert, update on public.student_evaluations to authenticated;

insert into public.exam_types (course_id, name, slug, weight, is_active)
select courses.id, default_exam_types.name, default_exam_types.slug, default_exam_types.weight, true
from public.courses
cross join (
  values
    ('1. Yazılı', '1-yazili', 1),
    ('2. Yazılı', '2-yazili', 1),
    ('3. Yazılı', '3-yazili', 1),
    ('4. Yazılı', '4-yazili', 1),
    ('Kanaat Notu', 'kanaat-notu', 1)
) as default_exam_types(name, slug, weight)
on conflict (course_id, slug) do update
set
  name = excluded.name,
  weight = excluded.weight,
  is_active = true,
  updated_at = now();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'academic_terms'
      and policyname = 'authenticated can manage academic_terms'
  ) then
    create policy "authenticated can manage academic_terms"
    on public.academic_terms
    for all
    to authenticated
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exam_types'
      and policyname = 'authenticated can manage exam_types'
  ) then
    create policy "authenticated can manage exam_types"
    on public.exam_types
    for all
    to authenticated
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'grades'
      and policyname = 'authenticated can manage grades'
  ) then
    create policy "authenticated can manage grades"
    on public.grades
    for all
    to authenticated
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'student_evaluations'
      and policyname = 'authenticated can manage student_evaluations'
  ) then
    create policy "authenticated can manage student_evaluations"
    on public.student_evaluations
    for all
    to authenticated
    using (true)
    with check (true);
  end if;
end $$;
