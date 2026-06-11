# Nizamiye Öğrenci Yönetim Sistemi

# Dönem Sonu Analiz ve Tasarım Raporu

## 1. Mevcut Durum Analizi

Kod yazmadan mevcut şema ve uygulama katmanı incelendi. Sistem şu anda "dönem" kavramını esas olarak Not Sistemi, Kanaat Sistemi ve kısmi öğrenci dönem snapshot'ları için kullanıyor.

Mevcut dönem altyapısı:

- `academic_terms`: dönem tanımı, `status`, `closed_at`, `closed_by`, `is_current`, `is_active` alanları var.
- `student_term_snapshots`: dönem kapanırken öğrenci bazlı özet snapshot tutmak için var.
- `grades.term_id`: notlar dönem bağlı.
- `student_evaluations.term_id`: kanaatler dönem bağlı.
- `student_profile_notes.term_id`: öğrenci hoca notları dönem bağlı olabilir.
- `student_books.term_id`: öğrencinin okuduğu kitaplar dönem bağlı olabilir.

Mevcut dönem kapatma:

- `src/lib/terms/actions.ts` içinde `closeTermAction` var.
- Yetki `canManageGradeSettings(profile)` ile kontrol ediliyor; bu da sadece `admin` ve `genel_mudur`.
- Kapatma işleminde `academic_terms.status = closed`, `is_current = false`, `is_active = false` yapılıyor.
- `student_term_snapshots` oluşturuluyor.
- Ancak bu mevcut işlem tüm kurum dönem sonlandırma değil; daha çok akademik not/kanaat dönemi kapatma.

Mevcut snapshot kapsamı:

- Aktif öğrenciler
- Notlar
- Kanaatler
- Revir kayıtları
- Öğrencinin o anki sınıf/bölüm durumu

Eksik kalanlar:

- Yoklama snapshot içinde detaylı değil.
- Rehberlik yok.
- Yatakhane yok.
- Kütüphane yok.
- Evraklar yok.
- Talepler, görevler, canlı oturumlar, duyurular dönemle bağlı değil.
- Sınıf/ders programı aktif yapı olarak duruyor; dönem bazlı versiyonlama yok.

## 2. Dönem Bağımlı Tablolar

