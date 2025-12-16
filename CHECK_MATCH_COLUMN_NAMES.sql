-- Check the actual column names in the matches table
-- This will show us if columns are named team_a/team_b or team_a_id/team_b_id

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'matches' 
  AND (column_name LIKE 'team_%' OR column_name LIKE '%_id')
ORDER BY column_name;

-- Also check foreign key constraints to see the actual column names
SELECT
  tc.constraint_name,
  tc.table_name,
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
  AND (kcu.column_name LIKE 'team_%' OR ccu.column_name LIKE 'team_%');

