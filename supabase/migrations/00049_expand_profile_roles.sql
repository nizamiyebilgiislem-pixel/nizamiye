alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (
    role in (
      'admin',
      'genel_mudur',
      'yonetim',
      'bolum_muduru',
      'hoca',
      'veli',
      'rehberlik',
      'destek_birim_muduru',
      'kutuphane_gorevlisi',
      'sponsor'
    )
  );

alter table public.announcements
  drop constraint if exists announcements_target_role_check;

alter table public.announcements
  add constraint announcements_target_role_check
  check (
    target_role is null
    or target_role in (
      'admin',
      'genel_mudur',
      'yonetim',
      'bolum_muduru',
      'hoca',
      'veli',
      'rehberlik',
      'destek_birim_muduru',
      'kutuphane_gorevlisi',
      'sponsor'
    )
  );
