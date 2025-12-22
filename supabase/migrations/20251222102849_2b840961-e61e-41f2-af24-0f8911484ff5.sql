-- Fix PUBLIC_DATA_EXPOSURE: Restrict profile visibility to own profile only
-- Current policy allows any authenticated user to read all user emails, names, and wallet addresses
-- This prevents mass user data harvesting and privacy violations

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);