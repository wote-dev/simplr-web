-- Update user_profiles RLS policies to support organization-scoped access

-- Drop existing user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create new RLS policies for user_profiles with organization context

-- Users can view profiles if:
-- 1. It's their own profile
-- 2. The profile belongs to a user in the same organization
CREATE POLICY "Users can view accessible profiles" ON public.user_profiles
  FOR SELECT USING (
    -- Own profile
    id = auth.uid() OR
    -- Profiles of users in the same organization
    id IN (
      SELECT om2.user_id 
      FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
    )
  );

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Add comments for documentation
COMMENT ON POLICY "Users can view accessible profiles" ON public.user_profiles IS 
  'Users can view their own profile and profiles of users in the same organization(s)';
COMMENT ON POLICY "Users can update own profile" ON public.user_profiles IS 
  'Users can only update their own profile';
COMMENT ON POLICY "Users can insert own profile" ON public.user_profiles IS 
  'Users can only create their own profile during signup';