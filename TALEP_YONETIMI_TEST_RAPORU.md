# Talep Yönetimi Modülü — Kapsamlı Test ve Denetim Raporu

**Tarih:** 2026-06-10
**Yöntem:** Statik kod analizi (tüm route, component, action, query, permission, dashboard dosyaları incelendi)
**Durum:** Kod değişikliği yapılmadı, sadece analiz.

---

## 1. Route Durumu

| Route | Var mı? | Yetki Koruması (route-permissions) | Sayfa içi permission | Çalışıyor |
|---|---|---|---|---|
| `/talepler` | ✅ | `talepRoles` | ✅ `canViewTalepler` | ✅ |
| `/talepler/yeni` | ✅ | `talepRoles` | ✅ `canCreateTalep` | ✅ |
| `/talepler/[id]` | ✅ | `talepRoles` | ✅ `canViewTalepler` + varsa `notFound` | ✅ |
| `/talepler/[id]/duzenle` | ✅ | `talepManageRoles` | ✅ `canEditTalep` + varsa `notFound` | ✅ |

**Eksik route bulunamadı.** 4 route da mevcut, her biri çift katmanlı yetki korumalı (route-permissions + sayfa içi).

---

## 2. Veritabanı Durumu

**Tablo:** `talepler`

| Alan | Tip | Var mı? | Zorunlu mu? |
|---|---|---|---|
| `id` | `uuid` (PK) | ✅ | ✅ |
| `title` | `string` | ✅ | ✅ |
| `description` | `string` | ✅ | ✅ |
| `type` | `string` | ✅ | default `"talep"` |
| `priority` | `string` | ✅ | default `"normal"` |
| `status` | `string` | ✅ | ✅ |
| `requested_unit` | `string` | ✅ | ✅ |
| `requested_by` | `string` (FK → profiles) | ✅ | ✅ |
| `assigned_to` | `string \| null` | ✅ | ❌ (nullable) |
| `target_person` | `string \| null` | ✅ | ❌ |
| `deadline` | `DateString \| null` | ✅ | ❌ |
| `response_note` | `string \| null` | ✅ | ❌ |
| `rejection_reason` | `string \| null` | ✅ | ❌ |
| `internal_note` | `string \| null` | ✅ | ❌ |
| `created_at` | `Timestamp` | ✅ | ✅ |
| `updated_at` | `Timestamp` | ✅ | ✅ |

**Eksik alan bulunamadı.** Tüm alanlar mevcut.

**Not:** `requested_unit` bir departman UUID'si, `"destek"` veya `"muhasebe"` string'i olabilir. Veritabanında FK kısıtlaması yoktur.

---

## 3. Yetki Analizi

### 3.1. Yetki Matrisi

