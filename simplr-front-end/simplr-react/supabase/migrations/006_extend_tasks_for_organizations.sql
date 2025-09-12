-- Extend tasks table for organization and collaboration features

-- Add organization-related columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'organization')),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON public.tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_visibility ON public.tasks(visibility);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- Update existing RLS policies to support organization context
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

-- Create new comprehensive RLS policies
-- Users can view tasks if:
-- 1. They own the task (user_id = auth.uid())
-- 2. Task is assigned to them
-- 3. Task belongs to their organization and has appropriate visibility
CREATE POLICY "Users can view accessible tasks" ON public.tasks
  FOR SELECT USING (
    -- Own tasks
    user_id = auth.uid() OR
    -- Tasks assigned to them
    assigned_to = auth.uid() OR
    -- Organization tasks with appropriate visibility
    (
      organization_id IS NOT NULL AND
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      ) AND
      (
        visibility = 'organization' OR
        (
          visibility = 'team' AND
          team_id IS NOT NULL AND
          team_id IN (
            SELECT team_id FROM public.team_members 
            WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

-- Users can insert tasks if:
-- 1. They are creating personal tasks (no organization_id)
-- 2. They are members of the organization they're creating tasks for
CREATE POLICY "Users can insert tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    -- Personal tasks
    (
      organization_id IS NULL AND
      user_id = auth.uid()
    ) OR
    -- Organization tasks (must be member)
    (
      organization_id IS NOT NULL AND
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      ) AND
      (
        user_id = auth.uid() OR
        assigned_to = auth.uid() OR
        created_by = auth.uid()
      )
    )
  );

-- Users can update tasks if:
-- 1. They own the task
-- 2. They are assigned to the task
-- 3. They are admin/manager in the organization
CREATE POLICY "Users can update accessible tasks" ON public.tasks
  FOR UPDATE USING (
    -- Own tasks
    user_id = auth.uid() OR
    -- Tasks assigned to them
    assigned_to = auth.uid() OR
    -- Organization admins/managers can update org tasks
    (
      organization_id IS NOT NULL AND
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );

-- Users can delete tasks if:
-- 1. They own the task
-- 2. They are admin/manager in the organization
CREATE POLICY "Users can delete accessible tasks" ON public.tasks
  FOR DELETE USING (
    -- Own tasks
    user_id = auth.uid() OR
    -- Organization admins/managers can delete org tasks
    (
      organization_id IS NOT NULL AND
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
      )
    )
  );

-- Function to automatically set created_by when inserting tasks
CREATE OR REPLACE FUNCTION public.set_task_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Set created_by if not already set
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  
  -- If no user_id is set and it's a personal task, set it to the creator
  IF NEW.user_id IS NULL AND NEW.organization_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set created_by automatically
CREATE TRIGGER set_task_created_by_trigger
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_task_created_by();

-- Function to validate task assignment within organization
CREATE OR REPLACE FUNCTION public.validate_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If task is assigned to someone, ensure they are in the same organization
  IF NEW.assigned_to IS NOT NULL AND NEW.organization_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = NEW.assigned_to AND organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'Cannot assign task to user who is not a member of the organization';
    END IF;
  END IF;
  
  -- If task belongs to a team, ensure the team belongs to the same organization
  IF NEW.team_id IS NOT NULL AND NEW.organization_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.teams 
      WHERE id = NEW.team_id AND organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'Team does not belong to the specified organization';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate task assignments
CREATE TRIGGER validate_task_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_task_assignment();

-- Comments for documentation
COMMENT ON COLUMN public.tasks.organization_id IS 'Organization this task belongs to (NULL for personal tasks)';
COMMENT ON COLUMN public.tasks.team_id IS 'Team this task belongs to within the organization';
COMMENT ON COLUMN public.tasks.assigned_to IS 'User this task is assigned to (can be different from owner)';
COMMENT ON COLUMN public.tasks.created_by IS 'User who created this task';
COMMENT ON COLUMN public.tasks.visibility IS 'Task visibility: private, team, organization';
COMMENT ON COLUMN public.tasks.priority IS 'Task priority: low, medium, high, critical';

-- Update existing personal tasks to have proper created_by
UPDATE public.tasks 
SET created_by = user_id 
WHERE created_by IS NULL AND user_id IS NOT NULL;