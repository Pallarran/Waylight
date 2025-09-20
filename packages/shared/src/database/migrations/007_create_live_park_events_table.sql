-- Migration 007: Create live_park_events table for special events
-- This table stores special ticketed events and park-specific events

-- Create the live_park_events table
CREATE TABLE IF NOT EXISTS live_park_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_open TIME,
  event_close TIME,
  description TEXT,
  data_source TEXT DEFAULT 'themeparks_api',
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one event per park per date per type per name
  UNIQUE(park_id, event_date, event_type, event_name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_live_park_events_park_date ON live_park_events(park_id, event_date);
CREATE INDEX IF NOT EXISTS idx_live_park_events_date ON live_park_events(event_date);
CREATE INDEX IF NOT EXISTS idx_live_park_events_park ON live_park_events(park_id);
CREATE INDEX IF NOT EXISTS idx_live_park_events_type ON live_park_events(event_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_live_park_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER live_park_events_updated_at
  BEFORE UPDATE ON live_park_events
  FOR EACH ROW
  EXECUTE FUNCTION update_live_park_events_updated_at();

-- Enable Row Level Security
ALTER TABLE live_park_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is public park data)
CREATE POLICY "Public read access for live_park_events" ON live_park_events
  FOR SELECT TO public USING (true);

-- Create policy for service role to insert/update/delete
CREATE POLICY "Service role full access for live_park_events" ON live_park_events
  FOR ALL TO service_role USING (true);

-- Add helpful comments
COMMENT ON TABLE live_park_events IS 'Special ticketed events and park-specific events';
COMMENT ON COLUMN live_park_events.park_id IS 'Internal park identifier (magic-kingdom, epcot, etc.)';
COMMENT ON COLUMN live_park_events.event_date IS 'The date this event occurs';
COMMENT ON COLUMN live_park_events.event_type IS 'Type of event (special_event, ticketed_event, etc.)';
COMMENT ON COLUMN live_park_events.event_name IS 'Name/title of the event';
COMMENT ON COLUMN live_park_events.event_open IS 'Event start time';
COMMENT ON COLUMN live_park_events.event_close IS 'Event end time';
COMMENT ON COLUMN live_park_events.description IS 'Event description from the API';
COMMENT ON COLUMN live_park_events.data_source IS 'Source of the event data (themeparks_api, manual, etc.)';
COMMENT ON COLUMN live_park_events.synced_at IS 'When this event was last synced from external source';