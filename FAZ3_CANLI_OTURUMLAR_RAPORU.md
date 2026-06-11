# FAZ 3 — Canlı Oturumlar Modülü Uygulama Raporu

## Kapsam
Kurum içi Jitsi tabanlı canlı oturumlar (öğretmen toplantıları, konuk seminerleri, bölüm toplantıları, veli görüşmeleri, özel etkinlikler) için tam bir CRUD + katılım modülü. V1 kapsamı yalnızca personel katılımcılar (öğrenci yok).

## Oluşturulan Tablolar

### `live_sessions`
| Sütun | Tip | Açıklama |
|---|---|---|
| `id` | `uuid PK` | |
| `title` | `text NOT NULL` | Oturum başlığı |
| `description` | `text` | Açıklama |
| `session_type` | `text CHECK` | `ogretmen_toplantisi, konuk_semineri, bolum_toplantisi, veli_gorusmesi, ozel_etkinlik` |
| `room_name` | `text UNIQUE NOT NULL` | Jitsi oda adı (`nizamiye-XXXX`) |
| `start_time` | `timestamptz NOT NULL` | Başlangıç |
| `end_time` | `timestamptz` | Bitiş |
| `max_participants` | `int DEFAULT 20` | Maksimum katılımcı |
| `status` | `text DEFAULT 'planned'` | `planned, active, completed, cancelled` |
| `created_by` | `uuid → profiles(id)` | |
| `department_id` | `uuid → departments(id)` | |
| `notes` | `text` | İç notlar |
| `created_at / updated_at` | `timestamptz` | |

### `live_session_participants`
| Sütun | Tip | Açıklama |
|---|---|---|
| `id` | `uuid PK` | |
| `session_id` | `uuid → live_sessions(id) CASCADE` | |
| `profile_id` | `uuid → profiles(id)` | |
| `status` | `text DEFAULT 'invited'` | `invited, confirmed, declined, attended` |
| `joined_at / left_at` | `timestamptz` | |
| `UNIQUE(session_id, profile_id)` | | |

## Oluşturulan Dosyalar

### Migration
```
supabase/migrations/00031_live_sessions_module.sql
```

### Lib (sunucu mantığı)
```
src/lib/live-sessions/permissions.ts   — Yetki kontrolleri
src/lib/live-sessions/queries.ts       — Sorgular (getSessions, getById, getUpcoming, getCounts, dashboard data)
src/lib/live-sessions/actions.ts       — Server actions (create, update, cancel, delete, join, leave)
```

### Sayfalar
```
src/app/(panel)/canli-oturumlar/page.tsx              — Liste (tab'ler: Hepsi/Yaklaşan/Aktif/Benimkiler/Tamamlanan/İptal)
src/app/(panel)/canli-oturumlar/yeni/page.tsx          — Yeni oturum formu
src/app/(panel)/canli-oturumlar/[id]/page.tsx          — Detay (katıl, iptal, sil, katılımcı listesi, Jitsi linki)
src/app/(panel)/canli-oturumlar/[id]/duzenle/page.tsx  — Düzenleme formu
src/app/(panel)/canli-oturumlar/loading.tsx            — Loading spinner
src/app/(panel)/canli-oturumlar/error.tsx              — Error boundary
```

### Bileşenler
```
src/components/live-sessions/session-form.tsx                — Client-side form (create/edit)
src/components/live-sessions/live-session-dashboard-card.tsx  — Dashboard kartı
```

## Değiştirilen Dosyalar

| Dosya | Değişiklik |
|---|---|
| `src/types/database.ts` | `LiveSessionRow`, `LiveSessionParticipantRow` tipleri ve Database tablo kaydı eklendi |
| `src/lib/route-permissions.ts` | `/canli-oturumlar/*` rotaları `staffAndSupportRoles` ile eklendi |
| `src/lib/navigation.ts` | Menüye "Canlı Oturumlar" girdisi eklendi (`video` ikonu, `taskRoles`) |
| `src/components/layout/sidebar.tsx` | `Video` ikonu import ve iconMap'e eklendi |
| `src/components/dashboard/admin-dashboard.tsx` | LiveSessionDashboardCard + Promise.all'e eklendi |
| `src/components/dashboard/department-manager-dashboard.tsx` | LiveSessionDashboardCard + Promise.all'e eklendi |
| `src/components/dashboard/class-teacher-dashboard.tsx` | LiveSessionDashboardCard + Promise.all'e eklendi |

## Tasarım Kararları

- **Oda adı**: `nizamiye-XXXX` (4 haneli rastgele sayı) — server-side `createSessionAction` içinde üretilir.
- **Jitsi URL**: `https://meet.jit.si/{room_name}` — sadece detail sayfasında gösterilir.
- **Yetkilendirme**: Admin/Genel Müdür tüm oturumları görebilir; Bölüm Müdürü kendi bölümündekileri; diğer roller kendi oluşturdukları veya katılımcısı oldukları oturumları.
- **Katılım**: Join/Leave işlemleri server action ile, duplicate engelleme unique constraint ile.
- **Audit**: Tüm CRUD işlemleri audit log'a yazılır.
- **Form validasyonu**: Zod schema + `useActionState`.
- **Tema**: Mevcut `#093657` paletine uygun.

## Doğrulama
- `npm run lint` — 0 error, 5 warning (tamamı önceden var olan)
- `npm run build` — başarılı (Turbopack + TypeScript + static generation)

## Migration'ı Uygulama
```bash
npx supabase migration up
```

## Notlar
- Veli (`veli`) rolü route-permissions'ta kasıtlı olarak dışarıda bırakıldı.
- Öğrenci katılımı v2'ye bırakıldı; gerektiğinde `participant_type` kolonu ve `student_id` FK eklenebilir.
- Bildirim (mail/SMS/push) v2 planında.
