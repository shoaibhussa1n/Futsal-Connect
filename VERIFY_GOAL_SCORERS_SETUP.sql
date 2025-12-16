-- Verify goal_scorers table and RLS setup
-- Run this to check if everything is configured correctly

-- Step 1: Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'goal_scorers'
) AS table_exists;

-- Step 2: Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'goal_scorers'
ORDER BY ordinal_position;

-- Step 3: Check RLS status
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'goal_scorers';

-- Step 4: Check existing policies
SELECT 
  policyname, 
  cmd,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'goal_scorers'
ORDER BY cmd, policyname;

-- Step 5: Check permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'goal_scorers'
ORDER BY grantee, privilege_type;

-- Expected results:
-- Step 1: table_exists should be true
-- Step 2: Should show 6 columns (id, match_id, player_id, team_id, goals, created_at)
-- Step 3: rls_enabled should be true
-- Step 4: Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- Step 5: Should show permissions for 'anon' and 'authenticated' roles