| Tablo | Amaç | Dönem bağımlı mı? | Dönem sonunda öneri |
|---|---|---:|---|
| `academic_terms` | Dönem tanımı | Evet | Aktif dönem `closed` yapılmalı, yeni dönem ayrı kayıtla açılmalı |
| `grades` | Öğrenci notları | Evet, `term_id` var | Korunmalı, kapalı dönemde salt okunur olmalı |
| `student_evaluations` | Kanaat değerlendirmesi | Evet, `term_id` var | Korunmalı, kapalı dönemde salt okunur olmalı |
| `student_profile_notes` | Öğrenci hoca/gözlem notları | Kısmen, `term_id` nullable | Yeni kayıtlar aktif döneme bağlanmalı, eski kayıtlar korunmalı |
| `student_books` | Öğrencinin okuduğu kitaplar | Kısmen, `term_id` nullable | Korunmalı, aktif dönem default atanmalı |
| `student_term_snapshots` | Dönem sonu öğrenci özeti | Evet | Dönem kapatmanın ana arşiv indeksi olmalı |
| `attendance_sessions` | Sınıf/namaz yoklama oturumları | Tarih bazlı, `term_id` yok | Tarih aralığıyla dönemlenebilir; idealde `term_id` eklenmeli |
| `attendance_records` | Öğrenci yoklama kayıtları | Session üzerinden tarih bazlı | Korunmalı, kapalı dönem kayıtları değiştirilememeli |
| `infirmary_records` | Revir kayıtları | Tarih bazlı, `term_id` yok | Korunmalı, dönem arşivinde tarih aralığıyla dahil edilmeli |
| `guidance_interviews` | Rehberlik görüşmeleri | Tarih bazlı | Korunmalı, dönem arşivinde gösterilmeli |
| `guidance_follow_ups` | Rehberlik takipleri | Tarih bazlı | Açık takipler yeni döneme devredebilir; kapalı olanlar arşivlenmeli |
| `guidance_surveys` | Rehberlik anketleri | Tarih/status bazlı | Dönem sonunda aktif anketler kapatılmalı veya devredilmeli |
| `guidance_survey_questions` | Anket soruları | Üst ankete bağlı | Üst anketle korunmalı |
| `guidance_survey_responses` | Anket cevapları | Üst ankete bağlı | Korunmalı |
| `guidance_survey_answers` | Cevap detayları | Üst cevaba bağlı | Korunmalı |
| `guidance_activities` | Rehberlik etkinlikleri | Tarih/status bazlı | Tamamlananlar arşivlenmeli, planlananlar devredilmeli |
| `guidance_activity_participants` | Etkinlik katılımcıları | Üst etkinliğe bağlı | Korunmalı |
| `dormitory_assignments` | Öğrenci yatakhane yerleşimi | Tarih/status bazlı | Aktif atamalar dönem sonunda opsiyonel sonlandırılmalı |
| `library_loans` | Kitap emanetleri | Tarih/status bazlı | Açık emanetler devretmeli; dönen/kayıp kayıtlar korunmalı |
| `student_documents` | Öğrenci evrakları | Tarih bazlı | Korunmalı; dönem arşivine dahil edilmeli |
| `talepler` | Talep yönetimi | Tarih/status bazlı | Açık talepler devretmeli; kapananlar arşivlenmeli |
| `tasks` | Görevler | Tarih/status bazlı | Açık görevler devretmeli veya iptal/kapatma onayı alınmalı |
| `task_comments` | Görev yorumları | Üst göreve bağlı | Görevle korunmalı |
| `task_attachments` | Görev ekleri | Üst göreve bağlı | Görevle korunmalı |
| `live_sessions` | Canlı oturumlar | Tarih/status bazlı | Geçmiş oturumlar korunmalı; aktif/planlılar kontrol edilmeli |
| `live_session_participants` | Oturum katılımcıları | Üst oturuma bağlı | Korunmalı |
| `announcements` | Duyurular | Tarih/status bazlı | Eski duyurular pasifleştirilebilir, silinmemeli |
| `audit_logs` | Denetim kayıtları | Tarih bazlı | Kesinlikle korunmalı |
| `assistant_messages` | AI sohbet geçmişi | Kullanıcı/tarih bazlı | Dönem kapatma kapsamında kritik değil; opsiyonel saklama politikası olabilir |

## 3. Kalıcı Tablolar

Bu tablolar dönem sonunda silinmemeli, çoğu yeni dönemde aynen korunmalı:

| Tablo | Amaç | Dönem sonunda öneri |
|---|---|---|
| `departments` | Bölümler | Korunmalı |
| `profiles` | Kullanıcı/personel/veli profilleri | Korunmalı |
| `classes` | Sınıflar | Korunmalı; aktif/pasif veya yeni dönem sınıf kopyalama stratejisi gerekli |
| `students` | Öğrenci ana kaydı | Kesinlikle korunmalı; mezun/ayrıldı durumu `status` ile tutulmalı |
| `parent_student_links` | Veli-öğrenci bağı | Genelde korunmalı; mezun öğrencide veli erişimi politikaya göre sınırlandırılabilir |
| `courses` | Dersler | Korunmalı |
| `exam_types` | Sınav türleri | Korunmalı |
| `class_courses` | Sınıf-ders-hoca ataması | Yeni dönemde sıfırlanabilir/kopyalanabilir |
| `weekly_schedule_slots` | Haftalık ders programı | Yeni dönemde sıfırlanabilir/kopyalanabilir |
| `dormitories` | Yatakhaneler | Korunmalı |
| `library_categories` | Kütüphane kategorileri | Korunmalı |
| `library_books` | Kitap envanteri | Korunmalı |
| `library_documents` | Kütüphane dokümanları | Korunmalı |
| `module_assignments` | Modül yetkileri | Korunmalı |
| `audit_logs` | Denetim izi | Korunmalı |

