-- Fix consensus calculation thresholds to be more sensitive to disagreement
-- Current thresholds are too forgiving for significant disagreement

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

  -- Determine consensus level based on variance (updated thresholds)
  CASE
    WHEN rating_variance <= 0.25 THEN RETURN 'high';     -- Very tight agreement (was 0.5)
    WHEN rating_variance <= 1.0 THEN RETURN 'medium';   -- Some agreement (was 1.5)
    WHEN rating_variance <= 2.5 THEN RETURN 'low';      -- Mixed opinions (was 3.0)
    ELSE RETURN 'conflict';                             -- Strong disagreement (>2.5)
  END CASE;
END;
$$ language 'plpgsql';