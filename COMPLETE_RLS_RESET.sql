-- Complete RLS Reset for goal_scorers
-- This completely resets RLS to the most permissive state possible

-- Step 1: Disable RLS completely (temporary)
ALTER TABLE goal_scorers DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant ALL permissions to everyone
GRANT ALL ON goal_scorers TO PUBLIC;
GRANT ALL ON goal_scorers TO anon;
GRANT ALL ON goal_scorers TO authenticated;
GRANT ALL ON goal_scorers TO service_role;

-- Step 3: Drop ALL existing policies (clean slate)
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

-- Step 4: Re-enable RLS
ALTER TABLE goal_scorers ENABLE ROW LEVEL SECURITY;

-- Step 5: Create the most permissive policies possible
-- These allow ALL operations for ALL roles
CREATE POLICY "Allow all operations for everyone" 
ON goal_scorers 
FOR ALL 
TO PUBLIC
USING (true)
WITH CHECK (true);

-- Step 6: Also create specific policies for each operation (belt and suspenders)
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

-- Step 7: Grant schema usage
GRANT USAGE ON SCHEMA public TO PUBLIC, anon, authenticated, service_role;

-- Step 8: Final permissions
GRANT ALL ON goal_scorers TO PUBLIC, anon, authenticated, service_role;

-- Step 9: Verify everything
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'goal_scorers';

SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'goal_scorers'
ORDER BY cmd, policyname;

-- Should show RLS enabled and 5 policies (ALL + SELECT + INSERT + UPDATE + DELETE)

