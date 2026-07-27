drop policy if exists "grades_insert_scoped_teachers_active_term" on public.grades;
drop policy if exists "grades_update_scoped_teachers_active_term" on public.grades;

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
      join public.classes c on c.id = s.course_class_id
      join public.class_courses cc on cc.class_id = c.id
      where s.id = grades.student_id
        and cc.course_id = grades.course_id
        and cc.is_active = true
        and (
          (
            public.current_profile_role() = 'bolum_muduru'
            and c.department_id = public.current_profile_department_id()
          )
          or (
            public.current_profile_role() = 'hoca'
            and cc.teacher_id = public.current_profile_id()
          )
        )
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
      join public.classes c on c.id = s.course_class_id
      join public.class_courses cc on cc.class_id = c.id
      where s.id = grades.student_id
        and cc.course_id = grades.course_id
        and cc.is_active = true
        and (
          (
            public.current_profile_role() = 'bolum_muduru'
            and c.department_id = public.current_profile_department_id()
          )
          or (
            public.current_profile_role() = 'hoca'
            and cc.teacher_id = public.current_profile_id()
          )
        )
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
      join public.classes c on c.id = s.course_class_id
      join public.class_courses cc on cc.class_id = c.id
      where s.id = grades.student_id
        and cc.course_id = grades.course_id
        and cc.is_active = true
        and (
          (
            public.current_profile_role() = 'bolum_muduru'
            and c.department_id = public.current_profile_department_id()
          )
          or (
            public.current_profile_role() = 'hoca'
            and cc.teacher_id = public.current_profile_id()
          )
        )
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
