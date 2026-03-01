-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own patrimonies" ON public.patrimonies;

-- Create new policy allowing all authenticated users to view all patrimonies
CREATE POLICY "Authenticated users can view all patrimonies"
ON public.patrimonies
FOR SELECT
TO authenticated
USING (true);

-- Keep INSERT, UPDATE, and DELETE policies restricted to own patrimonies
-- (these already exist and will remain unchanged)