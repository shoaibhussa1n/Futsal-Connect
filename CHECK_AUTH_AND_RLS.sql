-- Check Authentication and RLS Status
-- This helps diagnose why RLS policies might not be working

-- Step 1: Check current user context (for RLS evaluation)
SELECT 
  current_user,
  session_user,
  current_setting('request.jwt.claims', true)::json->>'sub' as auth_user_id,
  current_setting('request.jwt.claims', true)::json->>'role' as auth_role;

-- Step 2: Verify goal_scorers RLS is enabled
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'goal_scorers';

-- Step 3: Check ALL policies on goal_scorers (including any conflicting ones)
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

-- Step 4: Check if there are any DENY policies or restrictive policies
-- (These would override permissive ones)
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'goal_scorers'
  AND (qual LIKE '%false%' OR with_check LIKE '%false%' OR qual IS NULL OR with_check IS NULL);

-- Step 5: Check table permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'goal_scorers'
ORDER BY grantee, privilege_type;

-- Step 6: Try to manually test insert (this will show the exact RLS error)
-- Uncomment and replace with actual IDs:
/*
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub": "test-user-id", "role": "authenticated"}';

INSERT INTO goal_scorers (match_id, player_id, team_id, goals)
VALUES (
  'your-match-id',
  'your-player-id',
  'your-team-id',
  1
);
*/

