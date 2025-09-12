-- Organizations and Access Codes Schema
-- This migration adds enterprise-level organization support

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  access_code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_members table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create organization_invites table for pending invitations
CREATE TABLE IF NOT EXISTS public.organization_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- Add organization_id to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id to user_profiles for default organization
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS default_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_access_code ON public.organizations(access_code);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_org_id ON public.organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invites_email ON public.organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Organization admins can manage memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can join organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Users can leave organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Organization admins can view invites" ON public.organization_invites;
DROP POLICY IF EXISTS "Organization admins can create invites" ON public.organization_invites;
DROP POLICY IF EXISTS "Organization admins can delete invites" ON public.organization_invites;

-- RLS policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organization owners can update their organizations" ON public.organizations
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Organization owners can delete their organizations" ON public.organizations
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS policies for organization_members
CREATE POLICY "Users can view their organization memberships" ON public.organization_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can manage memberships" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can join organizations" ON public.organization_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave organizations" ON public.organization_members
  FOR DELETE USING (
    auth.uid() = user_id OR 
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS policies for organization_invites
CREATE POLICY "Organization admins can view invites" ON public.organization_invites
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can create invites" ON public.organization_invites
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can delete invites" ON public.organization_invites
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Update tasks RLS policies to include organization context
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      organization_id IS NULL OR 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (
    auth.uid() = user_id AND (
      organization_id IS NULL OR 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (
    auth.uid() = user_id AND (
      organization_id IS NULL OR 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to generate unique access codes
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.organizations WHERE access_code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create organization membership for owner
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Create membership record for the organization owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new organizations
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- Add updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean up expired invites
CREATE OR REPLACE FUNCTION public.cleanup_expired_invites()
RETURNS void AS $$
BEGIN
  DELETE FROM public.organization_invites WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for organization statistics
CREATE OR REPLACE VIEW public.organization_stats AS
SELECT 
  o.id,
  o.name,
  o.access_code,
  COUNT(DISTINCT om.user_id) as member_count,
  COUNT(DISTINCT t.id) as task_count,
  COUNT(DISTINCT CASE WHEN t.completed = true THEN t.id END) as completed_task_count,
  o.created_at,
  o.updated_at
FROM public.organizations o
LEFT JOIN public.organization_members om ON o.id = om.organization_id
LEFT JOIN public.tasks t ON o.id = t.organization_id
GROUP BY o.id, o.name, o.access_code, o.created_at, o.updated_at;