-- Migration: Add match result verification fields
-- Description: Adds fields to support two-team verification system for match results
-- Date: 2025-12-16

-- Add verification fields to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS team_a_result_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_b_result_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_a_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS team_b_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_result BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN matches.team_a_result_submitted IS 'Whether team A has submitted their match result';
COMMENT ON COLUMN matches.team_b_result_submitted IS 'Whether team B has submitted their match result';
COMMENT ON COLUMN matches.team_a_submitted_at IS 'Timestamp when team A submitted their result';
COMMENT ON COLUMN matches.team_b_submitted_at IS 'Timestamp when team B submitted their result';
COMMENT ON COLUMN matches.verified_result IS 'Whether both teams have verified the match result';

-- Create index for faster queries on matches needing verification
CREATE INDEX IF NOT EXISTS idx_matches_verification_status 
ON matches(status, team_a_result_submitted, team_b_result_submitted, verified_result)
WHERE status = 'confirmed' AND verified_result = false;

-- Update existing completed matches to be verified (if they have scores)
-- Only run this if the score columns exist
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
  END IF;
END $$;

