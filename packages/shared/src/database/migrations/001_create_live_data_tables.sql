-- Live Data Tables Migration
-- This creates the database tables for storing live theme park data

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Live Parks Table
-- Stores real-time park information (hours, status, crowd levels)
CREATE TABLE IF NOT EXISTS live_parks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  park_id text NOT NULL UNIQUE, -- Our internal park ID (e.g., 'magic-kingdom')
  external_id text NOT NULL UNIQUE, -- ThemeParks.wiki entity ID
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('operating', 'closed', 'limited')),
  regular_open time NOT NULL,
  regular_close time NOT NULL,
  early_entry_open time,
  extended_evening_close time,
  crowd_level integer CHECK (crowd_level >= 1 AND crowd_level <= 10),
  last_updated timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Live Attractions Table
-- Stores real-time attraction data (wait times, status, Lightning Lane info)
CREATE TABLE IF NOT EXISTS live_attractions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  park_id text NOT NULL REFERENCES live_parks(park_id) ON DELETE CASCADE,
  external_id text NOT NULL, -- ThemeParks.wiki entity ID
  name text NOT NULL,
  wait_time integer NOT NULL DEFAULT -1, -- -1 means unknown
  status text NOT NULL CHECK (status IN ('operating', 'down', 'delayed', 'temporary_closure')),
  lightning_lane_available boolean DEFAULT false,
  lightning_lane_return_time timestamptz,
  single_rider_available boolean DEFAULT false,
  single_rider_wait_time integer,
  last_updated timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(park_id, external_id)
);

-- Live Entertainment Table
-- Stores real-time show and entertainment data
CREATE TABLE IF NOT EXISTS live_entertainment (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  park_id text NOT NULL REFERENCES live_parks(park_id) ON DELETE CASCADE,
  external_id text NOT NULL, -- ThemeParks.wiki entity ID
  name text NOT NULL,
  show_times text[] DEFAULT '{}', -- Array of show time strings
  status text NOT NULL CHECK (status IN ('operating', 'cancelled', 'delayed')),
  next_show_time timestamptz,
  last_updated timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(park_id, external_id)
);

-- Live Sync Status Table
-- Tracks the status of background sync operations
CREATE TABLE IF NOT EXISTS live_sync_status (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name text NOT NULL UNIQUE, -- 'themeparks_api', 'queue_times_api'
  last_sync_at timestamptz NOT NULL,
  last_success_at timestamptz,
  last_error text,
  total_syncs integer DEFAULT 0,
  successful_syncs integer DEFAULT 0,
  failed_syncs integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_live_parks_park_id ON live_parks(park_id);
CREATE INDEX IF NOT EXISTS idx_live_parks_last_updated ON live_parks(last_updated);

CREATE INDEX IF NOT EXISTS idx_live_attractions_park_id ON live_attractions(park_id);
CREATE INDEX IF NOT EXISTS idx_live_attractions_external_id ON live_attractions(external_id);
CREATE INDEX IF NOT EXISTS idx_live_attractions_last_updated ON live_attractions(last_updated);
CREATE INDEX IF NOT EXISTS idx_live_attractions_status ON live_attractions(status);

CREATE INDEX IF NOT EXISTS idx_live_entertainment_park_id ON live_entertainment(park_id);
CREATE INDEX IF NOT EXISTS idx_live_entertainment_external_id ON live_entertainment(external_id);
CREATE INDEX IF NOT EXISTS idx_live_entertainment_last_updated ON live_entertainment(last_updated);
CREATE INDEX IF NOT EXISTS idx_live_entertainment_status ON live_entertainment(status);

CREATE INDEX IF NOT EXISTS idx_live_sync_status_service_name ON live_sync_status(service_name);
CREATE INDEX IF NOT EXISTS idx_live_sync_status_last_sync_at ON live_sync_status(last_sync_at);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at on row changes
CREATE TRIGGER update_live_parks_updated_at
  BEFORE UPDATE ON live_parks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_attractions_updated_at
  BEFORE UPDATE ON live_attractions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_entertainment_updated_at
  BEFORE UPDATE ON live_entertainment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_sync_status_updated_at
  BEFORE UPDATE ON live_sync_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Allow all users to read live data, but restrict writes
ALTER TABLE live_parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_entertainment ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sync_status ENABLE ROW LEVEL SECURITY;

-- Policies for live data tables (read-only for regular users)
CREATE POLICY "Allow read access to live_parks" ON live_parks FOR SELECT USING (true);
CREATE POLICY "Allow read access to live_attractions" ON live_attractions FOR SELECT USING (true);
CREATE POLICY "Allow read access to live_entertainment" ON live_entertainment FOR SELECT USING (true);
CREATE POLICY "Allow read access to live_sync_status" ON live_sync_status FOR SELECT USING (true);

-- Note: Write access should be restricted to service accounts only
-- These policies can be added later when implementing the background sync service

-- Initial data: Insert sync status records
INSERT INTO live_sync_status (service_name, last_sync_at, total_syncs, successful_syncs, failed_syncs)
VALUES
  ('themeparks_api', NOW() - INTERVAL '1 day', 0, 0, 0),
  ('queue_times_api', NOW() - INTERVAL '1 day', 0, 0, 0)
ON CONFLICT (service_name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE live_parks IS 'Real-time theme park data including hours, status, and crowd levels';
COMMENT ON TABLE live_attractions IS 'Real-time attraction data including wait times and Lightning Lane info';
COMMENT ON TABLE live_entertainment IS 'Real-time entertainment and show schedules';
COMMENT ON TABLE live_sync_status IS 'Status tracking for background data synchronization services';