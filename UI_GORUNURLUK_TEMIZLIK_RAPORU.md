# FAZ 3 — UI Görünürlük Temizliği Raporu

**Hazırlanma Tarihi:** 10 Haziran 2026  
**Kapsam:** Yetkisiz kullanıcıların (başta `destek_birim_muduru`) yönetim butonlarını, form sayfalarını ve hızlı işlem linklerini görmesinin engellenmesi. `canViewAttendance` izin fonksiyonunun düzeltilmesi.

---

## İçindekiler

1. [Değişiklik Özeti](#1-değişiklik-özeti)
2. [Düzeltilen İzin Fonksiyonu](#2-düzeltilen-i̇zin-fonksiyonu)
3. [Sayfa Seviyesinde Buton Korumaları](#3-sayfa-seviyesinde-buton-korumaları)
4. [Form Sayfası Yetki Kontrolleri](#4-form-sayfası-yetki-kontrolleri)
5. [Bileşen Seviyesinde Korumalar](#5-bileşen-seviyesinde-korumalar)
6. [Dashboard Temizliği](#6-dashboard-temizliği)
7. [Kapsam Dışı Bırakılanlar](#7-kapsam-dışı-bırakılanlar)
8. [Build ve Lint Sonuçları](#8-build-ve-lint-sonuçları)
9. [Ek: Değişen Dosyaların Tam Listesi](#9-ek-değişen-dosyaların-tam-listesi)

---

## 1. Değişiklik Özeti

| Kategori | Adet | Açıklama |
|---|---|---|
| İzin fonksiyonu düzeltmesi | 1 | `canViewAttendance` — negatif kontrol (`!== "veli"`) → allowlist |
| Buton koruması (sayfa) | 6 | `destek_birim_muduru`nden yönetim butonları gizlendi |
| Form sayfası uyarısı | 4 | Yetkisiz kullanıcıya "Bu işlem için yetkiniz bulunmamaktadır" |
| Bileşen prop koruması | 1 | `attendance-session-list` "Düzenle" linki `canManageAll` prop'una bağlandı |
| Dashboard temizliği | 2 | Sınıf hocası ve ders hocası dashboard'larından "Talep Oluştur" kaldırıldı |
| **Toplam** | **14** | |

Tüm değişiklikler **sadece UI görünürlük seviyesinde** yapıldı. Server-side permission fonksiyonlarına, action'lara veya veritabanı sorgularına dokunulmadı.

---

## 2. Düzeltilen İzin Fonksiyonu

### `src/lib/attendance/permissions.ts` — `canViewAttendance`

**Before:**
```ts
export function canViewAttendance(profile: ProfileRow) {
  return profile.role !== "veli";
}
```

**After:**
```ts
export function canViewAttendance(profile: ProfileRow) {
  return ["admin", "genel_mudur", "bolum_muduru", "hoca"].includes(profile.role);
}
```

**Sorun:** Negatif kontrol (`!== "veli"`), `destek_birim_muduru` dahil tüm non-veli rollerine yoklama görüntüleme izni veriyordu.

**Etkilenen roller:**
- `destek_birim_muduru`: **true → false** (kötüye kullanım kapatıldı)
- `rehberlik`, `kutuphane_gorevlisi`, `muhasebe`: **true → false** (eski roller, zaten route seviyesinde engelleniyor)
- `veli`: **false → false** (değişmedi)
- `admin`, `genel_mudur`, `bolum_muduru`, `hoca`: **true → true** (değişmedi)

---

## 3. Sayfa Seviyesinde Buton Korumaları

### 3.1 `src/app/(panel)/revir/page.tsx` — Yeni Revir Kaydı

```tsx
{canManage ? (
  <Link href="/revir/yeni" className={cn(buttonVariants())}>
    <Plus className="size-4" aria-hidden="true" />Yeni Revir Kaydı
  </Link>
) : null}
```

**Koruma:** `canManageInfirmary(profile)` — admin/genel_mudur veya "infirmary" module_assignment'ı olan kullanıcılar görür. `destek_birim_muduru` görmez.

### 3.2 `src/app/(panel)/yoklama/page.tsx` — Yeni Yoklama

```tsx
const canManage = canManageAttendance(profile);
// ...
{canManage ? (
  <Link href="/yoklama/yeni" className={cn(buttonVariants())}>
    <Plus className="size-4" aria-hidden="true" />Yeni Yoklama
  </Link>
) : null}
```

**Koruma:** `canManageAttendance(profile)` — admin/genel_mudur/bolum_muduru/hoca görür. `destek_birim_muduru` görmez.  
**Ek:** `AttendanceSessionList` bileşenine `canManageAll={canManage}` prop'u aktarıldı.

### 3.3 `src/app/(panel)/evraklar/page.tsx` — Yeni Evrak

```tsx
{profile.role !== "destek_birim_muduru" ? (
  <Link href="/evraklar/yeni" className={cn(buttonVariants())}>
    <Plus className="size-4" aria-hidden="true" />Yeni Evrak
  </Link>
) : null}
```

**Koruma:** Rol bazlı. admin/genel_mudur/bolum_muduru/hoca görür. `destek_birim_muduru` görmez.

### 3.4 `src/app/(panel)/not-sistemi/page.tsx` — Not Girişi linki

```tsx
{profile.role !== "destek_birim_muduru" ? (
  <Link href="/not-sistemi/not-girisi" className={cn(buttonVariants())}>Not Girişi</Link>
) : null}
```

**Not:** `/not-sistemi/not-girisi` sayfası zaten per-student bazında `canEditStudentGrades` ile korunuyor. Yetkisiz kullanıcı sayfayı görüntüleyebilir ama "Not Gir" butonlarını görmez. Bu değişiklik sadece **birincil aksiyon butonunun** görünürlüğünü kısıtlar.

### 3.5 `src/app/(panel)/kanaat-sistemi/page.tsx` — Kanaat Girişi butonu

```tsx
{profile.role !== "destek_birim_muduru" ? (
  <Link href="/kanaat-sistemi/kanaat-girisi" className={cn(buttonVariants())}>
    <ClipboardList className="size-4" aria-hidden="true" />
    Kanaat Girişi
  </Link>
) : null}
```

### 3.6 `src/app/(panel)/egitim-planlama/page.tsx` — Ders Atamaları ve Ders Programı

```tsx
<TableCell>
  <div className="flex justify-end gap-2">
    {["admin", "genel_mudur", "bolum_muduru"].includes(profile.role) ? (
      <Link href={`/egitim-planlama/ders-atamalari/${classRow.id}`} ...>Ders Atamaları</Link>
    ) : null}
    {profile.role !== "destek_birim_muduru" ? (
      <Link href={`/egitim-planlama/ders-programi/${classRow.id}`} ...>Ders Programı</Link>
    ) : null}
  </div>
</TableCell>
```

**Koruma:**
- **Ders Atamaları:** Sadece admin/genel_mudur/bolum_muduru görür (yönetim işlemi).
- **Ders Programı:** `destek_birim_muduru` hariç tüm staff roller görür (görüntüleme + yönetim).

---

## 4. Form Sayfası Yetki Kontrolleri

Form sayfalarına doğrudan URL'den erişmeye çalışan yetkisiz kullanıcılara, form yerine "Bu işlem için yetkiniz bulunmamaktadır" uyarısı gösterilir.

### 4.1 `src/app/(panel)/revir/yeni/page.tsx`

```tsx
const canManage = await canManageInfirmary(profile);

if (!canManage) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Revir" title="Yeni Revir Kaydı" description="Yetkisiz erişim" />
      <Card>
        <CardContent className="p-5 text-center text-sm text-muted-foreground">
          Bu işlem için yetkiniz bulunmamaktadır.
        </CardContent>
      </Card>
    </div>
  );
}
```

**Koruma:** `canManageInfirmary` — admin/genel_mudur veya module_assignment("infirmary") kontrolü.

### 4.2 `src/app/(panel)/revir/ogrenci/[studentId]/yeni/page.tsx`

Aynı `canManageInfirmary` kontrolü. Öğrenci bazlı revir kaydı oluşturma sayfası.

### 4.3 `src/app/(panel)/yoklama/yeni/page.tsx`

```tsx
if (!canManageAttendance(profile)) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Yeni Yoklama" title="Yetkisiz erişim" ... />
      ...
    </div>
  );
}
```

**Koruma:** `canManageAttendance` — admin/genel_mudur/bolum_muduru/hoca kontrolü.  
**Not:** Route permission (`staffRoles`) zaten destek_birim_muduru'nu engelliyor, ama defense-in-depth amaçlı eklendi.

### 4.4 `src/app/(panel)/evraklar/yeni/page.tsx`

```tsx
if (profile.role === "destek_birim_muduru") {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Evraklar" title="Yeni Evrak" description="Yetkisiz erişim" />
      ...
    </div>
  );
}
```

**Koruma:** Rol bazlı. `destek_birim_muduru` engellenir.

---

## 5. Bileşen Seviyesinde Korumalar

### 5.1 `src/components/attendance/attendance-session-list.tsx`

**Before:**
```tsx
export function AttendanceSessionList({ sessions }: { sessions: AttendanceSessionWithRelations[] }) {
```

**After:**
```tsx
export function AttendanceSessionList({ sessions, canManageAll }: { sessions: AttendanceSessionWithRelations[]; canManageAll?: boolean }) {
```

**"Düzenle" linki koruması:**
```tsx
{canManageAll ? (
  <Link href={`/yoklama/${session.id}/duzenle`} ...>Düzenle</Link>
) : null}
```

**Prop aktarımı** (`yoklama/page.tsx`):
```tsx
<AttendanceSessionList sessions={data.sessions} canManageAll={canManage} />
```

`canManage` değeri `canManageAttendance(profile)` ile hesaplanır.

---

## 6. Dashboard Temizliği

### 6.1 `src/components/dashboard/class-teacher-dashboard.tsx`

**Kaldırılan:**
```tsx
<QuickActionButton href="/talepler/yeni" label="Talep Oluştur" />
```

**Gerekçe:** Sınıf hocası (`class_teacher`), `talepCreatorRoles` içinde yer almaz. Buton tıklandığında talep oluşturma sayfası açılır ama kullanıcının yetkisi olmadığı için işlem başarısız olur. Hızlı işlemler bölümünde yanıltıcıydı.

### 6.2 `src/components/dashboard/course-teacher-dashboard.tsx`

**Kaldırılan:**
```tsx
<QuickActionButton href="/talepler/yeni" label="Talep Oluştur" />
```

**Gerekçe:** Aynı — ders hocası (`course_teacher`) da talep oluşturamaz.

---

## 7. Kapsam Dışı Bırakılanlar

### 7.1 `ders-sistemi/page.tsx` — "Yeni Ders" butonu

Route permission: `managerRoles` (admin/genel_mudur/bolum_muduru). Bu role sahip tüm kullanıcılar ders oluşturabilir. Buton zaten güvende.

### 7.2 `kutuphane/dokumanlar/yeni/page.tsx`

Client component. Route permission: `libraryStaffRoles` (admin/genel_mudur/kutuphane_gorevlisi). Eski rol (`kutuphane_gorevlisi`) hâlâ route guard'da yer alıyor. Module assignment sistemine geçişle birlikte ilerleyen fazlarda ele alınabilir. UI görünürlük temizliği kapsamında değiştirilmedi.

### 7.3 Guidance / Library form sayfaları

Bu modüller zaten Faz 2'de module assignment sistemiyle `canManageGuidance` / `canManageLibrary` async kontrollerine kavuştu. Action seviyesinde korumaları mevcut. Form sayfalarındaki kontroller ayrı bir fazda ele alınabilir.

---

## 8. Build ve Lint Sonuçları

| Kontrol | Sonuç |
|---|---|
| `npm run build` | **0 error, 0 warning** |
| `npm run lint` | **0 error** |
| Eski uyarılar | 5 adet (değiştirilmeyen dosyalarda — `not-sistemi/not-girisi/pdf/page.tsx`'te 4 unused import, `sidebar.tsx`'te `<img>` kullanımı) |

---

## 9. Ek: Değişen Dosyaların Tam Listesi

| # | Dosya | Değişiklik Türü |
|---|---|---|
| 1 | `src/lib/attendance/permissions.ts` | İzin fonksiyonu düzeltmesi |
| 2 | `src/app/(panel)/revir/page.tsx` | Buton koruması |
| 3 | `src/app/(panel)/yoklama/page.tsx` | Buton koruması + prop aktarımı |
| 4 | `src/app/(panel)/evraklar/page.tsx` | Buton koruması |
| 5 | `src/app/(panel)/not-sistemi/page.tsx` | Buton koruması |
| 6 | `src/app/(panel)/kanaat-sistemi/page.tsx` | Buton koruması |
| 7 | `src/app/(panel)/egitim-planlama/page.tsx` | Buton koruması (2 link) |
| 8 | `src/app/(panel)/revir/yeni/page.tsx` | Form sayfası yetki kontrolü |
| 9 | `src/app/(panel)/revir/ogrenci/[studentId]/yeni/page.tsx` | Form sayfası yetki kontrolü |
| 10 | `src/app/(panel)/yoklama/yeni/page.tsx` | Form sayfası yetki kontrolü |
| 11 | `src/app/(panel)/evraklar/yeni/page.tsx` | Form sayfası yetki kontrolü |
| 12 | `src/components/attendance/attendance-session-list.tsx` | Bileşen prop koruması |
| 13 | `src/components/dashboard/class-teacher-dashboard.tsx` | Dashboard link kaldırma |
| 14 | `src/components/dashboard/course-teacher-dashboard.tsx` | Dashboard link kaldırma |

---

## Özet Matris: `destek_birim_muduru` Görünürlük Tablosu

| Sayfa / Bileşen | Öncesi | Sonrası |
|---|---|---|
| revir — Yeni Revir Kaydı | Gösteriliyordu | Gizlendi |
| yoklama — Yeni Yoklama | Gösteriliyordu | Gizlendi |
| yoklama — Düzenle linki | Gösteriliyordu | Gizlendi |
| evraklar — Yeni Evrak | Gösteriliyordu | Gizlendi |
| not-sistemi — Not Girişi | Gösteriliyordu | Gizlendi |
| kanaat-sistemi — Kanaat Girişi | Gösteriliyordu | Gizlendi |
| egitim-planlama — Ders Atamaları | Gösteriliyordu | Gizlendi |
| egitim-planlama — Ders Programı | Gösteriliyordu | Gizlendi |
| yoklama genel görüntüleme | Görüntüleyebiliyordu | **Artık göremez** (canViewAttendance düzeltmesi) |
