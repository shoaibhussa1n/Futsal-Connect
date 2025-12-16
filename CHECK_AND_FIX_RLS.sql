-- Check and Fix RLS Policies for Matches Table
-- This ensures teams can update match results

-- Step 1: Check if RLS is enabled
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'matches';

-- Step 2: Check existing UPDATE policies
SELECT 
  policyname, 
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'matches' AND cmd = 'UPDATE';

-- Step 3: If no UPDATE policies exist, create them
-- (Only run this if Step 2 shows no results)

-- Allow team captains to update matches for their teams
CREATE POLICY IF NOT EXISTS "Team captains can update match results" 
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

-- Also allow updates if the user is a team member (for submitting results)
CREATE POLICY IF NOT EXISTS "Team members can update match results" 
ON matches 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT p.user_id 
    FROM profiles p
    JOIN players pl ON pl.profile_id = p.id
    JOIN team_members tm ON tm.player_id = pl.id
    WHERE tm.team_id = matches.team_a_id OR tm.team_id = matches.team_b_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT p.user_id 
    FROM profiles p
    JOIN players pl ON pl.profile_id = p.id
    JOIN team_members tm ON tm.player_id = pl.id
    WHERE tm.team_id = matches.team_a_id OR tm.team_id = matches.team_b_id
  )
);

-- Step 4: Ensure RLS is enabled
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE ON matches TO anon, authenticated;

-- After running, check the results from Step 1 and Step 2
-- If RLS is enabled but there are no UPDATE policies, the policies above will be created

