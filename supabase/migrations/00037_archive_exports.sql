create table if not exists public.archive_exports (
  id uuid primary key default gen_random_uuid(),
  export_type text not null check (export_type in ('student_pdf', 'term_csv', 'department_csv', 'class_csv')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  scope_type text,
  scope_id uuid,
  term_id uuid references public.academic_terms(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  file_name text,
  file_size bigint,
  storage_bucket text not null default 'archives',
  storage_path text,
  content_type text,
  error_message text,
  metadata jsonb
);

create index if not exists archive_exports_created_at_idx on public.archive_exports (created_at desc);
create index if not exists archive_exports_status_idx on public.archive_exports (status);
create index if not exists archive_exports_created_by_idx on public.archive_exports (created_by);
create index if not exists archive_exports_term_id_idx on public.archive_exports (term_id);

insert into storage.buckets (id, name, public)
values ('archives', 'archives', false)
on conflict (id) do nothing;
