create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.current_profile_department_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select department_id
  from public.profiles
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.is_top_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() in ('admin', 'genel_mudur'), false)
$$;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_department_id() to authenticated;
grant execute on function public.is_top_manager() to authenticated;

drop policy if exists "authenticated can manage academic_terms" on public.academic_terms;
drop policy if exists "authenticated can manage exam_types" on public.exam_types;
drop policy if exists "authenticated can manage grades" on public.grades;
drop policy if exists "authenticated can manage student_evaluations" on public.student_evaluations;

alter table public.academic_terms enable row level security;
alter table public.exam_types enable row level security;
alter table public.grades enable row level security;
alter table public.student_evaluations enable row level security;
alter table public.student_term_snapshots enable row level security;
alter table public.archive_exports enable row level security;

create policy "academic_terms_select_authenticated"
on public.academic_terms
for select
to authenticated
using (true);

create policy "academic_terms_insert_top_managers"
on public.academic_terms
for insert
to authenticated
with check (public.is_top_manager());

create policy "academic_terms_update_top_managers"
on public.academic_terms
for update
to authenticated
using (public.is_top_manager())
with check (public.is_top_manager());

create policy "exam_types_select_academic_staff"
on public.exam_types
for select
to authenticated
using (
  public.current_profile_role() in ('admin', 'genel_mudur', 'bolum_muduru', 'hoca')
);

create policy "exam_types_insert_top_managers"
on public.exam_types
for insert
to authenticated
with check (public.is_top_manager());

create policy "exam_types_update_top_managers"
on public.exam_types
for update
to authenticated
using (public.is_top_manager())
with check (public.is_top_manager());

create policy "grades_select_scoped_academic_staff"
on public.grades
for select
to authenticated
using (
  public.is_top_manager()
  or exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.course_class_id
    where s.id = grades.student_id
      and public.current_profile_role() = 'bolum_muduru'
      and c.department_id = public.current_profile_department_id()
  )
  or exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.course_class_id
    where s.id = grades.student_id
      and public.current_profile_role() = 'hoca'
      and c.department_id = public.current_profile_department_id()
  )
);

create policy "grades_insert_scoped_teachers_active_term"
on public.grades
for insert
to authenticated
with check (
  (
    public.is_top_manager()
    or exists (
      select 1
      from public.students s
      join public.class_courses cc on cc.class_id = s.course_class_id
      where s.id = grades.student_id
        and cc.course_id = grades.course_id
        and cc.teacher_id = public.current_profile_id()
        and cc.is_active = true
        and public.current_profile_role() = 'hoca'
    )
  )
  and exists (
    select 1
    from public.academic_terms t
    where t.id = grades.term_id
      and t.status = 'active'
      and t.is_active = true
      and t.is_current = true
  )
);

create policy "grades_update_scoped_teachers_active_term"
on public.grades
for update
to authenticated
using (
  (
    public.is_top_manager()
    or exists (
      select 1
      from public.students s
      join public.class_courses cc on cc.class_id = s.course_class_id
      where s.id = grades.student_id
        and cc.course_id = grades.course_id
        and cc.teacher_id = public.current_profile_id()
        and cc.is_active = true
        and public.current_profile_role() = 'hoca'
    )
  )
  and exists (
    select 1
    from public.academic_terms t
    where t.id = grades.term_id
      and t.status = 'active'
      and t.is_active = true
      and t.is_current = true
  )
)
with check (
  (
    public.is_top_manager()
    or exists (
      select 1
      from public.students s
      join public.class_courses cc on cc.class_id = s.course_class_id
      where s.id = grades.student_id
        and cc.course_id = grades.course_id
        and cc.teacher_id = public.current_profile_id()
        and cc.is_active = true
        and public.current_profile_role() = 'hoca'
    )
  )
  and exists (
    select 1
    from public.academic_terms t
    where t.id = grades.term_id
      and t.status = 'active'
      and t.is_active = true
      and t.is_current = true
  )
);

create policy "student_evaluations_select_scoped_academic_staff"
on public.student_evaluations
for select
to authenticated
using (
  public.is_top_manager()
  or exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.course_class_id
    where s.id = student_evaluations.student_id
      and public.current_profile_role() in ('bolum_muduru', 'hoca')
      and c.department_id = public.current_profile_department_id()
  )
);

