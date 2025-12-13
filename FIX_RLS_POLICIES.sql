-- =====================================================
-- COMPLETE FIX FOR 406/403 ERRORS
-- =====================================================
-- Run this SQL in Supabase SQL Editor to fix all RLS issues
-- =====================================================

-- Step 1: Ensure RLS is enabled on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if any)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Step 3: Create new policies with proper permissions

-- Allow anyone to read profiles (for marketplace, etc.)
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own profile (optional)
CREATE POLICY "Users can delete own profile" 
ON profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Step 4: Verify the table structure
-- Make sure the profiles table has these columns:
-- - id (UUID, PRIMARY KEY)
-- - user_id (UUID, UNIQUE, NOT NULL, REFERENCES auth.users(id))
-- - full_name (TEXT)
-- - email (TEXT)
-- - phone (TEXT, nullable)
-- - avatar_url (TEXT, nullable)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO anon, authenticated;

-- =====================================================
-- TEST QUERIES (Run these to verify)
-- =====================================================

-- Test 1: Check if you can read profiles (should work)
-- SELECT * FROM profiles LIMIT 1;

-- Test 2: Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- =====================================================
-- IF STILL GETTING ERRORS:
-- =====================================================
-- 1. Check Supabase Dashboard → Authentication → Policies
-- 2. Verify your environment variables in Vercel:
--    - VITE_SUPABASE_URL
--    - VITE_SUPABASE_ANON_KEY
-- 3. Check browser console for specific error messages
-- 4. Verify the profiles table exists in Table Editor
-- =====================================================

