create table if not exists public.student_profile_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  term_id uuid references public.academic_terms(id) on delete set null,
  note text not null,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_books (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  term_id uuid references public.academic_terms(id) on delete set null,
  title text not null,
  author text,
  read_date date,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_profile_notes_student_id_idx on public.student_profile_notes(student_id);
create index if not exists student_profile_notes_term_id_idx on public.student_profile_notes(term_id);
create index if not exists student_profile_notes_created_by_idx on public.student_profile_notes(created_by);
create index if not exists student_books_student_id_idx on public.student_books(student_id);
create index if not exists student_books_term_id_idx on public.student_books(term_id);
create index if not exists student_books_created_by_idx on public.student_books(created_by);

drop trigger if exists student_profile_notes_set_updated_at on public.student_profile_notes;
create trigger student_profile_notes_set_updated_at
before update on public.student_profile_notes
for each row execute function public.set_updated_at();

drop trigger if exists student_books_set_updated_at on public.student_books;
create trigger student_books_set_updated_at
before update on public.student_books
for each row execute function public.set_updated_at();

grant select, insert, update on public.student_profile_notes to authenticated;
grant select, insert, update on public.student_books to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'student_profile_notes'
      and policyname = 'authenticated can manage student_profile_notes'
  ) then
    create policy "authenticated can manage student_profile_notes"
    on public.student_profile_notes
    for all
    to authenticated
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'student_books'
      and policyname = 'authenticated can manage student_books'
  ) then
    create policy "authenticated can manage student_books"
    on public.student_books
    for all
    to authenticated
    using (true)
    with check (true);
  end if;
end $$;
