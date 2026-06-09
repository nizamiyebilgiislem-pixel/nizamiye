-- Drop old requested_unit check constraint (eski: sadece 'destek'/'muhasebe', yeni: departman UUID'leri de kabul eder)
do $$
declare
  rec record;
begin
  for rec in
    select conname
    from pg_constraint
    where conrelid = 'public.talepler'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%requested_unit%'
  loop
    execute 'alter table public.talepler drop constraint ' || rec.conname;
  end loop;
end $$;

-- Add new columns for the revised talep module
alter table public.talepler
  add column if not exists type text not null default 'talep',
  add column if not exists priority text not null default 'normal',
  add column if not exists target_person uuid references public.profiles(id),
  add column if not exists deadline date,
  add column if not exists response_note text,
  add column if not exists rejection_reason text,
  add column if not exists internal_note text;

-- Drop any existing check constraint on status column
do $$
declare
  rec record;
begin
  for rec in
    select conname
    from pg_constraint
    where conrelid = 'public.talepler'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  loop
    execute 'alter table public.talepler drop constraint ' || rec.conname;
  end loop;
end $$;

-- Add updated status check constraint
alter table public.talepler add constraint talepler_status_check
  check (status in ('bekliyor', 'incelemede', 'isleme_alindi', 'onaylandi', 'reddedildi', 'tamamlandi', 'iptal_edildi'));

-- Add priority check constraint
alter table public.talepler add constraint talepler_priority_check
  check (priority in ('normal', 'acil'));

-- Add missing indexes
create index if not exists idx_talepler_priority on public.talepler(priority);