create policy "student_evaluations_insert_scoped_active_term"
on public.student_evaluations
for insert
to authenticated
with check (
  (
    public.is_top_manager()
    or exists (
      select 1
      from public.students s
      join public.classes c on c.id = s.course_class_id
      where s.id = student_evaluations.student_id
        and public.current_profile_role() = 'bolum_muduru'
        and c.department_id = public.current_profile_department_id()
    )
    or exists (
      select 1
      from public.students s
      join public.classes c on c.id = s.course_class_id
      where s.id = student_evaluations.student_id
        and public.current_profile_role() = 'hoca'
        and c.class_teacher_id = public.current_profile_id()
    )
  )
  and exists (
    select 1
    from public.academic_terms t
    where t.id = student_evaluations.term_id
      and t.status = 'active'
      and t.is_active = true
      and t.is_current = true
  )
);

create policy "student_evaluations_update_scoped_active_term"
on public.student_evaluations
for update
to authenticated
using (
  (
    public.is_top_manager()
    or exists (
      select 1
      from public.students s
      join public.classes c on c.id = s.course_class_id
      where s.id = student_evaluations.student_id
        and public.current_profile_role() = 'bolum_muduru'
        and c.department_id = public.current_profile_department_id()
    )
    or exists (
      select 1
      from public.students s
      join public.classes c on c.id = s.course_class_id
      where s.id = student_evaluations.student_id
        and public.current_profile_role() = 'hoca'
        and c.class_teacher_id = public.current_profile_id()
    )
  )
  and exists (
    select 1
    from public.academic_terms t
    where t.id = student_evaluations.term_id
      and t.status = 'active'
      and t.is_active = true
      and t.is_current = true
  )
)
with check (
  (
    public.is_top_manager()
    or exists (
      select 1
      from public.students s
      join public.classes c on c.id = s.course_class_id
      where s.id = student_evaluations.student_id
        and public.current_profile_role() = 'bolum_muduru'
        and c.department_id = public.current_profile_department_id()
    )
    or exists (
      select 1
      from public.students s
      join public.classes c on c.id = s.course_class_id
      where s.id = student_evaluations.student_id
        and public.current_profile_role() = 'hoca'
        and c.class_teacher_id = public.current_profile_id()
    )
  )
  and exists (
    select 1
    from public.academic_terms t
    where t.id = student_evaluations.term_id
      and t.status = 'active'
      and t.is_active = true
      and t.is_current = true
  )
);

create policy "student_term_snapshots_select_scoped_staff"
on public.student_term_snapshots
for select
to authenticated
using (
  public.is_top_manager()
  or (
    public.current_profile_role() = 'bolum_muduru'
    and department_id = public.current_profile_department_id()
  )
  or (
    public.current_profile_role() = 'hoca'
    and (
      exists (
        select 1
        from public.classes c
        where c.id = student_term_snapshots.class_id
          and c.class_teacher_id = public.current_profile_id()
      )
      or exists (
        select 1
        from public.class_courses cc
        where cc.class_id = student_term_snapshots.class_id
          and cc.teacher_id = public.current_profile_id()
          and cc.is_active = true
      )
    )
  )
);

create policy "student_term_snapshots_insert_top_managers"
on public.student_term_snapshots
for insert
to authenticated
with check (public.is_top_manager());

create policy "student_term_snapshots_update_top_managers"
on public.student_term_snapshots
for update
to authenticated
using (public.is_top_manager())
with check (public.is_top_manager());

create policy "archive_exports_select_top_managers"
on public.archive_exports
for select
to authenticated
using (public.is_top_manager());

create policy "archive_exports_insert_top_managers"
on public.archive_exports
for insert
to authenticated
with check (public.is_top_manager());

drop policy if exists "archives_objects_select" on storage.objects;
drop policy if exists "archives_objects_insert" on storage.objects;
drop policy if exists "archives_objects_update" on storage.objects;
drop policy if exists "archives_objects_delete" on storage.objects;

update storage.buckets
set public = false
where id = 'archives';

create policy "archives_objects_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'archives'
  and public.is_top_manager()
);

create policy "archives_objects_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'archives'
  and public.is_top_manager()
)
with check (
  bucket_id = 'archives'
  and public.is_top_manager()
);

create policy "archives_objects_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'archives'
  and public.is_top_manager()
);
