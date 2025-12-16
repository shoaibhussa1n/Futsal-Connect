-- Check UPDATE policies in detail
SELECT 
  policyname, 
  cmd,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'matches' 
  AND cmd = 'UPDATE';

-- Also check if RLS is blocking
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'matches';

-- Check current user context (for RLS evaluation)
SELECT 
  current_user,
  session_user,
  current_setting('request.jwt.claims', true)::json->>'sub' as auth_user_id;

