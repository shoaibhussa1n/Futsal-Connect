-- Create goal_scorers table and set up RLS
-- This table stores goal scorer information for matches

-- Step 1: Create the goal_scorers table
CREATE TABLE IF NOT EXISTS goal_scorers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  goals INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goal_scorers_match_id ON goal_scorers(match_id);
CREATE INDEX IF NOT EXISTS idx_goal_scorers_player_id ON goal_scorers(player_id);
CREATE INDEX IF NOT EXISTS idx_goal_scorers_team_id ON goal_scorers(team_id);

-- Step 3: Enable RLS
ALTER TABLE goal_scorers ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies (if any)
DROP POLICY IF EXISTS "Anyone can view goal scorers" ON goal_scorers;
DROP POLICY IF EXISTS "Authenticated users can insert goal scorers" ON goal_scorers;
DROP POLICY IF EXISTS "Authenticated users can update goal scorers" ON goal_scorers;
DROP POLICY IF EXISTS "Authenticated users can delete goal scorers" ON goal_scorers;

-- Step 5: Create RLS policies
-- Allow anyone to view goal scorers
CREATE POLICY "Anyone can view goal scorers" 
ON goal_scorers 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert goal scorers
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

-- Step 7: Verify the table was created
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'goal_scorers'
ORDER BY ordinal_position;

-- Should show: id, match_id, player_id, team_id, goals, created_at

-- Step 8: Verify policies were created
SELECT 
  policyname, 
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'goal_scorers'
ORDER BY cmd, policyname;

-- Should show 4 policies: SELECT, INSERT, UPDATE, DELETE

