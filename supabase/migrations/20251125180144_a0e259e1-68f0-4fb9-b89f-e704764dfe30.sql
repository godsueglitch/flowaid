-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('donor', 'school', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role app_role NOT NULL DEFAULT 'donor',
  wallet_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create trigger to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'donor')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  students_count INTEGER DEFAULT 0,
  total_received DECIMAL(10,2) DEFAULT 0,
  wallet_address TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Products table (sanitary pads and other items)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'sanitary_pads',
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  transaction_hash TEXT,
  status TEXT DEFAULT 'pending',
  purpose TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for schools
CREATE POLICY "Anyone can view schools"
  ON public.schools FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Schools can update their own data"
  ON public.schools FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Schools can insert their own data"
  ON public.schools FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- RLS Policies for products
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Schools can manage their products"
  ON public.products FOR ALL
  TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE profile_id = auth.uid()));

-- RLS Policies for donations
CREATE POLICY "Donors can view their donations"
  ON public.donations FOR SELECT
  TO authenticated
  USING (donor_id = auth.uid());

CREATE POLICY "Schools can view donations to them"
  ON public.donations FOR SELECT
  TO authenticated
  USING (school_id IN (SELECT id FROM public.schools WHERE profile_id = auth.uid()));

CREATE POLICY "Donors can create donations"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (donor_id = auth.uid());

-- Insert sample sanitary pad products
INSERT INTO public.products (name, description, price, category, stock, is_featured) VALUES
  ('Always Maxi Pads', 'Comfortable and reliable protection for every day', 12.99, 'sanitary_pads', 500, true),
  ('Stayfree Ultra Thin', 'Ultra-thin design with maximum absorbency', 10.99, 'sanitary_pads', 450, true),
  ('Kotex Natural Balance', 'Made with natural materials for sensitive skin', 13.99, 'sanitary_pads', 400, true),
  ('Carefree Panty Liners', 'Everyday freshness and comfort', 7.99, 'sanitary_pads', 600, false);

-- Create update trigger for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();