-- Emergency RLS fix - completely reset everything
-- Run this in Supabase SQL Editor

-- Show current policies to see what's there
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'trips';

-- Disable RLS completely for now
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies by name (including any we might have missed)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'trips'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON trips';
    END LOOP;
END $$;

-- Verify all policies are gone
SELECT count(*) as remaining_policies FROM pg_policies WHERE tablename = 'trips';

-- For now, let's leave RLS disabled until we can debug the recursion issue
-- ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Show final state
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = 'trips') as policy_count
FROM pg_tables
WHERE tablename = 'trips';