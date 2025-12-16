-- Force Supabase Schema Cache Refresh
-- Run this to help refresh the PostgREST schema cache

-- Method 1: Query the columns directly (this can help trigger cache refresh)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches' 
  AND column_name IN (
    'team_a_result_submitted',
    'team_b_result_submitted',
    'team_a_submitted_at',
    'team_b_submitted_at',
    'verified_result'
  )
ORDER BY column_name;

-- Method 2: Make a simple SELECT query to trigger schema refresh
-- (This forces PostgREST to re-check the schema)
SELECT id, team_a_result_submitted, team_b_result_submitted, verified_result
FROM matches 
LIMIT 1;

-- Method 3: Grant permissions explicitly (ensures API can see the columns)
GRANT SELECT, INSERT, UPDATE ON matches TO anon, authenticated;

-- After running this, wait 1-2 minutes and try your app again

