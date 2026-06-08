# Nizamiye Ogrenci Sistemi

Nizamiye Ogrenci Sistemi, medrese veya okul yonetim ekiplerinin ogrenci, personel, akademik takip ve idari sureclerini tek panel uzerinden yonetmesi icin gelistirilmis bir Next.js uygulamasidir.

## Teknoloji Yigini

- Next.js 16.2.7
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- shadcn / Base UI
- Supabase Auth
- Supabase Postgres
- Supabase Storage

## Proje Modulleri

- Auth ve rol bazli panel yonlendirmesi
- Dashboard
- Talebe yonetimi
- Hoca yonetimi
- Bolum ve sinif yonetimi
- Not sistemi
- Kanaat sistemi
- Egitim planlama
- Revir kayitlari
- Evrak yonetimi
- Kullanici ve profil yonetimi
- Yoklama sistemi
- Raporlar ve PDF Merkezi
- Yatakhane / kat / oda / yatak ve talebe yerleşim yönetimi
- Veli paneli
- Audit log ve talebe gecmisi

## Kurulum

### 1. Bagimliliklari yukle

```bash
npm.cmd install
```

### 2. Ortam degiskenlerini hazirla

`.env.local` dosyasini olustur:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

Not:

- `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` uygulamanin normal Supabase istemcileri tarafindan kullanilir.
- `SUPABASE_SERVICE_ROLE_KEY` sadece server tarafinda kullanilir.
- Bu key frontend'e expose edilmemeli ve `NEXT_PUBLIC_` prefix'i almamali.

### 3. Supabase migrationlarini uygula

Migration sirasi:

1. `supabase/migrations/00001_initial_schema.sql`
2. `supabase/migrations/00002_student_evaluations_term_unique.sql`
3. `supabase/migrations/00003_profiles_photo_url.sql`
4. `supabase/migrations/00004_education_planning.sql`
5. `supabase/migrations/00005_storage_buckets.sql`
6. `supabase/migrations/00006_education_planning_permissions.sql`
7. `supabase/migrations/00007_grade_term_permissions_and_defaults.sql`
8. `supabase/migrations/00008_student_profile_notes_books.sql`
9. `supabase/migrations/00009_profile_account_fields.sql`
10. `supabase/migrations/00010_audit_logs.sql`
11. `supabase/migrations/00011_term_archives_and_snapshots.sql`
12. `supabase/migrations/00012_attendance_sessions_and_records.sql`

Supabase CLI kullaniyorsaniz kendi ortam komutlarinizla bu migrationlari sirasiyla uygulayin. Canliya cikistan once temiz bir veritabaninda sifirdan uygulanabildigini dogrulayin.

### 4. Gelistirme sunucusunu baslat

```bash
npm.cmd run dev
```

Varsayilan adres:

```txt
http://localhost:3000
```

## Ilk Admin Olusturma

1. Supabase Dashboard > Authentication > Users uzerinden bir kullanici olusturun.
2. Olusan kullanicinin `auth.users.id` degerini alin.
3. SQL Editor uzerinden aktif admin profilini baglayin:

```sql
insert into public.profiles (auth_user_id, full_name, email, role, is_active)
values (
  'AUTH_USER_ID_BURAYA',
  'Nizamiye Admin',
  'admin@nizamiye.local',
  'admin',
  true
);
```

Desteklenen temel roller:

- `admin`
- `genel_mudur`
- `bolum_muduru`
- `hoca`
- `veli`

Not:
- `bolum_muduru` ve `hoca` profillerinde `department_id` gereklidir.
- `is_active = false` olan veya aktif profili bulunmayan kullanici panele alinmaz.

## Panelden Kullanici Auth Olusturma

Bu fazda panel uzerinden su akislar desteklenir:

- `/hocalar/yeni` ekraninda hoca, bolum muduru ve genel mudur profili olusturma
- Profil olustururken istege bagli Supabase Auth hesabi acma
- Mevcut profile sonradan Auth hesabi baglama
- Admin veya genel mudur tarafindan gecici sifre atama
- `/veliler/*` ekranlarinda veli profili olusturma ve talebelerle iliskilendirme
- `/audit-log` ekraninda kritik islemleri izleme, talebe detayinda gecmis zaman cizelgesi gorme

