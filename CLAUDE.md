# Nizamiye Proje Hafizasi

Bu dosya proje uzerinde calisan ajanlar icin kalici mimari hafizadir. Kod yazmadan once burayi, `AGENTS.md` dosyasini ve ilgili yerel Next.js dokumanini oku.

## Zorunlu Next.js Kuralı

- Bu proje Next.js `16.2.7` ve React `19.2.4` kullanir. Egitim verisindeki eski Next.js varsayimlarina guvenme.
- Kod yazmadan once ilgili rehberi `node_modules/next/dist/docs/` altindan oku. Ozellikle App Router, Server/Client Components, Server Actions, async request API, cache/revalidate ve proxy/middleware dokumanlari onceliklidir.
- Next 16'da `params`, `searchParams`, `cookies()`, `headers()` gibi request-time API'ler async kabul edilir. Mevcut sayfalardaki `searchParams: Promise<...>` ve `await searchParams` desenini koru.
- Next 16'da `middleware` konvansiyonu `proxy` olarak yeniden adlandirilmistir. Projede su anda kokte `middleware.ts` var; bu dosyada degisiklik yaparken yerel Next 16 dokumanindaki deprecation notlarini dikkate al.
- `next lint` yoktur; lint icin `npm run lint`, build icin `npm.cmd run build` / `npm run build` kullanilir.

## Teknoloji Yığını

- Framework: Next.js App Router, TypeScript strict, React Server Components varsayilan.
- UI: Tailwind CSS 4, shadcn `base-nova`, Base UI, lucide-react ikonlari.
- Backend: Supabase Auth, Supabase SSR client, Supabase Postgres ve Storage.
- Paket yoneticisi: `package-lock.json` mevcut, npm kullan.
- Import alias: `@/*` -> `src/*`.

## Klasör Sorumlulukları

- `src/app`: Sadece route, layout ve route handler katmani. Sayfalar veri toplar, yetkiyi cagirir ve componentleri birlestirir.
- `src/app/(auth)`: Login gibi auth ekranlari.
- `src/app/(panel)`: Giriş sonrası panel. `layout.tsx` once `requireAuth()` calistirir, role gore navigasyon üretir ve `PanelShell` kullanir.
- `src/components`: UI ve domain componentleri. Is kurali ve Supabase sorgusu burada olmamali.
- `src/components/ui`: shadcn/Base UI temel parcalari. Yeni ortak UI primitive gerekiyorsa buraya, domain'e ozel bilesen gerekiyorsa ilgili domain klasorune koy.
- `src/lib/<domain>`: Domain is mantigi. Yerlesik desen:
  - `queries.ts`: Okuma sorgulari.
  - `actions.ts`: `"use server"` mutationlari.
  - `permissions.ts`: Domain seviyesinde role/resource yetkileri.
  - `constants.ts`: Domain sabitleri.
- `src/lib/auth.ts`: Session/profile okuma ve `requireAuth`, `requireRole`, `requireRouteAccess`.
- `src/lib/route-permissions.ts`: Route bazli RBAC kaynagi ve role label/default path.
- `src/lib/navigation.ts`: Sidebar module gruplari. Yeni route eklenirse genelde burasi ve `route-permissions.ts` birlikte guncellenir.
- `src/lib/supabase/server.ts`: Server Supabase client ve cookie entegrasyonu.
- `src/lib/supabase/client.ts`: Browser Supabase client gerekiyorsa kullanilir.
- `src/types`: Elle tutulan proje tipleri. Veritabani semasi degisirse `src/types/database.ts` mutlaka guncellenir.
- `supabase/migrations`: Veritabani semasinin kaynagi. Sema degisikligi migration olarak eklenir; mevcut migrationlar gelisiguzel editlenmez.
- `docs`: Kurulum ve operasyon notlari. Auth, Storage ve RLS notlarini burada tut.
- `tasarım`: Tasarim referanslari/varliklari icin ayrilmis alan.

## Veri Modeli Özeti

Ana tablolar:

