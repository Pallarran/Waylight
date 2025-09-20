-- Fix RLS for park_crowd_predictions table to allow authenticated users to insert/update
-- This enables the crowd data import feature to work from the client

-- First, create the table if it doesn't exist (in case migration 004 wasn't run yet)
CREATE TABLE IF NOT EXISTS park_crowd_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  park_id TEXT NOT NULL,
  prediction_date DATE NOT NULL,
  crowd_level INTEGER NOT NULL CHECK (crowd_level >= 1 AND crowd_level <= 10),
  crowd_level_description TEXT NOT NULL,
  recommendation TEXT,
  data_source TEXT DEFAULT 'queue_times_api' NOT NULL,
  confidence_score DECIMAL(3,2), -- For future API enhancements
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(park_id, prediction_date),
  CHECK (prediction_date >= CURRENT_DATE), -- Only future predictions
  CHECK (prediction_date <= CURRENT_DATE + INTERVAL '180 days') -- Max 6 months
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_park_crowd_predictions_park_date ON park_crowd_predictions(park_id, prediction_date);
CREATE INDEX IF NOT EXISTS idx_park_crowd_predictions_date ON park_crowd_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_park_crowd_predictions_park_level ON park_crowd_predictions(park_id, crowd_level);

-- Range queries for trip planning
CREATE INDEX IF NOT EXISTS idx_park_crowd_predictions_date_range ON park_crowd_predictions(prediction_date, crowd_level);
-- Note: Removed the partial index with CURRENT_DATE as it's not immutable
-- The regular date index above will be sufficient for query performance

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_park_crowd_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS park_crowd_predictions_updated_at ON park_crowd_predictions;
CREATE TRIGGER park_crowd_predictions_updated_at
  BEFORE UPDATE ON park_crowd_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_park_crowd_predictions_updated_at();

-- Enable Row Level Security
ALTER TABLE park_crowd_predictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for park_crowd_predictions" ON park_crowd_predictions;
DROP POLICY IF EXISTS "Service role full access for park_crowd_predictions" ON park_crowd_predictions;
DROP POLICY IF EXISTS "Authenticated users can manage crowd predictions" ON park_crowd_predictions;

-- Create policies for public read access (crowd data is public information)
CREATE POLICY "Public read access for park_crowd_predictions"
  ON park_crowd_predictions FOR SELECT TO public USING (true);

-- Create policy for service role to have full access
CREATE POLICY "Service role full access for park_crowd_predictions"
  ON park_crowd_predictions FOR ALL TO service_role USING (true);

-- Allow authenticated users to insert and update crowd predictions
-- This enables the import feature to work from the client side
CREATE POLICY "Authenticated users can manage crowd predictions"
  ON park_crowd_predictions FOR ALL TO authenticated USING (true);

-- Function to clean old predictions (run via cron or cleanup job)
CREATE OR REPLACE FUNCTION cleanup_old_crowd_predictions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete predictions older than yesterday
  DELETE FROM park_crowd_predictions
  WHERE prediction_date < CURRENT_DATE;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the cleanup
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Cleaned up % old crowd predictions', deleted_count;
  END IF;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE park_crowd_predictions IS '180-day crowd level forecasts for theme park trip planning';
COMMENT ON COLUMN park_crowd_predictions.park_id IS 'Internal park identifier (magic-kingdom, epcot, etc.)';
COMMENT ON COLUMN park_crowd_predictions.prediction_date IS 'The date this crowd prediction applies to';
COMMENT ON COLUMN park_crowd_predictions.crowd_level IS 'Crowd level from 1 (very low) to 10 (very high)';
COMMENT ON COLUMN park_crowd_predictions.crowd_level_description IS 'Human-readable crowd level (Very Low, Low, Moderate, High, Very High)';
COMMENT ON COLUMN park_crowd_predictions.recommendation IS 'Trip planning recommendation based on crowd level';
COMMENT ON COLUMN park_crowd_predictions.data_source IS 'Source of the crowd prediction (queue_times_api, estimated, etc.)';
COMMENT ON COLUMN park_crowd_predictions.confidence_score IS 'API confidence score (0.00-1.00) if available';
COMMENT ON COLUMN park_crowd_predictions.synced_at IS 'When this prediction was last synced from external source';

-- Add initial sync status for crowd predictions
INSERT INTO live_sync_status (service_name, last_sync_at, total_syncs, successful_syncs, failed_syncs)
VALUES ('crowd_predictions', NOW() - INTERVAL '1 day', 0, 0, 0)
ON CONFLICT (service_name) DO NOTHING;