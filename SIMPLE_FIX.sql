-- SIMPLE FIX: Copy and paste this entire script into Supabase SQL Editor and click RUN
-- This will add the missing columns that are causing the error

ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS team_a_result_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_b_result_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_a_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS team_b_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_result BOOLEAN DEFAULT FALSE;

-- That's it! After running, wait 30 seconds and try submitting a match result again.

