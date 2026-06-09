-- Dormitory Module v2 - Simplified flat structure

-- 1. dormitories
create table if not exists public.dormitories (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete restrict,
  name text not null,
  capacity integer not null check (capacity >= 1),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dormitories_department_id on public.dormitories (department_id);

-- 2. dormitory_assignments
create table if not exists public.dormitory_assignments (
  id uuid primary key default gen_random_uuid(),
  dormitory_id uuid not null references public.dormitories(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'ended')),
  note text,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_dormitory_assignments_dormitory_id on public.dormitory_assignments (dormitory_id);
create index if not exists idx_dormitory_assignments_student_id on public.dormitory_assignments (student_id);
create index if not exists idx_dormitory_assignments_status on public.dormitory_assignments (status);

-- One active assignment per student at a time
create unique index if not exists idx_dormitory_assignments_active_student on public.dormitory_assignments (student_id) where status = 'active';

-- 3. Enable RLS
alter table public.dormitories enable row level security;
alter table public.dormitory_assignments enable row level security;

-- 4. RLS policies for dormitories
create policy "dormitories_select_staff_veli"
  on public.dormitories for select
  using (true);

create policy "dormitories_insert_manager"
  on public.dormitories for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru')
  ));

create policy "dormitories_update_manager"
  on public.dormitories for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru')
  ));

create policy "dormitories_delete_topmanager"
  on public.dormitories for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 5. RLS policies for dormitory_assignments
create policy "dormitory_assignments_select_staff"
  on public.dormitory_assignments for select
  using (true);

create policy "dormitory_assignments_insert_manager"
  on public.dormitory_assignments for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru')
  ));

create policy "dormitory_assignments_update_manager"
  on public.dormitory_assignments for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'bolum_muduru')
  ));

create policy "dormitory_assignments_delete_topmanager"
  on public.dormitory_assignments for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 6. Triggers
create trigger set_dormitories_updated_at
  before update on public.dormitories
  for each row
  execute function public.set_updated_at();

-- 7. Grant permissions
grant all on public.dormitories to authenticated;
grant all on public.dormitory_assignments to authenticated;
