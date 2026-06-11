-- Live Sessions Module
-- Tables for internal Jitsi meeting management (v1: personnel only)

create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  session_type text not null check (session_type in ('ogretmen_toplantisi', 'konuk_semineri', 'bolum_toplantisi', 'veli_gorusmesi', 'ozel_etkinlik')),
  room_name text not null unique,
  start_time timestamptz not null,
  end_time timestamptz,
  max_participants int not null default 20 check (max_participants >= 1),
  status text not null default 'planned' check (status in ('planned', 'active', 'completed', 'cancelled')),
  created_by uuid not null references profiles(id),
  department_id uuid references departments(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table live_session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  profile_id uuid not null references profiles(id),
  status text not null default 'invited' check (status in ('invited', 'confirmed', 'declined', 'attended')),
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  unique(session_id, profile_id)
);

-- Add live_sessions to module_assignments check constraint
alter table module_assignments drop constraint if exists module_assignments_module_key_check;
alter table module_assignments add constraint module_assignments_module_key_check check (module_key in ('guidance', 'library', 'infirmary', 'live_sessions'));

-- Enable RLS
alter table live_sessions enable row level security;
alter table live_session_participants enable row level security;

-- RLS policies: all access controlled via application-level permissions
-- (same pattern as other modules in this project)
create policy "Application level access - live_sessions"
  on live_sessions for all
  using (true)
  with check (true);

create policy "Application level access - live_session_participants"
  on live_session_participants for all
  using (true)
  with check (true);
