alter table public.student_evaluations
  alter column term_id set not null;

alter table public.student_evaluations
  add constraint student_evaluations_student_term_unique unique (student_id, term_id);
