-- Fix user creation issue
-- The RLS policy for users table might be too restrictive

-- First, check if the policy exists and drop it if needed
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a more permissive insert policy
-- This allows authenticated users to create their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Also ensure the update policy exists
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure select policy exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;