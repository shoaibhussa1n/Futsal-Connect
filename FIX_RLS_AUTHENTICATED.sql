-- Fix RLS specifically for authenticated role
-- Create explicit policies for authenticated users (the role used when logged in)

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

-- Step 2: Create explicit policies for authenticated role
-- These are the policies that will work when you're logged in
CREATE POLICY "Authenticated SELECT" 
ON goal_scorers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated INSERT" 
ON goal_scorers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated UPDATE" 
ON goal_scorers 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated DELETE" 
ON goal_scorers 
FOR DELETE 
TO authenticated
USING (true);

-- Step 3: Also create policies for PUBLIC (covers anon and everyone else)
CREATE POLICY "Public SELECT" 
ON goal_scorers 
FOR SELECT 
TO PUBLIC
USING (true);

CREATE POLICY "Public INSERT" 
ON goal_scorers 
FOR INSERT 
TO PUBLIC
WITH CHECK (true);

CREATE POLICY "Public UPDATE" 
ON goal_scorers 
FOR UPDATE 
TO PUBLIC
USING (true)
WITH CHECK (true);

CREATE POLICY "Public DELETE" 
ON goal_scorers 
FOR DELETE 
TO PUBLIC
USING (true);

-- Step 4: Grant ALL permissions
GRANT ALL ON goal_scorers TO PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO PUBLIC, anon, authenticated;

-- Step 5: Verify - should show 8 policies (4 for authenticated, 4 for PUBLIC)
SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'goal_scorers'
ORDER BY roles, cmd, policyname;

