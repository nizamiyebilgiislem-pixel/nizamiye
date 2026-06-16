-- Öğrenci Görevleri Sistemi
-- Bölüm müdürü ve hocaların öğrencileri görevlendirmesi

-- 1. student_tasks tablosu
CREATE TABLE student_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'duty' CHECK (task_type IN ('duty', 'rotation', 'cleaning', 'food', 'other')),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
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
CREATE TRIGGER student_tasks_updated_at
  BEFORE UPDATE ON student_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Indexes
CREATE INDEX idx_student_tasks_student ON student_tasks(student_id);
CREATE INDEX idx_student_tasks_assigned_by ON student_tasks(assigned_by);
CREATE INDEX idx_student_tasks_status ON student_tasks(status);
CREATE INDEX idx_student_tasks_due_date ON student_tasks(due_date);
CREATE INDEX idx_student_tasks_active ON student_tasks(status) WHERE status = 'pending';

-- 5. Row Level Security
ALTER TABLE student_tasks ENABLE ROW LEVEL SECURITY;

-- Admin ve Genel Müdür tüm işlemleri yapabilir
CREATE POLICY "Admin ve GM gorebilir ve duzenleyebilir" ON student_tasks
  FOR ALL USING (
    exists (
      select 1 from public.profiles
      where auth_user_id = auth.uid()
        and is_active = true
        and role in ('admin', 'genel_mudur')
    )
  );

-- Bölüm müdürü kendi bölümündeki öğrencilerin görevlerini görebilir ve oluşturabilir
CREATE POLICY "Bolum muduru gorebilir ve olusturabilir" ON student_tasks
  FOR ALL USING (
    exists (
      select 1 from public.profiles p
      join public.students s on s.course_class_id is not null
      join public.classes c on c.id = s.course_class_id
      where p.auth_user_id = auth.uid()
        and p.is_active = true
        and p.role = 'bolum_muduru'
        and p.department_id = c.department_id
        and s.id = student_tasks.student_id
    )
  );

-- Hoca kendi sınıfındaki öğrencilerin görevlerini görebilir ve oluşturabilir
CREATE POLICY "Hoca gorebilir ve olusturabilir" ON student_tasks
  FOR ALL USING (
    exists (
      select 1 from public.profiles p
      join public.students s on s.course_class_id is not null
      join public.classes c on c.id = s.course_class_id
      where p.auth_user_id = auth.uid()
        and p.is_active = true
        and p.role = 'hoca'
        and c.class_teacher_id = p.id
        and s.id = student_tasks.student_id
    )
  );