# Supabase Storage Setup Guide

## Issue: "mime type application/json is not supported"

This error occurs when Supabase Storage buckets are not properly configured. Follow these steps:

## Step 1: Create Storage Buckets

Go to your Supabase Dashboard → Storage and create these buckets:

### Bucket 1: `team-logos`
- **Name**: `team-logos`
- **Public bucket**: ✅ Yes (check this)
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/png, image/jpeg, image/webp`

### Bucket 2: `player-photos`
- **Name**: `player-photos`
- **Public bucket**: ✅ Yes (check this)
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/png, image/jpeg, image/webp`

### Bucket 3: `avatars`
- **Name**: `avatars`
- **Public bucket**: ✅ Yes (check this)
- **File size limit**: 1 MB
- **Allowed MIME types**: `image/png, image/jpeg, image/webp`

## Step 2: Set Up Storage Policies

Run the SQL in `STORAGE_POLICIES.sql` in your Supabase SQL Editor, OR manually set up policies:

### For each bucket, go to Storage → [Bucket Name] → Policies and add:

**Policy 1: Public Read**
- Policy name: `Public read access`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression: `bucket_id = 'bucket-name'`

**Policy 2: Authenticated Upload**
- Policy name: `Authenticated users can upload`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression: `bucket_id = 'bucket-name' AND auth.role() = 'authenticated'`

**Policy 3: Authenticated Update**
- Policy name: `Authenticated users can update`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'bucket-name' AND auth.role() = 'authenticated'`

**Policy 4: Authenticated Delete**
- Policy name: `Authenticated users can delete`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'bucket-name' AND auth.role() = 'authenticated'`

## Step 3: Verify Bucket Configuration

1. Go to Storage → [Bucket Name] → Settings
2. Ensure "Public bucket" is checked
3. Verify file size limits are set correctly
4. Check that MIME type restrictions allow: `image/png, image/jpeg, image/webp`

## Step 4: Test Upload

After setting up, try uploading a team logo or player photo again. The error should be resolved.

## Common Issues

1. **Bucket doesn't exist**: Create the bucket first
2. **Bucket is not public**: Check "Public bucket" in settings
3. **Policies not set**: Run `STORAGE_POLICIES.sql` or set up policies manually
4. **Wrong MIME types**: Ensure bucket allows `image/png, image/jpeg, image/webp`
5. **File too large**: Check file size limits (2MB for logos/photos, 1MB for avatars)

## Quick Fix SQL

If you prefer to use SQL, run `STORAGE_POLICIES.sql` which sets up all policies automatically.

