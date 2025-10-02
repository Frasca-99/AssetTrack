-- Phase 1: Fix NULL user_id values and add constraints
-- First, get the first available user_id to assign orphaned records
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Get the first user from profiles table
  SELECT id INTO first_user_id FROM profiles LIMIT 1;
  
  -- If we have a user, assign orphaned patrimonies to them
  IF first_user_id IS NOT NULL THEN
    UPDATE patrimonies 
    SET user_id = first_user_id 
    WHERE user_id IS NULL;
  END IF;
END $$;

-- Add NOT NULL constraint to user_id to prevent future integrity issues
ALTER TABLE patrimonies 
ALTER COLUMN user_id SET NOT NULL;

-- Add the missing problem column (used in the application code)
ALTER TABLE patrimonies 
ADD COLUMN IF NOT EXISTS problem TEXT;

-- Phase 2: Add length constraints to prevent data overflow attacks
ALTER TABLE patrimonies 
ALTER COLUMN number TYPE VARCHAR(50);

ALTER TABLE patrimonies 
ALTER COLUMN model TYPE VARCHAR(200);

ALTER TABLE patrimonies 
ALTER COLUMN registered_by TYPE VARCHAR(200);

ALTER TABLE patrimonies 
ALTER COLUMN observations TYPE VARCHAR(2000);

ALTER TABLE patrimonies 
ALTER COLUMN custom_location TYPE VARCHAR(200);

ALTER TABLE patrimonies 
ALTER COLUMN problem TYPE VARCHAR(100);

-- Phase 3: Add CHECK constraints for valid enum values
ALTER TABLE patrimonies 
ADD CONSTRAINT valid_status CHECK (status IN ('Finalizada', 'Em manutenção', 'Entregue', 'Perda total'));

ALTER TABLE patrimonies 
ADD CONSTRAINT valid_location CHECK (location IN ('Quartinho', 'Manutenção', 'Outro'));

ALTER TABLE patrimonies 
ADD CONSTRAINT valid_problem CHECK (problem IS NULL OR problem IN ('Lentidão', 'Máquina não liga', 'Outro problema'));

-- Phase 4: Add length constraints to profiles table
ALTER TABLE profiles 
ALTER COLUMN full_name TYPE VARCHAR(200);

ALTER TABLE profiles 
ALTER COLUMN organization TYPE VARCHAR(200);

-- Phase 5: Create trigger to ensure user_id is always set on INSERT
CREATE OR REPLACE FUNCTION ensure_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is NULL, set it to the authenticated user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Verify user_id matches authenticated user (prevent privilege escalation)
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot set user_id to a different user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER ensure_patrimony_user_id
  BEFORE INSERT OR UPDATE ON patrimonies
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_id();

-- Phase 6: Add audit logging columns for security monitoring
ALTER TABLE patrimonies 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id);

-- Create index for better query performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_patrimonies_user_id ON patrimonies(user_id);
CREATE INDEX IF NOT EXISTS idx_patrimonies_status ON patrimonies(status);
CREATE INDEX IF NOT EXISTS idx_patrimonies_deleted_at ON patrimonies(deleted_at) WHERE deleted_at IS NULL;