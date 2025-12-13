-- =====================================================
-- FIX FOR PROFILE CREATION ERROR
-- =====================================================
-- If you're getting "Failed to create profile" error,
-- run this SQL in your Supabase SQL Editor to ensure
-- the RLS policies are set up correctly
-- =====================================================

-- First, check if policies exist and drop them if needed
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate the policies
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TEST: Try to verify the policy works
-- =====================================================
-- After running this, try creating a profile again.
-- If it still fails, check:
-- 1. Your Supabase project is active
-- 2. Environment variables are set correctly in Vercel
-- 3. The profiles table exists and has the correct schema
-- =====================================================

