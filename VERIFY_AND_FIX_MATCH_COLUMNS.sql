-- Verification and Fix Script for Match Result Submission Error
-- Run this in Supabase SQL Editor to check and fix missing columns

-- Step 1: Check if columns exist
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check each required column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'team_a_result_submitted'
  ) THEN
    missing_columns := array_append(missing_columns, 'team_a_result_submitted');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'team_b_result_submitted'
  ) THEN
    missing_columns := array_append(missing_columns, 'team_b_result_submitted');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'team_a_submitted_at'
  ) THEN
    missing_columns := array_append(missing_columns, 'team_a_submitted_at');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'team_b_submitted_at'
  ) THEN
    missing_columns := array_append(missing_columns, 'team_b_submitted_at');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'verified_result'
  ) THEN
    missing_columns := array_append(missing_columns, 'verified_result');
  END IF;
  
  -- Report missing columns
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE 'Missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'All required columns exist!';
  END IF;
END $$;

-- Step 2: Add missing columns (safe to run multiple times)
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS team_a_result_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_b_result_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_a_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS team_b_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_result BOOLEAN DEFAULT FALSE;

-- Step 3: Add comments
COMMENT ON COLUMN matches.team_a_result_submitted IS 'Whether team A has submitted their match result';
COMMENT ON COLUMN matches.team_b_result_submitted IS 'Whether team B has submitted their match result';
COMMENT ON COLUMN matches.team_a_submitted_at IS 'Timestamp when team A submitted their result';
COMMENT ON COLUMN matches.team_b_submitted_at IS 'Timestamp when team B submitted their result';
COMMENT ON COLUMN matches.verified_result IS 'Whether both teams have verified the match result';

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_matches_verification_status 
ON matches(status, team_a_result_submitted, team_b_result_submitted, verified_result)
WHERE status = 'confirmed' AND verified_result = false;

-- Step 5: Update existing completed matches
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'matches' 
    AND column_name = 'team_a_score'
  ) THEN
    UPDATE matches 
    SET verified_result = true,
        team_a_result_submitted = true,
        team_b_result_submitted = true
    WHERE status = 'completed' 
      AND team_a_score IS NOT NULL 
      AND team_b_score IS NOT NULL
      AND (verified_result IS NULL OR verified_result = false);
    
    RAISE NOTICE 'Updated existing completed matches';
  END IF;
END $$;

-- Step 6: Verify columns were added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
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

-- If you see all 5 columns in the result, the migration was successful!
-- After running this, wait 1-2 minutes for Supabase's schema cache to refresh

