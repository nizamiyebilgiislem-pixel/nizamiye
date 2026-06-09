-- Fix dormitories table permissions: GRANT + RLS policies

-- 1. Ensure base SELECT permission for authenticated users (defense in depth)
GRANT SELECT ON TABLE public.dormitories TO authenticated;
GRANT SELECT ON TABLE public.dormitory_assignments TO authenticated;

-- 2. Enable RLS on dormitories (idempotent — no-op if already enabled)
ALTER TABLE public.dormitories ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to allow re-running this migration
DROP POLICY IF EXISTS "dormitories_select_authenticated" ON public.dormitories;

-- 4. Allow all authenticated users to SELECT dormitories
--    Application-layer filtering handles role-based restrictions
CREATE POLICY "dormitories_select_authenticated" ON public.dormitories
  FOR SELECT
  TO authenticated
  USING (true);
