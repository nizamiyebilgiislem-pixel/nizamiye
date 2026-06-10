# REHBERLİK MODÜLÜ — CANLIYA HAZIRLIK TEST RAPORU

**Tarih:** 10 Haziran 2026  
**Test Türü:** Kod analizi (statik) — migration, route, lib, yetki, UI, performans  
**Durum:** ✅ Build başarılı, 0 TypeScript hatası

---

## 1. Route Durumu

| Route | Durum |
|---|---|
| `/rehberlik` | ✅ |
| `/rehberlik/gorusmeler` | ✅ |
| `/rehberlik/gorusmeler/yeni` | ✅ |
| `/rehberlik/gorusmeler/[id]` | ✅ |
| `/rehberlik/gorusmeler/[id]/duzenle` | ✅ |
| `/rehberlik/takipler` | ✅ |
| `/rehberlik/takipler/yeni` | ✅ |
| `/rehberlik/takipler/[id]` | ✅ |
| `/rehberlik/anketler` | ✅ |
| `/rehberlik/anketler/yeni` | ✅ |
| `/rehberlik/anketler/[id]` | ✅ |
| `/rehberlik/anketler/[id]/sonuclar` | ✅ |
| `/rehberlik/etkinlikler` | ✅ |
| `/rehberlik/etkinlikler/yeni` | ✅ |
| `/rehberlik/etkinlikler/[id]` | ✅ |
| `/rehberlik/etkinlikler/[id]/duzenle` | ✅ |
| `/rehberlik/raporlar` | ✅ |

**Not:** Beklenen `/rehberlik/yeni`, `/rehberlik/[id]`, `/rehberlik/[id]/duzenle` yoktur. Modül alt kırılımlara ayrılmıştır (`gorusmeler`, `takipler`, `anketler`, `etkinlikler`). Bu bir hata değil, farklı organizasyondur.

---

## 2. Veritabanı / Migration Durumu

**Migration dosyaları:** `00023_guidance_module.sql`, `00024_guidance_parent_access.sql`

### Tablo Yapısı

| Tablo | Durum |
|---|---|
| `guidance_interviews` | ✅ |
| `guidance_follow_ups` | ✅ |
| `guidance_surveys` | ✅ |
| `guidance_survey_questions` | ✅ |
| `guidance_survey_responses` | ✅ |
| `guidance_survey_answers` | ✅ |
| `guidance_activities` | ✅ |
| `guidance_activity_participants` | ✅ |

### ❌ Eksik Tablolar

| Tablo | Durum |
|---|---|
| `guidance_records` | ❌ Yok (yerine `guidance_interviews`) |
| `guidance_comments` | ❌ Yok (yorum sistemi hiç implemente edilmemiş) |

### guidance_interviews — Beklenen vs Gerçek Kolonlar

| Beklenen | Gerçek | Durum |
|---|---|---|
| `id` | `id` | ✅ |
| `student_id` | `student_id` | ✅ |
| `record_type` | `interview_type` | ⚠️ Farklı isim |
| `title` | `title` | ✅ |
| `summary` | `summary` | ✅ |
| `notes` | `private_notes` | ⚠️ Farklı isim |
| `status` | `status` | ✅ |
| `priority` | ❌ Yok | ❌ **Eksik** |
| `interview_date` | `interview_date` | ✅ |
| `next_followup_date` | `next_follow_up_date` | ⚠️ Farklı isim |
| `created_by` | `created_by` | ✅ |
| `updated_by` | ❌ Yok | ❌ **Eksik** |
| `is_active` | ❌ Yok | ❌ **Eksik** (soft-delete yok) |
| `created_at` | `created_at` | ✅ |
| `updated_at` | `updated_at` | ✅ |
| `closed_at` | ❌ Yok | ❌ **Eksik** |

---

## 3. Lib Katmanı

### Dosyalar

| Dosya | Durum |
|---|---|
| `src/lib/guidance/constants.ts` | ❌ Yok |
| `src/lib/guidance/permissions.ts` | ✅ (7 fonksiyon) |
| `src/lib/guidance/queries.ts` | ✅ (18+ fonksiyon) |
| `src/lib/guidance/actions.ts` | ✅ (16+ fonksiyon) |

### Fonksiyon İsim Farklılıkları

| Beklenen | Gerçek |
|---|---|
| `canViewGuidanceRecord` | `canViewGuidance()` |
| `canCreateGuidanceRecord` | `canManageGuidance()` |
| `canEditGuidanceRecord` | `canManageGuidance()` |
| `canCommentGuidanceRecord` | ❌ Yok |
| `getGuidanceOverview` | `getGuidanceDashboardData()` |
| `getGuidanceRecords` | `getInterviews()` |
| `getGuidanceRecordById` | `getInterviewById()` |
| `getGuidanceRecordsByStudent` | `getStudentInterviews()` |
| `getGuidanceReports` | ❌ Yok (rapor sayfası yönlendirme) |
| `createGuidanceRecordAction` | `createInterviewAction()` |
| `updateGuidanceRecordAction` | `updateInterviewAction()` |
| `updateGuidanceStatusAction` | ❌ Yok |
| `addGuidanceCommentAction` | ❌ Yok |

