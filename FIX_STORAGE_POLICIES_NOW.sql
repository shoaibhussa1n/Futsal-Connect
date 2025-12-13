-- =====================================================
-- IMMEDIATE FIX FOR STORAGE UPLOAD ERRORS
-- =====================================================
-- Run this ENTIRE file in Supabase SQL Editor
-- This will create all necessary bucket-specific policies
-- =====================================================

-- First, drop any existing generic policies that might conflict
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Drop existing bucket-specific policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "team-logos-public-read" ON storage.objects;
DROP POLICY IF EXISTS "team-logos-authenticated-upload" ON storage.objects;
DROP POLICY IF EXISTS "team-logos-update" ON storage.objects;
DROP POLICY IF EXISTS "team-logos-delete" ON storage.objects;

DROP POLICY IF EXISTS "player-photos-public-read" ON storage.objects;
DROP POLICY IF EXISTS "player-photos-authenticated-upload" ON storage.objects;
DROP POLICY IF EXISTS "player-photos-update" ON storage.objects;
DROP POLICY IF EXISTS "player-photos-delete" ON storage.objects;

DROP POLICY IF EXISTS "avatars-public-read" ON storage.objects;
DROP POLICY IF EXISTS "avatars-authenticated-upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars-update" ON storage.objects;
DROP POLICY IF EXISTS "avatars-delete" ON storage.objects;

-- =====================================================
-- BUCKET 1: team-logos
-- =====================================================

-- Public read access for team logos
CREATE POLICY "team-logos-public-read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-logos');

-- Authenticated users can upload team logos
CREATE POLICY "team-logos-authenticated-upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
);

-- Authenticated users can update team logos
CREATE POLICY "team-logos-update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
);

-- Authenticated users can delete team logos
CREATE POLICY "team-logos-delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- BUCKET 2: player-photos
-- =====================================================

-- Public read access for player photos
CREATE POLICY "player-photos-public-read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'player-photos');

-- Authenticated users can upload player photos
CREATE POLICY "player-photos-authenticated-upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'player-photos' 
  AND auth.role() = 'authenticated'
);

-- Authenticated users can update player photos
CREATE POLICY "player-photos-update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'player-photos' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'player-photos' 
  AND auth.role() = 'authenticated'
);

-- Authenticated users can delete player photos
CREATE POLICY "player-photos-delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'player-photos' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- BUCKET 3: avatars
-- =====================================================

-- Public read access for avatars
CREATE POLICY "avatars-public-read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars
CREATE POLICY "avatars-authenticated-upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Authenticated users can update avatars
CREATE POLICY "avatars-update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Authenticated users can delete avatars
CREATE POLICY "avatars-delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this after the above to verify policies were created:
-- 
-- SELECT 
--     policyname,
--     cmd as operation,
--     roles
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
--   AND tablename = 'objects'
--   AND (policyname LIKE '%team-logos%' OR policyname LIKE '%player-photos%' OR policyname LIKE '%avatars%')
-- ORDER BY policyname;
--
-- Expected: 12 rows (4 policies per bucket)
-- =====================================================

