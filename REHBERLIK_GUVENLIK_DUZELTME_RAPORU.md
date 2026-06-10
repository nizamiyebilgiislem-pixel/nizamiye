# REHBERLİK MODÜLÜ — GÜVENLİK VE YETKİ DÜZELTME RAPORU

**Tarih:** 10 Haziran 2026  
**Lint:** ✅ 0 error, 5 warning (pre-existing)  
**Build:** ✅ 0 error, başarılı

---

## Düzeltilen Yetki Açıkları

| # | Açıklama | Şiddet | Durum |
|---|---|---|---|
| 1 | Bölüm Müdürü diğer bölümlerin rehberlik kayıtlarını görebiliyordu | **Yüksek** | ✅ Düzeltildi |
| 2 | Sınıf hocası olmayan ders hocası da rehberlik kayıtlarını görebiliyordu | **Yüksek** | ✅ Düzeltildi |
| 3 | Ders hocası rehberlik modülüne erişebiliyordu | **Yüksek** | ✅ Düzeltildi |
| 4 | Talebe detayında rehberlik sekmesi yetkisiz kullanıcılarda render oluyordu | Orta | ✅ Düzeltildi |
| 5 | Sınıf hocası dashboard'ında rehberlik özeti yoktu | Orta | ✅ Eklendi |
| 6 | Dashboard sayıları bölüm müdürü için departman bazında filtrelenmiyordu | Orta | ✅ Düzeltildi |

---

## Değiştirilen Dosyalar

### 1. Yeni Dosya: `src/lib/guidance/scope.ts`

Yetki kapsamı (scope) yardımcı fonksiyonları:

- **`isGuidanceUnrestricted(profile)`** — admin/genel_mudur/rehberlik rollerini tespit eder (sınırsız erişim)
- **`requiresGuidanceScoping(profile)`** — bolum_muduru/hoca rollerini tespit eder (kapsamlı erişim)
- **`canViewGuidanceForStudent(profile, student)`** — belirli bir öğrenci için kullanıcının rehberlik verisine erişip erişemeyeceğini kontrol eder (async, DB sorgulu)
- **`getGuidanceScopedStudentIds(profile)`** — kullanıcının yetki alanındaki öğrenci ID'lerini döndürür:
  - admin/genel_mudur/rehberlik → `null` (filtre yok, tümünü görür)
  - bolum_muduru → kendi departmanındaki öğrenciler
  - hoca → class_teacher_id'si ile eşleşen sınıflardaki öğrenciler

### 2. `src/lib/guidance/permissions.ts`

- `canViewGuidance` → değişiklik yok (admin/genel_mudur/rehberlik/bolum_muduru/hoca)

### 3. `src/lib/guidance/queries.ts`

Aşağıdaki fonksiyonlara **server-tarafı scope filtresi** eklendi:

| Fonksiyon | Değişiklik |
|---|---|
| `getGuidanceDashboardData(profile)` | Profile parametre eklendi, bolum_muduru için departman filtresi |
| `getRecentInterviews(profile, limit)` | Profile parametre eklendi (zaten vardı), scope filtresi eklendi |
| `getUpcomingFollowUps(profile, limit)` | Profile parametre eklendi (zaten vardı), scope filtresi eklendi |
| `getActiveSurveys(profile, limit)` | Profile parametre eklendi, bolum_muduru için departman filtresi |
| `getPlannedActivities(profile, limit)` | Profile parametre eklendi, bolum_muduru için departman filtresi |
| `getInterviews(profile, filters)` | Scope filtresi eklendi (profile zaten vardı) |
| `getInterviewById(id, profile?)` | Profile parametre eklendi |
| `getFollowUps(profile, filters)` | Scope filtresi eklendi (profile zaten vardı) |
| `getFollowUpById(id, profile?)` | Profile parametre eklendi |
| `getSurveys(profile?)` | Profile parametre eklendi, bolum_muduru için departman filtresi |
| `getActivities(profile?, filters?)` | Profile parametre eklendi, bolum_muduru için departman filtresi |
| `getStudentInterviews(studentId, profile?)` | Profile parametre eklendi, öğrenci bazlı yetki kontrolü |
| `getStudentFollowUps(studentId, profile?)` | Profile parametre eklendi, öğrenci bazlı yetki kontrolü |
| `getStudentActivities(studentId, profile?)` | Profile parametre eklendi, öğrenci bazlı yetki kontrolü |

