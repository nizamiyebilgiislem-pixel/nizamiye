-- Make POLA AI assignable as a module and fix assistant message RLS.

alter table public.module_assignments drop constraint if exists module_assignments_module_key_check;

alter table public.module_assignments
  add constraint module_assignments_module_key_check
  check (module_key in ('guidance', 'library', 'infirmary', 'live_sessions', 'assistant'));

drop policy if exists "Users can read own messages" on public.assistant_messages;
drop policy if exists "Users can insert own messages" on public.assistant_messages;

create policy "Users can read own messages"
  on public.assistant_messages for select
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = assistant_messages.profile_id
        and profiles.auth_user_id = auth.uid()
    )
  );

create policy "Users can insert own messages"
  on public.assistant_messages for insert
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = assistant_messages.profile_id
        and profiles.auth_user_id = auth.uid()
    )
  );
