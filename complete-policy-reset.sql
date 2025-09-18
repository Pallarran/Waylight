-- Complete RLS policy reset for trips table
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily to clear everything
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on trips table
DROP POLICY IF EXISTS "Users can view trips they own or collaborate on" ON trips;
DROP POLICY IF EXISTS "Users can update trips they own or can edit" ON trips;
DROP POLICY IF EXISTS "Users can delete trips they own" ON trips;
DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Users can view shared trips they collaborate on" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Users can update shared trips with edit permission" ON trips;
DROP POLICY IF EXISTS "Admins can delete shared trips" ON trips;

-- Re-enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Start with just basic ownership - no collaboration for now
CREATE POLICY "trips_select_own" ON trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trips_insert_own" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trips_update_own" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trips_delete_own" ON trips FOR DELETE USING (auth.uid() = user_id);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'trips';