**Filtreleme mantığı:**
- admin/genel_mudur/rehberlik → **hiçbir filtre uygulanmaz** (tüm kayıtları görür)
- bolum_muduru → **sadece kendi departmanındaki öğrencilerin kayıtlarını görür**
- hoca → **sadece class_teacher_id'si ile eşleşen sınıflardaki öğrencilerin kayıtlarını görür**

### 4. `src/lib/route-permissions.ts`

```diff
- const guidanceViewRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik", "bolum_muduru", "hoca"];
+ const guidanceViewRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik", "bolum_muduru"];
```

**Etki:** Hoca rolü artık `/rehberlik/*` route'larına erişemez. URL elle yazılsa bile sayfa yetki hatası döndürür.

### 5. `src/lib/navigation.ts`

```diff
- const guidanceRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik", "bolum_muduru", "hoca"];
+ const guidanceRoles: UserRole[] = ["admin", "genel_mudur", "rehberlik", "bolum_muduru"];
```

**Etki:** Hoca rolü sidebar'da "Rehberlik" menü öğesini görmez.

### 6. `src/app/(panel)/rehberlik/page.tsx`

Tüm query çağrılarına `profile` parametresi eklendi:
- `getGuidanceDashboardData(profile)`
- `getRecentInterviews(profile, 5)`
- `getUpcomingFollowUps(profile, 5)`
- `getActiveSurveys(profile, 5)`
- `getPlannedActivities(profile, 5)`

### 7. `src/app/(panel)/rehberlik/gorusmeler/[id]/page.tsx`

- `getInterviewById(id)` → `getInterviewById(id, profile)`

### 8. `src/app/(panel)/rehberlik/gorusmeler/[id]/duzenle/page.tsx`

- `getInterviewById(id)` → `getInterviewById(id, profile)`

### 9. `src/app/(panel)/rehberlik/takipler/[id]/page.tsx`

- `getFollowUpById(id)` → `getFollowUpById(id, profile)`

### 10. `src/app/(panel)/rehberlik/anketler/page.tsx`

- `getSurveys()` → `getSurveys(profile)`

### 11. `src/app/(panel)/rehberlik/etkinlikler/page.tsx`

- `getActivities(...)` → `getActivities(profile, ...)`

### 12. `src/app/(panel)/talebeler/[id]/page.tsx`

- **Yeni import:** `canViewGuidanceForStudent` from `@/lib/guidance/scope`
- **`canViewGuid` değişti:**
  ```typescript
  // ESKİ: sadece rol bazlı
  const canViewGuid = canViewGuidance(profile);
  
  // YENİ: rol bazlı + öğrenci bazlı
  const canViewGuid = canViewGuidance(profile) && 
    await canViewGuidanceForStudent(profile, { 
      course_class_id: student.course_class?.id ?? null, 
      department_id: student.department?.id ?? null 
    });
  ```
- **Tab trigger artık conditional:**
  ```tsx
  {canViewGuid && <TabsTrigger value="rehberlik">Rehberlik</TabsTrigger>}
  ```
- **Tab content artık conditional** (placeholder da kalktı):
  ```tsx
  {canViewGuid && (
    <TabsContent value="rehberlik">
      <StudentGuidancePanel studentId={student.id} profile={profile} />
    </TabsContent>
  )}
  ```

### 13. `src/components/guidance/student-guidance-panel.tsx`