Öğrenci ana kaydı için kritik nokta: `students.course_class_id` aktif sınıfı gösteriyor. Öğrenci mezun olduğunda veya sınıfı değiştiğinde geçmiş sınıf bilgisi sadece bazı işlem kayıtlarında dolaylı kalıyor. `student_term_snapshots.class_id` bu açığı kısmen kapatıyor. Profesyonel mimaride her dönem sonunda öğrencinin sınıf/bölüm/status snapshot'ı mutlaka alınmalı.

## 4. Arşiv Stratejisi

### A) Sistem içi arşiv

Avantajlar:

- En güvenli yaklaşım.
- Veriler ilişkileriyle veritabanında kalır.
- Öğrenci dosyası üzerinden geçmiş dönemler görüntülenebilir.
- Yetki/RLS mantığı korunabilir.
- Sonradan rapor üretmek mümkün olur.
- ZIP/PDF hatası dönem kapatmayı engellemez.

Dezavantajlar:

- Bazı tablolarda `term_id` yok; tarih aralığıyla filtrelemek gerekir.
- Büyük veri büyüdükçe sorgu performansı için indeks ve dönem filtresi gerekir.
- Kapalı dönem salt okunur kuralları uygulama ve/veya DB seviyesinde güçlendirilmelidir.

### B) ZIP/PDF dışa aktarım

Avantajlar:

- Yönetim için offline arşiv sağlar.
- Bölüm/sınıf bazlı teslim edilebilir.
- Denetim, kurul, veli görüşmesi gibi durumlarda pratik olur.
- Veritabanından bağımsız saklanabilir.

Dezavantajlar:

- Tek başına güvenilir arşiv değildir.
- PDF/ZIP üretimi ağırdır.
- Vercel timeout riski yüksek.
- Dosya bozulursa veya eksik üretilirse veri geçmişinin tek kaynağı olamaz.
- Yetki ve gizlilik açısından dosya erişim kontrolü gerekir.
- Büyük dönemlerde tek ZIP üretimi maliyetli olur.

Sonuç: Ana arşiv mutlaka sistem içi olmalı. ZIP/PDF sadece dışa aktarım katmanı olmalı.

## 5. ZIP Stratejisi

Önerilen yapı uygulanabilir:

```text
2026_Bahar_Donemi.zip
  Arapca_Bolumu/
    Siniflar/
    Talebeler/
    Notlar/
    Kanaatler/
    Yoklama/
    Revir/
    Rehberlik/
  Hafizlik_Bolumu/
    ...
  Genel_Raporlar/
```

Daha iyi üretim yapısı:

```text
2026_Bahar_Donemi.zip
  manifest.json
  Genel_Raporlar/
    donem_ozeti.pdf
    kapanis_tutanagi.pdf
    eksik_veri_raporu.pdf
  Arapca_Bolumu/
    bolum_ozeti.pdf
    Siniflar/
      1A/
        sinif_ozeti.pdf
        notlar.pdf
        kanaatler.pdf
        yoklama.pdf
        talebeler/
          ogrenci_ad_soyad/
            ogrenci_dosyasi.pdf
            not_gecmisi.pdf
            kanaat_gecmisi.pdf
            yoklama_gecmisi.pdf
            revir_gecmisi.pdf
            rehberlik_ozeti.pdf
            evrak_listesi.pdf
```

Önemli tasarım notları:

- ZIP üretimi dönem kapatma işleminin içinde bloklayıcı olmamalı.
- Önce sistem içi kapanış yapılmalı, sonra arşiv export job olarak hazırlanmalı.
- `manifest.json` içinde dönem id, tarih, oluşturan kullanıcı, tablo sayıları, dosya listesi ve checksum bilgileri olmalı.
- Gizli rehberlik notları ayrı yetkiyle export edilmeli; her ZIP'e otomatik konmamalı.
- Öğrenci evraklarının gerçek dosyaları büyük olabilir; ZIP içine dosya kopyalamak yerine ilk fazda evrak listesi ve güvenli link daha yönetilebilir olabilir.

