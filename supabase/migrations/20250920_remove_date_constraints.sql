-- Remove restrictive date constraints to allow importing future year data
-- This allows importing 2025 Thrill Data predictions from current date

-- Drop the existing constraints
ALTER TABLE park_crowd_predictions
DROP CONSTRAINT IF EXISTS park_crowd_predictions_prediction_date_check;

ALTER TABLE park_crowd_predictions
DROP CONSTRAINT IF EXISTS park_crowd_predictions_prediction_date_check1;

-- Add a more reasonable constraint - just ensure dates are valid and not too far in the past
ALTER TABLE park_crowd_predictions
ADD CONSTRAINT park_crowd_predictions_prediction_date_valid
CHECK (prediction_date >= '2024-01-01' AND prediction_date <= '2030-12-31');

COMMENT ON CONSTRAINT park_crowd_predictions_prediction_date_valid ON park_crowd_predictions
IS 'Ensure prediction dates are within reasonable range (2024-2030)';