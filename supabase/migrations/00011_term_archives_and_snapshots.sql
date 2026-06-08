alter table public.academic_terms
  add column if not exists status text not null default 'active',
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references public.profiles(id) on delete set null,
  add column if not exists is_current boolean not null default false;

update public.academic_terms
set status = case when is_active then coalesce(status, 'active') else 'draft' end
where status is null or status = '';

update public.academic_terms
set status = 'active'
where is_active = true and status not in ('active', 'closed', 'archived');

with latest_active_term as (
  select id
  from public.academic_terms
  where is_active = true
  order by created_at desc
  limit 1
)
update public.academic_terms
set is_current = (id = (select id from latest_active_term))
where is_current is distinct from (id = (select id from latest_active_term));

create unique index if not exists academic_terms_is_current_unique_idx
  on public.academic_terms (is_current)
  where is_current = true;

create table if not exists public.student_term_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  term_id uuid not null references public.academic_terms(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  student_status text,
  grade_average numeric,
  evaluation_summary jsonb,
  total_grades integer not null default 0,
  total_evaluations integer not null default 0,
  total_infirmary_records integer not null default 0,
  snapshot_data jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  constraint student_term_snapshots_student_term_unique unique (student_id, term_id)
);

create index if not exists student_term_snapshots_student_id_idx on public.student_term_snapshots (student_id);
create index if not exists student_term_snapshots_term_id_idx on public.student_term_snapshots (term_id);
create index if not exists student_term_snapshots_department_id_idx on public.student_term_snapshots (department_id);
create index if not exists student_term_snapshots_class_id_idx on public.student_term_snapshots (class_id);
