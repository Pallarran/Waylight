-- Collaborative Trip Sharing Migration
-- Run this SQL in your Supabase SQL Editor

-- 1. Add collaboration columns to existing trips table
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_modified_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS version integer DEFAULT 0;

-- 2. Create trip_collaborators table
CREATE TABLE IF NOT EXISTS trip_collaborators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level text NOT NULL CHECK (permission_level IN ('view', 'edit', 'admin')),
    invited_by uuid NOT NULL REFERENCES auth.users(id),
    joined_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(trip_id, user_id) -- Prevent duplicate collaborators
);

-- 3. Create trip_invitations table
CREATE TABLE IF NOT EXISTS trip_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    invited_email text NOT NULL,
    invited_by uuid NOT NULL REFERENCES auth.users(id),
    permission_level text NOT NULL CHECK (permission_level IN ('view', 'edit', 'admin')),
    invitation_token text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at timestamptz NOT NULL,
    message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(trip_id, invited_email, status) -- Prevent duplicate pending invitations
);

-- 4. Create trip_activity_log table
CREATE TABLE IF NOT EXISTS trip_activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    action_type text NOT NULL CHECK (action_type IN ('created', 'updated', 'shared', 'joined', 'left', 'item_added', 'item_removed', 'item_updated')),
    description text NOT NULL,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_trip_id ON trip_collaborators(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_collaborators_user_id ON trip_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_trip_id ON trip_invitations(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_email ON trip_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_token ON trip_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_trip_invitations_status ON trip_invitations(status);
CREATE INDEX IF NOT EXISTS idx_trip_activity_log_trip_id ON trip_activity_log(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_activity_log_user_id ON trip_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_activity_log_created_at ON trip_activity_log(created_at DESC);

-- 6. Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_trip_collaborators_updated_at ON trip_collaborators;
CREATE TRIGGER update_trip_collaborators_updated_at
    BEFORE UPDATE ON trip_collaborators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_invitations_updated_at ON trip_invitations;
CREATE TRIGGER update_trip_invitations_updated_at
    BEFORE UPDATE ON trip_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Set up Row Level Security (RLS) policies

-- Enable RLS on all collaboration tables
ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for trip_collaborators table
DROP POLICY IF EXISTS "Users can view collaborators for trips they have access to" ON trip_collaborators;
CREATE POLICY "Users can view collaborators for trips they have access to" ON trip_collaborators
    FOR SELECT USING (
        trip_id IN (
            SELECT id FROM trips WHERE user_id = auth.uid()
            UNION
            SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Trip owners and admins can manage collaborators" ON trip_collaborators;
CREATE POLICY "Trip owners and admins can manage collaborators" ON trip_collaborators
    FOR ALL USING (
        trip_id IN (
            SELECT id FROM trips WHERE user_id = auth.uid()
            UNION
            SELECT trip_id FROM trip_collaborators
            WHERE user_id = auth.uid() AND permission_level = 'admin'
        )
    );

-- Policies for trip_invitations table
DROP POLICY IF EXISTS "Users can view invitations for their trips" ON trip_invitations;
CREATE POLICY "Users can view invitations for their trips" ON trip_invitations
    FOR SELECT USING (
        trip_id IN (
            SELECT id FROM trips WHERE user_id = auth.uid()
            UNION
            SELECT trip_id FROM trip_collaborators
            WHERE user_id = auth.uid() AND permission_level IN ('admin', 'edit')
        )
        OR invited_email = auth.email()
    );

DROP POLICY IF EXISTS "Trip owners and admins can manage invitations" ON trip_invitations;
CREATE POLICY "Trip owners and admins can manage invitations" ON trip_invitations
    FOR INSERT WITH CHECK (
        trip_id IN (
            SELECT id FROM trips WHERE user_id = auth.uid()
            UNION
            SELECT trip_id FROM trip_collaborators
            WHERE user_id = auth.uid() AND permission_level = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can update invitations sent to them" ON trip_invitations;
CREATE POLICY "Users can update invitations sent to them" ON trip_invitations
    FOR UPDATE USING (invited_email = auth.email());

-- Policies for trip_activity_log table
DROP POLICY IF EXISTS "Users can view activity for trips they have access to" ON trip_activity_log;
CREATE POLICY "Users can view activity for trips they have access to" ON trip_activity_log
    FOR SELECT USING (
        trip_id IN (
            SELECT id FROM trips WHERE user_id = auth.uid()
            UNION
            SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create activity logs for trips they can edit" ON trip_activity_log;
CREATE POLICY "Users can create activity logs for trips they can edit" ON trip_activity_log
    FOR INSERT WITH CHECK (
        trip_id IN (
            SELECT id FROM trips WHERE user_id = auth.uid()
            UNION
            SELECT trip_id FROM trip_collaborators
            WHERE user_id = auth.uid() AND permission_level IN ('admin', 'edit')
        )
    );

-- 9. Update trips table RLS to include shared trips
DROP POLICY IF EXISTS "Users can view their own trips and shared trips" ON trips;
CREATE POLICY "Users can view their own trips and shared trips" ON trips
    FOR SELECT USING (
        user_id = auth.uid()
        OR id IN (
            SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
        )
    );

-- Keep existing policies for trip modifications (only owners can modify)
-- Collaborators will update through the collaboration service with proper permission checks

-- 10. Create a function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE trip_invitations
    SET status = 'expired', updated_at = now()
    WHERE status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- 11. Create a helper function to check if user can access trip
CREATE OR REPLACE FUNCTION user_can_access_trip(trip_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trips WHERE id = user_can_access_trip.trip_id AND user_id = user_can_access_trip.user_id
        UNION
        SELECT 1 FROM trip_collaborators
        WHERE trip_id = user_can_access_trip.trip_id AND user_id = user_can_access_trip.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Add some helpful views for easier querying
CREATE OR REPLACE VIEW trip_collaboration_summary AS
SELECT
    t.id as trip_id,
    t.name as trip_name,
    t.user_id as owner_id,
    p_owner.email as owner_email,
    p_owner.full_name as owner_name,
    t.is_shared,
    t.version,
    t.last_modified_by,
    p_modifier.email as last_modified_by_email,
    COUNT(tc.id) as collaborator_count,
    COUNT(CASE WHEN ti.status = 'pending' THEN 1 END) as pending_invitations
FROM trips t
LEFT JOIN auth.users u_owner ON t.user_id = u_owner.id
LEFT JOIN profiles p_owner ON t.user_id = p_owner.id
LEFT JOIN auth.users u_modifier ON t.last_modified_by = u_modifier.id
LEFT JOIN profiles p_modifier ON t.last_modified_by = p_modifier.id
LEFT JOIN trip_collaborators tc ON t.id = tc.trip_id
LEFT JOIN trip_invitations ti ON t.id = ti.trip_id AND ti.status = 'pending'
GROUP BY t.id, t.name, t.user_id, p_owner.email, p_owner.full_name,
         t.is_shared, t.version, t.last_modified_by, p_modifier.email;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trip_collaborators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trip_invitations TO authenticated;
GRANT SELECT, INSERT ON trip_activity_log TO authenticated;
GRANT SELECT ON trip_collaboration_summary TO authenticated;

-- Insert initial activity log entries for existing trips (optional)
INSERT INTO trip_activity_log (trip_id, user_id, action_type, description, metadata)
SELECT
    id,
    user_id,
    'created',
    'Trip was created',
    jsonb_build_object('initial_migration', true)
FROM trips
WHERE NOT EXISTS (
    SELECT 1 FROM trip_activity_log
    WHERE trip_id = trips.id AND action_type = 'created'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Collaboration migration completed successfully!';
    RAISE NOTICE 'New tables created: trip_collaborators, trip_invitations, trip_activity_log';
    RAISE NOTICE 'Trips table updated with collaboration columns';
    RAISE NOTICE 'RLS policies configured for secure access';
    RAISE NOTICE 'Indexes created for optimal performance';
END $$;