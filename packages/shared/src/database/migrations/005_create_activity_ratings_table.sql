-- Activity Ratings Migration
-- This creates the database tables for storing group member ratings of attractions

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Activity Ratings Table
-- Stores individual ratings from party members for specific attractions
CREATE TABLE IF NOT EXISTS activity_ratings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid NOT NULL,
  party_member_id text NOT NULL, -- References traveling_party_member.id from trips
  attraction_id text NOT NULL, -- References attraction data (rides, shows, dining, etc.)
  activity_type text NOT NULL CHECK (activity_type IN ('ride', 'show', 'dining', 'meet_greet', 'shopping', 'attraction', 'waterpark', 'tours', 'special_events')),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
  preference_type text CHECK (preference_type IN ('must_do', 'want_to_do', 'neutral', 'skip', 'avoid')),
  notes text, -- Optional notes from the party member
  height_restriction_ok boolean DEFAULT true, -- Whether party member meets height requirements
  intensity_comfortable boolean DEFAULT true, -- Whether party member is comfortable with intensity level
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(trip_id, party_member_id, attraction_id)
);

-- Activity Rating Summary Table (for quick aggregation queries)
-- Pre-computed summary data for each attraction across all party members in a trip
CREATE TABLE IF NOT EXISTS activity_rating_summaries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id uuid NOT NULL,
  attraction_id text NOT NULL,
  activity_type text NOT NULL,
  average_rating numeric(3,2), -- Average rating across all party members
  rating_count integer DEFAULT 0, -- Number of ratings
  must_do_count integer DEFAULT 0, -- Number of party members who marked as must-do
  avoid_count integer DEFAULT 0, -- Number of party members who want to avoid
  consensus_level text CHECK (consensus_level IN ('high', 'medium', 'low', 'conflict')), -- How much agreement there is
  height_restricted_count integer DEFAULT 0, -- Number of party members who can't ride due to height
  intensity_concerns_count integer DEFAULT 0, -- Number of party members uncomfortable with intensity
  last_calculated_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(trip_id, attraction_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_ratings_trip_id ON activity_ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_activity_ratings_party_member_id ON activity_ratings(party_member_id);
CREATE INDEX IF NOT EXISTS idx_activity_ratings_attraction_id ON activity_ratings(attraction_id);
CREATE INDEX IF NOT EXISTS idx_activity_ratings_activity_type ON activity_ratings(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_ratings_rating ON activity_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_activity_ratings_preference_type ON activity_ratings(preference_type);

CREATE INDEX IF NOT EXISTS idx_activity_rating_summaries_trip_id ON activity_rating_summaries(trip_id);
CREATE INDEX IF NOT EXISTS idx_activity_rating_summaries_attraction_id ON activity_rating_summaries(attraction_id);
CREATE INDEX IF NOT EXISTS idx_activity_rating_summaries_activity_type ON activity_rating_summaries(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_rating_summaries_average_rating ON activity_rating_summaries(average_rating);
CREATE INDEX IF NOT EXISTS idx_activity_rating_summaries_consensus_level ON activity_rating_summaries(consensus_level);

-- Function to automatically update the updated_at timestamp
-- (Reuse the existing function if it exists, otherwise create it)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at on row changes
CREATE TRIGGER update_activity_ratings_updated_at
  BEFORE UPDATE ON activity_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_rating_summaries_updated_at
  BEFORE UPDATE ON activity_rating_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate consensus level based on ratings variance
CREATE OR REPLACE FUNCTION calculate_consensus_level(ratings integer[])
RETURNS text AS $$
DECLARE
  rating_variance numeric;
  rating_avg numeric;
  rating_count integer;
BEGIN
  rating_count := array_length(ratings, 1);

  -- Not enough data
  IF rating_count IS NULL OR rating_count < 2 THEN
    RETURN 'medium';
  END IF;

  -- Calculate average
  SELECT AVG(val) INTO rating_avg FROM unnest(ratings) AS val;

  -- Calculate variance
  SELECT AVG((val - rating_avg) * (val - rating_avg)) INTO rating_variance
  FROM unnest(ratings) AS val;

  -- Determine consensus level based on variance
  CASE
    WHEN rating_variance <= 0.5 THEN RETURN 'high';
    WHEN rating_variance <= 1.5 THEN RETURN 'medium';
    WHEN rating_variance <= 3.0 THEN RETURN 'low';
    ELSE RETURN 'conflict';
  END CASE;
END;
$$ language 'plpgsql';

-- Function to recalculate rating summary for a specific trip and attraction
CREATE OR REPLACE FUNCTION recalculate_rating_summary(p_trip_id uuid, p_attraction_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  rating_data RECORD;
  ratings_array integer[];
  consensus text;
BEGIN
  -- Gather rating data
  SELECT
    array_agg(rating) as ratings,
    AVG(rating::numeric) as avg_rating,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE preference_type = 'must_do') as must_do_count,
    COUNT(*) FILTER (WHERE preference_type = 'avoid') as avoid_count,
    COUNT(*) FILTER (WHERE height_restriction_ok = false) as height_restricted_count,
    COUNT(*) FILTER (WHERE intensity_comfortable = false) as intensity_concerns_count,
    (array_agg(activity_type))[1] as activity_type -- Get activity type from first record
  INTO rating_data
  FROM activity_ratings
  WHERE trip_id = p_trip_id AND attraction_id = p_attraction_id;

  -- Skip if no ratings found
  IF rating_data.total_count = 0 OR rating_data.total_count IS NULL THEN
    DELETE FROM activity_rating_summaries
    WHERE trip_id = p_trip_id AND attraction_id = p_attraction_id;
    RETURN;
  END IF;

  -- Calculate consensus
  consensus := calculate_consensus_level(rating_data.ratings);

  -- Insert or update summary
  INSERT INTO activity_rating_summaries (
    trip_id,
    attraction_id,
    activity_type,
    average_rating,
    rating_count,
    must_do_count,
    avoid_count,
    consensus_level,
    height_restricted_count,
    intensity_concerns_count,
    last_calculated_at
  ) VALUES (
    p_trip_id,
    p_attraction_id,
    rating_data.activity_type,
    rating_data.avg_rating,
    rating_data.total_count,
    rating_data.must_do_count,
    rating_data.avoid_count,
    consensus,
    rating_data.height_restricted_count,
    rating_data.intensity_concerns_count,
    NOW()
  )
  ON CONFLICT (trip_id, attraction_id)
  DO UPDATE SET
    activity_type = EXCLUDED.activity_type,
    average_rating = EXCLUDED.average_rating,
    rating_count = EXCLUDED.rating_count,
    must_do_count = EXCLUDED.must_do_count,
    avoid_count = EXCLUDED.avoid_count,
    consensus_level = EXCLUDED.consensus_level,
    height_restricted_count = EXCLUDED.height_restricted_count,
    intensity_concerns_count = EXCLUDED.intensity_concerns_count,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = NOW();
END;
$$;

-- Trigger function to automatically update summaries when ratings change
CREATE OR REPLACE FUNCTION update_rating_summary_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM recalculate_rating_summary(NEW.trip_id, NEW.attraction_id);
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_rating_summary(OLD.trip_id, OLD.attraction_id);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Trigger to automatically maintain rating summaries
CREATE TRIGGER maintain_rating_summaries
  AFTER INSERT OR UPDATE OR DELETE ON activity_ratings
  FOR EACH ROW EXECUTE FUNCTION update_rating_summary_trigger();

-- Row Level Security (RLS) - Users can only access ratings for their own trips
ALTER TABLE activity_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_rating_summaries ENABLE ROW LEVEL SECURITY;

-- Policies for activity ratings (users can only access ratings for trips they can access)
-- Note: This assumes there's a way to determine trip ownership.
-- The exact policy will depend on your existing trip access control.
CREATE POLICY "Users can manage their trip ratings" ON activity_ratings
  FOR ALL USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their trip rating summaries" ON activity_rating_summaries
  FOR SELECT USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Allow system/triggers to manage rating summaries
CREATE POLICY "System can manage rating summaries" ON activity_rating_summaries
  FOR ALL TO postgres USING (true);

-- Allow authenticated users to insert/update summaries for their trips
CREATE POLICY "Users can manage their trip rating summaries" ON activity_rating_summaries
  FOR ALL USING (
    trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE activity_ratings IS 'Individual ratings and preferences for attractions by trip party members';
COMMENT ON TABLE activity_rating_summaries IS 'Pre-calculated summary statistics for attraction ratings per trip';
COMMENT ON FUNCTION recalculate_rating_summary(uuid, text) IS 'Recalculates rating summary for a specific trip and attraction';
COMMENT ON FUNCTION calculate_consensus_level(integer[]) IS 'Determines consensus level (high/medium/low/conflict) based on rating variance';