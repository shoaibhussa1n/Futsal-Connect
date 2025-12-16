-- Check RLS Status and Fix Issues
-- Run this to diagnose and fix RLS/policy issues

-- Step 1: Check if RLS is enabled on matches table
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'matches';

-- Step 2: Check existing policies on matches table
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'matches'
ORDER BY cmd, policyname;

-- Step 3: Check if columns are accessible
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matches'
  AND column_name IN (
    'team_a_result_submitted',
    'team_b_result_submitted',
    'team_a_submitted_at',
    'team_b_submitted_at',
    'verified_result'
  )
ORDER BY column_name;

-- Step 4: Ensure RLS is properly configured
-- If RLS is enabled but there are no UPDATE policies, we need to add them
-- First, let's see what we have:

-- If you see RLS is enabled but no UPDATE policies, run this:
-- (Uncomment the lines below if needed)

/*
-- Enable RLS if not already enabled
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow team captains to update matches
CREATE POLICY "Team captains can update matches" 
ON matches 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = matches.team_a_id OR id = matches.team_b_id
    )
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = matches.team_a_id OR id = matches.team_b_id
    )
  )
);
*/

-- Step 5: Grant explicit permissions
GRANT SELECT, INSERT, UPDATE ON matches TO anon, authenticated;

-- Step 6: Try to force PostgREST schema refresh by querying the columns
SELECT 
  id,
  team_a_id,
  team_b_id,
  team_a_result_submitted,
  team_b_result_submitted,
  verified_result
FROM matches 
LIMIT 0;  -- Returns schema without data

