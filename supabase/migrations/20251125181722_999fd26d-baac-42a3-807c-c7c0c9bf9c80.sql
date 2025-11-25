-- Update RLS policy to allow public viewing of products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

CREATE POLICY "Public can view products"
  ON public.products
  FOR SELECT
  USING (true);