- `departments`: Arapca, Iptida, Hafizlik, Proje bolumleri.
- `profiles`: Supabase Auth kullanicisini uygulama rolune baglar. Kritik alan: `auth_user_id`. Aktif profil icin `is_active = true` gerekir.
- `classes`: Bolume bagli kurs siniflari, opsiyonel `class_teacher_id`.
- `students`: Talebe ana kaydi; `course_class_id`, `status`, aile/okul/foto alanlari.
- `courses`, `exam_types`, `academic_terms`, `grades`: Not sistemi.
- `student_evaluations`: Kanaat sistemi.
- `infirmary_records`: Revir kayitlari.
- `student_documents`: Evraklar.
- `parent_student_links`: Veli-talebe iliskisi.
- `student_profile_notes`: Talebe profilinde hoca/bolum muduru donem ici yorumlari.
- `student_books`: Talebenin donem icinde okudugu kitap kayitlari.
- `class_courses`, `weekly_schedule_slots`: Egitim planlama ve ders programi.

Yeni tablo/kolon eklerken:

- Migration ekle.
- `src/types/database.ts` tiplerini guncelle.
- Gerekirse domain `queries/actions/permissions` dosyalarini ekle.
- Route, navigasyon ve yetki tablolarini birlikte dusun.
- Storage veya RLS etkisi varsa `docs/` altindaki notlari guncelle.

## Not ve Dönem Kuralları

- Not girişi dönem bazlıdır; aktif dönem varsa varsayılan seçim aktif dönem olmalıdır.
- Ders başına standart not yapısı 5 kalemdir: `1. Yazılı`, `2. Yazılı`, `3. Yazılı`, `4. Yazılı`, `Kanaat Notu`.
- Bu 5 kalem `exam_types` tablosunda ders bazında tutulur; yeni alan eklemek yerine eksik varsayılan sınav tiplerini tamamla.
- Ders ortalaması bu 5 kalemin ağırlıklı ortalamasıdır. Varsayılan ağırlıklar eşittir.
- Dashboard ve bölüm/sınıf başarı yüzdesi aktif dönem varsa aktif dönem notlarından hesaplanır; aktif dönem yoksa mevcut not verisi üzerinden geriye uyumlu hesap yapılabilir.
- Kanaat sistemi (`student_evaluations`) ayrı modüldür; not sistemindeki `Kanaat Notu` ise `grades` içinde bir sınav tipi olarak değerlendirilir.

## Öğrenci Profili ve Veli Görünümü

- Talebe detayinda ilk sekme `Profil` olmalidir; not ozeti, revir gecmisi, hoca yorumu ve okunan kitaplar burada yonetim odakli ozetlenir.
- Veli paneli (`/veli`) ayni profil ozetini salt okunur kullanir ve sadece `parent_student_links.parent_profile_id = profile.id` ile bagli talebeleri gosterir.
- Profil ozeti PDF indirme/yazdirma davranisi `StudentProfilePdfButton` ve print CSS ile yalnizca ilgili profil blogunu hedefler; form ve aksiyon butonlari PDF ciktisinda gizlenir.
- Hoca ve bolum muduru kendi bolumundeki talebe profiline yorum ve kitap kaydi ekleyebilir. Admin/genel mudur tum talebelerde ekleyebilir.
- Revir bilgisi profil icinde yeni tabloya kopyalanmaz; `infirmary_records` kayitlarindan cekilir.
- Profil yorumu ve kitap kaydi icin `src/lib/student-profile/actions.ts`, okuma icin `src/lib/student-profile/queries.ts`, yetki icin `src/lib/student-profile/permissions.ts` kullanilir.

## Auth ve RBAC Kuralları

