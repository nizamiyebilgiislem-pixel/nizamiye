-- Add CHECK constraint for module_key values (guidance, library, infirmary)
-- First clean up any existing rows with invalid values
delete from module_assignments where module_key not in ('guidance', 'library', 'infirmary');

alter table module_assignments
  add constraint module_assignments_module_key_check
  check (module_key in ('guidance', 'library', 'infirmary'));
