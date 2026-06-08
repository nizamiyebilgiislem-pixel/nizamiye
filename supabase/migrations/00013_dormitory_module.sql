create table public.dormitories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dormitory_floors (
  id uuid primary key default gen_random_uuid(),
  dormitory_id uuid not null references public.dormitories(id) on delete cascade,
  name text not null,
  floor_no integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dormitory_rooms (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references public.dormitory_floors(id) on delete cascade,
  name text not null,
  room_no text,
  capacity integer not null default 1,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dormitory_beds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.dormitory_rooms(id) on delete cascade,
  bed_no text not null,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, bed_no)
);

create table public.dormitory_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  bed_id uuid not null references public.dormitory_beds(id) on delete cascade,
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active',
  note text,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dormitory_assignments_status_check check (status in ('active', 'ended'))
);

create unique index dormitory_assignments_active_student_unique_idx
  on public.dormitory_assignments(student_id)
  where status = 'active';

create unique index dormitory_assignments_active_bed_unique_idx
  on public.dormitory_assignments(bed_id)
  where status = 'active';

create index dormitory_floors_dormitory_id_idx on public.dormitory_floors(dormitory_id);
create index dormitory_rooms_floor_id_idx on public.dormitory_rooms(floor_id);
create index dormitory_beds_room_id_idx on public.dormitory_beds(room_id);
create index dormitory_assignments_student_id_idx on public.dormitory_assignments(student_id);
create index dormitory_assignments_bed_id_idx on public.dormitory_assignments(bed_id);
create index dormitory_assignments_status_idx on public.dormitory_assignments(status);

create trigger dormitories_set_updated_at
before update on public.dormitories
for each row execute function public.set_updated_at();

create trigger dormitory_floors_set_updated_at
before update on public.dormitory_floors
for each row execute function public.set_updated_at();

create trigger dormitory_rooms_set_updated_at
before update on public.dormitory_rooms
for each row execute function public.set_updated_at();

create trigger dormitory_beds_set_updated_at
before update on public.dormitory_beds
for each row execute function public.set_updated_at();

create trigger dormitory_assignments_set_updated_at
before update on public.dormitory_assignments
for each row execute function public.set_updated_at();
