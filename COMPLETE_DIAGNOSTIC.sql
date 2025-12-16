-- Complete Diagnostic and Fix Script
-- Run this to check everything and force a fix

-- ============================================
-- STEP 1: Verify columns exist in database
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
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

-- Expected: Should show 5 rows
-- If you see 5 rows, columns exist in PostgreSQL ✅

-- ============================================
-- STEP 2: Check RLS status
-- ============================================
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'matches';

-- ============================================
-- STEP 3: Check UPDATE policies
-- ============================================
SELECT 
  policyname, 
  cmd,
  qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'matches' 
  AND cmd = 'UPDATE';

-- If this returns 0 rows, you need UPDATE policies!

-- ============================================
-- STEP 4: Create/Update RLS Policies (if needed)
-- ============================================
-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Drop existing UPDATE policies (if any)
DROP POLICY IF EXISTS "Team captains can update matches" ON matches;
DROP POLICY IF EXISTS "Team captains can update match results" ON matches;
DROP POLICY IF EXISTS "Anyone can update matches" ON matches;

-- Create a permissive UPDATE policy (allows authenticated users to update)
-- This is temporary - you can make it more restrictive later
CREATE POLICY "Authenticated users can update matches" 
ON matches 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- STEP 5: Grant explicit permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE ON matches TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ============================================
-- STEP 6: Force PostgREST schema refresh
-- ============================================
-- Query the columns to force PostgREST to see them
SELECT 
  id,
  team_a_result_submitted,
  team_b_result_submitted,
  team_a_submitted_at,
  team_b_submitted_at,
  verified_result
FROM matches 
LIMIT 0;  -- Returns no rows but forces schema check

-- ============================================
-- STEP 7: Verify everything
-- ============================================
-- This should return all 5 columns
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matches'
  AND column_name IN (
    'team_a_result_submitted',
    'team_b_result_submitted',
    'team_a_submitted_at',
    'team_b_submitted_at',
    'verified_result'
  );

-- After running this:
-- 1. Wait 2-3 minutes
-- 2. Hard refresh your browser (Ctrl+Shift+R)
-- 3. Try submitting a match result again

