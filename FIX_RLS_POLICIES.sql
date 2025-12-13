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
-- FIX FOR PLAYERS TABLE RLS
-- =====================================================

-- Step 1: Enable RLS on players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if any)
DROP POLICY IF EXISTS "Players are viewable by everyone" ON players;
DROP POLICY IF EXISTS "Users can create own player profile" ON players;
DROP POLICY IF EXISTS "Players can update own profile" ON players;
DROP POLICY IF EXISTS "Players can delete own profile" ON players;

-- Step 3: Create new policies for players table

-- Allow anyone to read players (for marketplace, etc.)
CREATE POLICY "Players are viewable by everyone" 
ON players 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own player profile
CREATE POLICY "Users can create own player profile" 
ON players 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = players.profile_id
  )
);

-- Allow authenticated users to update their own player profile
CREATE POLICY "Players can update own profile" 
ON players 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = players.profile_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = players.profile_id
  )
);

-- Grant permissions on players table
GRANT ALL ON players TO anon, authenticated;

-- =====================================================
-- FIX FOR ALL OTHER TABLES (Preventive)
-- =====================================================

-- =====================================================
-- FIX FOR TEAMS TABLE RLS
-- =====================================================

-- Step 1: Enable RLS on teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if any)
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "Anyone can create teams" ON teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
DROP POLICY IF EXISTS "Team captains can update their team" ON teams;
DROP POLICY IF EXISTS "Team captains can delete their team" ON teams;

-- Step 3: Create new policies for teams table

-- Allow anyone to read teams (for matchmaking, etc.)
CREATE POLICY "Teams are viewable by everyone" 
ON teams 
FOR SELECT 
USING (true);

-- Allow authenticated users to create teams
-- The captain_id must match the user's profile
CREATE POLICY "Authenticated users can create teams" 
ON teams 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = teams.captain_id
  )
);

-- Allow team captains to update their team
CREATE POLICY "Team captains can update their team" 
ON teams 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = teams.captain_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = teams.captain_id
  )
);

-- Allow team captains to delete their team (optional)
CREATE POLICY "Team captains can delete their team" 
ON teams 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = teams.captain_id
  )
);

-- Grant permissions on teams table
GRANT ALL ON teams TO anon, authenticated;

-- =====================================================
-- FIX FOR PLAYER_INVITATIONS TABLE RLS
-- =====================================================

-- Step 1: Enable RLS on player_invitations table
ALTER TABLE player_invitations ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if any)
DROP POLICY IF EXISTS "Players can view their invitations" ON player_invitations;
DROP POLICY IF EXISTS "Team captains can create invitations" ON player_invitations;
DROP POLICY IF EXISTS "Team captains can view sent invitations" ON player_invitations;
DROP POLICY IF EXISTS "Players can update invitation status" ON player_invitations;
DROP POLICY IF EXISTS "Anyone can view invitations" ON player_invitations;

-- Step 3: Create new policies for player_invitations table

-- Allow players to view their own invitations
CREATE POLICY "Players can view their invitations" 
ON player_invitations 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT profile_id FROM players 
      WHERE id = player_invitations.player_id
    )
  )
);

-- Allow team captains to view invitations they sent
CREATE POLICY "Team captains can view sent invitations" 
ON player_invitations 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = player_invitations.team_id
    )
  )
);

-- Allow team captains to create invitations
CREATE POLICY "Team captains can create invitations" 
ON player_invitations 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = player_invitations.team_id
    )
  )
);

-- Allow players to update their own invitation status (accept/reject)
CREATE POLICY "Players can update invitation status" 
ON player_invitations 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT profile_id FROM players 
      WHERE id = player_invitations.player_id
    )
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT profile_id FROM players 
      WHERE id = player_invitations.player_id
    )
  )
);

-- Grant permissions on player_invitations table
GRANT ALL ON player_invitations TO anon, authenticated;

-- =====================================================
-- FIX FOR MATCH_REQUESTS TABLE RLS
-- =====================================================

-- Step 1: Enable RLS on match_requests table
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies (if any)
DROP POLICY IF EXISTS "Teams can view their match requests" ON match_requests;
DROP POLICY IF EXISTS "Team captains can create match requests" ON match_requests;
DROP POLICY IF EXISTS "Team captains can update match requests" ON match_requests;
DROP POLICY IF EXISTS "Anyone can view match requests" ON match_requests;

-- Step 3: Create new policies for match_requests table

-- Allow teams to view match requests they sent or received
CREATE POLICY "Teams can view their match requests" 
ON match_requests 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = match_requests.requester_team_id 
         OR id = match_requests.requested_team_id
    )
  )
);

-- Allow team captains to create match requests
CREATE POLICY "Team captains can create match requests" 
ON match_requests 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = match_requests.requester_team_id
    )
  )
);

-- Allow team captains to update match requests (for the team they sent or received)
CREATE POLICY "Team captains can update match requests" 
ON match_requests 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = match_requests.requester_team_id 
         OR id = match_requests.requested_team_id
    )
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE id IN (
      SELECT captain_id FROM teams 
      WHERE id = match_requests.requester_team_id 
         OR id = match_requests.requested_team_id
    )
  )
);

-- Grant permissions on match_requests table
GRANT ALL ON match_requests TO anon, authenticated;

-- =====================================================
-- IF STILL GETTING ERRORS:
-- =====================================================
-- 1. Check Supabase Dashboard → Authentication → Policies
-- 2. Verify your environment variables in Vercel:
--    - VITE_SUPABASE_URL
--    - VITE_SUPABASE_ANON_KEY
-- 3. Check browser console for specific error messages
-- 4. Verify the profiles and players tables exist in Table Editor
-- 5. Make sure you're logged in when testing
-- =====================================================

