-- Ders Notları Sistemi (Günlük Ders Günlüğü)
-- Basit başlangıç: Öğretmenler ders notu girer, yönetim raporları görür

-- 1. daily_lesson_logs tablosu
CREATE TABLE daily_lesson_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_course_id UUID NOT NULL REFERENCES class_courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_date DATE NOT NULL,
  course_book_id UUID REFERENCES course_books(id),
  started_page INTEGER,
  ended_page INTEGER,
  topics_covered TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_course_id, teacher_id, lesson_date)
);

-- 2. Updated_at trigger fonksiyonu (zaten var, ama ekleyelim)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_lesson_logs_updated_at
  BEFORE UPDATE ON daily_lesson_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Indexes
CREATE INDEX idx_daily_lesson_logs_class_course ON daily_lesson_logs(class_course_id);
CREATE INDEX idx_daily_lesson_logs_teacher ON daily_lesson_logs(teacher_id);
CREATE INDEX idx_daily_lesson_logs_date ON daily_lesson_logs(lesson_date);
CREATE INDEX idx_daily_lesson_logs_course_book ON daily_lesson_logs(course_book_id);

-- 4. Row Level Security
ALTER TABLE daily_lesson_logs ENABLE ROW LEVEL SECURITY;

-- Admin ve Genel Müdür tüm işlemleri yapabilir
CREATE POLICY "Admin ve GM daily_lesson_logs yonetebilir" ON daily_lesson_logs
  FOR ALL USING (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid()
        and is_active = true
        and role in ('admin', 'genel_mudur')
    )
  );

-- Bölüm müdürü kendi bölümündeki ders notlarını görebilir
CREATE POLICY "Bolum muduru daily_lesson_logs gorebilir" ON daily_lesson_logs
  FOR SELECT USING (
    exists (
      select 1 from public.profiles p
      join public.class_courses cc on cc.course_id = any(
        select id from public.courses where department_id = p.department_id
      )
      where p.auth_user_id = auth.uid()
        and p.is_active = true
        and p.role = 'bolum_muduru'
        and cc.id = daily_lesson_logs.class_course_id
    )
  );

-- Hoca kendi notlarını görebilir ve oluşturabilir
CREATE POLICY "Hoca kendi daily_lesson_logs yonetebilir" ON daily_lesson_logs
  FOR ALL USING (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid()
        and is_active = true
        and role = 'hoca'
        and id = daily_lesson_logs.teacher_id
    )
  );

-- Hoca kendi bölümündeki diğer hocanın notlarını görebilir (izin ile)
CREATE POLICY "Hoca kendi bolumundekilerin notlarini gorebilir" ON daily_lesson_logs
  FOR SELECT USING (
    exists (
      select 1 from public.profiles p
      join public.class_courses cc on cc.course_id = any(
        select id from public.courses where department_id = p.department_id
      )
      where p.auth_user_id = auth.uid()
        and p.is_active = true
        and p.role = 'hoca'
        and cc.id = daily_lesson_logs.class_course_id
        and cc.teacher_id = p.id
    )
  );