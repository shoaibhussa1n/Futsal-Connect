# Fix: "mime type application/json is not supported" Error

## Quick Fix Steps

This error means your Supabase Storage bucket either doesn't exist or has incorrect MIME type restrictions. Follow these steps:

## Step 1: Create the Storage Bucket (if it doesn't exist)

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** in the left sidebar
4. Click **"New bucket"** button
5. Create a bucket with these exact settings:

   **Bucket Name:** `team-logos`
   - ✅ **Public bucket** (MUST be checked)
   - **File size limit:** `2097152` (2 MB in bytes) or leave empty
   - **Allowed MIME types:** Leave this **EMPTY** or enter: `image/png,image/jpeg,image/jpg,image/webp`
   - Click **"Create bucket"**

6. Repeat for `player-photos` and `avatars` buckets with the same settings

## Step 2: Check Existing Bucket Settings (if bucket exists)

If the bucket already exists:

1. Go to **Storage** → Click on `team-logos` bucket
2. Click on **"Settings"** tab
3. Check these settings:
   - ✅ **Public bucket** must be checked
   - **File size limit:** Should be `2097152` (2MB) or empty
   - **Allowed MIME types:** Should be **EMPTY** (no restrictions) OR should include: `image/png,image/jpeg,image/jpg,image/webp`
   
   **IMPORTANT:** If MIME types field has `application/json` or any restriction that doesn't include image types, that's the problem!

4. If MIME types are restricted incorrectly:
   - Clear the MIME types field (leave it empty) OR
   - Add: `image/png,image/jpeg,image/jpg,image/webp`
   - Click **"Save"**

## Step 3: Set Up Storage Policies

1. Go to **Storage** → Click on `team-logos` bucket
2. Click on **"Policies"** tab
3. Click **"New Policy"** or use the SQL Editor

### Option A: Use SQL Editor (Recommended)

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the entire content of `STORAGE_POLICIES.sql`
3. Click **"Run"**

### Option B: Create Policies Manually

For each bucket, create these 4 policies:

**Policy 1: Public Read**
- Name: `Public read access`
- Operation: `SELECT`
- Target roles: `public`
- USING: `bucket_id = 'team-logos'`

**Policy 2: Authenticated Upload**
- Name: `Authenticated users can upload`
- Operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK: `bucket_id = 'team-logos' AND auth.role() = 'authenticated'`

**Policy 3: Authenticated Update**
- Name: `Authenticated users can update`
- Operation: `UPDATE`
- Target roles: `authenticated`
- USING: `bucket_id = 'team-logos' AND auth.role() = 'authenticated'`

**Policy 4: Authenticated Delete**
- Name: `Authenticated users can delete`
- Operation: `DELETE`
- Target roles: `authenticated`
- USING: `bucket_id = 'team-logos' AND auth.role() = 'authenticated'`

Repeat for `player-photos` and `avatars` buckets.

## Step 4: Verify Bucket Configuration

After setting up, verify:

1. **Bucket exists:** Storage → You should see `team-logos`, `player-photos`, `avatars`
2. **Bucket is public:** Settings → "Public bucket" is checked
3. **MIME types:** Settings → MIME types field is empty OR includes image types
4. **Policies exist:** Policies tab → You should see 4 policies per bucket

## Step 5: Test Upload

1. Refresh your app
2. Try uploading a team logo again
3. The error should be resolved

## Common Mistakes to Avoid

❌ **Don't** set MIME types to only `application/json`
❌ **Don't** forget to check "Public bucket"
❌ **Don't** skip setting up policies
✅ **Do** leave MIME types empty (allows all) OR specify image types
✅ **Do** make sure bucket names are exactly: `team-logos`, `player-photos`, `avatars`

## If Error Persists

1. Check browser console for the exact error message
2. Verify you're logged in (authenticated)
3. Check Supabase Dashboard → Storage → `team-logos` → Settings
4. Try creating a new bucket with a different name to test
5. Check Supabase project logs for more details

## Quick SQL to Check Bucket Status

Run this in SQL Editor to see if buckets exist:

```sql
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name IN ('team-logos', 'player-photos', 'avatars');
```

If no rows are returned, the buckets don't exist and need to be created.

