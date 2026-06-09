-- Simplify dormitory_assignments: add direct dormitory_id, make bed_id optional

-- Add dormitory_id column (nullable for backwards compatibility)
ALTER TABLE public.dormitory_assignments ADD COLUMN IF NOT EXISTS dormitory_id uuid REFERENCES public.dormitories(id) ON DELETE SET NULL;

-- Make bed_id nullable (new assignments won't reference beds)
ALTER TABLE public.dormitory_assignments ALTER COLUMN bed_id DROP NOT NULL;

-- Backfill existing assignments: set dormitory_id from bed -> room -> floor chain
UPDATE public.dormitory_assignments da
SET dormitory_id = f.dormitory_id
FROM public.dormitory_beds b
JOIN public.dormitory_rooms r ON r.id = b.room_id
JOIN public.dormitory_floors f ON f.id = r.floor_id
WHERE da.bed_id = b.id
  AND da.dormitory_id IS NULL;

-- Index for new dormitory_id lookups
CREATE INDEX IF NOT EXISTS idx_dormitory_assignments_dormitory_id ON public.dormitory_assignments(dormitory_id);

-- Remove the old unique index on student_id (status=active) since it still works with new model
-- The existing partial unique index covers the "one active per student" rule
