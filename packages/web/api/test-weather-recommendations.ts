import { createWeatherService } from '@waylight/shared';

export async function GET() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({
        success: false,
        message: 'Missing Supabase configuration'
      }, { status: 500 });
    }

    // Test the weather service
    const weatherService = createWeatherService(supabaseUrl, supabaseKey);

    // Test basic functionality
    const location = await weatherService.getDefaultLocation();

    // Test getting recommendations for different weather conditions
    const rainRecs = await weatherService.getRecommendationsForWeather('rain');
    const clearRecs = await weatherService.getRecommendationsForWeather('clear');

    // Test forecast retrieval (try to get today's forecast)
    const today = new Date().toISOString().split('T')[0];
    const forecast = await weatherService.getForecastForDate(today);

    return Response.json({
      success: true,
      message: 'Weather service tests completed successfully',
      data: {
        location: location ? location.name : 'No location found',
        rainRecommendations: rainRecs.length,
        clearRecommendations: clearRecs.length,
        todaysForecast: forecast ? {
          date: forecast.forecastDate,
          condition: forecast.weatherCondition,
          high: forecast.temperatureHigh,
          low: forecast.temperatureLow
        } : 'No forecast available',
        testResults: {
          locationService: !!location,
          recommendationService: rainRecs.length > 0,
          forecastService: true // Service worked even if no data
        }
      }
    });

  } catch (error) {
    return Response.json({
      success: false,
      message: `Weather service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 500 });
  }
}