## 6. Riskler

### Veri kaybı

En büyük risk `students.course_class_id`, `class_courses`, `weekly_schedule_slots`, `dormitory_assignments` gibi aktif ilişkilerin sıfırlanmasıdır.

Çözüm: Sıfırlama öncesi `student_term_snapshots` benzeri kapsamlı dönem snapshot'ı alınmalı. Silme yerine status/end_date kullanılmalı.

### Yanlışlıkla dönem kapatma

Çözüm: Sihirbaz, önizleme, çift onay, dönem adını elle yazdırma, audit log, geri alınabilir soft close penceresi.

### Büyük ZIP üretimi

Çözüm: ZIP'i isteğe bağlı ve asenkron üretmek. Bölüm bazlı parçalara ayırmak. Tek dev ZIP yerine çoklu arşiv üretmek.

### Vercel timeout

Çözüm: Server action içinde PDF/ZIP üretmemek. Supabase Edge Function, queue, cron job veya background worker mantığı kullanmak. İlk fazda sadece arşiv hazırlık kaydı oluşturmak.

### Supabase performansı

Çözüm: dönem/tarih indeksleri, sayfalı export, bölüm/sınıf bazlı batch, `term_id` eklenebilecek tablolarda doğrudan dönem bağı.

### PDF üretim yükü

Çözüm: PDF'leri talep bazlı üretmek, cachelemek, toplu üretimde batch yapmak. Öğrenci başına tek dosya üretimini sınırlandırmak.

### Gizlilik

Rehberlik `private_notes`, sağlık/revir kayıtları ve öğrenci kişisel bilgileri hassas.

Çözüm: export profilleri: Yönetici tam arşiv, bölüm arşivi, veli/öğrenci paylaşılabilir arşiv.

### Açık işler

Açık görev, talep, takip, emanet, yatakhane ataması dönem sonunda körlemesine kapatılmamalı.

Çözüm: sihirbazda devret / kapat / iptal / olduğu gibi bırak seçenekleri.

## 7. Önerilen Mimari

Bu sistem için en güvenli mimari:

1. Sistem içi dönem arşivi ana kaynak olmalı.
2. Dönem kapatma atomik ve küçük tutulmalı.
3. ZIP/PDF export dönem kapatmadan ayrılmalı.
4. Silme yapılmamalı; status/end_date/is_active ile geçmiş korunmalı.
5. Aktif ilişki değişecekse önce snapshot alınmalı.
6. Kapalı dönem verileri uygulama seviyesinde salt okunur yapılmalı.
7. Kritik alanlarda ileride DB seviyesinde de kilit kuralı düşünülmeli.

Önerilen dönem sonlandırma modeli:

- `academic_terms` dönem durumunu yönetir.
- `student_term_snapshots` genişletilerek veya yeni arşiv snapshot tablolarıyla dönem kapanış özeti tutulur.
- `grades`, `student_evaluations`, `student_profile_notes`, `student_books` doğrudan `term_id` üzerinden dönemlenir.
- `attendance`, `infirmary`, `guidance`, `library_loans`, `documents`, `tasks`, `talepler`, `live_sessions`, `announcements` ilk fazda tarih aralığıyla arşivlenir.
- İkinci fazda kritik tarih bazlı tablolara `term_id` eklenmesi değerlendirilebilir.

Önerilen dönem sonlandırma sihirbazı:

1. Ön Kontrol
   - Aktif dönem var mı?
   - Kullanıcı `admin` veya `genel_mudur` mu?
   - Dönem zaten kapalı mı?
   - Başlangıç/bitiş tarihleri var mı?

