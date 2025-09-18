-- Fix RLS policy to allow guest users to create teams
-- The current policy blocks guest users because auth.uid() is null for them

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;

-- Create a new policy that allows both authenticated users and guest users to create teams
-- For authenticated users: created_by must match auth.uid()
-- For guest users: created_by can be null (since they don't exist in auth.users)
CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (
    -- Allow authenticated users to create teams (created_by must match their auth.uid())
    (auth.uid() IS NOT NULL AND created_by = auth.uid())
    OR
    -- Allow guest users to create teams (created_by must be null for guest users)
    (auth.uid() IS NULL AND created_by IS NULL)
  );