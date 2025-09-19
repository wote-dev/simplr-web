-- Fix team creation issues for both authenticated and guest users
-- This migration addresses RLS policy conflicts and trigger issues

-- Drop the problematic trigger that tries to add all creators as team members
DROP TRIGGER IF EXISTS on_team_created ON public.teams;

-- Update the handle_new_team function to handle guest users properly
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add team creator as owner if they are an authenticated user (not guest)
  -- Guest users have created_by = null and don't exist in auth.users table
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, user_id, role, invited_by)
    VALUES (NEW.id, NEW.created_by, 'owner', NEW.created_by);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();

-- Update the team creation policy to be more explicit about guest vs authenticated users
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

CREATE POLICY "Allow team creation for all users" ON public.teams
  FOR INSERT WITH CHECK (
    -- Authenticated users: created_by must match their auth.uid()
    (auth.uid() IS NOT NULL AND created_by = auth.uid())
    OR
    -- Guest users: created_by must be null (since they don't exist in auth.users)
    (auth.uid() IS NULL AND created_by IS NULL)
  );

-- Add a policy to allow guest users to view teams they created
-- Since guest users can't be in team_members, we need a different approach
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;

CREATE POLICY "Users can view accessible teams" ON public.teams
  FOR SELECT USING (
    -- Authenticated users can see teams they're members of
    (auth.uid() IS NOT NULL AND id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    ))
    OR
    -- Guest users can see teams with null created_by (their own teams)
    -- This is a temporary solution - in production you'd want better guest user tracking
    (auth.uid() IS NULL AND created_by IS NULL)
  );

-- Update team member validation to handle guest-created teams
CREATE OR REPLACE FUNCTION public.validate_team_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
  team_created_by UUID;
BEGIN
  -- Get current member count, max limit, and team creator
  SELECT COUNT(*), t.max_members, t.created_by
  INTO current_count, max_allowed, team_created_by
  FROM public.team_members tm
  RIGHT JOIN public.teams t ON t.id = NEW.team_id
  WHERE tm.team_id = NEW.team_id OR tm.team_id IS NULL
  GROUP BY t.max_members, t.created_by;
  
  -- For guest-created teams (created_by IS NULL), start count from 0
  -- For authenticated user teams, include the owner in the count
  IF team_created_by IS NULL THEN
    current_count := COALESCE(current_count, 0);
  ELSE
    current_count := COALESCE(current_count, 0);
  END IF;
  
  -- Check if adding this member would exceed the limit
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Team has reached maximum member limit of %', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to generate consistent join codes (matching the frontend logic)
CREATE OR REPLACE FUNCTION public.generate_consistent_join_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character uppercase alphanumeric code (matching frontend logic)
    new_code := upper(substring(replace(encode(gen_random_bytes(4), 'base64'), '/', ''), 1, 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.teams WHERE join_code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update teams table to use the consistent join code generator as default
ALTER TABLE public.teams ALTER COLUMN join_code SET DEFAULT public.generate_consistent_join_code();

-- Add an index for better performance on guest team queries
CREATE INDEX IF NOT EXISTS idx_teams_created_by_null ON public.teams(id) WHERE created_by IS NULL;

-- Clean up any existing teams that might have inconsistent join codes
UPDATE public.teams 
SET join_code = public.generate_consistent_join_code() 
WHERE join_code IS NULL OR length(join_code) != 6;