-- Assistant Messages Module
-- Persistent chat history for the AI assistant

create table assistant_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_assistant_messages_profile on assistant_messages(profile_id, created_at);

alter table assistant_messages enable row level security;

-- Users can only read their own messages
create policy "Users can read own messages"
  on assistant_messages for select
  using (profile_id = auth.uid());

-- Users can insert their own messages
create policy "Users can insert own messages"
  on assistant_messages for insert
  with check (profile_id = auth.uid());
