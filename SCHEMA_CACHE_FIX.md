# Schema Cache Issue - Fix Guide

## ✅ Good News!
Your database columns **DO exist** (verified by your SQL query showing all 5 columns). This is a **Supabase schema cache** issue.

## The Problem
Supabase's PostgREST API caches the database schema. Even though the columns exist in PostgreSQL, the API layer hasn't refreshed its cache yet.

## Solutions (Try in Order)

### Solution 1: Wait and Refresh (Easiest)
1. **Wait 2-5 minutes** - Supabase's cache refreshes automatically
2. **Hard refresh your browser** - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. **Try submitting again**

### Solution 2: Force Schema Refresh
Run this SQL in Supabase SQL Editor (use `SIMPLE_SCHEMA_REFRESH.sql`):

```sql
-- Force schema cache refresh (safe - just a SELECT query)
SELECT 
  id,
  team_a_result_submitted,
  team_b_result_submitted,
  team_a_submitted_at,
  team_b_submitted_at,
  verified_result
FROM matches 
LIMIT 1;

-- Grant explicit permissions
GRANT SELECT, INSERT, UPDATE ON matches TO anon, authenticated;
```

Then wait 1-2 minutes and try again.

### Solution 3: Clear Browser Cache
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Try submitting again

### Solution 4: Check RLS Policies
Make sure you have RLS policies that allow updating matches. Run this to check:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'matches';

-- Check existing policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'matches';
```

If RLS is enabled but there are no UPDATE policies, you need to add them.

### Solution 5: Restart Supabase Project (Last Resort)
1. Go to Supabase Dashboard → Settings → General
2. Click "Restart Project" (if available)
3. Wait 2-3 minutes for restart
4. Try again

## Why This Happens
- Supabase uses PostgREST which caches schema metadata
- When you add columns, the cache needs time to refresh
- Usually takes 1-5 minutes, but can take longer during high traffic

## Verify It's Fixed
After trying the solutions above:
1. Go to your app
2. Try submitting a match result
3. If it works, you're done! ✅
4. If not, check the browser console for the exact error message

## Still Not Working?
If you're still getting errors after 5+ minutes:
1. Check the **exact error message** in browser console (F12)
2. Verify you're **logged in** as a team captain
3. Check if **RLS policies** are blocking the update
4. Share the exact error message and I'll help troubleshoot further

