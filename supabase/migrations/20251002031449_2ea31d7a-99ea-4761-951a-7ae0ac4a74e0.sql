-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies: users can only read/update their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add user_id column to patrimonies table
ALTER TABLE public.patrimonies 
  ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add validation constraints
ALTER TABLE public.patrimonies
  ADD CONSTRAINT number_length CHECK (char_length(number) <= 50),
  ADD CONSTRAINT model_length CHECK (char_length(model) <= 200),
  ADD CONSTRAINT registered_by_length CHECK (char_length(registered_by) <= 200),
  ADD CONSTRAINT observations_length CHECK (char_length(observations) <= 2000),
  ADD CONSTRAINT custom_location_length CHECK (char_length(custom_location) <= 200);

-- Make user_id NOT NULL for new records (existing records can be NULL temporarily)
-- We'll handle data migration separately if needed

-- Drop all existing public policies
DROP POLICY IF EXISTS "Permitir leitura pública de patrimônios" ON public.patrimonies;
DROP POLICY IF EXISTS "Permitir criação pública de patrimônios" ON public.patrimonies;
DROP POLICY IF EXISTS "Permitir atualização pública de patrimônios" ON public.patrimonies;
DROP POLICY IF EXISTS "Permitir exclusão pública de patrimônios" ON public.patrimonies;

-- Create new authenticated user policies
CREATE POLICY "Users can view their own patrimonies"
  ON public.patrimonies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patrimonies"
  ON public.patrimonies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patrimonies"
  ON public.patrimonies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patrimonies"
  ON public.patrimonies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);