-- Add capacity field to dormitories table
ALTER TABLE public.dormitories ADD COLUMN IF NOT EXISTS capacity integer NOT NULL DEFAULT 0;

-- Add capacity check constraint (must be >= 0)
ALTER TABLE public.dormitories ADD CONSTRAINT dormitories_capacity_check CHECK (capacity >= 0);

-- Add department_id field to dormitories (optional linking)
ALTER TABLE public.dormitories ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- Create index for department_id for performance
CREATE INDEX IF NOT EXISTS dormitories_department_id_idx ON public.dormitories(department_id);

-- Add comment for documentation
COMMENT ON COLUMN public.dormitories.capacity IS 'Maximum number of students this dormitory can accommodate';
COMMENT ON COLUMN public.dormitories.department_id IS 'Optional department association for reporting purposes';