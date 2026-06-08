# Release Checklist

Bu belge, Nizamiye Ogrenci Sistemi icin canliya cikis oncesi son kontrol listesidir.

## Kod Sagligi

- [ ] `npm.cmd run lint` temiz geciyor.
- [ ] `npm.cmd run build` temiz geciyor.
- [ ] `README.md` guncel ve kurulum adimlari dogru.
- [ ] `.env.example` mevcut env ihtiyaclarini dogru yansitiyor.
- [ ] Gereksiz debug loglari koddan temizlendi.
- [ ] Hata loglari yalnizca operasyonel tanilama icin gerekli alanlari iceriyor.

## Supabase Migration Kontrolu

- [ ] `00001_initial_schema.sql` temiz ortamda uygulanabiliyor.
- [ ] `00002_student_evaluations_term_unique.sql` uygulaniyor.
- [ ] `00003_profiles_photo_url.sql` uygulaniyor.
- [ ] `00004_education_planning.sql` uygulaniyor.
- [ ] `00005_storage_buckets.sql` uygulaniyor.
- [ ] `00006_education_planning_permissions.sql` uygulaniyor.
- [ ] `00007_grade_term_permissions_and_defaults.sql` uygulaniyor.
- [ ] `00008_student_profile_notes_books.sql` uygulaniyor.
- [ ] Temiz veritabaninda migrationlar sirali ve hatasiz tamamlandi.
- [ ] Migration sonrasi kritik tablolar beklenen kolon ve constraint'lerle kontrol edildi.

## Auth ve Rol Testleri

- [ ] Login akisi calisiyor.
- [ ] Logout akisi calisiyor.
- [ ] Auth callback akisi calisiyor.
- [ ] Aktif profili olmayan kullanici login sonrasi bloke ediliyor.
- [ ] `admin` rolunun panel erisimi dogru.
- [ ] `genel_mudur` rolunun panel erisimi dogru.
- [ ] `bolum_muduru` rolunun panel erisimi dogru.
- [ ] `hoca` rolunun panel erisimi dogru.
- [ ] `veli` rolunun yalnizca kendi gorunmesi gereken ekrana erisimi dogru.
- [ ] Yetkisiz route denemelerinde kullanici dogru varsayilan ekrana yonlendiriliyor.

## Kritik Form Akislari

- [ ] Bolum olusturma ve guncelleme calisiyor.
- [ ] Sinif olusturma ve guncelleme calisiyor.
- [ ] Hoca olusturma ve guncelleme calisiyor.
- [ ] Talebe olusturma ve guncelleme calisiyor.
- [ ] Ders olusturma ve guncelleme calisiyor.
- [ ] Sinifa ders atama calisiyor.
- [ ] Ders programi kaydi calisiyor.
- [ ] Not girisi kaydi calisiyor.
- [ ] Kanaat girisi kaydi calisiyor.
- [ ] Revir kaydi olusturma ve guncelleme calisiyor.
- [ ] Evrak ekleme ve duzenleme calisiyor.
- [ ] Talebe ve profil fotografi upload akisi calisiyor.

## Storage Bucket / Policy Kontrolu

- [ ] `student-photos` bucket'i mevcut.
- [ ] `profile-photos` bucket'i mevcut.
- [ ] Her iki bucket icin upload policy dogru.
- [ ] Her iki bucket icin read policy dogru.
- [ ] Public URL olusumu beklenen sekilde calisiyor.
- [ ] Buyukluk ve mime type kisitlari beklenen sekilde davraniyor.

## RLS Durumu

- [ ] Canli Supabase ortaminda RLS durumu tablo bazinda listelendi.
- [ ] Egitim planlama tablolarinda gereken permission/policy durumu dogrulandi.
- [ ] Not, kanaat, donem ve ilgili tablolarin permission davranisi test edildi.
- [ ] Storage policy'leri uygulama akisiyla birlikte test edildi.
- [ ] RLS aciksa uygulama akislarini bloke eden eksik policy kalmadi.

## Deploy Env Degiskenleri

- [ ] `NEXT_PUBLIC_SUPABASE_URL` dogru ortama isaret ediyor.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` dogru projeye ait.
- [ ] Canli ortam env degerleri staging veya local degerlerle karismiyor.
- [ ] Deploy platformunda env degiskenleri yazili ve teyitli.

## Rollback Plani

- [ ] Son stabil commit veya release etiketi belli.
- [ ] Veritabaninda geri donus stratejisi net.
- [ ] Problemler icin hizli uygulama rollback adimi yazili.
- [ ] Gerekirse migration geri alma veya ileri migration ile duzeltme yaklasimi belli.
- [ ] Canliya cikis sonrasi ilk kontrol sorumlusu belli.
