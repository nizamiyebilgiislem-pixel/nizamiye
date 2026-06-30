-- Hafızlık Takip Sistemi
-- Cüz ve sayfa bazlı hafızlık ilerlemesi takibi

-- 1. Hafızlık ilerleme tablosu
CREATE TABLE hafizlik_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  current_juz INTEGER NOT NULL DEFAULT 1 CHECK (current_juz BETWEEN 1 AND 30),
  current_page INTEGER NOT NULL DEFAULT 1 CHECK (current_page BETWEEN 1 AND 604),
  status TEXT NOT NULL DEFAULT 'learning' CHECK (status IN ('learning', 'reviewing', 'completed')),
  target_completion_date DATE,
  teacher_note TEXT,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Updated_at trigger
CREATE TRIGGER hafizlik_progress_updated_at
  BEFORE UPDATE ON hafizlik_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security
ALTER TABLE hafizlik_progress ENABLE ROW LEVEL SECURITY;

-- Admin ve Genel Müdür tüm işlemleri yapabilir
CREATE POLICY "Admin ve GM görebilir ve düzenleyebilir" ON hafizlik_progress
  FOR ALL USING (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid()
        and is_active = true
        and role in ('admin', 'genel_mudur')
    )
  );

-- Bölüm müdürü kendi bölümündeki öğrencilerin kayıtlarını görebilir ve düzenleyebilir
CREATE POLICY "Bolum muduru gorebilir ve duzenleyebilir" ON hafizlik_progress
  FOR ALL USING (
    exists (
      select 1 from public.profiles p
      join public.students s on s.course_class_id is not null
      join public.classes c on c.id = s.course_class_id
      where p.auth_user_id = auth.uid()
        and p.is_active = true
        and p.role = 'bolum_muduru'
        and p.department_id = c.department_id
        and s.id = hafizlik_progress.student_id
    )
  );

-- Hoca sınıfına bağlı öğrencilerin kayıtlarını görebilir ve düzenleyebilir
CREATE POLICY "Hoca gorebilir ve duzenleyebilir" ON hafizlik_progress
  FOR ALL USING (
    exists (
      select 1 from public.profiles p
      join public.students s on s.course_class_id is not null
      join public.classes c on c.id = s.course_class_id
      where p.auth_user_id = auth.uid()
        and p.is_active = true
        and p.role = 'hoca'
        and c.class_teacher_id = p.id
        and s.id = hafizlik_progress.student_id
    )
  );