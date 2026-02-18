
-- Add license/verification number to schools
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS license_number text;

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_schools_license_number ON public.schools(license_number);
