-- Fix privilege escalation vulnerability: Always default to 'donor' role, ignore client-supplied role
-- This prevents attackers from setting themselves as 'admin' or 'school' during signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'donor'::app_role  -- Always default to donor, ignore client-supplied role
  );
  RETURN new;
END;
$$;