-- =====================================================
-- ADD AREA COLUMN TO TEAMS TABLE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to add area support
-- =====================================================

-- Add area column to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS area TEXT;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_teams_area ON teams(area);

-- Update existing teams (optional - sets default area for existing teams)
-- UPDATE teams SET area = 'Karachi' WHERE area IS NULL;

-- =====================================================
-- DONE!
-- =====================================================
-- After running this, teams can have an area field
-- and filtering by area in matchmaking will work
-- =====================================================

