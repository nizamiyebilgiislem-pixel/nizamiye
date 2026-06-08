create table public.class_courses (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  teacher_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, course_id)
);

create table public.weekly_schedule_slots (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  class_course_id uuid not null references public.class_courses(id) on delete cascade,
  day_of_week int not null,
  period_no int not null,
  start_time time,
  end_time time,
  room text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_schedule_slots_day_of_week_check check (day_of_week between 1 and 7),
  constraint weekly_schedule_slots_period_no_check check (period_no > 0),
  unique (class_id, day_of_week, period_no)
);

create index class_courses_class_id_idx on public.class_courses(class_id);
create index class_courses_course_id_idx on public.class_courses(course_id);
create index class_courses_teacher_id_idx on public.class_courses(teacher_id);
create index weekly_schedule_slots_class_id_idx on public.weekly_schedule_slots(class_id);
create index weekly_schedule_slots_class_course_id_idx on public.weekly_schedule_slots(class_course_id);
create index weekly_schedule_slots_day_of_week_idx on public.weekly_schedule_slots(day_of_week);

create trigger class_courses_set_updated_at
before update on public.class_courses
for each row execute function public.set_updated_at();

create trigger weekly_schedule_slots_set_updated_at
before update on public.weekly_schedule_slots
for each row execute function public.set_updated_at();

