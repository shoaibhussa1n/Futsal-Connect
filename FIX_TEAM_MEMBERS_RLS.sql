-- =====================================================
-- FIX FOR TEAM_MEMBERS TABLE RLS
-- =====================================================
-- Run this SQL in Supabase SQL Editor to fix team_members RLS issues
-- =====================================================

-- Step 1: Enable RLS on team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if any)
DROP POLICY IF EXISTS "Team members are viewable by everyone" ON team_members;
DROP POLICY IF EXISTS "Team captains can view their team members" ON team_members;
DROP POLICY IF EXISTS "Team captains can add members" ON team_members;
DROP POLICY IF EXISTS "Team captains can remove members" ON team_members;
DROP POLICY IF EXISTS "Players can view their team memberships" ON team_members;

-- Step 3: Create new policies for team_members table

-- Allow anyone to read team members (for viewing team rosters)
CREATE POLICY "Team members are viewable by everyone" 
ON team_members 
FOR SELECT 
USING (true);

-- Allow team captains to view their team members
CREATE POLICY "Team captains can view their team members" 
ON team_members 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = team_members.team_id
    )
  )
);

-- Allow players to view their own team memberships
CREATE POLICY "Players can view their team memberships" 
ON team_members 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT profile_id FROM players 
      WHERE id = team_members.player_id
    )
  )
);

-- Allow team captains to add members to their team
CREATE POLICY "Team captains can add members" 
ON team_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = team_members.team_id
    )
  )
);

-- Allow team captains to remove members from their team
CREATE POLICY "Team captains can remove members" 
ON team_members 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = team_members.team_id
    )
  )
);

-- Allow players to leave teams themselves (optional)
CREATE POLICY "Players can leave teams" 
ON team_members 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT profile_id FROM players 
      WHERE id = team_members.player_id
    )
  )
  AND role = 'member'  -- Can't delete if they're the captain
);

-- Grant permissions on team_members table
GRANT ALL ON team_members TO anon, authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this, test by:
-- 1. Adding a player to a team (should work)
-- 2. Viewing team members (should work)
-- 3. Removing a player from a team (should work)
-- =====================================================

