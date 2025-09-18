-- Fix infinite recursion in RLS policies (without status column)
-- Run this in Supabase SQL Editor

-- First, drop the existing policies that are causing recursion
DROP POLICY IF EXISTS "Users can view trips they own or collaborate on" ON trips;
DROP POLICY IF EXISTS "Users can update trips they own or can edit" ON trips;
DROP POLICY IF EXISTS "Users can delete trips they own" ON trips;
DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;

-- Recreate simpler policies without recursion and without status column
-- Policy for viewing trips (owned + collaborated)
CREATE POLICY "Users can view their own trips"
ON trips FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared trips they collaborate on"
ON trips FOR SELECT
USING (
  is_shared = true
  AND EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_collaborators.trip_id = trips.id
    AND trip_collaborators.user_id = auth.uid()
  )
);

-- Policy for updating trips
CREATE POLICY "Users can update their own trips"
ON trips FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update shared trips with edit permission"
ON trips FOR UPDATE
USING (
  is_shared = true
  AND EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_collaborators.trip_id = trips.id
    AND trip_collaborators.user_id = auth.uid()
    AND trip_collaborators.permission_level IN ('edit', 'admin')
  )
);

-- Policy for inserting trips
CREATE POLICY "Users can insert their own trips"
ON trips FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for deleting trips
CREATE POLICY "Users can delete their own trips"
ON trips FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete shared trips"
ON trips FOR DELETE
USING (
  is_shared = true
  AND EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_collaborators.trip_id = trips.id
    AND trip_collaborators.user_id = auth.uid()
    AND trip_collaborators.permission_level = 'admin'
  )
);