# Supabase Auth Kurulumu

## 1. Supabase Auth'u aktif et

Supabase projesinde Authentication bölümünü açın. Email provider aktif olmalı. Geliştirme için email confirmation kapatılabilir.

Site URL:

```txt
http://localhost:3000
```

Redirect URL:

```txt
http://localhost:3000/auth/callback
```

## 2. Ortam değişkenleri

`.env.local` dosyası:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
```

Service role key frontend'e veya `NEXT_PUBLIC_` değişkenlerine konulmamalı.

## 3. Test admin kullanıcısı oluştur

Supabase Dashboard üzerinden Authentication > Users ekranında yeni kullanıcı oluşturun.

Örnek:

```txt
Email: admin@nizamiye.local
Password: güçlü-bir-şifre
```

Kullanıcının `id` değerini kopyalayın. Bu değer `auth.users.id` alanıdır.

## 4. profiles kaydını bağla

SQL Editor'da `auth_user_id` alanını auth kullanıcı id değeriyle eşleştirin:

```sql
insert into public.profiles (auth_user_id, full_name, email, role, is_active)
values (
  'AUTH_USER_ID_BURAYA',
  'Nizamiye Admin',
  'admin@nizamiye.local',
  'admin',
  true
);
```

Rol değerleri:

```txt
admin
genel_mudur
bolum_muduru
hoca
veli
```

`bolum_muduru` ve `hoca` rolleri için `department_id` zorunludur. Admin, Genel Müdür ve Veli için boş bırakılabilir.

## 5. Giriş testi

Uygulamayı başlatın:

```bash
npm.cmd run dev
```

Sonra giriş ekranını açın:

```txt
http://localhost:3000/login
```

Aktif profile bulunmazsa veya `is_active = false` ise kullanıcı panele alınmaz.
