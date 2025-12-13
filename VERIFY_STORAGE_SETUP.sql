-- =====================================================
-- COMPREHENSIVE STORAGE SETUP VERIFICATION
-- =====================================================
-- Run this to check if everything is set up correctly
-- =====================================================

-- Step 1: Check if buckets exist and are configured correctly
SELECT 
    name,
    public as is_public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE name IN ('team-logos', 'player-photos', 'avatars')
ORDER BY name;

-- Step 2: Check if storage policies exist for team-logos
SELECT 
    policyname,
    cmd as operation,
    roles,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (policyname LIKE '%team-logos%' OR policyname LIKE '%player-photos%' OR policyname LIKE '%avatars%')
ORDER BY policyname;

-- Step 3: Check RLS status on storage.objects table
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- Step 4: Count total policies for storage.objects
SELECT 
    COUNT(*) as total_policies,
    COUNT(CASE WHEN policyname LIKE '%team-logos%' THEN 1 END) as team_logos_policies,
    COUNT(CASE WHEN policyname LIKE '%player-photos%' THEN 1 END) as player_photos_policies,
    COUNT(CASE WHEN policyname LIKE '%avatars%' THEN 1 END) as avatars_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- Step 5: Check for any conflicting policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname NOT LIKE '%team-logos%'
  AND policyname NOT LIKE '%player-photos%'
  AND policyname NOT LIKE '%avatars%'
ORDER BY policyname;

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- Step 1: Should show 3 rows (one for each bucket)
--   - All should have is_public = true
--   - file_size_limit should be set (2097152 for logos/photos, 1048576 for avatars)
--   - allowed_mime_types should include image types
--
-- Step 2: Should show 12 policies (4 per bucket):
--   - team-logos-public-read (SELECT)
--   - team-logos-authenticated-upload (INSERT)
--   - team-logos-update (UPDATE)
--   - team-logos-delete (DELETE)
--   - Same for player-photos and avatars
--
-- Step 3: Should show rls_enabled = true
--
-- Step 4: Should show:
--   - total_policies >= 12
--   - team_logos_policies = 4
--   - player_photos_policies = 4
--   - avatars_policies = 4
--
-- Step 5: May show other policies (that's okay)
-- =====================================================

