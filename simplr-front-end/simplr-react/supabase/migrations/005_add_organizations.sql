-- Add organizations and user_organizations tables for enterprise functionality

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_organizations junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.user_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Add organization_id to tasks table to associate tasks with organizations
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_code ON public.organizations(code);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON public.user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Organization owners can manage memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can join organizations" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can leave organizations" ON public.user_organizations;

-- Create RLS policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update their organization" ON public.organizations
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Create RLS policies for user_organizations
CREATE POLICY "Users can view their organization memberships" ON public.user_organizations
  FOR SELECT USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization owners can manage memberships" ON public.user_organizations
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM public.organizations 
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can join organizations" ON public.user_organizations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave organizations" ON public.user_organizations
  FOR DELETE USING (user_id = auth.uid());

-- Update tasks RLS policy to include organization context
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

-- Recreate tasks policies with organization support
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      organization_id IS NULL OR 
      organization_id IN (
        SELECT organization_id FROM public.user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ))
  );

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (
    auth.uid() = user_id OR 
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ))
  );

-- Create function to automatically add organization owner to user_organizations
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_organizations (user_id, organization_id, role)
  VALUES (NEW.owner_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add owner to organization
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- Add updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique organization codes
CREATE OR REPLACE FUNCTION public.generate_organization_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character alphanumeric code
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

-- Add comments to document the schema
COMMENT ON TABLE public.organizations IS 'Organizations for enterprise functionality';
COMMENT ON TABLE public.user_organizations IS 'Junction table for user-organization relationships';
COMMENT ON COLUMN public.organizations.code IS 'Unique invite code for joining the organization';
COMMENT ON COLUMN public.user_organizations.role IS 'User role in the organization: owner, admin, or member';
COMMENT ON COLUMN public.tasks.organization_id IS 'Optional organization association for tasks';