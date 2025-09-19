-- Weather system tables for Waylight
-- These tables store weather forecast data fetched by our Edge Function

-- Weather locations table (for Orlando/Disney World area)
CREATE TABLE weather_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather forecasts table
CREATE TABLE weather_forecasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID REFERENCES weather_locations(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    forecast_time TIMESTAMPTZ NOT NULL, -- When this forecast was made
    temperature_high INTEGER, -- Fahrenheit
    temperature_low INTEGER, -- Fahrenheit
    temperature_feels_like INTEGER, -- Fahrenheit
    humidity INTEGER, -- Percentage
    precipitation_chance INTEGER, -- Percentage 0-100
    precipitation_amount DECIMAL(5,2), -- Inches
    weather_condition TEXT NOT NULL, -- 'clear', 'rain', 'thunderstorm', 'cloudy', etc.
    weather_description TEXT, -- Human readable description
    wind_speed INTEGER, -- mph
    wind_direction INTEGER, -- degrees
    uv_index INTEGER,
    visibility DECIMAL(4,1), -- miles
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure we don't have duplicate forecasts for same location/date
    UNIQUE(location_id, forecast_date)
);

-- Weather recommendations table (for weather-specific attraction suggestions)
CREATE TABLE weather_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    weather_condition TEXT NOT NULL,
    recommendation_type TEXT NOT NULL, -- 'indoor_attraction', 'outdoor_avoid', 'clothing', 'general'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority INTEGER DEFAULT 1, -- 1-5, higher is more important
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_weather_forecasts_location_date ON weather_forecasts(location_id, forecast_date);
CREATE INDEX idx_weather_forecasts_date ON weather_forecasts(forecast_date);
CREATE INDEX idx_weather_forecasts_condition ON weather_forecasts(weather_condition);
CREATE INDEX idx_weather_recommendations_condition ON weather_recommendations(weather_condition, is_active);

-- Insert Orlando/Disney World location
INSERT INTO weather_locations (name, latitude, longitude, description) VALUES
(
    'Walt Disney World',
    28.3852,
    -81.5639,
    'Walt Disney World Resort area in Orlando, Florida'
);

-- Insert some default weather recommendations
INSERT INTO weather_recommendations (weather_condition, recommendation_type, title, description, priority) VALUES
-- Rain recommendations
('rain', 'indoor_attraction', 'Indoor Attractions', 'Focus on indoor attractions and shows to stay dry', 5),
('rain', 'clothing', 'Rain Gear', 'Bring umbrella, poncho, and waterproof shoes', 4),
('rain', 'general', 'Plan Indoor Dining', 'Consider table service restaurants for longer indoor breaks', 3),

-- Thunderstorm recommendations
('thunderstorm', 'indoor_attraction', 'Indoor Activities Only', 'Outdoor attractions may close during storms', 5),
('thunderstorm', 'general', 'Monitor Weather Alerts', 'Stay indoors and monitor park announcements', 5),

-- Hot weather recommendations
('clear', 'general', 'Heat Precautions', 'Stay hydrated and take breaks in air conditioning', 4),
('clear', 'clothing', 'Sun Protection', 'Wear sunscreen, hat, and light-colored clothing', 4),

-- Cloudy/overcast recommendations
('clouds', 'general', 'Great Weather for Walking', 'Comfortable conditions for outdoor attractions', 2),
('clouds', 'general', 'Good Photo Conditions', 'Overcast skies provide even lighting for photos', 1);

-- Row Level Security (RLS) policies
ALTER TABLE weather_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_recommendations ENABLE ROW LEVEL SECURITY;

-- Allow read access to weather data for all authenticated users
CREATE POLICY "Weather locations are viewable by all authenticated users" ON weather_locations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Weather forecasts are viewable by all authenticated users" ON weather_forecasts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Weather recommendations are viewable by all authenticated users" ON weather_recommendations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only service role can insert/update weather data (from Edge Functions)
CREATE POLICY "Weather data can be modified by service role" ON weather_locations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Weather forecasts can be modified by service role" ON weather_forecasts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Weather recommendations can be modified by service role" ON weather_recommendations
    FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_weather_locations_updated_at BEFORE UPDATE ON weather_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weather_forecasts_updated_at BEFORE UPDATE ON weather_forecasts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weather_recommendations_updated_at BEFORE UPDATE ON weather_recommendations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();