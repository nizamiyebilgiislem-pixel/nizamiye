# Dönem Sonlandırma Simülasyon Uygulama Raporu

Bu belge, dönem sonlandırma altyapısı ve buna bağlı simülasyon ekranı için uygulanan değişiklikleri özetler. Kapsam iki aşamayı birlikte içerir:

- FAZ 1: dönem sonlandırma altyapısı
- FAZ 2: dönem sonlandırma simülasyon ve ön kontrol ekranı

Amaç, gerçek dönem kapatma yapılmadan önce sistemi güvenli biçimde analiz edebilen, sadece yetkili kullanıcıların erişebildiği, veri değiştirmeyen bir ön izleme katmanı oluşturmaktı.

## 1. Uygulanan Temel Kapsam

### 1.1 FAZ 1 - Altyapı

Aşağıdaki çekirdek altyapı eklendi:

- `term_closure_runs` tablosu
- dönem sonlandırma yetki kontrolü
- dönem sonlandırma simülasyon servisi
- dönem kapanış operasyon kaydı mantığı
- snapshot yapısının dönem sonu özetlerini taşıyabilecek şekilde genişletilmesi
- audit entegrasyonu için operasyon modeli

### 1.2 FAZ 2 - Simülasyon Ekranı

Aşağıdaki kullanıcı yüzü ve sunucu entegrasyonu eklendi:

- `/sistem/donem-sonlandirma` route’u
- sistem yönetimi menü bağlantısı
- aktif dönem kartı
- simülasyon çalıştırma butonu
- sonuç özet kartları
- uyarı ve engel listeleri
- `term_closure_runs` geçmiş tablosu
- `loading.tsx`
- `error.tsx`

## 2. Değiştirilen Dosyalar

### 2.1 Yeni veya güncellenen altyapı dosyaları

- [supabase/migrations/00034_term_closure_infrastructure.sql](C:/Users/user/Desktop/nizamiye/supabase/migrations/00034_term_closure_infrastructure.sql)
- [src/types/database.ts](C:/Users/user/Desktop/nizamiye/src/types/database.ts)
- [src/lib/terms/closure-permissions.ts](C:/Users/user/Desktop/nizamiye/src/lib/terms/closure-permissions.ts)
- [src/lib/terms/simulation.ts](C:/Users/user/Desktop/nizamiye/src/lib/terms/simulation.ts)
- [src/lib/terms/closure.ts](C:/Users/user/Desktop/nizamiye/src/lib/terms/closure.ts)
- [src/lib/terms/snapshots.ts](C:/Users/user/Desktop/nizamiye/src/lib/terms/snapshots.ts)
- [tests/term-closure-permissions.test.ts](C:/Users/user/Desktop/nizamiye/tests/term-closure-permissions.test.ts)

### 2.2 Simülasyon ekranı ve veri okuma katmanı

- [src/lib/navigation.ts](C:/Users/user/Desktop/nizamiye/src/lib/navigation.ts)
- [src/lib/route-permissions.ts](C:/Users/user/Desktop/nizamiye/src/lib/route-permissions.ts)
- [src/lib/terms/closure-queries.ts](C:/Users/user/Desktop/nizamiye/src/lib/terms/closure-queries.ts)
- [src/lib/terms/closure-actions.ts](C:/Users/user/Desktop/nizamiye/src/lib/terms/closure-actions.ts)
- [src/components/terms/term-closure-simulation-panel.tsx](C:/Users/user/Desktop/nizamiye/src/components/terms/term-closure-simulation-panel.tsx)
- [src/app/(panel)/sistem/donem-sonlandirma/page.tsx](C:/Users/user/Desktop/nizamiye/src/app/(panel)/sistem/donem-sonlandirma/page.tsx)
- [src/app/(panel)/sistem/donem-sonlandirma/loading.tsx](C:/Users/user/Desktop/nizamiye/src/app/(panel)/sistem/donem-sonlandirma/loading.tsx)
- [src/app/(panel)/sistem/donem-sonlandirma/error.tsx](C:/Users/user/Desktop/nizamiye/src/app/(panel)/sistem/donem-sonlandirma/error.tsx)

### 2.3 İlgili ama önceki fazlardan kalan dosyalar

Bu fazın temelini oluşturan ve daha önce eklenmiş olan dosyalar da rapor kapsamındadır:

- [src/lib/assistant/llm-reliability.ts](C:/Users/user/Desktop/nizamiye/src/lib/assistant/llm-reliability.ts)
- [src/lib/assistant/llm.ts](C:/Users/user/Desktop/nizamiye/src/lib/assistant/llm.ts)
- [src/components/assistant/assistant-chat.tsx](C:/Users/user/Desktop/nizamiye/src/components/assistant/assistant-chat.tsx)
- [DONEM_SONU_ANALIZ_TASARIM_RAPORU.md](C:/Users/user/Desktop/nizamiye/DONEM_SONU_ANALIZ_TASARIM_RAPORU.md)

## 3. FAZ 1 Uygulama Özeti

### 3.1 Veritabanı altyapısı

`term_closure_runs` tablosu eklendi. Tablo şu amaçlarla kullanılıyor:

- dönem sonlandırma operasyon kaydı tutmak
- aynı dönem için eş zamanlı birden fazla kapanış girişimini engellemek
- simülasyon çıktısını ve özet metrikleri saklamak
- hata durumunu ve zaman bilgilerini izlemek

Ek olarak `student_term_snapshots` yapısı, dönem sonu özetlerini daha iyi taşıyabilmek için genişletildi.

### 3.2 Tip sistem güncellemesi

`src/types/database.ts` dosyasında aşağıdaki tipler eklendi veya genişletildi:

- `TermClosureRunStatus`
- `TermClosureRunRow`
- `SnapshotSummary`
- `TermSimulationResult`
- `attendance_summary` alanı

