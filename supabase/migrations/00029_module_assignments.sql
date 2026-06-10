create table if not exists module_assignments (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  assigned_by uuid null references profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_key, profile_id)
);

create index if not exists idx_module_assignments_module_key on module_assignments(module_key);
create index if not exists idx_module_assignments_profile_id on module_assignments(profile_id);
create index if not exists idx_module_assignments_is_active on module_assignments(is_active);
