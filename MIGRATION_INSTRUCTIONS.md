# Database Migration Instructions

## Match Result Verification System Migration

This migration adds support for the two-team verification system where both teams must confirm match results before ratings are updated.

### Prerequisites

**IMPORTANT:** If your `matches` table doesn't have `team_a_score` and `team_b_score` columns, run the score columns migration first:

1. Run `migrations/add_match_score_columns.sql` first
2. Then run `migrations/add_match_verification_fields.sql`

### How to Apply the Migrations

1. **Go to your Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migrations (in order)**
   
   **Step 1: Add Score Columns (if needed)**
   - Copy the contents of `migrations/add_match_score_columns.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Skip this step if your matches table already has `team_a_score` and `team_b_score` columns
   
   **Step 2: Add Verification Fields**
   - Copy the contents of `migrations/add_match_verification_fields.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify the Migration**
   - Go to "Table Editor"
   - Select the `matches` table
   - Verify that the following new columns exist:
     - `team_a_result_submitted` (boolean)
     - `team_b_result_submitted` (boolean)
     - `team_a_submitted_at` (timestamp)
     - `team_b_submitted_at` (timestamp)
     - `verified_result` (boolean)

### What This Migration Does

1. **Adds Verification Fields**
   - Tracks which team has submitted their result
   - Records when each team submitted
   - Marks when both teams have verified the result

2. **Creates Index**
   - Improves query performance for finding matches needing verification

3. **Updates Existing Data**
   - Marks all existing completed matches as verified
   - Ensures backward compatibility with existing match data

### After Migration

Once the migration is complete:
- The match result verification system will be fully functional
- Teams will need to verify each other's results before ratings update
- Match history will show all verified completed matches

### Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove the new columns
ALTER TABLE matches 
DROP COLUMN IF EXISTS team_a_result_submitted,
DROP COLUMN IF EXISTS team_b_result_submitted,
DROP COLUMN IF EXISTS team_a_submitted_at,
DROP COLUMN IF EXISTS team_b_submitted_at,
DROP COLUMN IF EXISTS verified_result;

-- Remove the index
DROP INDEX IF EXISTS idx_matches_verification_status;
```

**Note:** Rolling back will lose all verification data. Only do this if absolutely necessary.