---

## 4. Yetki Testi Sonucu

| Rol | Menü | Erişim | Görüşme Görürlüğü | Düzenleme |
|---|---|---|---|---|
| admin | ✅ | ✅ | Tümü | ✅ |
| genel_mudur | ✅ | ✅ | Tümü | ✅ |
| rehberlik | ✅ | ✅ | Tümü | ✅ |
| bolum_muduru | ✅ | ✅ | Sadece `visibility` in ('summary','shared') | ❌ |
| hoca (sınıf hocası) | ✅ | ✅ | Sadece `visibility` in ('summary','shared') | ❌ |
| hoca (ders hocası) | ✅ | ✅ | Sadece `visibility` in ('summary','shared') | ❌ |
| veli | ❌ | ⚠️ RLS ile sınırlı | Sadece çocuğunun 'summary'/'shared' | ❌ |
| muhasebe | ❌ | ❌ | ❌ | ❌ |
| destek_birim_muduru | ❌ | ❌ | ❌ | ❌ |
| kutuphane_gorevlisi | ❌ | ❌ | ❌ | ❌ |

### 🔴 Kritik Yetki Bulguları

1. **Bölüm müdürü departman filtresiz** — RLS sadece visibility kontrolü yapar, departman kontrolü yapmaz. Bölüm müdürü diğer bölümlerin "summary"/"shared" görüşmelerini de görebilir.
2. **Hoca sınıf filtresiz** — RLS visibility kontrolü yapar ama sınıf bazında filtreleme yoktur. Sınıf hocası olmayan ders hocası da tüm görüşmeleri görebilir.
3. **Veli menüde rehberlik görmez** ✅ (beklenen)
4. **Veli elle `/rehberlik` yazarsa** — `canViewGuidance` false döndüğü için hata mesajı gösterir ✅

---

## 5. Create/Update/Status/Comment Akışı

### Yeni Görüşme (`createInterviewAction`)

| Kontrol | Durum |
|---|---|
| Talebe zorunlu | ✅ (Zod uuid) |
| Başlık zorunlu | ✅ (Zod min(1)) |
| Görüşme tarihi zorunlu | ✅ |
| record_type (interview_type) zorunlu | ✅ (Zod enum) |
| Başarılı sonuç | ✅ `{ success: true }` |
| Audit log | ✅ `guidance_interview_created` |

### Düzenleme (`updateInterviewAction`)

| Kontrol | Durum |
|---|---|
| Sadece admin/genel_mudur/rehberlik | ✅ |
| updated_by dolduruluyor | ❌ **DB'de updated_by kolonu yok** |
| updated_at güncelleniyor | ✅ (DB trigger) |

### Durum Güncelleme

