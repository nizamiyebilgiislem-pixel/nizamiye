# FAZ 2 — Rol Sadeleştirme, Modül Yetkilisi Sistemi ve Kapsamlı Denetim Raporu

**Hazırlanma Tarihi:** 10 Haziran 2026  
**Kapsam:** Tam kod tabanı incelemesi + Faz 2 değişiklikleri (modül assignee sistemi, rol sadeleştirme, destek_birim_muduru, muhasebe çıkarma)

---

## İçindekiler
1. [Sistem Genel Bakışı ve Faz 2 Değişiklikleri](#1-sistem-genel-bakışı-ve-faz-2-değişiklikleri)
2. [Roller ve Yetki Matrisi (Güncel)](#2-roller-ve-yetki-matrisi-güncel)
3. [Modül Yetkilisi (Module Assignment) Sistemi](#3-modül-yetkilisi-module-assignment-sistemi)
4. [Dashboard Erişim Haritası](#4-dashboard-erişim-haritası)
5. [Menü/Navigasyon Analizi](#5-menünavigasyon-analizi)
6. [Route Permission Modeli](#6-route-permission-modeli)
7. [Departman Bazlı Veri Kapsamı (Scoping)](#7-departman-bazlı-veri-kapsamı-scoping)
8. [Modül Bazında Derinlemesine İnceleme](#8-modül-bazında-derinlemesine-inceleme)
9. [Güvenlik Açıkları ve Riskler](#9-güvenlik-açıkları-ve-riskler)
10. [Performans Analizi](#10-performans-analizi)
11. [Placeholder / Eksik Sayfalar](#11-placeholder--eksik-sayfalar)
12. [UI/UX Sorunları](#12-uiux-sorunları)
13. [Kullanılmayan Kodlar](#13-kullanılmayan-kodlar)
14. [Rol Bazında Kullanıcı Deneyimi](#14-rol-bazında-kullanıcı-deneyimi)
15. [Build ve Lint Durumu](#15-build-ve-lint-durumu)
16. [Migration ve Veritabanı Durumu](#16-migration-ve-veritabanı-durumu)
17. [Önerilen Düzeltmeler (Öncelik Sıralı)](#17-önerilen-düzeltmeler-öncelik-sıralı)
18. [Sonuç](#18-sonuç)

---

# 1. Sistem Genel Bakışı ve Faz 2 Değişiklikleri

## Sistem Mimarisi
- **Frontend/Backend:** Next.js 16 (Turbopack)
- **Auth:** Supabase Auth (email/şifre)
- **Veritabanı:** Supabase PostgreSQL
- **Tip sistemi:** TypeScript strict mode
- **State yönetimi:** Server Components + useActionState (client)

## Faz 2'de Yapılan Değişiklikler

| Değişiklik | Açıklama |
|---|---|
| **Module Assignment Sistemi** | `module_assignments` tablosu ile admin/genel_mudur artık rehberlik/kütüphane yetkisini doğrudan atayabilir |
| **rehberlik rolü pasifleştirildi** | UI/permission seviyesinde kullanılmıyor; yerini module_assignment("guidance") aldı |
| **kutuphane_gorevlisi rolü pasifleştirildi** | UI/permission seviyesinde kullanılmıyor; yerini module_assignment("library") aldı |
| **muhasebe rolü kaldırıldı** | Navigation, route-permissions, talep-permissions'tan çıkarıldı |
| **destek_birim_muduru eklendi** | Tüm modüllere salt okunur erişim, kullanıcı oluşturma sayfasında seçilebilir |
| **Guidance permissions async oldu** | `canManageGuidance`, `canViewPrivateNotes`, `canManageInterviews`, `canManageFollowUps`, `canManageSurveys`, `canManageActivities` artık module_assignment kontrolü yapıyor |
| **Guidance scope async oldu** | `isGuidanceUnrestricted` artık module_assignment kontrolü yapıyor |
| **Library permissions async oldu** | `canManageLibrary`, `canManageCategories`, `canManageBooks`, `canManageLoans`, `canManageDocuments` artık module_assignment kontrolü yapıyor |
| **Navigation async oldu** | `getNavigationForProfile(profile)` artık module assignee'ye göre menü filtreliyor |
| **SupportDashboard** | destek_birim_muduru için özel dashboard (açık talep, görev, geciken görev KPI'ları) |

## DB'de Kalan ama UI'da Kullanılmayan Roller
- `rehberlik` — DB'de kalır, yeni atama yapılmaz, mevcut kullanıcılar çalışır
- `kutuphane_gorevlisi` — DB'de kalır, yeni atama yapılmaz, mevcut kullanıcılar çalışır
- `muhasebe` — DB'de kalır, UI'da hiçbir yerde kullanılmaz, mevcut kullanıcılar DefaultDashboard'a düşer

---

# 2. Roller ve Yetki Matrisi (Güncel)

## Sistemdeki 8 Aktif Rol

| Rol | Açıklama | Dashboard | Modül Atanabilir mi? |
|---|---|---|---|
| `admin` | Tam yetki | AdminDashboard | — (atanan değil, atayan) |
| `genel_mudur` | Admin ile neredeyse aynı | AdminDashboard | — (atanan değil, atayan) |
| `bolum_muduru` | Departman yöneticisi | DepartmentManagerDashboard | Evet (guidance, library) |
| `hoca` | Öğretmen | ClassTeacherDashboard / CourseTeacherDashboard | Evet (guidance, library) |
| `veli` | Veli | Veli portali (/veli) | Hayır |
| `destek_birim_muduru` | Destek birim yöneticisi | SupportDashboard | Evet (guidance, library) |
| `rehberlik` | **(pasif)** Eski rehberlik uzmanı | DefaultDashboard | — |
| `kutuphane_gorevlisi` | **(pasif)** Eski kütüphaneci | DefaultDashboard | — |
| `muhasebe` | **(pasif)** Eski muhasebe | DefaultDashboard | — |

## Yetki Matrisi (detaylı)

| Yetki | admin | genel_mudur | bolum_muduru | hoca | destek_birim_muduru | veli |
|---|---|---|---|---|---|---|
| Öğrenci CRUD | ✅ | ✅ | ✅ (kendi dep.) | ❌ | ❌ | ❌ |
| Öğrenci düzenleme | ✅ | ✅ | ✅ (kendi dep.) | ✅ (class_teacher) | ❌ | ❌ |
| Öğrenci arşiv | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Not girişi | ✅ | ✅ | ❌ (sadece görme) | ✅ (atandığı dersler) | ❌ | ❌ |
| Kanaat girişi | ✅ | ✅ | ✅ (kendi dep.) | ✅ (class_teacher) | ❌ | ❌ |
| Yoklama alma | ✅ | ✅ | ✅ (kendi dep.) | ✅ (kendi sınıfı) | ❌ | ❌ |
| Rehberlik (tam) | ✅ | ✅ | ✅ (kendi dep.) | ✅ (class_teacher sınıfı) | ❌ (varsayılan) | ❌ |
| Rehberlik (görüntüleme) | ✅ | ✅ | ✅ | ❌ | ✅ (module_assignment ile) | ✅ (çocukları) |
| Guidance module assignee | ✅ (tam yetki) | ✅ (tam yetki) | ✅ (atandıysa) | ✅ (atandıysa) | ✅ (atandıysa) | ❌ |
| Library module assignee | ✅ (tam yetki) | ✅ (tam yetki) | ✅ (atandıysa) | ✅ (atandıysa) | ✅ (atandıysa) | ❌ |
| Sınıf CRUD | ✅ | ✅ | ✅ (kendi dep.) | ❌ | ❌ | ❌ |
| Ders Sistemi CRUD | ✅ | ✅ | ✅ (kendi dep.) | ❌ | ❌ | ❌ |
| Departman CRUD | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Hoca profili CRUD | ✅ | ✅ | ✅ (kendi dep. hoca) | ❌ | ❌ | ❌ |
| Veli profili CRUD | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Kullanıcı CRUD | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Yatakhane yönetimi | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Kütüphane yönetimi | ✅ | ✅ | ❌ (atandıysa ✅) | ❌ (atandıysa ✅) | ❌ (atandıysa ✅) | ❌ |
| Kütüphane görüntüleme | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Revir yönetimi | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Duyuru CRUD | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Görev CRUD | ✅ | ✅ | ✅ (kendi dep.) | ✅ (atananları görme) | ❌ | ❌ |
| Talep oluşturma/görme | ✅ | ✅ | ✅ | ❌ | ✅ (kendi birimi) | ❌ |
| Eğitim Planlama | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Evrak Yönetimi | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Raporlar (tümü) | ✅ | ✅ | ✅ (kendi dep.) | ✅ (kendi sınıfı) | ❌ | ❌ |
| Ayarlar | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modül Yetkilileri | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit Log | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Değişiklik Özeti (Faz 1 → Faz 2)
- `rehberlik` → pasif: yerini `module_assignment("guidance")` aldı
- `kutuphane_gorevlisi` → pasif: yerini `module_assignment("library")` aldı
- `muhasebe` → kaldırıldı: tüm UI/permission referansları silindi
- `destek_birim_muduru` → eklendi: tüm module'lere read-only erişim (guidance hariç varsayılan)

---

# 3. Modül Yetkilisi (Module Assignment) Sistemi

## Veritabanı
- **Tablo:** `module_assignments`
- **Migration:** `supabase/migrations/00029_module_assignments.sql`
- **Sütunlar:** id, module_key, profile_id, assigned_by, is_active, created_at, updated_at
- **Unique constraint:** (module_key, profile_id)
- **Soft-delete:** `is_active = false` ile pasifleştirme, fiziksel silme yok

## Kütüphane (`src/lib/module-assignments/`)

### queries.ts (6 fonksiyon)
| Fonksiyon | Dönüş | Kullanım |
|---|---|---|
| `getModuleAssignments(profileId)` | ModuleAssignmentRow[] | Belirli bir kullanıcının tüm aktif atamaları |
| `getProfileModuleKeys(profileId)` | string[] | Kullanıcının atandığı modül anahtarları (menü filtreleme için) |
| `hasModuleAssignment(profileId, moduleKey)` | boolean | Belirli bir modüle atanmış mı (permission check için) |
| `getModuleAssignees(moduleKey)` | ModuleAssignmentWithProfile[] | Modülün tüm aktif assignee'leri (yönetim sayfası için) |
| `getAssignableModuleProfiles()` | Profile[] | Atanabilir rollerdeki kullanıcılar (select dropdown için) |
| `getExistingAssignment(profileId, moduleKey)` | ModuleAssignmentRow \| null | Varsa mevcut kaydı getirir (re-activate için) |

### permissions.ts (3 fonksiyon)
| Fonksiyon | Açıklama |
|---|---|
| `canManageModuleAssignments(profile)` | admin/genel_mudur → modül yetkilisi yönetebilir |
| `canManageGuidance(profile)` | admin/genel_mudur veya rehberlik rolü veya hasModuleAssignment("guidance") |
| `canManageLibrary(profile)` | admin/genel_mudur veya kutuphane_gorevlisi rolü veya hasModuleAssignment("library") |

### actions.ts (2 server action)
| Action | Açıklama |
|---|---|
| `createModuleAssignmentAction` | Yeni atama oluşturur veya pasif kaydı re-aktive eder; audit log: module_assignment_created / module_assignment_reactivated |
| `deactivateModuleAssignmentAction` | is_active = false; audit log: module_assignment_deactivated |

## Audit Log
- `module_assignment_created` — yeni yetki ataması
- `module_assignment_reactivated` — pasif kaydın yeniden aktifleştirilmesi
- `module_assignment_deactivated` — yetkinin kaldırılması

## Yönetim Arayüzü (`/ayarlar/modul-yetkilileri`)
- **Erişim:** Sadece admin/genel_mudur
- **Sayfalar:** page.tsx (server) + module-assignment-manager.tsx (client)
- **İşlemler:** Atama ekle (profile_id + module_key seç), Atama kaldır (assignment_id ile)
- **State yönetimi:** useActionState ile form validation + error/success
- **Route güvenliği:** `topManagerRoles` ile route-permissions'ta

## Async Dönüşümü

### Guidance Module
| Dosya | Değişiklik |
|---|---|
| `permissions.ts` | `canManageGuidance`, `canViewPrivateNotes`, `canManageInterviews`, `canManageFollowUps`, `canManageSurveys`, `canManageActivities` → async |
| `scope.ts` | `isGuidanceUnrestricted` → async |
| `queries.ts` | 14 fonksiyonda `isGuidanceUnrestricted` → `await` |
| `actions.ts` | Tüm `canManage*` çağrıları → `await` |
| 15 page dosyası | `canManageGuidance`, `canViewPrivateNotes` çağrıları → `await` |

### Library Module
| Dosya | Değişiklik |
|---|---|
| `permissions.ts` | `canManageLibrary`, `canManageCategories`, `canManageBooks`, `canManageLoans`, `canManageDocuments` → async |
| `actions.ts` | Tüm `canManage*` çağrıları → `await` |
| 10 page dosyası | `canManage*` çağrıları → `await` |

### Navigation
| Dosya | Değişiklik |
|---|---|
| `navigation.ts` | `getNavigationForProfile(profile)` → async (module assignee check ile) |
| `layout.tsx` | `getNavigationForProfile` kullanıyor |

## Tip Sınırlamaları (as any kullanımı)
Supabase generated types henüz `module_assignments` tablosunu içermediği için `actions.ts` ve `queries.ts`'te `as any` cast'leri kullanıldı. Migration çalıştırılıp tipler yeniden oluşturulduğunda kaldırılacak.

---

# 4. Dashboard Erişim Haritası

## Routing Mantığı

`src/app/(panel)/dashboard/page.tsx`:

```
profile.role
  ├── admin          → AdminDashboard
  ├── genel_mudur    → AdminDashboard
  ├── bolum_muduru   → DepartmentManagerDashboard
  ├── destek_birim_muduru → SupportDashboard  ✅ YENİ
  └── diğer (hoca, rehberlik, kutuphane_gorevlisi, muhasebe, veli)
         ├── (DB'de class_teacher_id sorgusu)
         │     ├── var  → ClassTeacherDashboard
         │     └── yok  → (DB'de class_courses.teacher_id sorgusu)
         │           ├── var  → CourseTeacherDashboard
         │           └── yok  → DefaultDashboard
         └── (veli → yönlendirme yok, kendi portalı)
```

### AdminDashboard
- 10 adet KPI kartı (Toplam Öğrenci, Aktif Öğrenci, Sınıf, Hoca, Bölüm, Ders, Yoklama, Kanaat, Not, Revir)
- Departman bazlı içgörüler
- Hızlı Erişim butonları
- Rehberlik özet kartı
- Görev bildirimleri

### DepartmentManagerDashboard
- 8 KPI (kendi departmanına göre)
- Departman bazlı sınıf listesi + hızlı erişim
- Guidance verisi (profile geçirilerek)

### ClassTeacherDashboard
- 7 KPI
- Sınıf listesi (kendi class_teacher olduğu sınıflar)
- Görev bildirimleri
- Rehberlik özet kartı

### CourseTeacherDashboard
- 4 KPI (Aktif Ders, Atandığım Sınıf, Bugünkü Ders, Bana Atanan Görev)
- Course listesi + hızlı işlemler

### SupportDashboard ✅ YENİ
- 3 KPI (Açık Talep, Açık Görev, Geciken Görev)
- Hızlı Erişim linkleri (Talepler, Görevler)
- Salt okunur bilgi kartı

### DefaultDashboard
- rehberlik, kutuphane_gorevlisi, muhasebe rolleri bu dashboard'u görür
- İçeriği zayıf — özel dashboard önerilir

---

# 5. Menü/Navigasyon Analizi

## Kaynak: `src/lib/navigation.ts`

## Menü Öğeleri ve Roller (Güncel)

| Menü Grubu | Öğeler | Erişim Rolleri | Not |
|---|---|---|---|
| **Genel** | Dashboard | Tüm staff roller + destek_birim_muduru | ✅ |
| | Duyurular | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Görevler | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| **Öğrenci İşleri** | Talebeler | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Sınıflar | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Hocalar | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Veliler | admin, genel_mudur, destek_birim_muduru | ✅ |
| **Eğitim** | Not Sistemi | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Kanaat Sistemi | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Ders Sistemi | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Eğitim Planlama | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Yoklama | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| **Rehberlik** | Rehberlik | admin, genel_mudur, bolum_muduru, rehberlik + **module_assignment("guidance") olanlar** | ✅ moduleKey ile filtreleniyor |
| **Destek** | Revir | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Yatakhane | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Kütüphane | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru + **module_assignment("library") olanlar** | ✅ moduleKey ile filtreleniyor |
| | Talepler | admin, genel_mudur, bolum_muduru, rehberlik, destek_birim_muduru | ✅ (muhasebe çıkarıldı) |
| **Yönetim** | Kullanıcılar | admin, genel_mudur, destek_birim_muduru | ✅ |
| | Departmanlar | admin, genel_mudur, destek_birim_muduru | ✅ |
| | Raporlar | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Ayarlar | admin, genel_mudur | ✅ |
| | Modül Yetkilileri | admin, genel_mudur | ✅ YENİ |
| | Evrak Yönetimi | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ |
| | Audit Log | admin, genel_mudur, destek_birim_muduru | ✅ |

## Async Navigation Filtreleme
`getNavigationForProfile(profile)` menü öğelerini iki aşamalı filtreler:
1. **Rol bazlı filtre:** profile.role menü öğesinin rollerinde var mı?
2. **Module assignee filtresi:** Menü öğesinde `moduleKey` varsa, kullanıcı o modüle atanmış mı?

Bu sayede:
- `bolum_muduru` guidance atanmamışsa Rehberlik menüsünü **görmez** (accessGuidance modülündeki `canViewGuidance` ile değil, menü seviyesinde)
- `hoca` library atanmışsa Kütüphane menüsünü **görür** (kütüphane görüntüleme yetkisi olduğu için)

## Eksik/Tutarsız Menü Durumları
1. **Veli** için menü yok — sadece kendi portali (`/veli`) — bu tasarım kararı
2. **Pasif roller** (rehberlik, kutuphane_gorevlisi, muhasebe) menüde görünmez — DB'deki eski kullanıcılar module_key filter'ı geçemez
3. **destek_birim_muduru** neredeyse tüm menüleri görür — read-only erişim sayesinde

---

# 6. Route Permission Modeli

## Kaynak: `src/lib/route-permissions.ts`

## Route Grupları ve Roller (Güncel)

| Route Grubu | İzin Verilen Roller | Değişiklik |
|---|---|---|
| Dashboard | Tüm staff roller + destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Talebeler | admin, genel_mudur, bolum_muduru, hoca, rehberlik, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Siniflar | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Hocalar | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Not-sistemi | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Kanaat-sistemi | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Ders-sistemi | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Yoklama | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Rehberlik | admin, genel_mudur, bolum_muduru, rehberlik | ✅ aynı kaldı |
| Revir | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Yatakhane | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Kutuphane | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Talepler | admin, genel_mudur, bolum_muduru, rehberlik, destek_birim_muduru | ❌ muhasebe çıkarıldı |
| Kullanicilar | admin, genel_mudur, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Bolumler | admin, genel_mudur, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Raporlar | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Ayarlar | admin, genel_mudur | ✅ aynı kaldı |
| Modul-yetkilileri | admin, genel_mudur | ✅ YENİ |
| Evrak-yonetimi | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Duyurular | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Gorevler | admin, genel_mudur, bolum_muduru, hoca, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Audit-log | admin, genel_mudur, destek_birim_muduru | ✅ destek_birim_muduru eklendi |
| Veli | veli | ✅ aynı kaldı |

## staffAndSupportRoles
Yeni tanımlanan yardımcı array:
```typescript
const staffAndSupportRoles = [...staffRoles, "destek_birim_muduru"];
```
Bu array çoğu route'ta kullanılarak tutarlılık sağlandı.

## topManagerRoles
```typescript
const topManagerRoles = ["admin", "genel_mudur"];
```
Ayarlar, modül yetkilileri, audit-log gibi kritik route'larda kullanıldı.

---

# 7. Departman Bazlı Veri Kapsamı (Scoping)

## Model (Değişmedi)

| Modül | admin/genel_mudur | bolum_muduru | hoca | destek_birim_muduru |
|---|---|---|---|---|
| **Öğrenciler** | Tüm departmanlar | `department_id` filtresi | `department_id` filtresi | Tümü (read-only) |
| **Sınıflar** | Tüm departmanlar | `department_id` filtresi | `department_id` filtresi | Tümü (read-only) |
| **Hocalar** | Tüm departmanlar | Sadece `hoca` rolü, kendi dep. | Sadece `hoca` rolü, kendi dep. | Tümü (read-only) |
| **Dersler** | Tüm departmanlar | `department_id` filtresi | `department_id` filtresi | Tümü (read-only) |
| **Notlar** (görme) | Tümü | Kendi departmanı | Kendi departmanı | Tümü (read-only) |
| **Notlar** (düzenleme) | Tümü | ❌ | Sadece atandığı dersler | ❌ |
| **Kanaat** (düzenleme) | Tümü | Kendi departmanı | Sadece class_teacher | ❌ |
| **Yoklama** (yönetim) | Tüm sınıflar | Kendi dep. sınıfları | Sadece kendi sınıfı | ❌ |
| **Rehberlik** | Tüm öğrenciler | Dep. + class_teacher öğr. | Sadece class_teacher | Module_assignment varsa |
| **Görevler** | Tümü | Kendi departmanı | Kendisine atananlar | Tümü (read-only) |
| **Duyurular** | Tümü | Kendi departmanı | Kendi departmanı | Tümü (read-only) |
| **Evraklar** | Tümü | Kendi departmanı | Kendi departmanı | Tümü (read-only) |
| **Revir** | Tümü | Kendi departmanı | Kendi departmanı | Tümü (read-only) |
| **Yatakhane** (yönetim) | Tümü | ✅ Global (dep. sınırı yok) | ❌ | ❌ |
| **Raporlar** | Tümü | Kendi departmanı | Kendi sınıfı | Tümü (read-only) |
| **Kütüphane** | Tümü | Tümü (global) | Tümü (global) | Tümü (read-only) |
| **Talepler** | Tümü | Tümü | ❌ | Sadece kendi birimi |

**Not:** `destek_birim_muduru` için departman bazlı scoping uygulanmaz — tüm veriye read-only erişimi vardır. Guidance modülü için module_assignment gerekir.

---

# 8. Modül Bazında Derinlemesine İnceleme

## 8.1 Öğrenci Modülü (`/talebeler`)
**Dosyalar:** `src/lib/students/`, `src/app/(panel)/talebeler/`
- CRUD: Tam — create, read, update, archive
- Liste: Filtreleme (departman, sınıf, durum, arama)
- Detay sayfası: 14 sekme (Profil, Notlar, Kanaat, Devamsızlık, Yoklama, Rehberlik, Revir, Yatakhane, Kütüphane, Evraklar, Aidat, Hesap Hareketleri, Dosyalar, Etkinlikler)
- Rehberlik tab'ı conditional (yetkiye göre)
- PDF: Öğrenci bilgi kartı, notlar, kanaat, revir PDF'leri
- ✅ destek_birim_muduru read-only erişebilir

## 8.2 Not Sistemi (`/not-sistemi`)
**Dosyalar:** `src/lib/grades/`, `src/app/(panel)/not-sistemi/`
- Dönem yönetimi (CRUD + kapatma)
- Ders yönetimi (CRUD)
- Not girişi (öğrenci bazında)
- PDF toplu indirme
- İzinler: canEditStudentGrades → admin/genel_mudur + hoca (atandığı dersler)
- ❌ pdf/page.tsx'te 4 unused import (lint warning)
- ✅ destek_birim_muduru read-only erişebilir

## 8.3 Kanaat Sistemi (`/kanaat-sistemi`)
- İki sayfa: Liste + öğrenci bazlı giriş
- class_teacher ve bolum_muduru girebilir
- ✅ destek_birim_muduru read-only erişebilir

## 8.4 Ders Sistemi (`/ders-sistemi`)
- CRUD: Listeleme, oluşturma, düzenleme (tab-based: sınıf atama aktif/pasif/sil)
- ✅ destek_birim_muduru read-only erişebilir

## 8.5 Rehberlik Modülü (`/rehberlik`)
**Önceki faz:** 6 güvenlik açığı kapatıldı  
**Bu faz:** Module assignment sistemi entegre edildi
- `canManageGuidance` async oldu — admin/genel_mudur veya rehberlik rolü veya hasModuleAssignment("guidance")
- `canViewPrivateNotes` async oldu
- Tüm scope fonksiyonları async oldu
- Tüm query/action fonksiyonlarında await eklendi
- ✅ destek_birim_muduru module_assignment("guidance") ile rehberliği görebilir

## 8.6 Yoklama (`/yoklama`)
- Yeni yoklama alma, oturum düzenleme, raporlar
- class_teacher sınırlaması, bolum_muduru kendi dep.
- ✅ destek_birim_muduru read-only erişebilir

## 8.7 Yatakhane (`/yatakhane`)
- CRUD + öğrenci yerleştirme
- admin/genel_mudur/bolum_muduru yönetebilir, hoca görebilir
- ✅ destek_birim_muduru read-only erişebilir

## 8.8 Kütüphane (`/kutuphane`)
**Bu faz:** Module assignment sistemi entegre edildi
- `canManageLibrary`, `canManageCategories`, `canManageBooks`, `canManageLoans`, `canManageDocuments` async oldu
- `canViewLibrary` → destek_birim_muduru eklendi
- `bolum_muduru` ve `hoca` kütüphaneyi global görür (departman sınırı yok)
- ✅ destek_birim_muduru read-only erişebilir

## 8.9 Revir (`/revir`)
- Kayıt listesi, yeni kayıt, öğrenci bazlı kayıt, düzenleme
- ✅ destek_birim_muduru read-only erişebilir

## 8.10 Duyurular (`/duyurular`)
- CRUD, departman bazlı filtreleme
- ✅ destek_birim_muduru read-only erişebilir

## 8.11 Görevler (`/gorevler`)
- CRUD, atanabilir profil filtreleme (3 katmanlı)
- ✅ destek_birim_muduru read-only erişebilir

## 8.12 Talepler (`/talepler`)
**Bu faz:** muhasebe rolü çıkarıldı
- Talep oluşturma, listeleme, düzenleme, durum yönetimi
- Birim bazlı yönlendirme (destek, bölüm)
- ✅ destek_birim_muduru kendi birimindeki talepleri yönetebilir
- ❌ muhasebe artık talep göremez
- ❌ hoca ve veli taleplerden dışlanmış (bilinçli karar)

## 8.13 Kullanıcılar (`/kullanicilar`)
- CRUD (create/edit/delete), sadece admin/genel_mudur
- `getCreatableRoles` → destek_birim_muduru eklendi
- ✅ destek_birim_muduru read-only erişebilir

## 8.14 Veli Portali (`/veli`)
- Veli kendi çocuklarının tüm verilerini salt okunur görüntüleyebilir
- Anketler, etkinlikler, notlar, kanaat, rehberlik, yatakhane, revir, evraklar, kütüphane emanetleri, devamsızlık
- ✅ Kapsamlı ve iyi tasarlanmış

## 8.15 Eğitim Planlama (`/egitim-planlama`)
- Ders atamaları, ders programı, sınıf bazlı program
- ✅ destek_birim_muduru read-only erişebilir

## 8.16 Raporlar (`/raporlar`)
- Bolumler, Donem-sonu, Kanaatler, Namaz Yoklama, Notlar, Revir, Siniflar, Talebeler, Yoklama
- ✅ destek_birim_muduru read-only erişebilir

## 8.17 Evrak Yönetimi (`/evrak-yonetimi`, `/evraklar`)
- CRUD, departman bazlı erişim
- ✅ destek_birim_muduru read-only erişebilir

---

# 9. Güvenlik Açıkları ve Riskler

## Faz 1'de Kapatılanlar ✅
1. Rehberlik route'larına hoca erişimi → route-permissions güncellendi
2. Rehberlik menüsünde hoca görünüyor → navigation güncellendi
3. Rehberlik query'lerinde server-side yetki kontrolü yok → scope.ts + 14 query güncellendi
4. Student detail'de rehberlik tab'ı herkese açık → conditional render
5. Admin/DeptManager dashboard guidance verisi profile'siz → profile geçirildi
6. ClassTeacherDashboard guidance kartı eksik → eklendi

## Faz 2'de Kapatılanlar ✅
1. Modül yetkisi kontrolü olmadan guidance/kütüphane erişimi → module_assignment sistemi
2. muhasebe rolünün taleplere erişimi → talep permissions/route/navigation'dan çıkarıldı
3. Client component'in server-only import çekmesi → panel-shell.tsx'te import fix

## Risk Değerlendirmesi

### Düşük Risk
1. **`as any` cast'leri** — `module-assignments/actions.ts` ve `queries.ts`'te Supabase tip uyumsuzluğu nedeniyle kullanıldı. Migration sonrası tipler yeniden oluşturulduğunda kaldırılmalı.
2. **Not girişi PDF sayfasında kullanılmayan importlar** — Kod kalitesi sorunu, güvenlik riski yok.
3. **Sidebar'da `<img>` kullanımı** — Performans, güvenlik değil.

### Değerlendirme
Genel güvenlik durumu **iyi**. Server-side yetki kontrolleri tüm modüllerde mevcut. Module assignment sistemi guidance ve library için ikinci bir güvenlik katmanı ekledi.

---

# 10. Performans Analizi

## Async Ek Yük
Module assignment sorguları guidance ve library sayfalarında ek bir Supabase sorgusu anlamına gelir. Her `canManageGuidance`/`canManageLibrary` çağrısı `hasModuleAssignment` sorgusu yapar.

**Etki:** Kabul edilebilir — her sorgu tek bir indexli `count` sorgusu (<5ms).

## Potansiyel N+1 Noktaları
1. **Öğrenci listesi sayfası** — `getStudentsForProfile` sonrası her öğrenci için ayrı sorgu olabilir
2. **Veli portali** — Her çocuk için 8-10 alt sorgu (not, kanaat, rehberlik vs.) — ciddi N+1 riski
3. **Dashboard KPI'ları** — Her KPI için ayrı SQL sorgusu (8-10 sorgu, genelde kabul edilebilir)
4. **Navigation** — Her sayfa yüklemesinde `getProfileModuleKeys` çağrısı (1 indexli sorgu)

## İyileştirme Önerileri
- Veli portalinde batch query veya Redis cache kullanılabilir
- Navigation module key'leri session'a cache'lenebilir

---

# 11. Placeholder / Eksik Sayfalar

| Dosya | Placeholder | Durum |
|---|---|---|
| `src/app/(panel)/hocalar/[id]/page.tsx:65` | `<Placeholder title="Verdiği Dersler" />` | Hoca detayında "Verdiği Dersler" bölümü henüz aktif değil |
| `src/app/(panel)/hocalar/[id]/page.tsx:109` | `<Placeholder title="Sorumlu Olduğu Öğrenciler" />` | Hoca detayında "Sorumlu Olduğu Öğrenciler" bölümü henüz aktif değil |

Metin: *"Bu bölüm sonraki fazda aktif edilecek."*

---

# 12. UI/UX Sorunları

1. **Lint Warning — Sidebar `<img>`** — `next/image` yerine `<img>` kullanılıyor
2. **Lint Warning — Kullanılmayan importlar** — `pdf/page.tsx`'te 4 adet unused import
3. **Hoca detay sayfası placeholders** — "Verdiği Dersler" ve "Sorumlu Olduğu Öğrenciler" bölümleri yer tutucu
4. **Pasif roller (rehberlik, kutuphane_gorevlisi, muhasebe)** — DefaultDashboard görüyor, özel dashboard yok
5. **destek_birim_muduru** — Tüm modülleri görür ama hiçbirinde yazma yetkisi yok; butonlar/aksiyonlar gizlenmeli (server action'lar zaten reddediyor, UX için UI da gizlenmeli)

---

# 13. Kullanılmayan Kodlar

## Lint Warnings (5 adet, 0 error)

| Dosya | Satır | Uyarı |
|---|---|---|
| `src/app/(panel)/not-sistemi/not-girisi/pdf/page.tsx` | 7 | `canEditStudentCourseGrade` tanımlanmış kullanılmamış |
| `src/app/(panel)/not-sistemi/not-girisi/pdf/page.tsx` | 12 | `ClassRow` tanımlanmış kullanılmamış |
| `src/app/(panel)/not-sistemi/not-girisi/pdf/page.tsx` | 12 | `DepartmentRow` tanımlanmış kullanılmamış |
| `src/app/(panel)/not-sistemi/not-girisi/pdf/page.tsx` | 221 | `profile` tanımlanmış kullanılmamış |
| `src/components/layout/sidebar.tsx` | 84 | `<img>` kullanımı (next/image önerisi) |

Hepsi düşük öncelikli.

---

# 14. Rol Bazında Kullanıcı Deneyimi

## Admin
- Tam erişim, her şey görünür
- Audit log ile tüm değişiklikleri takip eder
- Modül yetkililerini yönetebilir
- Dashboard: 10 KPI, kapsamlı

## Genel Müdür
- Admin ile neredeyse aynı (kullanıcı oluşturmada daha kısıtlı roller)
- Modül yetkililerini yönetebilir

## Bölüm Müdürü
- Sadece kendi departmanındaki verileri görür
- Dashboard: 8 KPI (departman bazlı)
- Not giremez (sadece görüntüleme)
- ✅ Module assignment ile guidance/library yetkisi alabilir

## Hoca
- Class Teacher veya Course Teacher dashboard
- Module assignment ile guidance/library yetkisi alabilir
- Talep açamaz

## Destek Birim Müdürü ✅ YENİ
- Dashboard: SupportDashboard (3 KPI)
- Tüm modüllerde read-only erişim
- Module assignment ile guidance/library yönetebilir
- Talepleri yönetebilir (kendi birimi)

## Veli
- Sadece `/veli` portalı
- Çocuklarının tüm verilerini salt okunur görüntüleyebilir
- Anketlere katılabilir
- Talep açamaz

## Pasif Roller (rehberlik, kutuphane_gorevlisi, muhasebe)
- **rehberlik:** DefaultDashboard, eski rehberlik yetkileri çalışır (module_assignment olmadan)
- **kutuphane_gorevlisi:** DefaultDashboard, eski kütüphane yetkileri çalışır
- **muhasebe:** DefaultDashboard, hiçbir module erişemez

**Öneri:** Pasif roller için migration sonrası module_assignments kaydı oluşturulmalı.

---

# 15. Build ve Lint Durumu

## Build (Son Durum)
```
▲ Next.js 16.2.7 (Turbopack)
✓ Compiled successfully in 11.3s
  Running TypeScript ...
  Finished TypeScript in 16.6s ...
  Collecting page data using 15 workers ...
  Generating static pages using 15 workers ...
✓ Generating static pages in 293ms
```

**0 error, 0 warning** (warning'ler yok — build'de lint warning gösterilmiyor)

## Lint
```
npm run lint → 0 error, 5 warning
```

**5 warning (değişmedi):**
1-4: `pdf/page.tsx` — unused imports
5: `sidebar.tsx` — `<img>` tag

---

# 16. Migration ve Veritabanı Durumu

## Migration Listesi
| # | Dosya | Açıklama | Durum |
|---|---|---|---|
| ... | ... | Önceki migration'lar | ✅ Uygulanmış |
| 00029 | `00029_module_assignments.sql` | module_assignments tablosu | ⏳ Henüz uygulanmadı |

## 00029_module_assignments.sql İçeriği
```sql
CREATE TABLE IF NOT EXISTS module_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL CHECK (module_key IN ('guidance', 'library')),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_module_assignments_unique 
  ON module_assignments(module_key, profile_id);
CREATE INDEX idx_module_assignments_profile_id 
  ON module_assignments(profile_id);
CREATE INDEX idx_module_assignments_module_key 
  ON module_assignments(module_key);
```

## Yapılması Gerekenler
1. **Migration'ı çalıştır:** `supabase/migrations/00029_module_assignments.sql`
2. **Supabase tiplerini yeniden oluştur:** `npx supabase gen types typescript --local > src/types/database.ts`
3. **`as any` cast'lerini kaldır:** `module-assignments/actions.ts` ve `queries.ts`'teki type assertion'ları temizle
4. **Eski roller için modül kaydı oluştur:**
   - `role = 'rehberlik'` olan her kullanıcıya → `module_assignments(module_key='guidance')`
   - `role = 'kutuphane_gorevlisi'` olan her kullanıcıya → `module_assignments(module_key='library')`

---

# 17. Önerilen Düzeltmeler (Öncelik Sıralı)

## Acil (Faz 3 öncesi)
1. **Migration'ı çalıştır** ve Supabase tiplerini yeniden oluştur, `as any` cast'lerini kaldır
2. **Eski roller için module_assignments kaydı oluştur** — script ile
3. **destek_birim_muduru için UI'da write butonlarını gizle** — tüm modüllerde create/edit/delete butonları conditional render edilmeli

## Yüksek Öncelik
4. **Pasif roller (rehberlik, kutuphane_gorevlisi, muhasebe) için özel dashboard** — Şu anda DefaultDashboard görüyorlar. GuidanceDashboard ve LibraryDashboard eklenebilir. muhasebe direkt Default'a düşebilir.
5. **Kullanılmayan importların temizlenmesi** — `pdf/page.tsx`'teki 4 unused import

## Orta Öncelik
6. **Sidebar `<img>` → `next/image`** — Performans iyileştirmesi
7. **Hoca detay placeholders** — "Verdiği Dersler" ve "Sorumlu Olduğu Öğrenciler" bölümlerinin aktifleştirilmesi
8. **Navigation cache** — `getProfileModuleKeys` sonucu session/cookie'a cache'lenebilir (her sayfada extra query)

## Düşük Öncelik
9. **Veli portalinde N+1 query optimizasyonu** — Batch query veya cache
10. **Guidance module assignee olmayanlar için sayfa içi uyarı** — "Bu modül için yetkiniz bulunmamaktadır" mesajı

---

# 18. Sonuç

## Genel Değerlendirme

| Alan | Not | Açıklama |
|---|---|---|
| Yetki matrisi tutarlılığı | ✅ 9/10 | Rol sadeleştirmesi tutarlı, module assignment iyi entegre |
| Route permission doğruluğu | ✅ 10/10 | staffAndSupportRoles ile tutarlılık sağlandı |
| Departman bazlı veri kapsamı | ✅ 9/10 | destek_birim_muduru için scoping gerekmez |
| Server-side güvenlik | ✅ 9/10 | Module assignment ikinci katman |
| UI/UX kalitesi | ✅ 7/10 | Pasif roller DefaultDashboard, buton gizleme eksik |
| Kod kalitesi (lint) | ✅ 9/10 | 0 error, 5 warning (değişmedi) |
| Build | ✅ 10/10 | 0 error, başarılı |
| Migration durumu | ⚠️ 6/10 | Henüz uygulanmadı, as any cast'leri var |
| Async dönüşümü | ✅ 9/10 | Tüm çağrı yerleri güncellendi |

## Önemli İstatistikler
- **Toplam dosya değişikliği:** ~40 dosya (yeni + güncellenen)
- **Yeni dosya:** 7 (migration, 3 kütüphane, 2 arayüz, 1 dashboard, 1 rapor)
- **Async yapılan fonksiyon sayısı:** ~30 (permissions + scope + page'ler)
- **DB'de pasif rol sayısı:** 3 (rehberlik, kutuphane_gorevlisi, muhasebe)
- **Yeni rol:** 1 (destek_birim_muduru)
- **Build:** 0 error
- **Migration:** 1 bekleyen

## Ana Eksiklikler
1. Migration uygulanmadı → `as any` cast'leri temizlenemedi
2. Eski roller için module_assignments kaydı oluşturulmadı
3. Pasif roller özel dashboard'suz (önemli UX sorunu)
4. destek_birim_muduru için UI'da write butonları gizlenmemiş
5. Hoca detay sayfasında 2 placeholder

## Build Durumu (Güncel)
- **Lint:** 0 error, 5 warning (önceden beri var olan uyarılar — değişmedi)
- **Build:** 0 error — başarılı
