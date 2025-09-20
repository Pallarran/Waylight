-- Remove restrictive date constraints to allow importing future year data
-- This allows importing 2025 Thrill Data predictions from current date

-- Drop the existing constraints
ALTER TABLE park_crowd_predictions
DROP CONSTRAINT IF EXISTS park_crowd_predictions_prediction_date_check;

ALTER TABLE park_crowd_predictions
DROP CONSTRAINT IF EXISTS park_crowd_predictions_prediction_date_check1;

-- Add a more reasonable constraint - just ensure dates are valid and not too far in the past/future
-- Allow 10 years in the past and 5 years in the future from current date
ALTER TABLE park_crowd_predictions
ADD CONSTRAINT park_crowd_predictions_prediction_date_valid
CHECK (
  prediction_date >= (CURRENT_DATE - INTERVAL '10 years') AND
  prediction_date <= (CURRENT_DATE + INTERVAL '5 years')
);

COMMENT ON CONSTRAINT park_crowd_predictions_prediction_date_valid ON park_crowd_predictions
IS 'Ensure prediction dates are within reasonable range (current date ±10/+5 years)';