# Weather Fetching Edge Function

This Supabase Edge Function fetches weather forecast data from OpenWeatherMap and stores it in our database.

## Setup

1. Set environment variables in Supabase dashboard:
   - `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key

## Manual Testing

To test the function manually:

```bash
# Deploy the function
npx supabase functions deploy fetch-weather

# Test the function
curl -X POST 'https://[your-project-id].supabase.co/functions/v1/fetch-weather' \
  -H 'Authorization: Bearer [your-anon-key]' \
  -H 'Content-Type: application/json'
```

## Scheduling

This function should be called hourly. You can set this up using:

1. **Supabase Cron Jobs** (if available)
2. **External Cron Service** (like cron-job.org)
3. **Vercel Cron Jobs** (if deploying the main app on Vercel)

Example cron schedule: `0 * * * *` (every hour at minute 0)

## Data Flow

1. Function fetches 5-day forecast from OpenWeatherMap
2. Groups 3-hour forecasts into daily summaries
3. Upserts data into `weather_forecasts` table
4. Cleans up old forecast data (older than 2 days)

## Weather Conditions Mapping

The function maps OpenWeatherMap conditions to simplified categories:

- `clear` - Clear skies
- `clouds` - Cloudy/overcast
- `rain` - Rain or drizzle
- `thunderstorm` - Thunderstorms
- `snow` - Snow
- `cloudy` - Mist, fog, haze