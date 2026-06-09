-- Remove dormitory module tables (will be rebuilt cleanly later)

DROP TABLE IF EXISTS public.dormitory_assignments CASCADE;
DROP TABLE IF EXISTS public.dormitory_beds CASCADE;
DROP TABLE IF EXISTS public.dormitory_rooms CASCADE;
DROP TABLE IF EXISTS public.dormitory_floors CASCADE;
DROP TABLE IF EXISTS public.dormitories CASCADE;
