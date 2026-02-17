
-- Add status column for admin approval of schools
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Update existing schools to approved
UPDATE public.schools SET status = 'approved' WHERE status = 'pending';

-- Make wallet_address NOT NULL for new schools (can't alter existing nulls, use a default)
-- Instead, we'll enforce at application level since existing rows may have NULL
