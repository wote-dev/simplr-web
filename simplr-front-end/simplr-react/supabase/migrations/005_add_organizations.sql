-- Add organizations and organization membership tables for enterprise features

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- 6-8 character invite code
  description TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  max_users INTEGER DEFAULT 10,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(organization_id, user_id)
);

-- Create teams table (for future use)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table (for future use)
CREATE TABLE IF NOT EXISTS public.team_members (
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_code ON public.organizations(code);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON public.organization_members(role);
CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON public.teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can update their organization" ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for organization_members
CREATE POLICY "Users can view members of their organizations" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage members" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can join organizations" ON public.organization_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for teams
CREATE POLICY "Organization members can view teams" ON public.teams
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins and managers can manage teams" ON public.teams
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for team_members
CREATE POLICY "Team members can view team membership" ON public.team_members
  FOR SELECT USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      JOIN public.organization_members om ON t.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Team leads and org admins can manage team members" ON public.team_members
  FOR ALL USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      JOIN public.organization_members om ON t.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND (
        om.role IN ('admin', 'manager') OR
        EXISTS (
          SELECT 1 FROM public.team_members tm 
          WHERE tm.team_id = t.id AND tm.user_id = auth.uid() AND tm.role = 'lead'
        )
      )
    )
  );

-- Function to generate unique organization codes
CREATE OR REPLACE FUNCTION public.generate_org_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.organizations WHERE code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically set organization code and create admin membership
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization code if not provided
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := public.generate_org_code();
  END IF;
  
  -- Set created_by if not set
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin membership after organization creation
CREATE OR REPLACE FUNCTION public.create_org_admin_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Create admin membership for the organization creator
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_organization_created_set_code
  BEFORE INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

CREATE TRIGGER on_organization_created_add_admin
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_org_admin_membership();

-- Update triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.organizations IS 'Organizations for multi-tenant task management';
COMMENT ON COLUMN public.organizations.code IS 'Unique 6-character invite code for joining organization';
COMMENT ON COLUMN public.organizations.subscription_tier IS 'Subscription level: free, pro, enterprise';
COMMENT ON COLUMN public.organizations.max_users IS 'Maximum number of users allowed in organization';
COMMENT ON TABLE public.organization_members IS 'User memberships in organizations with roles';
COMMENT ON COLUMN public.organization_members.role IS 'User role: admin, manager, member';
COMMENT ON TABLE public.teams IS 'Teams within organizations for better task organization';
COMMENT ON TABLE public.team_members IS 'User memberships in teams';