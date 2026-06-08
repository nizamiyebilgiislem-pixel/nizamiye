# Nizamiye İlerleme Özeti

Son güncelleme: 2026-06-06

## Mevcut Durum

- Proje Next.js `16.2.7`, React `19.2.4`, TypeScript strict, Tailwind CSS 4, shadcn/Base UI ve Supabase üzerine kurulmuş durumda.
- App Router yapısı oturmuş: `src/app/(auth)` giriş akışı, `src/app/(panel)` panel ekranları, `src/app/auth` auth callback/logout route handlerları için ayrılmış.
- Panel tarafında ana modüller oluşturulmuş: dashboard, talebeler, hocalar, bölümler, sınıflar, not sistemi, eğitim planlama, kanaat sistemi, revir, evraklar, kullanıcılar, raporlar, ayarlar ve veli paneli.
- İş mantığı domain bazında `src/lib/<domain>` altında `queries.ts`, `actions.ts`, `permissions.ts` desenine ayrılmış.
- UI bileşenleri domain klasörlerine bölünmüş; ortak primitive bileşenler `src/components/ui` altında tutuluyor.
- Supabase migration yapısı var: ilk şema, kanaat unique düzeltmesi, profil foto alanı ve eğitim planlama tabloları migration olarak eklenmiş.
- Supabase Auth, Storage ve eğitim planlama RLS notları `docs/` altında belgelenmiş.

## Bugünkü Çalışma

- Proje yapısı tarandı: paketler, App Router route ağacı, domain `lib` katmanı, component yapısı, Supabase migrationları, docs ve Next.js 16 yerel dokümanları incelendi.
- `CLAUDE.md` dosyası gerçek proje hafızası olacak şekilde yeniden yazıldı.
- `CLAUDE.md` içine şu kurallar eklendi:
  - Next.js 16 için yerel doküman okuma zorunluluğu.
  - Async `params`, `searchParams`, `cookies`, `headers` deseni.
  - `middleware`/`proxy` deprecation notu.
  - Klasör sorumlulukları ve domain mimarisi.
  - Supabase Auth, profile ve RBAC kuralları.
  - Server Action güvenlik kuralları.
  - Veri modeli özeti.
  - UI, kod stili, doğrulama ve sık hata kaynakları.
- Bu dosya (`progress.md`) ilerleyiş takibi için oluşturuldu.
- Dashboard gerçek veri ve profesyonel UI/UX fazına başlandı.
- `src/lib/dashboard/queries.ts` eklendi; dashboard metrikleri, son kayıt listeleri ve talebe dağılımları role/bölüm filtresiyle hesaplanıyor.
- Dashboard sayfası statik mock veriden çıkarıldı; gerçek Supabase verileriyle çalışan kartlar, son talebe/revir/evrak/kanaat listeleri ve dağılım blokları eklendi.
- Profil ve talebe avatar boyutları standartlaştırıldı: üst bar küçük, liste orta, detay büyük kullanımına göre güncellendi.
- Hoca/kullanıcı listesi, sınıf hocası alanları, revir listesi, evrak listesi, eğitim planlama ders/program ekranları ve not girişi detay başlığı avatar destekli hale getirildi.
- Supabase/auth debug `console.log` satırları temizlendi; server action hata logları korunacak şekilde bırakıldı.
- Genel save hata mesajları modüle özel ve kullanıcı dostu hale getirildi.
- `npm.cmd run lint` ve `npm.cmd run build` başarıyla çalıştı.
- In-app browser doğrulaması sandbox kaynaklı açılamadı; `/dashboard` HTTP 200 yanıtı PowerShell ile doğrulandı.
- Profil/talebe fotoğraf yükleme sorunu incelendi. Fotoğraf içeren formlara `encType="multipart/form-data"` eklendi.
- Profil ve talebe fotoğraf upload hataları artık sessizce yutulmuyor; bucket/policy kaynaklı problem varsa kullanıcıya `photo-upload` hatası gösteriliyor.
- Fotoğraf upload düzeltmesinden sonra `npm.cmd run lint` ve `npm.cmd run build` tekrar başarılı çalıştı.
- `student-edit-form.tsx` form hatasına neden olabilen manuel `encType` eklemesi geri alındı; Next Server Action form akışı doğal `FormData` davranışıyla bırakıldı.
- Talebe fotoğrafları opsiyonel önizleme/indirme desteği kazandı. Talebe detay, talebe listesi, sınıf detayı, revir, evrak, kanaat ve not girişi alanlarında fotoğrafa tıklayınca büyük önizleme açılır ve indirme bağlantısı görünür.
- Önizleme düzeltmesinden sonra `npm.cmd run lint` ve `npm.cmd run build` başarılı çalıştı.
- Bölümler ve dashboard profesyonel yönetim görünümü fazı tamamlandı.
- `src/lib/departments/analytics.ts` eklendi; bölüm/sınıf doluluk, başarı ortalaması, müdür/hoca, ders, program ve aktif talebe verileri tek katmanda hesaplanıyor.
- `/bolumler` düz tablo yerine kart tabanlı görünüme geçirildi.
- `/bolumler/[id]` bölüm bilgi kartı, müdür kartı, doluluk/başarı göstergeleri, sınıf kartları, son talebeler ve hocalar ile yenilendi.
- `/siniflar/[id]` sınıf bilgi kartı, sınıf hocası kartı, doluluk/başarı, dersler, program özeti ve talebe profil kartlarıyla yenilendi.
- Dashboard'a bölüm doluluk paneli, başarı yüzdesi paneli, bölüm yönetim kartları ve bölümlere göre açılır sınıf/talebe görünümleri eklendi.
- Bu fazdan sonra `npm.cmd run lint` ve `npm.cmd run build` başarılı çalıştı.
- Eğitim planlama ders atama sırasında görülen `42501` policy/permission hatası için `supabase/migrations/00006_education_planning_permissions.sql` eklendi.
- Bu migration `class_courses` ve `weekly_schedule_slots` için `authenticated` tablo grant'leri ve RLS açıksa read/insert/update policy'leri oluşturur.
- Eğitim planlama izin düzeltmesinden sonra `npm.cmd run lint` ve `npm.cmd run build` başarılı çalıştı.
- Dönem/not/kanaat akışı stabilize edildi.
- Dönem ekleme action'ı başarılı kayıt sonrası dönemler, not girişi, kanaat girişi ve dashboard ekranlarını yeniden doğrulayacak şekilde güncellendi.
- Dashboard aktif dönem bilgisini görünür şekilde göstermeye başladı.
- Not girişi aktif dönemi varsayılan seçer; hatalı dönem parametresi varsa aktif/ilk döneme düşer.
- Sınıfa atanmış derslerde not alanı görünmemesi sorunu için ders başına varsayılan 5 not tipi tanımlandı: 4 yazılı ve 1 kanaat notu.
- Mevcut dersler için eksik varsayılan sınav tiplerini ekleyen ve dönem/not/kanaat tablolarına authenticated izinleri veren `supabase/migrations/00007_grade_term_permissions_and_defaults.sql` eklendi.
- Bölüm, sınıf ve dashboard başarı yüzdeleri aktif dönem varsa aktif dönem notlarından hesaplanacak şekilde güncellendi.
- Not ve kanaat giriş sayfalarındaki dönem yok/yanlış dönem durumları daha anlaşılır hale getirildi.
- Öğrenci profili fazı eklendi.
- Talebe detayında ilk sekme olarak `Profil` görünümü oluşturuldu; not özeti, dönem içi hoca yorumu, revir geçmişi ve okunan kitaplar tek yönetim ekranında gösteriliyor.
- Hoca, bölüm müdürü, admin ve genel müdür yetkisi dahilinde talebe profiline yorum ve okunan kitap kaydı ekleyebiliyor.
- Veli paneli gerçek veriye bağlandı; `parent_student_links` ile bağlı talebelerin profil özetini salt okunur gösteriyor.
- Revir bilgisi yeni tabloya kopyalanmadan mevcut `infirmary_records` üzerinden profil ekranına çekiliyor.
- Profil yorumları ve kitaplar için `supabase/migrations/00008_student_profile_notes_books.sql` migration'ı, `src/lib/student-profile/*` domain katmanı ve `src/components/students/student-profile-overview.tsx` bileşeni eklendi.
- Bu fazdan sonra `npm.cmd run lint` ve `npm.cmd run build` başarılı çalıştı.
- Talebe profil özetine `PDF İndir` butonu eklendi. Buton tarayıcı PDF yazdırma akışını açar ve print CSS sadece seçili profil alanını basar; form ve aksiyon butonları çıktıdan gizlenir.
- PDF indirme eklemesinden sonra `npm.cmd run lint` ve `npm.cmd run build` başarılı çalıştı.