- Supabase Auth tek basina yeterli degildir; uygulama yetkisi `profiles` tablosundaki aktif profile ve `role` alanina dayanir.
- Rolleri `src/types/rbac.ts` belirler: `admin`, `genel_mudur`, `bolum_muduru`, `hoca`, `veli`.
- `bolum_muduru` ve `hoca` icin `department_id` zorunlu kabul edilir.
- Protected panel route'lari icin once `requireAuth()` veya `requireRole()` kullan.
- Route bazli erisim `src/lib/route-permissions.ts` icinden yonetilir. Yeni route eklerken izinini burada tanimla.
- Sidebar gorunurlugu `src/lib/navigation.ts` icinden role gore filtrelenir. Route izni ile sidebar izni tutarli olmali.
- Server Actions dogrudan POST ile cagrilabilir; her action kendi icinde auth ve authorization kontrolu yapmalidir. Sadece UI'da buton saklamak yeterli degildir.
- Domain yetkileri resource bilgisi gerektiriyorsa `permissions.ts` fonksiyonlariyla kontrol et. Ornek: `canEditStudent(profile, student, courseClass)`.
- Veli rolu ayri bir akistir; personel rolleriyle ayni liste varsayimina sokma.

## Supabase Kuralları

- Server tarafinda Supabase icin `createSupabaseServerClient()` kullan.
- Browser tarafinda yalnizca client component gercekten gerektiriyorsa `src/lib/supabase/client.ts` kullan.
- `.env.local` sadece `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` icerir. Service role key frontend'e veya `NEXT_PUBLIC_` degiskenlerine konmaz.
- Auth kullanici id'si ile profile baglantisi `profiles.auth_user_id = user.id` uzerinden kurulur; `profiles.id` ile karistirma.
- Server client cookie yazimini her yerde dogrudan yapamaz; middleware/proxy cookie yenileme akisini dikkate al.
- Supabase hatalarinda kullaniciya kisa hata, log'a action/profile/payload/error bilgisi ver. Var olan `logSupabaseActionError` ve `buildSaveRedirect` desenini kullan.
- Storage bucket'lari: `student-photos`, `profile-photos`. Kabul edilen dosyalar `image/jpeg`, `image/png`, `image/webp`; maksimum `3 MB`.
- Foto upload icin `src/lib/storage/upload.ts` yardimcilarini kullan. Path deseni `{recordId}/{timestamp}-{uuid}-{safeFilename}`.
- Docs notu: Mevcut migrationlarda genel veritabani RLS varsayilan olarak kapali tutulmus. Canli Supabase'de RLS aciksa ilgili policy'leri `docs/EDUCATION_PLANNING_RLS.md` ve `docs/STORAGE_SETUP.md` ile uyumlu ele al.

## Server Component ve Client Component Sınırları

- Sayfa ve layoutlar varsayilan Server Component kalsin. Veri cekme, auth ve Supabase sorgulari server katmaninda yapilsin.
- `"use client"` yalnizca state, event handler, effect, browser API veya client-only kutuphane gereken bilesenlere eklenir.
- Client Component icine server-only moduller, Supabase server client, `next/headers`, `crypto`, dosya sistemi veya gizli env tasima.
- Server Component'ten Client Component'e sadece serializable props ver.
- Form mutationlari icin domain `actions.ts` dosyalarindaki `"use server"` action desenini koru.
- Mutation sonrasi once `revalidatePath(...)`, sonra `redirect(...)` cagir. `redirect` sonrasi kod calismayacagini unutma.

## Sayfa ve Domain Deseni

Yeni modül veya ekran eklerken tercih edilen akış:

1. Route'u `src/app/(panel)/.../page.tsx` altina ekle.
2. Gerekli veri okumalari icin `src/lib/<domain>/queries.ts` yaz.
3. Mutation gerekiyorsa `src/lib/<domain>/actions.ts` icinde `"use server"`, zod validasyon, `requireAuth`, permission check, Supabase mutation, revalidate ve redirect kullan.
4. Yetki fonksiyonlarini `src/lib/<domain>/permissions.ts` icine koy.
5. UI'yi `src/components/<domain>` altinda bol. Liste, form, filtre, empty state ve error message componentlerini ayri tut.
6. Yeni route panelde gorunecekse `src/lib/navigation.ts`; erisilecekse `src/lib/route-permissions.ts` guncelle.
7. Sema degisti ise migration, tipler ve docs birlikte guncellenir.

## UI ve Tasarım Kuralları

