# Commit Plan

Bu belge, mevcut buyuk degisiklik setini mantikli ve gozden gecirilebilir commit bloklarina ayirmak icin rehberdir.

## 1. Proje Temeli

Kapsam:

- `package.json`
- `package-lock.json`
- `components.json`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- temel config dosyalari

Amac:

- Next.js tabani, bagimliliklar ve temel uygulama kabugu

Onerilen mesaj:

```txt
chore: establish project foundation and dependencies
```

## 2. Auth ve RBAC

Kapsam:

- `src/app/(auth)/*`
- `src/app/auth/*`
- `src/lib/auth.ts`
- `src/lib/route-permissions.ts`
- `src/lib/navigation.ts`
- `middleware.ts`
- Supabase auth ile ilgili temel yardimci dosyalar

Amac:

- Giris, cikis, callback, aktif profil kontrolu ve rol bazli route korumasi

Onerilen mesaj:

```txt
feat: add auth flow and role-based access control
```

## 3. Layout ve UI

Kapsam:

- `src/components/ui/*`
- `src/components/layout/*`
- ortak form yardimcilari

Amac:

- Panel kabugu, sidebar, baslik alanlari ve ortak UI primitive'leri

Onerilen mesaj:

```txt
feat: add shared layout and UI primitives
```

## 4. Akademik Domain

Kapsam:

- `src/lib/students/*`
- `src/lib/profiles/*`
- `src/lib/departments/*`
- `src/lib/classes/*`
- `src/lib/courses/*`
- ilgili sayfa ve component dosyalari

Amac:

- Talebe, hoca/profil, bolum, sinif ve ders cekirdegi

Onerilen mesaj:

```txt
feat: add core academic management domains
```

## 5. Dashboard

Kapsam:

- `src/lib/dashboard/*`
- `src/components/dashboard/*`
- `src/app/(panel)/dashboard/page.tsx`

Amac:

- Gercek veriyle calisan yonetim dashboard'u

Onerilen mesaj:

```txt
feat: add dashboard analytics and overview panels
```

## 6. Not / Kanaat

Kapsam:

- `src/lib/grades/*`
- `src/lib/evaluations/*`
- `src/lib/terms/*`
- `src/components/grades/*`
- `src/components/evaluations/*`
- ilgili `not-sistemi` ve `kanaat-sistemi` route'lari

Amac:

- Donem, not ve kanaat akislarini tek paket olarak izlenebilir hale getirmek

Onerilen mesaj:

```txt
feat: add grading, terms, and evaluation workflows
```

## 7. Egitim Planlama

Kapsam:

- `src/lib/education/*`
- `src/components/education/*`
- `src/app/(panel)/egitim-planlama/*`

Amac:

- Ders atama ve haftalik program yonetimi

Onerilen mesaj:

```txt
feat: add education planning module
```

## 8. Revir / Evrak

Kapsam:

- `src/lib/infirmary/*`
- `src/lib/documents/*`
- `src/components/infirmary/*`
- `src/components/documents/*`
- ilgili panel route'lari

Amac:

- Ogrenci operasyon kayitlari icin revir ve evrak akislari

Onerilen mesaj:

```txt
feat: add infirmary and document management modules
```

## 9. Veli Paneli

Kapsam:

- `src/app/(panel)/veli/page.tsx`
- `src/lib/student-profile/*`
- `src/components/students/student-profile-overview.tsx`
- ilgili read-only gorunum destekleri

Amac:

- Ogrenci profil ozeti ve veli erisim gorunumu

Onerilen mesaj:

```txt
feat: add student profile overview and parent portal
```

## 10. Migration ve Docs

Kapsam:

- `supabase/migrations/*`
- `docs/*`
- `.env.example`
- operasyonel notlar

Amac:

- Veritabani evrimi, storage/auth kurulumu ve release belgeleri

Onerilen mesaj:

```txt
docs: add migrations, setup guides, and release documentation
```

## Uygulama Notlari

- Mumkunse her commit `lint` ve `build` gecer halde tutulmali.
- Commit'leri dosya tasima yerine davranissal sinirlara gore ayirmak daha okunabilir olur.
- Ilk asamada tek tek cherry-pick kolayligi saglayan bloklar hedeflenmeli.
