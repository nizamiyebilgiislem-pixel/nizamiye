-- Fix dormitory_assignments: add dormitory_id, grant SELECT permission

-- 1. Add dormitory_id column for direct dormitory assignment
ALTER TABLE public.dormitory_assignments ADD COLUMN IF NOT EXISTS dormitory_id uuid REFERENCES public.dormitories(id) ON DELETE CASCADE;

-- 2. Make bed_id optional (no longer used in app)
ALTER TABLE public.dormitory_assignments ALTER COLUMN bed_id DROP NOT NULL;

-- 3. Backfill existing assignments via bed → room → floor chain
UPDATE public.dormitory_assignments da
SET dormitory_id = f.dormitory_id
FROM public.dormitory_beds b
JOIN public.dormitory_rooms r ON r.id = b.room_id
JOIN public.dormitory_floors f ON f.id = r.floor_id
WHERE da.bed_id = b.id
  AND da.dormitory_id IS NULL;

-- 4. Index for dormitory_id lookups
CREATE INDEX IF NOT EXISTS idx_dormitory_assignments_dormitory_id ON public.dormitory_assignments(dormitory_id);

-- 5. Grant SELECT to authenticated (missing from 00013 — root cause of empty data)
GRANT SELECT ON TABLE public.dormitory_assignments TO authenticated;
