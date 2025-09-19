import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({
        success: false,
        message: 'Missing Supabase configuration'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check for weather locations
    const { data: locations, error: locationError } = await supabase
      .from('weather_locations')
      .select('*')
      .limit(5);

    if (locationError) {
      return Response.json({
        success: false,
        message: `Error querying locations: ${locationError.message}`,
        hasData: false
      });
    }

    // Check for weather forecasts
    const { data: forecasts, error: forecastError } = await supabase
      .from('weather_forecasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (forecastError) {
      return Response.json({
        success: false,
        message: `Error querying forecasts: ${forecastError.message}`,
        hasData: false
      });
    }

    // Check for weather recommendations
    const { data: recommendations, error: recError } = await supabase
      .from('weather_recommendations')
      .select('*')
      .limit(5);

    if (recError) {
      return Response.json({
        success: false,
        message: `Error querying recommendations: ${recError.message}`,
        hasData: false
      });
    }

    const hasData = locations.length > 0 && forecasts.length > 0 && recommendations.length > 0;

    return Response.json({
      success: true,
      hasData,
      message: hasData
        ? `Found ${locations.length} locations, ${forecasts.length} forecasts, ${recommendations.length} recommendations`
        : 'Weather tables exist but no data found. Run the Edge Function to populate data.',
      data: {
        locations: locations.length,
        forecasts: forecasts.length,
        recommendations: recommendations.length,
        latestForecast: forecasts[0] || null
      }
    });

  } catch (error) {
    return Response.json({
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      hasData: false
    }, { status: 500 });
  }
}