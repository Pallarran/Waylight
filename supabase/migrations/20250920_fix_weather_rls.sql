-- Fix weather RLS policies to allow anonymous access
-- Weather data should be readable by anyone since it's public information

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Weather locations are viewable by all authenticated users" ON weather_locations;
DROP POLICY IF EXISTS "Weather forecasts are viewable by all authenticated users" ON weather_forecasts;
DROP POLICY IF EXISTS "Weather recommendations are viewable by all authenticated users" ON weather_recommendations;

-- Create new policies that allow both authenticated and anonymous access
CREATE POLICY "Weather locations are publicly viewable" ON weather_locations
    FOR SELECT USING (true);

CREATE POLICY "Weather forecasts are publicly viewable" ON weather_forecasts
    FOR SELECT USING (true);

CREATE POLICY "Weather recommendations are publicly viewable" ON weather_recommendations
    FOR SELECT USING (true);