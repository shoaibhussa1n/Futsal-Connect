-- =====================================================
-- VERIFY STORAGE POLICIES
-- =====================================================
-- Run this to check if storage policies are set up correctly
-- =====================================================

-- Check existing policies for team-logos bucket
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%team-logos%'
ORDER BY policyname;

-- Check existing policies for player-photos bucket
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%player-photos%'
ORDER BY policyname;

-- Check existing policies for avatars bucket
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatars%'
ORDER BY policyname;

-- =====================================================
-- If you see 0 rows for any bucket, you need to run STORAGE_POLICIES.sql
-- =====================================================

