# Fix: Match Result Submission Error

## Problem
Error: "Could not find the 'team_b_result_submitted' column of 'matches' in the schema cache"

This error occurs because the database is missing the verification columns needed for the match result submission system.

## Solution: Run Database Migration

**IMPORTANT:** You must run the migration SQL script in your Supabase dashboard. The app code expects these columns to exist.

### Quick Fix (Recommended)

Use the verification script `VERIFY_AND_FIX_MATCH_COLUMNS.sql` which will:
- Check which columns are missing
- Add all missing columns
- Verify the migration was successful

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the Migration**
   - Copy the entire contents of `migrations/add_match_verification_fields.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify Success**
   - You should see "Success. No rows returned" or similar
   - Go to "Table Editor" → `matches` table
   - Verify these columns exist:
     - `team_a_result_submitted` (boolean)
     - `team_b_result_submitted` (boolean)
     - `team_a_submitted_at` (timestamp)
     - `team_b_submitted_at` (timestamp)
     - `verified_result` (boolean)

### Quick Copy-Paste SQL:

```sql
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
```

### After Running:

- The error should be resolved immediately
- Match result submission will work correctly
- Both teams will need to verify results before ratings update
- No app restart needed - the fix is database-only

