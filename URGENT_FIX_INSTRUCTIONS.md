# 🚨 URGENT: Fix Match Submission Error

## The Problem
You're seeing: **"Could not find the 'team_b_result_submitted' column"**

This means your Supabase database is missing required columns.

## ✅ Quick Fix (2 minutes)

### Step 1: Open Supabase
1. Go to https://app.supabase.com
2. Sign in and select your project

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar (it has a database icon)
2. Click **"New query"** button (top right)

### Step 3: Copy and Paste This SQL

Copy this ENTIRE block and paste it into the SQL Editor:

```sql
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS team_a_result_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_b_result_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS team_a_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS team_b_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_result BOOLEAN DEFAULT FALSE;
```

### Step 4: Run It
1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. You should see: **"Success. No rows returned"**

### Step 5: Wait 30 seconds
- Supabase needs to refresh its schema cache
- Wait 30-60 seconds

### Step 6: Try Again
- Go back to your app
- Try submitting a match result again
- It should work now! ✅

---

## 🔍 Verify It Worked

After running the SQL, you can verify by:

1. In Supabase, go to **"Table Editor"**
2. Click on the **"matches"** table
3. Scroll through the columns - you should see:
   - `team_a_result_submitted`
   - `team_b_result_submitted`
   - `team_a_submitted_at`
   - `team_b_submitted_at`
   - `verified_result`

If you see all 5 columns, the fix worked! ✅

---

## ⚠️ If You Still Get Errors

1. **Make sure you ran the SQL** - Check the SQL Editor history
2. **Check for errors** - Look for any red error messages in SQL Editor
3. **Wait longer** - Sometimes Supabase takes 1-2 minutes to refresh
4. **Clear browser cache** - Try refreshing the app page (Ctrl+F5)

---

## 📝 What This Does

This adds 5 new columns to your `matches` table:
- Tracks which team submitted their result
- Records when each team submitted
- Marks when both teams have verified the result

These columns are required for the match result verification system to work.

---

## 🆘 Still Having Issues?

If you're still getting errors after running the SQL:
1. Take a screenshot of the SQL Editor (showing any errors)
2. Check the "Table Editor" → "matches" table and see which columns exist
3. Let me know what you see and I'll help troubleshoot

