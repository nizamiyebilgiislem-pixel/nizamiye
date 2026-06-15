-- Telefon Numarası Formatını E.164'e Dönüştürme
-- Tüm telefon numaraları +90 formatında saklanacak

-- 1. Telefon numaralarını normalize eden fonksiyon
CREATE OR REPLACE FUNCTION normalize_phone_e164(phone TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF phone IS NULL OR phone = '' THEN
    RETURN NULL;
  END IF;

  cleaned := regexp_replace(phone, '[\s\-()]+', '', 'g');

  -- Zaten +90 ile başlıyorsa aynen döndür
  IF cleaned LIKE '+90%' THEN
    RETURN cleaned;
  END IF;

  -- 90 ile başlıyor ama + yok (11 hane)
  IF cleaned LIKE '90%' AND LENGTH(cleaned) = 11 THEN
    RETURN '+' || cleaned;
  END IF;

  -- 0 ile başlıyor (10 hane) - 05457305646 -> +905457305646
  IF cleaned LIKE '0%' AND LENGTH(cleaned) = 10 THEN
    RETURN '+90' || SUBSTRING(cleaned FROM 2);
  END IF;

  -- 5 ile başlıyor (10 hane) - 5457305646 -> +905457305646
  IF cleaned LIKE '5%' AND LENGTH(cleaned) = 10 THEN
    RETURN '+90' || cleaned;
  END IF;

  -- Geçerli değilse null döndür
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Profiles tablosundaki telefon numaralarını güncelle
UPDATE profiles
SET phone = normalize_phone_e164(phone)
WHERE phone IS NOT NULL AND phone != '';

-- 3. Students tablosundaki telefon numaralarını güncelle
UPDATE students
SET guardian_phone = normalize_phone_e164(guardian_phone)
WHERE guardian_phone IS NOT NULL AND guardian_phone != '';

UPDATE students
SET guardian_phone_2 = normalize_phone_e164(guardian_phone_2)
WHERE guardian_phone_2 IS NOT NULL AND guardian_phone_2 != '';

-- 4. Fonksiyonu drop et (trigger'da kullanılmadığı için)
DROP FUNCTION IF EXISTS normalize_phone_e164(TEXT);