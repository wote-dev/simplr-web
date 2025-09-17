-- Teams Schema Migration
-- This migration adds enterprise-level team functionality with joining codes

-- Create team role enum
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');

-- Create team status enum  
CREATE TYPE team_status AS ENUM ('active', 'suspended', 'archived');

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  description TEXT CHECK (length(description) <= 500),
  avatar_url TEXT,
  join_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'base64'),
  status team_status NOT NULL DEFAULT 'active',
  max_members INTEGER NOT NULL DEFAULT 50 CHECK (max_members > 0 AND max_members <= 1000),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(team_id, user_id)
);

-- Create team_invites table for tracking pending invitations
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT,
  join_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update tasks table to support team tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_team_task BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_join_code ON public.teams(join_code);
CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON public.teams(created_by);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);

CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON public.team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_join_code ON public.team_invites(join_code);
CREATE INDEX IF NOT EXISTS idx_team_invites_expires_at ON public.team_invites(expires_at);

CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON public.tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_team_task ON public.tasks(is_team_task);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing task policies to update them
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

-- Teams RLS Policies
CREATE POLICY "Users can view teams they belong to" ON public.teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners and admins can update team" ON public.teams
  FOR UPDATE USING (
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Authenticated users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Team owners can delete teams" ON public.teams
  FOR DELETE USING (
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Team Members RLS Policies
CREATE POLICY "Users can view team members of their teams" ON public.team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners and admins can manage members" ON public.team_members
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can join teams via invite" ON public.team_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Team Invites RLS Policies
CREATE POLICY "Team members can view team invites" ON public.team_invites
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners and admins can manage invites" ON public.team_invites
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Updated Tasks RLS Policies (support both personal and team tasks)
CREATE POLICY "Users can view their own tasks and team tasks" ON public.tasks
  FOR SELECT USING (
    (user_id = auth.uid() AND (team_id IS NULL OR NOT is_team_task))
    OR 
    (is_team_task AND team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert personal tasks and team members can insert team tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id AND (team_id IS NULL OR NOT is_team_task))
    OR
    (is_team_task AND team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their own tasks and team tasks" ON public.tasks
  FOR UPDATE USING (
    (user_id = auth.uid() AND (team_id IS NULL OR NOT is_team_task))
    OR 
    (is_team_task AND team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete their own tasks and team admins can delete team tasks" ON public.tasks
  FOR DELETE USING (
    (user_id = auth.uid() AND (team_id IS NULL OR NOT is_team_task))
    OR 
    (is_team_task AND team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ))
  );

-- Functions for team management

-- Function to generate unique join codes
CREATE OR REPLACE FUNCTION public.generate_team_join_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code
    new_code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    -- Remove potentially confusing characters
    new_code := replace(replace(replace(replace(new_code, '0', 'X'), 'O', 'Y'), 'I', 'Z'), 'L', 'W');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.teams WHERE join_code = new_code) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically add team creator as owner
CREATE OR REPLACE FUNCTION public.handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the team creator as owner
  INSERT INTO public.team_members (team_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.created_by, 'owner', NEW.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired invites
CREATE OR REPLACE FUNCTION public.cleanup_expired_invites()
RETURNS void AS $$
BEGIN
  DELETE FROM public.team_invites 
  WHERE expires_at < NOW() AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate team member limits
CREATE OR REPLACE FUNCTION public.validate_team_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current member count and max limit
  SELECT COUNT(*), t.max_members 
  INTO current_count, max_allowed
  FROM public.team_members tm
  JOIN public.teams t ON t.id = tm.team_id
  WHERE tm.team_id = NEW.team_id
  GROUP BY t.max_members;
  
  -- Check if adding this member would exceed the limit
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Team has reached maximum member limit of %', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE OR REPLACE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_team();

CREATE OR REPLACE TRIGGER validate_member_limit
  BEFORE INSERT ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.validate_team_member_limit();

-- Update existing triggers for updated_at
CREATE OR REPLACE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Set default join codes for teams table
UPDATE public.teams SET join_code = public.generate_team_join_code() WHERE join_code IS NULL;