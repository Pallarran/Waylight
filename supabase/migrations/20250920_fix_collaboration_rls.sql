-- Final fix for RLS policies - proper collaboration setup

-- First ensure all collaboration tables exist
CREATE TABLE IF NOT EXISTS trip_collaborators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level text NOT NULL CHECK (permission_level IN ('view', 'edit', 'admin')),
    invited_by uuid NOT NULL REFERENCES auth.users(id),
    joined_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(trip_id, user_id)
);

CREATE TABLE IF NOT EXISTS trip_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    invited_email text NOT NULL,
    invited_by uuid NOT NULL REFERENCES auth.users(id),
    permission_level text NOT NULL CHECK (permission_level IN ('view', 'edit', 'admin')),
    invitation_token text NOT NULL UNIQUE,
    message text,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Users can view shared trips they collaborate on" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Users can update shared trips with edit permission" ON trips;
DROP POLICY IF EXISTS "Users can insert their own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;
DROP POLICY IF EXISTS "Admins can delete shared trips" ON trips;

-- Create simple, non-recursive policies for trips
CREATE POLICY "trip_owners_full_access" ON trips
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "collaborators_can_view_trips" ON trips
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_collaborators.trip_id = trips.id
    AND trip_collaborators.user_id = auth.uid()
  )
);

CREATE POLICY "collaborators_can_edit_trips" ON trips
FOR UPDATE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM trip_collaborators
    WHERE trip_collaborators.trip_id = trips.id
    AND trip_collaborators.user_id = auth.uid()
    AND trip_collaborators.permission_level IN ('edit', 'admin')
  )
);

-- Policies for trip_collaborators
CREATE POLICY "collaborators_can_view_trip_collaborators" ON trip_collaborators
FOR SELECT
USING (
  user_id = auth.uid() OR
  invited_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_collaborators.trip_id
    AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "trip_owners_manage_collaborators" ON trip_collaborators
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_collaborators.trip_id
    AND trips.user_id = auth.uid()
  )
);

-- Policies for trip_invitations
CREATE POLICY "invitation_management" ON trip_invitations
FOR ALL
USING (
  invited_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM trips
    WHERE trips.id = trip_invitations.trip_id
    AND trips.user_id = auth.uid()
  )
);

CREATE POLICY "invited_users_can_view_invitations" ON trip_invitations
FOR SELECT
USING (true); -- Allow public read for invitation tokens