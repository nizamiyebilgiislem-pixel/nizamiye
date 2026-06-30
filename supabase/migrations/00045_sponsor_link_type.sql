-- Sponsor Sistemi Entegrasyonu
-- parent_student_links tablosuna link_type sütunu ekleme
-- Bu sütun veli ve sponsor ilişkilerini ayırt etmek için kullanılır

-- 1. link_type sütunu ekle
ALTER TABLE parent_student_links ADD COLUMN IF NOT EXISTS link_type TEXT DEFAULT 'veli' CHECK (link_type IN ('veli', 'sponsor', 'both'));

-- 2. Mevcut kayıtları veli olarak işaretle
UPDATE parent_student_links SET link_type = 'veli' WHERE link_type IS NULL;

-- 3. RLS Policy güncelle - sponsor rolü de görebilsin
-- Not: Mevcut policy'ler auth.uid() ile çalışıyor, role kontrolü için ek sorgu gerekebilir

-- 4. Updated_at trigger fonksiyonu (zaten varsa atla)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. updated_at trigger (parent_student_links için)
DROP TRIGGER IF EXISTS parent_student_links_updated_at ON parent_student_links;
CREATE TRIGGER parent_student_links_updated_at
  BEFORE UPDATE ON parent_student_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();