| Rol | Görüntüleme | Oluşturma | Düzenleme | Durum Değiştirme | Dashboard Kartı |
|---|---|---|---|---|---|
| **admin** | ✅ Tümü | ✅ | ✅ Her zaman | ✅ Her zaman | ❌ Yok |
| **genel_mudur** | ✅ Tümü | ✅ | ✅ Her zaman | ✅ Her zaman | ❌ Yok |
| **bolum_muduru** | ✅ Kendi bölümü + kendi talepleri | ✅ | ✅ Sadece "bekliyor" durumunda ve kendi talebi | ✅ Kendi bölümüne gelen + atandıysa | ✅ Açık talep sayısı |
| **hoca** | ❌ Erişemez | ❌ | ❌ | ❌ | ❌ |
| **rehberlik** | ✅ Sadece kendi talepleri | ✅ | ✅ Sadece "bekliyor" durumunda ve kendi talebi | ❌ | ❌ |
| **destek_bm** | ✅ Destek birimine gelen + kendi talepleri | ✅ | ✅ Sadece "bekliyor" durumunda ve kendi talebi | ✅ Destek birimine gelen taleplerde | ✅ Açık talep sayısı |
| **veli** | ❌ Erişemez | ❌ | ❌ | ❌ | ❌ |
| **muhasebe** | ✅ Muhasebeye gelen + kendi talepleri | ❌ (permissions'ta yok) | ❌ | ❌ (handler) | ❌ |

### 3.2. Per-route Yetki Detayı

#### Admin / Genel Müdür
- `canViewTalepler` → true (talepCreatorRoles'da admin/genel_mudur var)
- `canCreateTalep` → true
- `canEditTalep` → true (her zaman)
- `canManageTalepStatus` → true (her zaman)
- Tüm talepleri görür (`getTalepler`'de ilk branch: admin/genel_mudur → tüm kayıtlar)

#### Bölüm Müdürü
- **Görme:** `getTalepler` kendi departmanına gelen (`requested_unit = department_id`) + kendi oluşturduğu talepleri
- **Oluşturma:** ✅
- **Düzenleme:** Sadece kendi oluşturduğu ve "bekliyor" durumundaki talepleri
- **Durum değiştirme:** `canManageTalepStatus`: `isHandlerForUnit` → `requested_unit === profile.department_id` ise true. Ayrıca `assigned_to === profile.id` ise true.
- **Dashboard:** `department-manager-dashboard.tsx` içinde "Talep Oluştur" butonu + `role-based-queries.ts` ile `open_talep_count`

#### Destek Birim Müdürü
- **Görme:** `getTalepler`'de "destek" unit handler'ı olarak gelen talepleri + kendi oluşturdukları
- **Oluşturma:** ✅ (talepCreatorRoles'da var)
- **Düzenleme:** Sadece kendi oluşturduğu ve "bekliyor" durumundaki talepleri
- **Durum değiştirme:** `canManageTalepStatus`: `isHandlerForUnit` → `requested_unit === "destek"` ise true. Ayrıca `assigned_to === profile.id` ise true.
- **Dashboard:** `support-dashboard.tsx` içinde açık talep sayısı + Talep Yönetimi linki

#### Hoca
- Hiçbir talep yetkisi yoktur. `talepCreatorRoles`'da `"hoca"` bulunmaz. Route-permissions'da da yok.

#### Veli
- Hiçbir talep yetkisi yoktur.

---

## 4. Dashboard Analizi

| Dashboard | Talep Kartı Var mı? | Ne Gösteriyor? |
|---|---|---|
| **admin** | ❌ | Hiçbir talep bileşeni yok |
| **genel_mudur** | ❌ | Aynı admin dashboard'unu kullanıyor |
| **bolum_muduru** | ✅ | `open_talep_count` (açık talep sayısı) + "Talep Oluştur" quick action |
| **hoca (sınıf)** | ❌ | Talep ile ilgili hiçbir şey yok |
| **hoca (ders)** | ❌ | Talep ile ilgili hiçbir şey yok |
| **destek_bm** | ✅ | Açık talep sayısı (`bekliyor + incelemede`) + Talep Yönetimi linki |

**Bulgular:**
- Admin/genel_mudur dashboard'unda talep özeti olmaması dikkat çekici. Admin tüm talepleri görebildiği halde dashboard'da talep kartı yok.
- Destek dashboard'u sadece "bekliyor + incelemede" sayar. `isleme_alindi` durumu açık talep olarak sayılmaz, bu doğru.
- Bölüm müdürü dashboard'u `role-based-queries.ts` üzerinden `open_talep_count` hesaplar: `["tamamlandi", "iptal_edildi", "reddedildi"]` dışındaki tüm durumları açık kabul eder.

---

## 5. Talep Akışı (Yaşam Döngüsü)

```
bekliyor
  ├→ incelemede
  └→ iptal_edildi

incelemede
  ├→ isleme_alindi
  └→ reddedildi

isleme_alindi
  ├→ onaylandi
  └→ reddedildi

onaylandi
  └→ tamamlandi

(terminal durumlar: tamamlandi, reddedildi, iptal_edildi)
```

**Akış tanımı:** `nextActions` record'unda (talep-status-form.tsx:16-32) tam olarak tanımlanmış. 4 aşamalı ileri akış + 2 iptal/red noktası.

**Doğrulamalar:**
- ✅ Bekliyor → İncelemede (ileri)
- ✅ Bekliyor → İptal Edildi (iptal)
- ✅ İncelemede → İşleme Alındı (ileri)
- ✅ İncelemede → Reddedildi (red)
- ✅ İşleme Alındı → Onaylandı (ileri)
- ✅ İşleme Alındı → Reddedildi (red)
- ✅ Onaylandı → Tamamlandı (terminal)
- ✅ Terminal durumlardan geri dönüş yok (form gizlenir: satır 117)

**Eksik:** Reddedildi'den "Yeniden Aç" akışı yok. Bir talep reddedildikten sonra tekrar açılamaz.

---

## 6. Güvenlik Bulguları

### 6.1. Admin Client Kullanımı — YÜKSEK
`getTalepler()` ve `getTalepById()` fonksiyonları `createSupabaseAdminClient()` kullanır. Bu, RLS'yi tamamen bypass eder.

- `getTalepById` hiçbir yetki kontrolü yapmaz. Herhangi bir kullanıcı doğru URL'yi bilirse (`/talepler/[id]`) herhangi bir talebi görebilir.
- Çünkü `getTalepById`'de **rol filtresi yoktur**. `canViewTalepler` sadece sayfaya erişimi kontrol eder, talep bazında filtre yapmaz.
- `getTalepler` ise role göre filtreler (admin her şeyi görür, BM sadece kendi bölümünü, vb.)

**Risk:** `getTalepById` çağrıldığında yetki kontrolü yapılmaz. Kimlik doğrulaması `requireAuth` ile yapılır, ancak talep üzerinde görüntüleme yetkisi yoktur.

### 6.2. URL Manipülasyonu — ORTA
Talep detay sayfasında `canViewTalepler` kontrolü yapılır, ancak bu sadece **role** bakar, **talep sahipliğine** değil. Yani:
- Admin/genel_mudur → her şeyi görebilir (doğru)
- Bolum_muduru → `/talepler/[id]` sayfasına erişebilir ancak sayfa `getTalepById(id)` ile her talebi çeker (admin client ile)
- Destek BM → aynı şekilde

`TalepDetayPage` içinde:
```tsx
if (!canViewTalepler(profile)) { return error }
const talep = await getTalepById(id);
```
Yani sayfaya erişim izni var diye talep detayına bakar, ancak bu talebin kullanıcının yetki alanında olup olmadığı kontrol edilmez.

### 6.3. Yetki Sızıntısı — ORTA
`getTalepler` filtrelemesi:
- Bolum_muduru: `requested_unit = department_id OR requested_by = profile.id`
- Destek BM: `requested_unit = "destek" OR requested_by = profile.id`
- Muhasebe: `requested_unit = "muhasebe" OR requested_by = profile.id`

Sorun: Bir kullanıcı hem talep eden hem de hedef birim yetkilisi ise her iki tarafı da görür. Bu bir kısıtlama değil, beklenen davranış.

---

## 7. Performans Bulguları

### 7.1. N+1 Sorgu — DÜŞÜK
`getTalepler`'de join ile profil bilgileri tek sorguda çekilir:
```ts
const selectFields = "*, requester:requested_by(id, full_name), assignee:assigned_to(id, full_name), target:target_person(id, full_name)";
```
Bu doğru bir yaklaşım. ✅

### 7.2. `select("*")` Kullanımı — DÜŞÜK
`getTalepById` ve `getTalepler` `select("*")` yapar. TalepRow 16 alan içerir, filtreleme gerekmez. Kabul edilebilir.

### 7.3. Pagination Eksikliği — ORTA
`getTalepler` tüm talepleri tek seferde çeker, sayfalama yoktur. Veri seti büyüdükçe sorun çıkarabilir.

### 7.4. Filter Fonksiyonları — DÜŞÜK
`getTalepCounts` tüm talepleri çeker ve array.filter ile sayar. 50+ talepte sorun yok, 500+ talepte yavaşlayabilir.

---

## 8. Kullanıcı Deneyimi Bulguları

### 8.1. Olumlu
- ✅ **Tab sistemi:** Gelen/Giden/Bekleyen/Acil/Onaylanan/Reddedilen/Tamamlanan sekmeleri
- ✅ **Durum akışı butonları:** Tek tıkla durum değiştirme
- ✅ **Cevap/Red/İç not alanları:** Detaylı iletişim
- ✅ **Acil öncelik:** Kırmızı nokta ile görsel uyarı
- ✅ **Toast/Redirect:** `useActionState` ile hata gösterimi, başarıda redirect
- ✅ **Audit log:** Oluşturma, güncelleme, durum değiştirme işlemleri loglanıyor
- ✅ **Düzenleme koruması:** Sadece "bekliyor" durumunda düzenlenebilir

### 8.2. Eksik / İyileştirme Alanları
- ❌ **Admin dashboard'unda talep kartı yok.** Admin/genel_mudur tüm talepleri görebildiği halde dashboard'da özet gösterilmez.
- ❌ **Yorum/yanıt geçmişi yok.** Durum değişiklikleri audit log'da kayıtlıdır ancak talep detay sayfasında görüntülenmez.
- ❌ **Atama sistemi zayıf.** `assigned_to` sadece durum güncelleme sırasında otomatik doldurulur (`!talep.assigned_to ? { assigned_to: profile.id } : {}`). Manuel atama yok.
- ❌ **Reddedildi'den geri dönüş yok.** Reddedilen talep tekrar açılamaz.
- ❌ **Dosya ekleme yok.** Talebe dosya/doküman eklenemez.
- ❌ **Bildirim yok.** Talep durumu değişince talep edene bildirim gitmez.
- ❌ **`requested_unit` seçimi free-text.** Departman listesi + "destek" + "muhasebe" sabitlerinden oluşur. Yeni birim eklenirse elle kod değişikliği gerekir.

---

## 9. Kritik Hatalar

### KRİTİK-1: `getTalepById` Yetki Kontrolsüz
`getTalepById` admin client kullanır ve hiçbir yetki kontrolü yapmaz. Talep detay sayfası sadece `canViewTalepler` ile role bakar, talebin kullanıcıya ait olup olmadığını kontrol etmez.

**Etki:** Bölüm müdürü, doğrudan URL girerek (`/talepler/[baska-bolum-talebi-id]`) başka bölümün talebini görebilir. Destek BM de aynı şekilde muhasebe taleplerini görebilir.

**Örnek:**
1. BM-A, `/talepler` sayfasına gider → sadece kendi bölümünün taleplerini görür
2. BM-A, URL'yi `/talepler/[farklı-bolum-talebi-id]` olarak değiştirir
3. `canViewTalepler(profile)` true döner (rol bazlı)
4. `getTalepById(id)` hiçbir rol/sahiplik kontrolü yapmaz
5. Talep detayı gösterilir

**Risk Seviyesi: YÜKSEK**

### KRİTİK-2: `canEditTalep` ve `canManageTalepStatus` Bypass
Aynı sorun: Bu fonksiyonlar `requireAuth` sonrası çağrılır, `profile` objesi güvenilirdir. Ancak action'larda `formData` doğrudan kullanılır. Eğer bir kullanıcı kendi talebi olmayan bir `id` gönderirse:

- `editTalepAction`: `getTalepById(id)` ile talebi çeker (yetki kontrolsüz), sonra `canEditTalep(profile, talep)` çağrılır
  - `canEditTalep` admin/GM için her zaman true → doğru
  - BM için: `talep.requested_by === profile.id && talep.status === "bekliyor"` → sadece kendi talebi

**Risk Seviyesi: DÜŞÜK** (action seviyesinde kontrol var)

---

## 10. Önerilen İyileştirmeler

### Acil
1. **`getTalepById`'ye yetki kontrolü eklenmeli** — `getTalepById(id, profile)` şeklinde veya çağıran yerde `canViewTalep(profile, talep)` kontrolü yapılmalı.

### Orta
2. **Admin dashboard'ına talep özet kartı** — Admin/genel_mudur için bekleyen/acil talep sayısı.
3. **Pagination** — `getTalepler` büyük veri setlerinde limit+offset ile sayfalanmalı.
4. **Reddedilen talebi yeniden açma** — `reddedildi → bekliyor` akışı eklenmeli (yetkili kullanıcı için).

### Düşük
5. **Yorum/yanıt geçmişi** — Talep detayında audit log'dan okunan durum değişiklikleri kronolojik olarak gösterilmeli.
6. **Dosya ekleme** — Talebe dosya/doküman ekleme imkanı.
7. **Bildirim** — Durum değişikliklerinde talep edene bildirim.
8. **`requested_unit` seçenekleri** — Kod yerine veritabanından dinamik olarak çekilmeli.

---

## 11. Doğrulama

```
npm run lint  → 0 error, 5 warning (pre-existing)
npm run build → ✓ Compiled successfully, 0 error
```

Kod değişikliği yapılmadı, modül mevcut haliyle clean build geçiyor.

---

## 12. Özet

| Başlık | Durum |
|---|---|
| Route sayısı | 4/4 — tümü çalışıyor, çift katmanlı koruma |
| Veritabanı şeması | Eksiksiz, 16 alan |
| Yaşam döngüsü | 7 durum, 4 aşamalı ileri akış, iptal/red noktaları |
| Dashboard entegrasyonu | BM ve DBM'de var, admin/GM'de yok |
| Audit log | Oluşturma, güncelleme, durum değiştirme loglanıyor |
| Toast/Bildirim | `useActionState` ile hata, redirect ile başarı |
| Güvenlik riski | **YÜKSEK** — `getTalepById` yetki kontrolsüz admin client kullanıyor |
| Performans riski | DÜŞÜK-ORTA — pagination yok, büyük veride yavaşlayabilir |
| Kritik hata sayısı | **1** (KRİTİK-1: `getTalepById` yetki kontrolsüz) |
