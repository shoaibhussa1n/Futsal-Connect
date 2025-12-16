-- Final RLS Troubleshooting for goal_scorers
-- Run this to completely reset and fix RLS policies

-- Step 1: Verify table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'goal_scorers'
) AS table_exists;

-- Step 2: Disable RLS temporarily to test
ALTER TABLE goal_scorers DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant full permissions (temporary - for testing)
GRANT ALL ON goal_scorers TO anon, authenticated, public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, public;

-- Step 4: Test if you can now insert (this should work without RLS)
-- Uncomment and run with actual IDs:
/*
INSERT INTO goal_scorers (match_id, player_id, team_id, goals)
VALUES (
  'your-match-id',
  'your-player-id',
  'your-team-id',
  1
);
*/

-- Step 5: If insert works, re-enable RLS with very permissive policies
ALTER TABLE goal_scorers ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'goal_scorers') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON goal_scorers';
  END LOOP;
END $$;

-- Create the most permissive policies possible
CREATE POLICY "Allow all SELECT" ON goal_scorers FOR SELECT USING (true);
CREATE POLICY "Allow all INSERT" ON goal_scorers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all UPDATE" ON goal_scorers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all DELETE" ON goal_scorers FOR DELETE USING (true);

-- Step 6: Verify policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'goal_scorers';

-- Step 7: Final permissions
GRANT ALL ON goal_scorers TO anon, authenticated, public;

