-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'secretaire', 'entraineur')) DEFAULT 'entraineur',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Trigger to automatically create a profile when a new user signs up
-- Par sécurité, tout nouveau compte reçoit le rôle minimal 'entraineur' (jamais 'admin' par défaut).
-- Seul le premier utilisateur de la table reçoit automatiquement le rôle 'admin'.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  has_any_admin BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') INTO has_any_admin;

  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN has_any_admin THEN 'entraineur' ELSE 'admin' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
