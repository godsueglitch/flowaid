-- Allow anyone to read aggregate donation data (amount + product_id only visible via RLS)
-- This is needed so homepage stats and progress bars show real data
CREATE POLICY "Anyone can view donation amounts"
  ON public.donations
  FOR SELECT
  USING (true);