2. Veri Sayım ve Eksik Kontrol
   - Not girilmemiş aktif öğrenciler
   - Kanaat girilmemiş aktif öğrenciler
   - Eksik yoklama günleri
   - Açık rehberlik takipleri
   - Açık kütüphane emanetleri
   - Aktif yatakhane atamaları
   - Açık görev ve talepler
   - Planlı/aktif canlı oturumlar

3. Kapanış Kararları
   - Yatakhane atamaları: devret / sonlandır
   - Açık görevler: devret / iptal / olduğu gibi bırak
   - Açık talepler: devret / kapatmadan engelle
   - Rehberlik takipleri: devret / kapatmadan engelle
   - Duyurular: pasifleştir / koru

4. Arşiv Önizleme
   - Bölüm/sınıf/öğrenci sayıları
   - Not/kanaat/yoklama/revir/rehberlik/evrak sayıları
   - Oluşacak snapshot sayısı
   - Export tahmini boyutu

5. Yönetici Onayı
   - Dönem adını elle yazdırma
   - "Bu işlem veri silmez, dönemi kilitler" açıklaması
   - İkinci onay

6. Dönemi Kilitle
   - Snapshot oluştur
   - `academic_terms.status = closed`
   - `closed_at`, `closed_by`, `is_current=false`, `is_active=false`
   - Audit log yaz

7. Yeni Dönem Hazırlığı
   - Yeni dönem oluştur
   - İstenirse sınıf/ders programını kopyala
   - İstenirse aktif öğrenci sınıflarını taşıma ekranına yönlendir
   - İstenirse yatakhane/görev/talep devretme işlemlerini başlat

8. Arşiv Export
   - ZIP/PDF hazırlama talebi oluştur
   - Bölüm bazlı export
   - Hazır olunca indirilebilir hale getir

## 8. Uygulama Yol Haritası

### Faz 1: Analiz ve güvenli kilit

- Mevcut `closeTermAction` kurumsal dönem kapatma ihtiyacına göre tasarlanmalı.
- Sadece `admin` ve `genel_mudur` yetkisi korunmalı.
- Kapanış ön kontrol ekranı tasarlanmalı.
- Veri silme yapılmamalı.
- Kapalı dönem not/kanaat düzenleme zaten büyük ölçüde UI'da engelleniyor; bu davranış genişletilmeli.

### Faz 2: Snapshot kapsamını genişletme

- `student_term_snapshots.snapshot_data` içine şu özetler eklenmeli:
  - Yoklama özetleri
  - Revir kayıt sayısı/detay özeti
  - Rehberlik özetleri
  - Yatakhane son durumu
  - Kütüphane emanet durumu
  - Evrak listesi
- Hassas rehberlik özel notları ayrı export yetkisine tabi olmalı.

### Faz 3: Aktif ilişki devretme/sıfırlama

- `dormitory_assignments` aktif kayıtları için toplu sonlandırma/devretme.
- `class_courses` ve `weekly_schedule_slots` için yeni döneme kopyalama veya sıfırlama.
- Açık `tasks`, `talepler`, `guidance_follow_ups`, `library_loans` için karar ekranı.

### Faz 4: Sistem içi arşiv ekranları

- Dönem detay ekranı.
- Bölüm/sınıf/öğrenci dönem filtresi.
- Öğrenci dosyasında dönem geçmişi panelinin genişletilmesi.
- Kapalı dönem salt okunur görünüm.

### Faz 5: ZIP/PDF export

- Export işi dönem kapatma işleminden ayrılmalı.
- Bölüm bazlı ve sınıf bazlı üretim yapılmalı.
- `manifest.json` ve audit log zorunlu olmalı.
- Büyük exportlar için background job yaklaşımı tercih edilmeli.

## Sonuç

Bu sistemde Dönem Sonlandırma veri silen bir işlem olmamalı. Doğru model; aktif dönemi kilitleyen, öğrencinin o andaki akademik/idari durumunu snapshot'layan, açık işleri kontrollü devreden ve dışa aktarımı ayrı bir arşiv işi olarak yöneten mimaridir.
