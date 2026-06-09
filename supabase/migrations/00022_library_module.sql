-- Library Module - Kitap, dokuman ve emanet takip sistemi

-- 1. library_categories
create table if not exists public.library_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. library_books
create table if not exists public.library_books (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.library_categories(id) on delete set null,
  title text not null,
  author text,
  publisher text,
  isbn text,
  publication_year integer,
  shelf_code text,
  location_note text,
  total_count integer not null default 1 check (total_count >= 0),
  available_count integer not null default 1 check (available_count >= 0),
  description text,
  cover_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_available_count check (available_count <= total_count)
);

create index if not exists idx_library_books_category_id on public.library_books (category_id);
create index if not exists idx_library_books_title on public.library_books (title);
create index if not exists idx_library_books_author on public.library_books (author);
create index if not exists idx_library_books_isbn on public.library_books (isbn);
create index if not exists idx_library_books_is_active on public.library_books (is_active);

-- 3. library_loans
create table if not exists public.library_loans (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.library_books(id) on delete restrict,
  borrower_type text not null check (borrower_type in ('student', 'profile')),
  student_id uuid references public.students(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  loan_date date not null default current_date,
  due_date date,
  returned_at date,
  status text not null default 'borrowed' check (status in ('borrowed', 'returned', 'lost')),
  note text,
  given_by uuid references public.profiles(id) on delete set null,
  received_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_borrower_student check (borrower_type != 'student' or student_id is not null),
  constraint chk_borrower_profile check (borrower_type != 'profile' or profile_id is not null),
  constraint chk_returned_has_date check (status != 'returned' or returned_at is not null)
);

create index if not exists idx_library_loans_book_id on public.library_loans (book_id);
create index if not exists idx_library_loans_student_id on public.library_loans (student_id);
create index if not exists idx_library_loans_profile_id on public.library_loans (profile_id);
create index if not exists idx_library_loans_status on public.library_loans (status);
create index if not exists idx_library_loans_due_date on public.library_loans (due_date);

-- 4. library_documents
create table if not exists public.library_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references public.library_categories(id) on delete set null,
  document_type text check (document_type in ('pdf', 'word', 'excel', 'image', 'other')),
  file_url text not null,
  file_name text,
  file_size integer,
  description text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_library_documents_category_id on public.library_documents (category_id);
create index if not exists idx_library_documents_document_type on public.library_documents (document_type);
create index if not exists idx_library_documents_uploaded_by on public.library_documents (uploaded_by);
create index if not exists idx_library_documents_is_active on public.library_documents (is_active);

-- 5. Triggers
create trigger set_library_categories_updated_at
  before update on public.library_categories
  for each row
  execute function public.set_updated_at();

create trigger set_library_books_updated_at
  before update on public.library_books
  for each row
  execute function public.set_updated_at();

create trigger set_library_loans_updated_at
  before update on public.library_loans
  for each row
  execute function public.set_updated_at();

create trigger set_library_documents_updated_at
  before update on public.library_documents
  for each row
  execute function public.set_updated_at();

-- 6. Enable RLS
alter table public.library_categories enable row level security;
alter table public.library_books enable row level security;
alter table public.library_loans enable row level security;
alter table public.library_documents enable row level security;

-- 7. RLS: library_categories
create policy "library_categories_select_all"
  on public.library_categories for select
  using (true);

create policy "library_categories_insert_staff"
  on public.library_categories for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ));

create policy "library_categories_update_staff"
  on public.library_categories for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ));

create policy "library_categories_delete_topmanager"
  on public.library_categories for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 8. RLS: library_books
create policy "library_books_select_all"
  on public.library_books for select
  using (true);

create policy "library_books_insert_staff"
  on public.library_books for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ));

create policy "library_books_update_staff"
  on public.library_books for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ));

create policy "library_books_delete_topmanager"
  on public.library_books for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 9. RLS: library_loans
create policy "library_loans_select_staff"
  on public.library_loans for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi', 'bolum_muduru')
  ));

create policy "library_loans_select_hoca"
  on public.library_loans for select
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role = 'hoca'
      and id = profile_id
  ));

create policy "library_loans_insert_staff"
  on public.library_loans for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ));

create policy "library_loans_update_staff"
  on public.library_loans for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ));

create policy "library_loans_delete_topmanager"
  on public.library_loans for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 10. RLS: library_documents
create policy "library_documents_select_all"
  on public.library_documents for select
  using (true);

create policy "library_documents_insert_staff"
  on public.library_documents for insert
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ));

create policy "library_documents_update_staff"
  on public.library_documents for update
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ))
  with check (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur', 'kutuphane_gorevlisi')
  ));

create policy "library_documents_delete_topmanager"
  on public.library_documents for delete
  using (exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and is_active = true
      and role in ('admin', 'genel_mudur')
  ));

-- 11. Storage bucket for library documents
insert into storage.buckets (id, name, public)
values ('library-documents', 'library-documents', true)
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
      and policyname = 'authenticated can upload library documents'
  ) then
    create policy "authenticated can upload library documents"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'library-documents');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'authenticated can read library documents'
  ) then
    create policy "authenticated can read library documents"
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'library-documents');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'authenticated can delete library documents'
  ) then
    create policy "authenticated can delete library documents"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'library-documents');
  end if;
end $$;

-- 12. Default categories
insert into public.library_categories (name, description) values
  ('Tefsir', 'Tefsir ilmi ile ilgili eserler'),
  ('Hadis', 'Hadis ilmi ile ilgili eserler'),
  ('Fıkıh', 'Fıkıh ilmi ile ilgili eserler'),
  ('Akaid', 'Akaid ve kelam ilmi ile ilgili eserler'),
  ('Siyer', 'Siyer ve İslam tarihi ile ilgili eserler'),
  ('Arapça', 'Arapça dil bilgisi ve edebiyatı ile ilgili eserler'),
  ('Tasavvuf', 'Tasavvuf ilmi ile ilgili eserler'),
  ('Genel', 'Diğer konulardaki eserler')
on conflict do nothing;

-- 13. Grant permissions
grant all on public.library_categories to authenticated;
grant all on public.library_books to authenticated;
grant all on public.library_loans to authenticated;
grant all on public.library_documents to authenticated;
