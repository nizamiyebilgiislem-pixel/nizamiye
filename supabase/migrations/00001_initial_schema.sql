create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text not null,
  email text unique,
  phone text,
  role text not null,
  department_id uuid references public.departments(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin', 'genel_mudur', 'bolum_muduru', 'hoca', 'veli')),
  constraint profiles_department_role_check check (
    role not in ('bolum_muduru', 'hoca')
    or department_id is not null
  )
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete restrict,
  name text not null,
  slug text not null,
  class_teacher_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, slug)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  identity_number text,
  father_name text,
  mother_name text,
  guardian_phone text,
  guardian_phone_2 text,
  father_job text,
  mother_job text,
  father_status text,
  mother_status text,
  family_monthly_income text,
  home_status text,
  parent_marital_status text,
  blood_type text,
  sibling_in_institution text,
  birth_date date,
  registration_date date,
  course_class_id uuid references public.classes(id) on delete set null,
  school_class text,
  school_name text,
  nationality text,
  hometown text,
  address text,
  photo_url text,
  status text not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_status_check check (status in ('active', 'passive', 'graduated', 'left'))
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete restrict,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (department_id, slug)
);

create table public.exam_types (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  name text not null,
  slug text not null,
  weight numeric not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create table public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  course_id uuid not null references public.courses(id) on delete restrict,
  exam_type_id uuid not null references public.exam_types(id) on delete restrict,
  term_id uuid references public.academic_terms(id) on delete restrict,
  grade numeric not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grades_grade_check check (grade >= 0 and grade <= 100),
  unique nulls not distinct (student_id, course_id, exam_type_id, term_id)
);

create table public.student_evaluations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  term_id uuid references public.academic_terms(id) on delete restrict,
  behavior_score int,
  attendance_score int,
  lesson_performance_score int,
  discipline_score int,
  memorization_score int,
  general_opinion text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.infirmary_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  record_date date not null default current_date,
  complaint text,
  treatment text,
  sent_to_hospital boolean not null default false,
  hospital_name text,
  medication_given text,
  parent_informed boolean not null default false,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  target_role text,
  department_id uuid references public.departments(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_target_role_check check (
    target_role is null
    or target_role in ('admin', 'genel_mudur', 'bolum_muduru', 'hoca', 'veli')
  )
);

create table public.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  document_type text not null,
  file_url text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid not null references public.profiles(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  relation text,
  created_at timestamptz not null default now(),
  unique (parent_profile_id, student_id)
);

create index departments_is_active_idx on public.departments(is_active);
create index profiles_auth_user_id_idx on public.profiles(auth_user_id);
create index profiles_role_idx on public.profiles(role);
create index profiles_department_id_idx on public.profiles(department_id);
create index profiles_is_active_idx on public.profiles(is_active);
create index classes_department_id_idx on public.classes(department_id);
create index classes_class_teacher_id_idx on public.classes(class_teacher_id);
create index classes_is_active_idx on public.classes(is_active);
create index students_course_class_id_idx on public.students(course_class_id);
create index students_status_idx on public.students(status);
create index students_identity_number_idx on public.students(identity_number);
create index students_created_by_idx on public.students(created_by);
create index courses_department_id_idx on public.courses(department_id);
create index courses_is_active_idx on public.courses(is_active);
create index exam_types_course_id_idx on public.exam_types(course_id);
create index academic_terms_is_active_idx on public.academic_terms(is_active);
create index grades_student_id_idx on public.grades(student_id);
create index grades_course_id_idx on public.grades(course_id);
create index grades_exam_type_id_idx on public.grades(exam_type_id);
create index grades_term_id_idx on public.grades(term_id);
create index student_evaluations_student_id_idx on public.student_evaluations(student_id);
create index student_evaluations_term_id_idx on public.student_evaluations(term_id);
create index infirmary_records_student_id_idx on public.infirmary_records(student_id);
create index infirmary_records_record_date_idx on public.infirmary_records(record_date);
create index announcements_target_role_idx on public.announcements(target_role);
create index announcements_department_id_idx on public.announcements(department_id);
create index announcements_is_published_idx on public.announcements(is_published);
create index student_documents_student_id_idx on public.student_documents(student_id);
create index parent_student_links_parent_profile_id_idx on public.parent_student_links(parent_profile_id);
create index parent_student_links_student_id_idx on public.parent_student_links(student_id);

create trigger departments_set_updated_at
before update on public.departments
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger classes_set_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

create trigger courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

create trigger exam_types_set_updated_at
before update on public.exam_types
for each row execute function public.set_updated_at();

create trigger academic_terms_set_updated_at
before update on public.academic_terms
for each row execute function public.set_updated_at();

create trigger grades_set_updated_at
before update on public.grades
for each row execute function public.set_updated_at();

create trigger student_evaluations_set_updated_at
before update on public.student_evaluations
for each row execute function public.set_updated_at();

create trigger infirmary_records_set_updated_at
before update on public.infirmary_records
for each row execute function public.set_updated_at();

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

insert into public.departments (name, slug, description)
values
  ('Arapça', 'arapca', 'Arapça bölümü'),
  ('İptida', 'iptida', 'İptida bölümü'),
  ('Hafızlık', 'hafizlik', 'Hafızlık bölümü'),
  ('Proje', 'proje', 'Proje bölümü')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = true,
  updated_at = now();
