-- Test UPDATE directly to see the exact error
-- Replace '053e8bab-702b-4d6f-a1b3-5c90838a44bc' with your actual match ID

-- First, check what columns actually exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'matches' 
  AND column_name LIKE 'team_%'
ORDER BY column_name;

-- Then check if the match exists (using correct column names)
-- Replace 'team_a' and 'team_b' with actual column names from above query
SELECT id, team_a, team_b, status 
FROM matches 
WHERE id = '053e8bab-702b-4d6f-a1b3-5c90838a44bc';

-- Then try a simple UPDATE
UPDATE matches 
SET 
  team_a_score = 1,
  team_b_score = 2,
  team_a_result_submitted = true,
  team_b_result_submitted = false,
  verified_result = false
WHERE id = '053e8bab-702b-4d6f-a1b3-5c90838a44bc';

-- Check if it worked
SELECT 
  id,
  team_a_score,
  team_b_score,
  team_a_result_submitted,
  team_b_result_submitted,
  verified_result
FROM matches 
WHERE id = '053e8bab-702b-4d6f-a1b3-5c90838a44bc';

