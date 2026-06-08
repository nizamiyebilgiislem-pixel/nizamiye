# Supabase Storage Kurulumu

Bu projede iki bucket kullanılır:

- `student-photos`
- `profile-photos`

## 1. Bucket oluşturma

Supabase Dashboard > Storage bölümünde iki bucket oluşturun.

Her iki bucket için:

- `Public` seçeneğini açın
- Bucket adını birebir şu şekilde verin:
  - `student-photos`
  - `profile-photos`

## 2. Policy notları

Bu projede veritabanı RLS şimdilik kapalı tutuluyor. Storage için ise Supabase tarafında bucket policy’leri kontrol etmeniz gerekir.

Kalıcı kurulum için migration dosyası:

```txt
supabase/migrations/00005_storage_buckets.sql
```

Eğer doğrudan client veya server action üzerinden upload yapacaksanız, en azından authenticated kullanıcıların ilgili bucket’a yazmasına izin veren policy ekleyin.

Örnek SQL:

```sql
insert into storage.buckets (id, name, public)
values
  ('student-photos', 'student-photos', true),
  ('profile-photos', 'profile-photos', true)
on conflict (id) do update
set public = excluded.public;

create policy "authenticated can upload student photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'student-photos');

create policy "authenticated can read student photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'student-photos');

create policy "authenticated can upload profile photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'profile-photos');

create policy "authenticated can read profile photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'profile-photos');
```

## 3. Dosya kuralları

- Sadece `image/jpeg`, `image/png`, `image/webp`
- Maksimum boyut: `3 MB`
- Student path:
  - `student-photos/{studentId}/{timestamp}-{filename}`
- Profile path:
  - `profile-photos/{profileId}/{timestamp}-{filename}`

Upload sonrası public URL veritabanındaki `photo_url` alanına yazılır.
