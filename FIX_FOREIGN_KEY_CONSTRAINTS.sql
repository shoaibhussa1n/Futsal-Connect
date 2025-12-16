-- Fix Foreign Key Constraints After Column Rename
-- This script fixes the foreign key constraints to match the renamed columns

-- Step 1: Check current state
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'matches' 
  AND (column_name IN ('team_a', 'team_b', 'team_a_id', 'team_b_id'))
ORDER BY column_name;

-- Step 2: Check current foreign key constraints
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'matches'
  AND (kcu.column_name LIKE 'team_%');

-- Step 3: Drop old foreign key constraints (if they reference team_a/team_b)
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_team_a_fkey,
DROP CONSTRAINT IF EXISTS matches_team_b_fkey;

-- Step 4: Drop existing constraints with new names (if they exist)
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_team_a_id_fkey,
DROP CONSTRAINT IF EXISTS matches_team_b_id_fkey;

-- Step 5: Create new foreign key constraints for team_a_id and team_b_id
ALTER TABLE matches 
ADD CONSTRAINT matches_team_a_id_fkey 
FOREIGN KEY (team_a_id) REFERENCES teams(id);

ALTER TABLE matches 
ADD CONSTRAINT matches_team_b_id_fkey 
FOREIGN KEY (team_b_id) REFERENCES teams(id);

-- Step 6: Verify the fix
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'matches'
  AND (kcu.column_name IN ('team_a_id', 'team_b_id'));

-- Should show 2 rows: team_a_id and team_b_id both referencing teams(id)