- Uygulama operasyon panelidir; pazarlama/landing page dili kullanma. Yogun ama okunabilir, is odakli ekranlar tasarla.
- Mevcut tema lacivert/beyaz/acik gri uzerine kurulu: renkleri `src/app/globals.css` tokenlarindan kullan.
- Tailwind 4 ve shadcn CSS variable desenini bozma.
- Ikon gereken butonlarda lucide-react kullan.
- `PageHeader`, `PanelShell`, `Sidebar`, `buttonVariants`, `ui/*` primitive'leri gibi mevcut parcalari tekrar kullan.
- Kartlari yalnizca gercekten cercevelenmis bilgi/form/listeler icin kullan; ayni sayfada gereksiz nested card yapma.
- Mobilde text tasmasi, buton icinde kirilma ve tablo tasmasi kontrol edilir. Uzun Turkce metinlerde `truncate`, `min-w-0`, responsive flex/grid kullan.
- Dil Turkce. Kullaniciya gorunen metinlerde domain terminolojisini koru: `Talebe`, `Hoca`, `Bolum`, `Sinif`, `Kanaat`, `Revir`, `Evrak`.

## Kod Stili

- TypeScript strict varsay. `any` kullanma; gerekiyorsa once `src/types` altinda tip tanimla.
- Validasyon icin zod kullan. Bos stringleri nullable alanlara yazarken mevcut `emptyToNull` desenini takip et.
- Slug uretimi icin `src/lib/slug.ts` kullan.
- Class birlestirme icin `cn` (`src/lib/utils.ts`) kullan.
- Importlarda `@/` alias'ini tercih et.
- Yorumlar kisa ve sadece karmasik niyetleri aciklamak icin olmali.
- Console loglar mevcutta debug amacli bazi yerlerde var; yeni kalici log eklerken gerekliligini sorgula, hassas veri yazma.
- Var olan kullanici degisikliklerini geri alma. Kapsam disi refactor yapma.

## Güvenlik ve Veri Bütünlüğü

- UI yetkisi, route yetkisi ve action yetkisi ayni sey degildir; mutation guvenligi action icinde kesinlesir.
- Bolum bazli kisitlarda `profile.department_id` ile ilgili `class.department_id`/resource bolumu karsilastirilir.
- `hoca` genelde kendi sinifi veya bolumuyle sinirli tutulur; admin/genel_mudur genis yetkilidir.
- Arsiv/pasif/mezun/ayrilmis talebelerde edit/reactivate kurallari domain permission fonksiyonlariyla uygulanir.
- Dosya yuklemede MIME ve boyut kontrolunu atlama.
- Redirect query parametrelerine hata mesaji koyarken `encodeURIComponent` kullan.

## Çalıştırma ve Doğrulama

- Dev server: `npm.cmd run dev` veya `npm run dev`.
- Build: `npm.cmd run build` veya `npm run build`.
- Lint: `npm run lint`.
- Type kontrol icin gerekirse `npx.cmd tsc --noEmit`.
- Frontend degisikliginden sonra ilgili route'u tarayici ile kontrol et; ozellikle mobil/desktop duzen, auth redirect ve form submit akisini dogrula.
- Supabase baglantisi gerektiren testlerde `.env.local` yoksa veya canli Supabase yetkisi yoksa bunu sonucu bildir.

## Sık Yapılan Hata Kaynakları

- `auth.users.id` ile `profiles.id` karistirilmasi. Auth baglantisi `profiles.auth_user_id` alanidir.
- Next 16 async `params/searchParams/cookies` deseninin unutulmasi.
- Yeni route eklenip `route-permissions.ts` veya `navigation.ts` dosyasinin unutulmasi.
- Server Action icinde sadece form validasyonu yapilip role/resource yetkisinin atlanmasi.
- SQL migration guncellenip `src/types/database.ts` dosyasinin unutulmasi.
- Client Component'e server-only Supabase/client cookie/env kodu import edilmesi.
- Storage policy/bucket kurulumu dusunulmeden upload ozelligi eklenmesi.
