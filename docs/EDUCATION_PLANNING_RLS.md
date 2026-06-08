# Education Planning RLS Notes

Bu repo migration'larında `class_courses` ve `weekly_schedule_slots` için RLS enable edilmez.

Canlı ortamda ders atama veya ders programı kaydı `42501` ile engellenirse şu migration uygulanmalıdır:

```txt
supabase/migrations/00006_education_planning_permissions.sql
```

Bu migration `authenticated` rolüne tablo yetkilerini verir ve canlı veritabanında RLS açıksa gereken read/insert/update policy'lerini idempotent olarak oluşturur.

Eğer canlı Supabase veritabanında bu tablolarda RLS açıksa, `authenticated` rolü için aşağıdaki politikalar gerekir:

```sql
-- class_courses
create policy "authenticated can read class_courses"
on public.class_courses
for select
to authenticated
using (true);

create policy "authenticated can insert class_courses"
on public.class_courses
for insert
to authenticated
with check (true);

create policy "authenticated can update class_courses"
on public.class_courses
for update
to authenticated
using (true)
with check (true);

-- weekly_schedule_slots
create policy "authenticated can read weekly_schedule_slots"
on public.weekly_schedule_slots
for select
to authenticated
using (true);

create policy "authenticated can insert weekly_schedule_slots"
on public.weekly_schedule_slots
for insert
to authenticated
with check (true);

create policy "authenticated can update weekly_schedule_slots"
on public.weekly_schedule_slots
for update
to authenticated
using (true)
with check (true);
```

Not:
- Eğer erişimi role veya bölüm bazında daraltmak isterseniz `using` / `with check` koşullarını uygulama yetkilerine göre sıkılaştırın.
- `teacher_id` alanı nullable olduğu için update sırasında boş seçim `null` olarak gönderilmelidir.
- Supabase error `42501` genelde policy / permission kaynaklıdır.
