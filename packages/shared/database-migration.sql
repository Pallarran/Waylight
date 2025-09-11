-- Add accommodation and traveling_party columns to trips table
-- Run this in Supabase SQL Editor

ALTER TABLE trips 
ADD COLUMN accommodation JSONB DEFAULT NULL,
ADD COLUMN traveling_party JSONB DEFAULT NULL;

-- Update the existing data to ensure compatibility
UPDATE trips SET 
  accommodation = NULL,
  traveling_party = NULL
WHERE accommodation IS DISTINCT FROM NULL OR traveling_party IS DISTINCT FROM NULL;

-- Add comments for documentation
COMMENT ON COLUMN trips.accommodation IS 'Accommodation details including hotel name, check-in/out dates, confirmation number, etc.';
COMMENT ON COLUMN trips.traveling_party IS 'Array of traveling party members with names, ages, relationships, and special needs';