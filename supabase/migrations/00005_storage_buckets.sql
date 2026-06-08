insert into storage.buckets (id, name, public)
values
  ('student-photos', 'student-photos', true),
  ('profile-photos', 'profile-photos', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'authenticated can upload student photos'
  ) then
    create policy "authenticated can upload student photos"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'student-photos');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'authenticated can read student photos'
  ) then
    create policy "authenticated can read student photos"
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'student-photos');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'authenticated can upload profile photos'
  ) then
    create policy "authenticated can upload profile photos"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'profile-photos');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'authenticated can read profile photos'
  ) then
    create policy "authenticated can read profile photos"
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'profile-photos');
  end if;
end $$;