Query çağrılarına `profile` parametresi eklendi:
- `getStudentInterviews(studentId, profile)`
- `getStudentFollowUps(studentId, profile)`
- `getStudentActivities(studentId, profile)`

### 14. `src/components/dashboard/class-teacher-dashboard.tsx`

**Yeni:** Rehberlik özeti kartı eklendi.
- `getGuidanceDashboardData(profile)` ile sınıf hocasının kendi sınıfına ait veriler
- 3 metrik: Açık Rehberlik Kaydı, Takip Bekleyen, Yaklaşan Takip
- Sadece veri varsa gösterilir (boş kart görünmez)
- "Rehberlik Sayfasına Git" linki

### 15. `src/components/dashboard/admin-dashboard.tsx`

- `getGuidanceDashboardData()` → `getGuidanceDashboardData(profile)`

### 16. `src/components/dashboard/department-manager-dashboard.tsx`

- `getGuidanceDashboardData()` → `getGuidanceDashboardData(profile)` — böylece bölüm müdürü sadece kendi departmanının verilerini görür

---

## Test Senaryoları — Doğrulama

| # | Senaryo | Nasıl Sağlandı |
|---|---|---|
| 1 | Admin tüm rehberlik kayıtlarını görür | `isGuidanceUnrestricted` → `true`, hiçbir query filtrelenmez |
| 2 | Genel Müdür tüm rehberlik kayıtlarını görür | Aynı şekilde |
| 3 | Rehberlik rolü tüm kayıtları görür | Aynı şekilde |
| 4 | Bölüm Müdürü sadece kendi bölümünü görür | Query'lerde `in("student_id", scopedStudentIds)` + survey/activity'lerde `department_id` filtresi |
| 5 | Başka bölüm öğrencisine erişemez | `getGuidanceScopedStudentIds` sadece kendi departmanındaki öğrencileri döndürür |
| 6 | Sınıf hocası sadece kendi sınıfını görür | `getGuidanceScopedStudentIds` class_teacher_id ile eşleşen sınıfların öğrencilerini döndürür |
| 7 | Başka sınıf öğrencisini göremez | Aynı şekilde, class_teacher_id eşleşmezse scopedIds'e dahil edilmez |
| 8 | Ders hocası rehberlik modülüne erişemez | `guidanceViewRoles`'dan hoca kaldırıldı, route koruması + sidebar'dan kaldırıldı |
| 9 | Ders hocası rehberlik sekmesini göremez | `canViewGuidanceForStudent` hoca için class_teacher kontrolü yapar |
| 10 | Talebe detayında rehberlik sekmesi sadece yetkililere görünür | Tab trigger + content conditional render (`canViewGuid`) |
| 11 | ClassTeacherDashboard rehberlik kartları çalışır | `getGuidanceDashboardData(profile)` ile scope'lu veri + yeni kart component'i |
| 12 | Dashboard sayıları doğru filtrelenir | Admin: tümü; Bölüm Müdürü: departman bazlı; Sınıf hocası: class_teacher bazlı |

---

## Özet

Tüm kritik yetki açıkları kapatılmıştır:

1. ✅ **Bölüm müdürü departman filtresi** — Query seviyesinde zorunlu filtre
2. ✅ **Hoca sınıf filtresi** — Sadece class_teacher olan hocalar kendi sınıfındaki öğrencileri görür
3. ✅ **Ders hocası erişimi engellendi** — Route + navigation + student detail seviyesinde
4. ✅ **Talebe detayındaki rehberlik sekmesi** — Sadece yetkili roller görür
5. ✅ **Class Teacher Dashboard** — Rehberlik özeti kartı eklendi
6. ✅ **Dashboard sayıları** — Bölüm müdürü için departman bazında filtrelenir

Migration oluşturulmamış, yeni tablo eklenmemiş, şema değiştirilmemiş, RLS açılmamıştır.
