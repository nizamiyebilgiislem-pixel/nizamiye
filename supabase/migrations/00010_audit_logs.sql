create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  student_id uuid references public.students(id) on delete set null,
  title text not null,
  description text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_profile_id_idx on public.audit_logs (actor_profile_id);
create index if not exists audit_logs_entity_type_entity_id_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_student_id_idx on public.audit_logs (student_id);
create index if not exists audit_logs_created_at_desc_idx on public.audit_logs (created_at desc);
