alter table public.profiles
  add column if not exists school_name text,
  add column if not exists expertise_area text,
  add column if not exists hometown text,
  add column if not exists birth_date date,
  add column if not exists address text,
  add column if not exists biography text;
