-- Fix RLS Policies for goal_scorers table
-- This allows teams to insert goal scorer records

-- IMPORTANT: If the goal_scorers table doesn't exist, run CREATE_GOAL_SCORERS_TABLE.sql first!

-- Step 1: Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'goal_scorers'
) AS table_exists;

-- If table_exists is false, you need to create the table first using CREATE_GOAL_SCORERS_TABLE.sql

-- Step 2: Check current RLS status
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'goal_scorers';

-- Step 2: Check existing policies
SELECT 
  policyname, 
  cmd,
  qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'goal_scorers';

-- Step 3: Enable RLS (if not already enabled)
ALTER TABLE goal_scorers ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (if any)
DROP POLICY IF EXISTS "Anyone can view goal scorers" ON goal_scorers;
DROP POLICY IF EXISTS "Teams can insert goal scorers" ON goal_scorers;
DROP POLICY IF EXISTS "Teams can update goal scorers" ON goal_scorers;
DROP POLICY IF EXISTS "Teams can delete goal scorers" ON goal_scorers;
DROP POLICY IF EXISTS "Authenticated users can insert goal scorers" ON goal_scorers;

-- Step 5: Create permissive policies for goal_scorers
-- Allow anyone to view goal scorers
CREATE POLICY "Anyone can view goal scorers" 
ON goal_scorers 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert goal scorers
-- (Teams need to be able to add goal scorers when submitting match results)
CREATE POLICY "Authenticated users can insert goal scorers" 
ON goal_scorers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update goal scorers
CREATE POLICY "Authenticated users can update goal scorers" 
ON goal_scorers 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete goal scorers
CREATE POLICY "Authenticated users can delete goal scorers" 
ON goal_scorers 
FOR DELETE 
TO authenticated
USING (true);

-- Step 6: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON goal_scorers TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Step 7: Verify policies were created
SELECT 
  policyname, 
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'goal_scorers'
ORDER BY cmd, policyname;

-- Should show 4 policies: SELECT, INSERT, UPDATE, DELETE

