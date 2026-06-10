create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_by uuid not null references public.profiles(id),
  assigned_to uuid not null references public.profiles(id),
  department_id uuid references public.departments(id),
  due_date date,
  completed_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tasks_assigned_by on public.tasks(assigned_by);
create index idx_tasks_assigned_to on public.tasks(assigned_to);
create index idx_tasks_status on public.tasks(status);
create index idx_tasks_priority on public.tasks(priority);
create index idx_tasks_department on public.tasks(department_id);
create index idx_tasks_active on public.tasks(is_active);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  comment text not null,
  created_at timestamptz not null default now()
);

create index idx_task_comments_task on public.task_comments(task_id);

create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_task_attachments_task on public.task_attachments(task_id);

alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;

create policy "Tasks full access for authenticated"
  on public.tasks for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Task comments full access for authenticated"
  on public.task_comments for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Task attachments full access for authenticated"
  on public.task_attachments for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
