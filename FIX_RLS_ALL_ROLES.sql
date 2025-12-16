-- Fix RLS for ALL roles (public, authenticated, anon)
-- The issue is that policies might only be for 'public' role, but requests come as 'authenticated'

-- Step 1: Drop all existing policies
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'goal_scorers'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON goal_scorers CASCADE';
  END LOOP;
END $$;

-- Step 2: Create policies for ALL roles (public, authenticated, anon)
-- SELECT policy
CREATE POLICY "Allow SELECT for all" 
ON goal_scorers 
FOR SELECT 
TO PUBLIC, authenticated, anon
USING (true);

-- INSERT policy  
CREATE POLICY "Allow INSERT for all" 
ON goal_scorers 
FOR INSERT 
TO PUBLIC, authenticated, anon
WITH CHECK (true);

-- UPDATE policy
CREATE POLICY "Allow UPDATE for all" 
ON goal_scorers 
FOR UPDATE 
TO PUBLIC, authenticated, anon
USING (true)
WITH CHECK (true);

-- DELETE policy
CREATE POLICY "Allow DELETE for all" 
ON goal_scorers 
FOR DELETE 
TO PUBLIC, authenticated, anon
USING (true);

-- Step 3: Grant ALL permissions to all roles
GRANT ALL ON goal_scorers TO PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO PUBLIC, anon, authenticated;

-- Step 4: Verify
SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'goal_scorers'
ORDER BY cmd, policyname;

-- Should show 4 policies, each with roles: {public,authenticated,anon}

