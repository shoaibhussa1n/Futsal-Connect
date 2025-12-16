-- Migration: Add match score columns
-- Description: Adds team_a_score and team_b_score columns to matches table if they don't exist
-- Date: 2025-12-16
-- Run this BEFORE add_match_verification_fields.sql if your matches table doesn't have score columns

-- Add score columns to matches table if they don't exist
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS team_a_score INTEGER,
ADD COLUMN IF NOT EXISTS team_b_score INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN matches.team_a_score IS 'Final score for team A';
COMMENT ON COLUMN matches.team_b_score IS 'Final score for team B';

-- Note: If you also need mvp_player_id and notes columns, uncomment the following:
-- ALTER TABLE matches 
-- ADD COLUMN IF NOT EXISTS mvp_player_id UUID REFERENCES players(id),
-- ADD COLUMN IF NOT EXISTS notes TEXT;

