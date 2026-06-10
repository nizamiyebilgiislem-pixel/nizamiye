# Evrak Yönetimi — Öğrenci Seçimi ve Rol Bazlı Filtre Düzeltmesi

## Değiştirilen dosyalar

| Dosya | İşlem |
|---|---|
| `src/lib/documents/queries.ts` | `getDocumentCreateOptions` + `groupBy` eklendi |
| `src/components/documents/document-create-form.tsx` | **YENİ** — cascading select client component |
| `src/app/(panel)/evraklar/yeni/page.tsx` | Eski multi-form yapı kaldırıldı, yeni component kullanıldı |

## Form akışı nasıl değişti?

**Eski:** Server-side iki adımlı form. Önce bölüm/sınıf seç → "Öğrencileri Göster" butonuna tıkla → sayfa yenilenir → öğrenci listesi gelir → DocumentForm gösterilir.

**Yeni:** Tek adımlı client-side cascading select. Bölüm seçilince sınıflar, sınıf seçilince öğrenciler anında gelir. Sayfa yenilenmez.

### Form sırası:
1. Bölüm seç → sınıf select aktif olur
2. Sınıf seç → öğrenci select aktif olur
3. Öğrenci seç → evrak türü / dosya URL / açıklama alanları doldurulur

### Davranış:
- Bölüm seçilmeden sınıf select disabled
- Sınıf seçilmeden öğrenci select disabled
- Bölüm değişince sınıf ve öğrenci seçimi sıfırlanır
- Sınıf değişince öğrenci seçimi sıfırlanır
- Sınıf yoksa: "Bu bölüme ait aktif sınıf bulunamadı"
- Öğrenci yoksa: "Bu sınıfta aktif öğrenci bulunamadı"

## Rol bazlı filtre nasıl çalışıyor?

`getDocumentCreateOptions(profile)` sunucuda çalışır, role göre filtreler:

| Rol | Bölümler | Sınıflar | Öğrenciler |
|---|---|---|---|
| **admin** | Tümü | Tümü | Tümü |
| **genel_mudur** | Tümü | Tümü | Tümü |
| **bolum_muduru** | Sadece `department_id` | Sadece kendi bölümündeki sınıflar | Kendi bölümündeki tüm öğrenciler |
| **hoca** | Sadece `department_id` | Sadece `class_teacher_id = profile.id` | Sadece kendi sınıfındaki öğrenciler |
| **destek_bm** | Sayfaya erişemez (sayfa başında engellenir) | — | — |

Client component (`DocumentCreateForm`) bu önceden filtrelenmiş listeyi alır, sadece UI kademeli seçim yapar (`useState` + `useMemo`). Ekstra veri çekmez, güvenlik riski yoktur.

## Query güvenliği

`getDocumentCreateOptions` üç kademeli Supabase sorgusu çalıştırır:

1. **Departments** — `is_active = true`, BM/hoca için `id = profile.department_id`
2. **Classes** — `is_active = true`, görünür departman ID'lerine göre, hoca için `class_teacher_id = profile.id`
3. **Students** — `status = active`, görünür sınıf ID'lerine göre

Sonuçlar `groupBy` ile `classesByDepartment` ve `studentsByClass` sözlüklerine dönüştürülür. Client sadece bu sözlükler üzerinde `departmentId`/`classId` anahtarıyla erişir.

## Server action güvenliği

Değişiklik yapılmadı. **Zaten doğru çalışıyordu:**

`createDocumentAction` → `canEditStudentDocuments(profile, student, courseClass)`:

```ts
// documents/permissions.ts
- admin / genel_mudur → true (tüm öğrenciler)
- bolum_muduru → Boolean(profile.department_id && courseClass?.department_id === profile.department_id)
- hoca → courseClass?.class_teacher_id === profile.id
- destek_bm → false (reddedilir)
- veli → false (reddedilir)
```

Elle farklı bir `student_id` gönderilse bile `canEditStudentDocuments` reddeder. Yetkisiz student_id için hata mesajı: "Bu işlem için yetkiniz yok."

## Test sonuçları (kod analizi)

| # | Test | Durum |
|---|---|---|
| 1 | Admin tüm bölümleri görüyor | ✅ — `filterDepartments`'da role kısıtlaması yok |
| 2 | Bölüm seçince ilgili sınıflar geliyor | ✅ — `useMemo` ile `classesByDepartment[departmentId]` |
| 3 | Sınıf seçince ilgili öğrenciler geliyor | ✅ — `useMemo` ile `studentsByClass[classId]` |
| 4 | Bölüm değişince sınıf/öğrenci sıfırlanıyor | ✅ — `setDepartmentId(v); setClassId("")` |
| 5 | BM sadece kendi bölümünü görüyor | ✅ — dept query `.eq("id", profile.department_id)` |
| 6 | BM kendi bölümündeki tüm öğrencilere evrak ekleyebiliyor | ✅ — department → class → student zinciri |
| 7 | Hoca sadece kendi sınıfını ve öğrencilerini görüyor | ✅ — `class_teacher_id === profile.id` filtresi |
| 8 | Hoca başka sınıf öğrencisine evrak ekleyemiyor | ✅ — sadece kendi sınıfındaki öğrenciler gelir |
| 9 | DBM yeni evrak sayfasına erişemiyor | ✅ — sayfa başında `if (role === "destek_bm")` blok |
| 10 | Server action'a elle başka student_id gönderilirse reddediliyor | ✅ — `canEditStudentDocuments` ile korumalı |

## Mevcut evrak listeleme

Değişiklik yok. Liste, filtre ve detay sayfaları eskisi gibi çalışır:

- **Destek birim müdürü**: Evrakları görebilir, yeni ekleyemez, düzenleyemez, silemez.
- **Bölüm müdürü**: Kendi bölümü öğrencilerinin evraklarını görebilir ve ekleyebilir.
- **Sınıf hocası**: Kendi sınıf öğrencilerinin evraklarını görebilir ve ekleyebilir.

## Lint / Build

```
npm run lint  → 0 error, 5 warning (pre-existing)
npm run build → ✓ Compiled successfully, 0 error
```