Teknik not:

- Supabase Auth kullanicisi server-side admin client ile olusturulur.
- Admin client `src/lib/supabase/admin.ts` uzerinden `SUPABASE_SERVICE_ROLE_KEY` ile acilir.
- Service role key istemciye gonderilmez.

## Hesabim / Profil Ayarlari

- Giris yapan her kullanici kendi profilini `/hesabim` altindan yonetebilir.
- `/hesabim/profil` ekraninda kullanici kendi temel profil bilgilerini gunceller.
- `/hesabim/guvenlik` ekraninda kullanici kendi sifresini degistirebilir.
- E-posta degisikligi bu fazda kullanici tarafindan yapilmaz; yonetici kontrolludur.

## Audit Log

- Kritik islemler server-side audit_logs tablosuna yazilir.
- Talebe detayinda `Gecmis` sekmesi ile kronolojik zaman cizelgesi goruntulenir.
- Audit log yazimi ana islemin basarisina bagli degildir; log hatalari sadece server tarafinda kaydedilir.

## PDF Merkezi

- Genel rapor merkezi: `/raporlar`
- Talebe bazli PDF merkezi: `/raporlar/talebeler`
- Bireysel PDF ciktolari: `/talebeler/[id]/pdf`, `/talebeler/[id]/notlar/pdf`, `/talebeler/[id]/kanaat/pdf`, `/talebeler/[id]/revir/pdf`
- Sinif ve bolum PDF ciktolari: `/siniflar/[id]/pdf`, `/bolumler/[id]/pdf`
- Yazdirma akisi mevcut tarayici print mekanizmasi ile calisir; yeni agir PDF kutuphanesi eklenmemistir.

## Yatakhane

- Yatakhane, kat, oda ve yatak yönetimi `/yatakhane` altindadir.
- Talebe yerleşimleri ve geçmiş yerleşimler buradan takip edilir.
- Doluluk ve yataksiz talebe ozeti dashboard ve rapor ekranlarinda goruntulenir.

## Storage Bucket Kurulumu

Projede iki bucket beklenir:

- `student-photos`
- `profile-photos`

Kurulum ozeti:

1. Supabase Storage altinda iki bucket'i olusturun.
2. Bucket adlarini birebir yukaridaki gibi verin.
3. `supabase/migrations/00005_storage_buckets.sql` dosyasini uygulayin.
4. Upload ve read policy'lerinin canli ortamda gecerli oldugunu test edin.

Detayli notlar icin [docs/STORAGE_SETUP.md](docs/STORAGE_SETUP.md) dosyasina bakin.

## Auth ve Rol Akisi

- Giris sayfasi: `/login`
- Callback route: `/auth/callback`
- Logout route: `/auth/logout`
- Panel erisimleri rol bazli kontrol edilir.
- Aktif profil bulunmazsa kullanici cikis yaptirilip login ekranina yonlendirilir.

Detayli kurulum icin [docs/AUTH_SETUP.md](docs/AUTH_SETUP.md) dosyasina bakin.

## Gelistirme Komutlari

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

## Canliya Cikis Notlari

- `npm.cmd run lint` temiz gecmeli.
- `npm.cmd run build` temiz gecmeli.
- Tum migrationlar temiz veritabaninda uygulanabilmeli.
- Auth, rol yonlendirmesi ve kritik formlar manuel smoke testten gecmeli.
- Storage upload ve okuma policy'leri gercek Supabase projesinde test edilmeli.
- RLS durumu tablo bazinda dogrulanmali; ozellikle egitim planlama ve storage politikalari kontrol edilmeli.
- Rollback plani ve deploy sirasinda kullanilacak env degerleri onceden yazili olmali.
- Dönem kapatma veri silmez; not ve kanaat kayitlari term bazli kalir, akademik ozetler `student_term_snapshots` tablosuna arşivlenir.

Canliya hazirlik icin ek belgeler:

- [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)
- [docs/SMOKE_TESTS.md](docs/SMOKE_TESTS.md)
- [docs/STABILIZATION_BACKLOG.md](docs/STABILIZATION_BACKLOG.md)
- [docs/COMMIT_PLAN.md](docs/COMMIT_PLAN.md)