| Kontrol | Durum |
|---|---|
| Ayrı status action | ❌ Yok — `updateInterviewAction` ile birlikte gönderilir |
| closed_at dolduruluyor | ❌ **closed_at kolonu yok** |
| cancelled durumu korunuyor | ✅ |
| Fiziksel silme yapılmıyor | ✅ (silme action'ı yok) |
| Soft-delete (is_active) | ❌ Yok |

### Yorum

| Kontrol | Durum |
|---|---|
| Yorum eklenebiliyor | ❌ **Yorum sistemi yok** |
| Audit log yazıyor | ❌ Yok |

---

## 6. Talebe Detay Entegrasyonu (`/talebeler/[id]`)

| Özellik | Durum |
|---|---|
| "Rehberlik" tab'ı | ✅ |
| Görüşme geçmişi listesi | ✅ |
| Takip planları | ✅ |
| Katıldığı etkinlikler | ✅ |
| Yaklaşan takip tarihi | ⚠️ Ayrı alan olarak değil, takip listesinde |
| Detay linkleri | ✅ |
| Özel notlar (yetkiliye) | ✅ (`canViewPrivateNotes`) |
| Yeni görüşme butonu (yetkiliye) | ✅ |
| Veli görmez | ⚠️ Tab trigger tüm rollere görünür, içerik boş placeholder |

---

## 7. Dashboard Entegrasyonu

| Dashboard | Rehberlik Özeti |
|---|---|
| Admin/genel_mudur | ✅ `GuidanceDashboardCard` ile |
| Bölüm müdürü | ✅ `GuidanceDashboardCard` ile |
| Sınıf hocası | ❌ **YOK** — `ClassTeacherDashboard`'da guidance verisi eklenmemiş |
| Ders hocası | ❌ Yok (beklenen) |

**Not:** Dashboard sayıları departman bazında filtrelenmez. Bölüm müdürü için RLS visibility filtresine takıldığı için sayılar yanıltıcı olabilir.

---

## 8. Raporlar Ekranı (`/rehberlik/raporlar`)

- ✅ Sayfa mevcut, 4 rapor link kartı
- ❌ **Sadece yönlendirme sayfası** — özel rapor/istatistik yok
- ❌ Beklenen özelliklerin hiçbiri yok: dağılımlar, istatistikler, grafikler

---

## 9. UI/UX Bulguları

| Kontrol | Durum |
|---|---|
| Empty state | ✅ Tüm listelerde düzgün mesaj |
| Filtreler | ✅ (search, status, type, counselor, date) |
| Badge renkleri | ✅ Tutarlı mapping |
| Mobil görünüm | ✅ Card layout, taşma riski düşük |
| FormSubmitButton | ⚠️ Görüşme formlarında `button` kullanılmış, `FormSubmitButton` değil |
| Toast bildirimi | ⚠️ `useActionState` dönüşüne dayanıyor, global toast yok |
| Hata mesajları | ✅ Türkçe, anlaşılır |

---

## 10. Performans Bulguları

| Kontrol | Durum |
|---|---|
| `select("*")` gereksiz | ⚠️ Birçok yerde `*` kullanılıyor, sadece gerekli kolonlar seçilebilir |
| Liste sayfası tüm kayıtları çekiyor | ⚠️ Sayfalama (pagination) yok |
| Son kayıtlar için limit | ✅ `limit(5)` kullanılıyor |
| Bağımsız sorgular paralel | ✅ `Promise.all` ile |
| N+1 problemi | ❌ `getActiveSurveys()`, `getPlannedActivities()` içinde per-row count sorgusu |
| Nested select riski | ⚠️ `getSurveysForParent()` 3 seviye iç içe sorgu |

---

## 11. 🔴 Kritik Hatalar

| # | Hata | Şiddet |
|---|---|---|
| 1 | **Bölüm müdürü departman filtresiz** — RLS'de departman kontrolü yok, diğer bölümlerin görüşmelerini görebilir | **Yüksek** |
| 2 | **Hoca sınıf filtresiz** — Sınıf hocası olmayan ders hocası da tüm "summary"/"shared" görüşmeleri görebilir | **Yüksek** |
| 3 | **`updated_by` alanı yok** — Kimin güncellediği takip edilemez | Orta |
| 4 | **Dashboard sınıf hocası eksik** — `ClassTeacherDashboard`'da rehberlik özeti yok | Orta |
| 5 | **`priority` alanı yok** — Beklenen alan mevcut değil | Düşük |
| 6 | **`closed_at` alanı yok** — Kapatma zamanı kaydedilmez | Düşük |
| 7 | **Soft-delete (`is_active`) yok** — Kayıt pasifleştirilemez | Düşük |
| 8 | **Yorum/comment sistemi yok** — `guidance_comments` tablosu ve ilgili fonksiyonlar mevcut değil | Düşük |

---

## 12. İyileştirme Önerileri

1. **RLS politikaları düzeltilmeli** — Bölüm müdürü ve hoca için departman/sınıf bazlı filtreleme eklenmeli
2. **ClassTeacherDashboard'a guidance özeti eklenmeli**
3. **N+1 sorgular optimize edilmeli** — `getActiveSurveys()` ve `getPlannedActivities()` batch count sorgusuna dönüştürülmeli
4. **Dashboard sayıları departman filtreli hale getirilmeli**
5. **Talebe detay sayfasında "Rehberlik" tab'ı conditionally render edilmeli** (yetkisiz kullanıcılara gösterilmemeli)
6. **Görüşme formlarında `FormSubmitButton` kullanılmalı**
7. **Rapor sayfası zenginleştirilmeli** — Gerçek istatistik ve grafikler eklenmeli

---

## 13. Lint / Build Sonucu

| Araç | Sonuç |
|---|---|
| `npm run lint` | ✅ 0 error, 5 warning (4'ü not-girisi/pdf sayfası, 1'i pre-existing sidebar) |
| `npm run build` | ✅ 0 error — TypeScript + Turbopack başarılı |

---

## Özet

Rehberlik modülü genel olarak çalışır durumdadır. En kritik bulgular:

1. **Yetki modelinde RLS zafiyeti** — Bölüm müdürü ve hoca rolleri için departman/sınıf bazlı kısıtlama eksiktir
2. **3 beklenen DB alanı eksik** (`updated_by`, `closed_at`, `is_active`)
3. **Yorum/comment sistemi hiç implemente edilmemiştir**
4. **Sınıf hocası dashboard'ında rehberlik özeti yoktur**
5. **Rapor sayfası iskelet halindedir** — gerçek istatistik içermez

Build ve lint başarılıdır. Modül canlıya alınabilir ancak yukarıdaki kritik maddelerin önceliklendirilmesi önerilir.
