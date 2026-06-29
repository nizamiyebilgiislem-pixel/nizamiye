create policy "Hoca gorebilir bolumundeki hafizlik kayitlari"
on public.hafizlik_progress
for select
using (
  exists (
    select 1
    from public.profiles p
    join public.students s on s.id = hafizlik_progress.student_id
    join public.classes c on c.id = s.course_class_id
    where p.auth_user_id = auth.uid()
      and p.is_active = true
      and p.role = 'hoca'
      and p.department_id = c.department_id
  )
);
