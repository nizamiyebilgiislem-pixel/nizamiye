create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  attendance_date date not null,
  attendance_type text not null default 'daily',
  taken_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_sessions_type_check check (
    attendance_type in ('daily', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha')
  ),
  unique (class_id, attendance_date, attendance_type)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'absent',
  note text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_records_status_check check (status in ('present', 'absent', 'excused', 'late')),
  unique (session_id, student_id)
);

create index attendance_sessions_class_id_idx on public.attendance_sessions(class_id);
create index attendance_sessions_attendance_date_idx on public.attendance_sessions(attendance_date);
create index attendance_sessions_attendance_type_idx on public.attendance_sessions(attendance_type);
create index attendance_sessions_taken_by_idx on public.attendance_sessions(taken_by);

create index attendance_records_session_id_idx on public.attendance_records(session_id);
create index attendance_records_student_id_idx on public.attendance_records(student_id);
create index attendance_records_status_idx on public.attendance_records(status);

create trigger attendance_sessions_set_updated_at
before update on public.attendance_sessions
for each row execute function public.set_updated_at();

create trigger attendance_records_set_updated_at
before update on public.attendance_records
for each row execute function public.set_updated_at();
