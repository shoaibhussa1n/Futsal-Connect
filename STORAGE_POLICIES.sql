-- =====================================================
-- COMPLETE STORAGE BUCKET POLICIES FOR FUTSAL CONNECT
-- =====================================================
-- This SQL sets up all policies for all three storage buckets
-- Run this in Supabase SQL Editor after creating the buckets
-- =====================================================

-- Drop existing policies if they exist (safe to run multiple times)
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
USING (bucket_id = 'team-logos');

-- Authenticated users can upload team logos
CREATE POLICY "team-logos-authenticated-upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
);

-- Team captains can update their team logos
CREATE POLICY "team-logos-update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
);

-- Team captains can delete their team logos
CREATE POLICY "team-logos-delete"
ON storage.objects FOR DELETE
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
USING (bucket_id = 'player-photos');

-- Authenticated users can upload player photos
CREATE POLICY "player-photos-authenticated-upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'player-photos' 
  AND auth.role() = 'authenticated'
);

-- Players can update their own photos
CREATE POLICY "player-photos-update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'player-photos' 
  AND auth.role() = 'authenticated'
);

-- Players can delete their own photos
CREATE POLICY "player-photos-delete"
ON storage.objects FOR DELETE
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
USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatars
CREATE POLICY "avatars-authenticated-upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Users can update their own avatars
CREATE POLICY "avatars-update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Users can delete their own avatars
CREATE POLICY "avatars-delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- DONE! All policies are now set up.
-- =====================================================
-- Note: Make sure you've created the buckets first:
-- 1. team-logos (public bucket)
-- 2. player-photos (public bucket)
-- 3. avatars (public bucket)
-- =====================================================