Bu sayede hem simülasyon sonucu hem de kapanış geçmişi tip güvenli hale getirildi.

### 3.3 Yetki kontrolü

Tek bir merkezden yetki denetimi sağlamak için `closure-permissions.ts` oluşturuldu.

Kurallar:

- `admin` erişebilir
- `genel_mudur` erişebilir
- diğer roller erişemez

### 3.4 Simülasyon servisi

`simulateTermClosure()` servisi eklendi. Bu servis:

- veri yazmaz
- insert/update/delete yapmaz
- sadece mevcut veriyi okur ve sayısal özet üretir

Hesaplanan ana metrikler:

- aktif öğrenci sayısı
- bölüm sayısı
- sınıf sayısı
- not sayısı
- kanaat sayısı
- yoklama oturumu sayısı
- yoklama kayıt sayısı
- revir kaydı sayısı
- rehberlik kayıt sayısı
- aktif yatakhane ataması sayısı
- açık görev sayısı
- açık talep sayısı
- açık kütüphane emaneti sayısı
- planlı/aktif canlı oturum sayısı

### 3.5 Dönem kapanış operasyon iskeleti

`runTermClosure()` servisi, gerçek kapatma yapmadan operasyon akışını kuracak şekilde hazırlandı.

İlk fazda:

- yetki kontrolü
- aktif dönem doğrulaması
- aktif kapanış kontrolü
- simülasyon çağrısı
- operasyon kaydı oluşturma
- audit kaydı oluşturma

### 3.6 Snapshot genişletmesi

`student_term_snapshots` içinde dönem sonu özetlerini daha anlamlı tutabilmek için `attendance_summary` ve ilgili toplamlar eklendi.

## 4. FAZ 2 Uygulama Özeti

### 4.1 Route ve navigation

Yeni route eklendi:

- `/sistem/donem-sonlandirma`

Navigation içinde bu ekran:

- `Yönetim` grubuna
- `Dönem Sonlandırma` adıyla

eklendi.

### 4.2 Route permission

`src/lib/route-permissions.ts` içine yeni izin tanımı eklendi:

- `/sistem/donem-sonlandirma` -> `admin`, `genel_mudur`

### 4.3 Sayfa yapısı

Yeni sayfa şu bölümleri içeriyor:

- üst açıklama ve uyarı bandı
- aktif dönem kartı
- simülasyon çalıştırma butonu
- sonuç özetleri
- uyarı listesi
- engel listesi
- dönem kapanış geçmişi

### 4.4 Loading ve error state

Route için iki destek dosyası eklendi:

- `loading.tsx`
- `error.tsx`

Bu sayede sayfa yüklenirken ve hata oluştuğunda kullanıcıya kurumsal bir ekran gösteriliyor.

## 5. Simülasyon Akışı

### 5.1 Server action

`runTermClosureSimulationAction()` oluşturuldu.

Bu action:

- `requireAuth()` ile kullanıcıyı doğrular
- dönem sonlandırma yetkisini kontrol eder
- aktif dönemi bulur
- `simulateTermClosure()` ile okuma tabanlı özet üretir
- sonucu UI’a döndürür

### 5.2 Veri etkisi

Bu fazda:

- veri silinmez
- veri güncellenmez
- veri eklenmez
- gerçek dönem kapatma yapılmaz

Bu kural simülasyon action’ı için korunmuştur.

### 5.3 Sonuç gösterimi

Simülasyon çıktısı şu başlıklarla gösteriliyor:

- Genel Özet
- Akademik Veriler
- Yoklama
- Sağlık/Revir
- Rehberlik
- Yatakhane
- Kütüphane
- Görevler ve Talepler
- Canlı Oturumlar
- Uyarılar
- Engeller

## 6. Geçmiş Kayıtları

`term_closure_runs` geçmişi için yeni sorgu katmanı eklendi.

Gösterilen alanlar:

- tarih
- dönem
- durum
- başlatan kullanıcı
- başlangıç zamanı
- bitiş zamanı
- hata mesajı

Bu bölüm yalnızca okuma amaçlıdır.

## 7. Güvenlik ve Erişim

### 7.1 Kullanıcı erişimi

Ekran ve action yalnızca şu rollere açık:

- `admin`
- `genel_mudur`

### 7.2 Yönetim menüsü

Destek birim müdürü, hoca ve veli menüde bu sayfayı görmez.

### 7.3 Sunucu tarafı kontrol

Sadece UI seviyesinde değil, server tarafında da erişim kontrolü yapıldı.

Bu, doğrudan action çağrılarında yetkisiz kullanım riskini azaltır.

## 8. Test ve Doğrulama

### 8.1 Statik doğrulama

Başarılı geçen komutlar:

- `npx.cmd tsc --noEmit`
- `npm.cmd run lint`
- `npm.cmd run build`

### 8.2 Build çıktısı

Build çıktısında yeni route şu şekilde derlendi:

- `/sistem/donem-sonlandirma`

### 8.3 Yerel kontrol

Route, çalışan dev sunucuda 200 yanıt verdi.

Yetkisiz oturum için login ekranına yönlendirme davranışı korundu.

## 9. Sonuç

Bu çalışma sonunda dönem sonlandırma için güvenli bir ön izleme ve simülasyon katmanı hazırlandı. Sistem şu anda:

- yetkili kullanıcılarla sınırlandırılmış
- veri değiştirmeyen bir simülasyon akışına sahip
- geçmiş kapanış denemelerini görüntüleyebiliyor
- gerçek kapatma adımına hazır bir altyapı taşıyor

Gerçek dönem kapatma, kilitleme, yeni dönem oluşturma ve export işlemleri bu fazda bilinçli olarak eklenmedi.

