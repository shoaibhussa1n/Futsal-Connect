-- Simple Schema Cache Refresh (Safe - No Updates)
-- Just run this SELECT query to force PostgREST to refresh its schema cache

SELECT 
  id,
  team_a_result_submitted,
  team_b_result_submitted,
  team_a_submitted_at,
  team_b_submitted_at,
  verified_result
FROM matches 
LIMIT 1;

-- This query will:
-- 1. Force PostgREST to check the schema
-- 2. Verify all columns are accessible
-- 3. Refresh the schema cache

-- After running, wait 1-2 minutes and try your app again!

