-- Working RLS policies that allow basic trip access
-- Run this in Supabase SQL Editor

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "trip_owners_full_access" ON trips;
DROP POLICY IF EXISTS "collaborators_can_view_trips" ON trips;
DROP POLICY IF EXISTS "collaborators_can_edit_trips" ON trips;
DROP POLICY IF EXISTS "collaborators_can_view_trip_collaborators" ON trip_collaborators;
DROP POLICY IF EXISTS "trip_owners_manage_collaborators" ON trip_collaborators;
DROP POLICY IF EXISTS "invitation_management" ON trip_invitations;
DROP POLICY IF EXISTS "invited_users_can_view_invitations" ON trip_invitations;

-- Simple policy: Users can access their own trips
CREATE POLICY "users_own_trips" ON trips
FOR ALL
USING (auth.uid() = user_id);

-- Simple policy: Users can view collaborators on their trips
CREATE POLICY "trip_collaborators_access" ON trip_collaborators
FOR ALL
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_collaborators.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- Simple policy: Users can manage invitations they created or for their trips
CREATE POLICY "trip_invitations_access" ON trip_invitations
FOR ALL
USING (
  auth.uid() = invited_by OR
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_invitations.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- Allow public read for invitation tokens (needed for invitation acceptance)
CREATE POLICY "public_invitation_read" ON trip_invitations
FOR SELECT
USING (true);

-- Verify policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('trips', 'trip_collaborators', 'trip_invitations')
ORDER BY tablename, policyname;