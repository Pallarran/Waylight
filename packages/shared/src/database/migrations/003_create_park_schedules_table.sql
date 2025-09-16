-- Migration 003: Create live_park_schedules table for date-specific park hours
-- This table stores park operating hours for specific dates, enabling trip planning

-- Create the live_park_schedules table
CREATE TABLE IF NOT EXISTS live_park_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  regular_open TIME,
  regular_close TIME,
  early_entry_open TIME,
  extended_evening_close TIME,
  data_source TEXT DEFAULT 'themeparks_api',
  is_estimated BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one schedule per park per date
  UNIQUE(park_id, schedule_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_live_park_schedules_park_date ON live_park_schedules(park_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_live_park_schedules_date ON live_park_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_live_park_schedules_park ON live_park_schedules(park_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_live_park_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER live_park_schedules_updated_at
  BEFORE UPDATE ON live_park_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_live_park_schedules_updated_at();

-- Enable Row Level Security
ALTER TABLE live_park_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is public park data)
CREATE POLICY "Public read access for live_park_schedules" ON live_park_schedules
  FOR SELECT TO public USING (true);

-- Create policy for service role to insert/update
CREATE POLICY "Service role full access for live_park_schedules" ON live_park_schedules
  FOR ALL TO service_role USING (true);

-- Add helpful comments
COMMENT ON TABLE live_park_schedules IS 'Date-specific park operating hours for trip planning';
COMMENT ON COLUMN live_park_schedules.park_id IS 'Internal park identifier (magic-kingdom, epcot, etc.)';
COMMENT ON COLUMN live_park_schedules.schedule_date IS 'The specific date these hours apply to';
COMMENT ON COLUMN live_park_schedules.regular_open IS 'Regular park opening time';
COMMENT ON COLUMN live_park_schedules.regular_close IS 'Regular park closing time';
COMMENT ON COLUMN live_park_schedules.early_entry_open IS 'Early entry opening time for eligible guests';
COMMENT ON COLUMN live_park_schedules.extended_evening_close IS 'Extended evening hours closing time';
COMMENT ON COLUMN live_park_schedules.data_source IS 'Source of the schedule data (themeparks_api, estimated, etc.)';
COMMENT ON COLUMN live_park_schedules.is_estimated IS 'Whether this is estimated data when official hours not available';
COMMENT ON COLUMN live_park_schedules.synced_at IS 'When this schedule was last synced from external source';