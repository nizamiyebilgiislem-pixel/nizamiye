-- Ders Kitapları Sistemi
-- Her dersin birden fazla kitabı olabilir
-- Sınıf bazlı ilerleme takibi

-- 1. course_books tablosu (dersin kitapları)
CREATE TABLE course_books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  book_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. course_book_progress tablosu (sınıfın kitap ilerlemesi)
CREATE TABLE course_book_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_book_id UUID NOT NULL REFERENCES course_books(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  started_at DATE,
  completed_at DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'ongoing', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_book_id, class_id)
);

-- 3. Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Updated_at triggerları
CREATE TRIGGER course_books_updated_at
  BEFORE UPDATE ON course_books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER course_book_progress_updated_at
  BEFORE UPDATE ON course_book_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. student_books tablosuna yeni kolonlar (ders-kitap bağlantısı)
ALTER TABLE student_books ADD COLUMN course_id UUID REFERENCES courses(id);
ALTER TABLE student_books ADD COLUMN course_book_id UUID REFERENCES course_books(id);

-- 6. Indexes
CREATE INDEX idx_course_books_course ON course_books(course_id);
CREATE INDEX idx_course_books_order ON course_books(course_id, book_order);
CREATE INDEX idx_course_book_progress_book ON course_book_progress(course_book_id);
CREATE INDEX idx_course_book_progress_class ON course_book_progress(class_id);
CREATE INDEX idx_course_book_progress_status ON course_book_progress(status);
CREATE INDEX idx_student_books_course ON student_books(course_id);
CREATE INDEX idx_student_books_course_book ON student_books(course_book_id);

-- 7. Row Level Security - course_books
ALTER TABLE course_books ENABLE ROW LEVEL SECURITY;

-- Admin ve Genel Müdür tüm işlemleri yapabilir
CREATE POLICY "Admin ve GM course_books yonetebilir" ON course_books
  FOR ALL USING (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid()
        and is_active = true
        and role in ('admin', 'genel_mudur')
    )
  );

-- Bölüm müdürü kendi bölümündeki derslerin kitaplarını yönetebilir
CREATE POLICY "Bolum muduru course_books yonetebilir" ON course_books
  FOR ALL USING (
    exists (
      select 1 from public.profiles p
      join public.courses c on c.department_id = p.department_id
      where p.auth_user_id = auth.uid()
        and p.is_active = true
        and p.role = 'bolum_muduru'
        and c.id = course_books.course_id
    )
  );

-- Hoca kendi bölümündeki derslerin kitaplarını görebilir
CREATE POLICY "Hoca course_books görebilir" ON course_books
  FOR SELECT USING (
    exists (
      select 1 from public.profiles p
      join public.courses c on c.department_id = p.department_id
      where p.auth_user_id = auth.uid()
        and p.is_active = true
        and p.role = 'hoca'
        and c.id = course_books.course_id
    )
  );

-- 8. Row Level Security - course_book_progress
ALTER TABLE course_book_progress ENABLE ROW LEVEL SECURITY;

-- Admin ve Genel Müdür tüm işlemleri yapabilir
CREATE POLICY "Admin ve GM course_book_progress yonetebilir" ON course_book_progress
  FOR ALL USING (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid()
        and is_active = true
        and role in ('admin', 'genel_mudur')
    )
  );

-- Bölüm müdürü kendi bölümündeki sınıfların progressini görebilir ve güncelleyebilir
CREATE POLICY "Bolum muduru course_book_progress yonetebilir" ON course_book_progress
  FOR ALL USING (
    exists (
      select 1 from public.profiles p
      join public.classes c on c.department_id = p.department_id
      where p.auth_user_id = auth.uid()
        and p.is_active = true
        and p.role = 'bolum_muduru'
        and c.id = course_book_progress.class_id
    )
  );

-- Hoca kendi sınıfının progressini görebilir ve güncelleyebilir
CREATE POLICY "Hoca course_book_progress yonetebilir" ON course_book_progress
  FOR ALL USING (
    exists (
      select 1 from public.profiles p
      join public.classes c on c.id = course_book_progress.class_id
      where p.auth_user_id = auth.uid()
        and p.is_active = true
        and p.role = 'hoca'
        and c.class_teacher_id = p.id
    )
  );

-- 9. student_books RLS güncellemesi (yeni kolonlar için)
-- Mevcut policies zaten course_id üzerinden çalışabilir
ALTER TABLE student_books ENABLE ROW LEVEL SECURITY;

-- Not: student_books için mevcut RLS policies zaten insert/update yapabiliyor
-- Yeni kolonlar optional olduğu için mevcut policies yeterli