## Mimari Kararlar

- Sayfa ve layoutlar mümkün olduğunca Server Component kalacak.
- Client Component yalnızca state, event handler, effect veya browser API gerektiğinde kullanılacak.
- Mutationlar domain `actions.ts` dosyalarında `"use server"` ile tutulacak.
- Her Server Action kendi içinde `requireAuth` ve domain permission kontrolü yapacak.
- Yeni route eklenince `src/lib/route-permissions.ts` ve gerekiyorsa `src/lib/navigation.ts` birlikte güncellenecek.
- Veritabanı şeması değiştiğinde migration ile beraber `src/types/database.ts` de güncellenecek.
- Supabase Auth kullanıcı id'si ile uygulama profili `profiles.auth_user_id` üzerinden bağlanacak; `profiles.id` ile karıştırılmayacak.

## Açık Konular

- `middleware.ts` hâlâ mevcut; Next.js 16 dokümanına göre `proxy.ts` geçişi değerlendirilmesi gereken teknik borç.
- `middleware.ts`, `src/lib/auth.ts` ve `src/lib/supabase/server.ts` içinde debug amaçlı `console.log` satırları var; üretime hazırlıkta temizlenmeli veya kontrollü log stratejisine alınmalı.
- Supabase RLS genel migrationlarda aktif görünmüyor; canlı ortamda RLS açıksa policy dokümanlarıyla uyumlu kontrol edilmeli.
- Storage bucket ve policy kurulumları canlı Supabase tarafında doğrulanmalı.
- Git çalışma ağacında `CLAUDE.md` dışındaki birçok değişiklik/untracked dosya zaten mevcut; bunlara bu çalışmada dokunulmadı.

## Sonraki Mantıklı Adımlar

- `npm run lint` ve `npm.cmd run build` ile mevcut kod tabanı doğrulanmalı.
- Auth akışı gerçek Supabase projesiyle test edilmeli: login, aktif profile eşleşmesi, role göre redirect.
- Kritik panel route'ları rol bazında gezilmeli: admin, genel_mudur, bolum_muduru, hoca, veli.
- Form akışları test edilmeli: talebe oluşturma/düzenleme, foto upload, not/kanaat/revir/evrak kayıtları.
- Next.js 16 uyumluluğu için `middleware.ts` -> `proxy.ts` geçişi ayrı bir küçük iş olarak planlanmalı.
