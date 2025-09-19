import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OpenWeatherResponse {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
    wind: {
      speed: number;
      deg: number;
    };
    visibility: number;
    pop: number; // probability of precipitation
    rain?: {
      '3h': number;
    };
    uv?: number;
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

    // Fetch 5-day forecast from OpenWeatherMap (free tier)
    // Using 5 day / 3 hour forecast API
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.latitude}&lon=${location.longitude}&appid=${openWeatherApiKey}&units=imperial`

    const weatherResponse = await fetch(weatherUrl)
    if (!weatherResponse.ok) {
      throw new Error(`OpenWeatherMap API error: ${weatherResponse.status} ${weatherResponse.statusText}`)
    }

    const weatherData: OpenWeatherResponse = await weatherResponse.json()
    console.log(`Received ${weatherData.list.length} forecast entries`)

    // Process forecast data - group by date and get daily high/low
    const dailyForecasts = new Map<string, {
      date: string;
      temps: number[];
      feels_like: number[];
      humidity: number[];
      precipitation_chance: number[];
      precipitation_amount: number[];
      weather_conditions: Array<{ main: string; description: string }>;
      wind_speeds: number[];
      wind_directions: number[];
      visibility: number[];
      uv_indices: number[];
    }>()

    weatherData.list.forEach(entry => {
      const date = new Date(entry.dt * 1000).toISOString().split('T')[0]

      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, {
          date,
          temps: [],
          feels_like: [],
          humidity: [],
          precipitation_chance: [],
          precipitation_amount: [],
          weather_conditions: [],
          wind_speeds: [],
          wind_directions: [],
          visibility: [],
          uv_indices: []
        })
      }

      const dayData = dailyForecasts.get(date)!
      dayData.temps.push(entry.main.temp)
      dayData.feels_like.push(entry.main.feels_like)
      dayData.humidity.push(entry.main.humidity)
      dayData.precipitation_chance.push(Math.round(entry.pop * 100))
      dayData.precipitation_amount.push(entry.rain ? entry.rain['3h'] : 0)
      dayData.weather_conditions.push(...entry.weather)
      dayData.wind_speeds.push(entry.wind.speed)
      dayData.wind_directions.push(entry.wind.deg)
      dayData.visibility.push(entry.visibility / 1609.34) // Convert meters to miles
      dayData.uv_indices.push(entry.uv || 0)
    })

    // Convert to database format
    const forecastsToInsert: WeatherForecast[] = []
    const currentTime = new Date().toISOString()

    for (const [date, data] of dailyForecasts) {
      // Get the most common weather condition for the day
      const conditionCounts = new Map<string, number>()
      let mostCommonCondition = 'clear'
      let mostCommonDescription = 'Clear sky'

      data.weather_conditions.forEach(condition => {
        const count = conditionCounts.get(condition.main.toLowerCase()) || 0
        conditionCounts.set(condition.main.toLowerCase(), count + 1)

        if (count + 1 > (conditionCounts.get(mostCommonCondition) || 0)) {
          mostCommonCondition = condition.main.toLowerCase()
          mostCommonDescription = condition.description
        }
      })

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

      const forecast: WeatherForecast = {
        location_id: location.id,
        forecast_date: date,
        forecast_time: currentTime,
        temperature_high: Math.round(Math.max(...data.temps)),
        temperature_low: Math.round(Math.min(...data.temps)),
        temperature_feels_like: Math.round(data.feels_like.reduce((a, b) => a + b, 0) / data.feels_like.length),
        humidity: Math.round(data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length),
        precipitation_chance: Math.max(...data.precipitation_chance),
        precipitation_amount: Math.round((data.precipitation_amount.reduce((a, b) => a + b, 0) / 25.4) * 100) / 100, // Convert mm to inches
        weather_condition: weatherConditionMap[mostCommonCondition] || 'clear',
        weather_description: mostCommonDescription,
        wind_speed: Math.round(data.wind_speeds.reduce((a, b) => a + b, 0) / data.wind_speeds.length),
        wind_direction: Math.round(data.wind_directions.reduce((a, b) => a + b, 0) / data.wind_directions.length),
        uv_index: Math.round(data.uv_indices.reduce((a, b) => a + b, 0) / data.uv_indices.length),
        visibility: Math.round((data.visibility.reduce((a, b) => a + b, 0) / data.visibility.length) * 10) / 10
      }

      forecastsToInsert.push(forecast)
    }

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

    // Clean up old forecasts (older than 2 days)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const { error: cleanupError } = await supabaseClient
      .from('weather_forecasts')
      .delete()
      .lt('forecast_date', twoDaysAgo.toISOString().split('T')[0])

    if (cleanupError) {
      console.warn('Cleanup error (non-fatal):', cleanupError.message)
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