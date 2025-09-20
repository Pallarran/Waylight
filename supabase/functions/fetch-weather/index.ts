import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OneCallResponse {
  current: {
    dt: number;
    temp: number;
    feels_like: number;
    humidity: number;
    uvi: number;
    visibility: number;
    weather: Array<{
      main: string;
      description: string;
    }>;
    wind_speed: number;
    wind_deg: number;
  };
  daily: Array<{
    dt: number;
    temp: {
      day: number;
      min: number;
      max: number;
      night: number;
      eve: number;
      morn: number;
    };
    feels_like: {
      day: number;
      night: number;
      eve: number;
      morn: number;
    };
    humidity: number;
    wind_speed: number;
    wind_deg: number;
    weather: Array<{
      main: string;
      description: string;
    }>;
    pop: number;
    rain?: number;
    uvi: number;
  }>;
}

interface WeatherForecast {
  location_id: string;
  forecast_date: string;
  forecast_time: string;
  temperature_high: number;
  temperature_low: number;
  temperature_feels_like: number;
  humidity: number;
  precipitation_chance: number;
  precipitation_amount: number;
  weather_condition: string;
  weather_description: string;
  wind_speed: number;
  wind_direction: number;
  uv_index: number;
  visibility: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for full access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Weather fetch function called at', new Date().toISOString())

    const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY')
    if (!openWeatherApiKey) {
      throw new Error('OPENWEATHER_API_KEY not configured')
    }

    // Get Walt Disney World location from database
    const { data: location, error: locationError } = await supabaseClient
      .from('weather_locations')
      .select('*')
      .eq('name', 'Walt Disney World')
      .single()

    if (locationError || !location) {
      throw new Error('Disney World location not found in database')
    }

    console.log(`Fetching weather for ${location.name} (${location.latitude}, ${location.longitude})`)

    // Fetch 8-day forecast from OpenWeatherMap One Call API 3.0
    // Using One Call API 3.0 for daily forecasts (8 days)
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${location.latitude}&lon=${location.longitude}&appid=${openWeatherApiKey}&units=imperial&exclude=minutely,hourly,alerts`

    const weatherResponse = await fetch(weatherUrl)
    if (!weatherResponse.ok) {
      throw new Error(`OpenWeatherMap API error: ${weatherResponse.status} ${weatherResponse.statusText}`)
    }

    const weatherData: OneCallResponse = await weatherResponse.json()
    console.log(`Received ${weatherData.daily.length} daily forecast entries`)

    // Process daily forecast data (already organized by day)
    const forecastsToInsert: WeatherForecast[] = []
    const currentTime = new Date().toISOString()

    // Map OpenWeatherMap conditions to our simplified conditions
    const weatherConditionMap: Record<string, string> = {
      'clear': 'clear',
      'clouds': 'clouds',
      'rain': 'rain',
      'drizzle': 'rain',
      'thunderstorm': 'thunderstorm',
      'snow': 'snow',
      'mist': 'cloudy',
      'fog': 'cloudy',
      'haze': 'cloudy'
    }

    // Process each daily forecast (One Call API 3.0 provides clean daily data)
    weatherData.daily.forEach(dayData => {
      const date = new Date(dayData.dt * 1000).toISOString().split('T')[0]
      const mainCondition = dayData.weather[0]?.main.toLowerCase() || 'clear'

      const forecast: WeatherForecast = {
        location_id: location.id,
        forecast_date: date,
        forecast_time: currentTime,
        temperature_high: Math.round(dayData.temp.max),
        temperature_low: Math.round(dayData.temp.min),
        temperature_feels_like: Math.round(dayData.feels_like.day),
        humidity: dayData.humidity,
        precipitation_chance: Math.round(dayData.pop * 100),
        precipitation_amount: Math.round(((dayData.rain || 0) / 25.4) * 100) / 100, // Convert mm to inches
        weather_condition: weatherConditionMap[mainCondition] || 'clear',
        weather_description: dayData.weather[0]?.description || 'Clear sky',
        wind_speed: Math.round(dayData.wind_speed),
        wind_direction: dayData.wind_deg,
        uv_index: Math.round(dayData.uvi),
        visibility: Math.round(weatherData.current.visibility / 1609.34 * 10) / 10 // Convert meters to miles
      }

      forecastsToInsert.push(forecast)
    })

    console.log(`Processed ${forecastsToInsert.length} daily forecasts`)

    // Upsert forecasts into database (update if exists, insert if not)
    const { error: upsertError } = await supabaseClient
      .from('weather_forecasts')
      .upsert(forecastsToInsert, {
        onConflict: 'location_id,forecast_date'
      })

    if (upsertError) {
      throw new Error(`Database upsert error: ${upsertError.message}`)
    }

    // Clean up old forecasts (past dates only, keep today and future)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const { error: cleanupError, count: deletedCount } = await supabaseClient
      .from('weather_forecasts')
      .delete({ count: 'exact' })
      .lt('forecast_date', today.toISOString().split('T')[0])

    if (cleanupError) {
      console.warn('Cleanup error (non-fatal):', cleanupError.message)
    } else {
      console.log(`Cleaned up ${deletedCount || 0} old weather forecasts`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${forecastsToInsert.length} daily forecasts for ${location.name}`,
        forecasts: forecastsToInsert.length,
        location: location.name
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error fetching weather data:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch weather data',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})