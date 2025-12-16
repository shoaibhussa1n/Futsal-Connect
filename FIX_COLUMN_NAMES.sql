-- Fix column name mismatch
-- The code expects team_a_id and team_b_id, but database might have team_a and team_b

-- Step 1: Check current column names
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'matches' 
  AND (column_name IN ('team_a', 'team_b', 'team_a_id', 'team_b_id'))
ORDER BY column_name;

-- Step 2: If columns are named team_a and team_b, rename them to team_a_id and team_b_id
-- (Only run this if Step 1 shows team_a and team_b exist, but team_a_id and team_b_id don't)

-- First, drop foreign key constraints if they exist
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_team_a_fkey,
DROP CONSTRAINT IF EXISTS matches_team_b_fkey,
DROP CONSTRAINT IF EXISTS matches_team_a_id_fkey,
DROP CONSTRAINT IF EXISTS matches_team_b_id_fkey;

-- Rename columns
ALTER TABLE matches 
RENAME COLUMN team_a TO team_a_id;

ALTER TABLE matches 
RENAME COLUMN team_b TO team_b_id;

-- Recreate foreign key constraints
ALTER TABLE matches
ADD CONSTRAINT matches_team_a_id_fkey 
FOREIGN KEY (team_a_id) REFERENCES teams(id);

ALTER TABLE matches
ADD CONSTRAINT matches_team_b_id_fkey 
FOREIGN KEY (team_b_id) REFERENCES teams(id);

-- Step 3: Verify the rename
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'matches' 
  AND column_name IN ('team_a_id', 'team_b_id')
ORDER BY column_name;

-- Should show 2 rows: team_a_id and team_b_id

