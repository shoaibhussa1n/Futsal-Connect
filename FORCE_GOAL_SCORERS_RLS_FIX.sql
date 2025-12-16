-- Force fix for goal_scorers RLS - More permissive policies
-- Run this if you're still getting RLS errors after creating the table

-- Step 1: Ensure table exists (create if not)
CREATE TABLE IF NOT EXISTS goal_scorers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  goals INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE goal_scorers ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'goal_scorers') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON goal_scorers';
  END LOOP;
END $$;

-- Step 4: Create very permissive policies (for now - can restrict later)
-- Allow anyone (including anon) to view
CREATE POLICY "Public read access" 
ON goal_scorers 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert (very permissive)
CREATE POLICY "Authenticated insert" 
ON goal_scorers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Authenticated update" 
ON goal_scorers 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Authenticated delete" 
ON goal_scorers 
FOR DELETE 
TO authenticated
USING (true);

-- Step 5: Grant explicit permissions
GRANT ALL ON goal_scorers TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Step 6: Verify
SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'goal_scorers'
ORDER BY cmd, policyname;

-- Should show 4 policies

