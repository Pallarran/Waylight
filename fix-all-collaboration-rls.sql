-- Fix RLS for ALL collaboration tables
-- Run this in Supabase SQL Editor

-- Disable RLS on all collaboration tables
ALTER TABLE trip_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_activity_log DISABLE ROW LEVEL SECURITY;

-- Drop all policies on collaboration tables
DO $$
DECLARE
    pol record;
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['trip_collaborators', 'trip_invitations', 'trip_activity_log'])
    LOOP
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON ' || tbl;
        END LOOP;
    END LOOP;
END $$;

-- Show what policies remain
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('trips', 'trip_collaborators', 'trip_invitations', 'trip_activity_log')
ORDER BY tablename, policyname;

-- Show RLS status for all tables
SELECT
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE tablename IN ('trips', 'trip_collaborators', 'trip_invitations', 'trip_activity_log')
ORDER BY tablename;