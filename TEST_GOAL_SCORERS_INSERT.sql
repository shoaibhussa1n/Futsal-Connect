-- Test inserting into goal_scorers table
-- Replace the UUIDs with actual values from your database

-- First, check if you have any matches
SELECT id, team_a_id, team_b_id FROM matches LIMIT 1;

-- Then check if you have any players
SELECT id FROM players LIMIT 1;

-- Test insert (replace the UUIDs with actual values from above queries)
-- Uncomment and modify the line below with real IDs:
/*
INSERT INTO goal_scorers (match_id, player_id, team_id, goals)
VALUES (
  'your-match-id-here',
  'your-player-id-here', 
  'your-team-id-here',
  1
);
*/

-- Check if the insert worked
SELECT * FROM goal_scorers ORDER BY created_at DESC LIMIT 5;

