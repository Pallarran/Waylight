import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, Eye, EyeOff } from 'lucide-react';
import { createWeatherService } from '@waylight/shared';
import type { WeatherForecast } from '@waylight/shared';

interface WeatherHeaderProps {
  date: Date;
}

const getWeatherIcon = (condition: string) => {
  if (!condition) return <Cloud className="w-4 h-4 text-gray-500" />;

  switch (condition.toLowerCase()) {
    case 'clear':
      return <Sun className="w-4 h-4 text-yellow-500" />;
    case 'clouds':
      return <Cloud className="w-4 h-4 text-gray-500" />;
    case 'rain':
      return <CloudRain className="w-4 h-4 text-blue-500" />;
    case 'snow':
      return <Snowflake className="w-4 h-4 text-blue-300" />;
    case 'thunderstorm':
      return <CloudLightning className="w-4 h-4 text-purple-600" />;
    default:
      return <Cloud className="w-4 h-4 text-gray-500" />;
  }
};

const formatTemperature = (temp: number) => `${Math.round(temp)}°F`;

export default function WeatherHeader({ date }: WeatherHeaderProps) {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          setError('Weather service not configured');
          return;
        }

        const weatherService = createWeatherService(supabaseUrl, supabaseKey);
        const dateString = date.toISOString().split('T')[0];
        const weatherData = await weatherService.getForecastForDate(dateString);

        setForecast(weatherData);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Unable to load weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [date]);

  if (loading) {
    return (
      <div className="flex items-center text-xs text-ink-light">
        <Cloud className="w-4 h-4 mr-1 animate-pulse" />
        Loading weather...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center text-xs text-ink-light">
        <EyeOff className="w-4 h-4 mr-1" />
        {error}
      </div>
    );
  }

  if (!forecast) {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today;
    const isFarFuture = date > new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

    let message = 'No weather data available';
    if (isPast && !isToday) {
      message = 'Weather data not available for past dates';
    } else if (isFarFuture) {
      message = 'Weather forecast only available 5 days ahead';
    }

    return (
      <div className="flex items-center text-xs text-ink-light">
        <Eye className="w-4 h-4 mr-1" />
        {message}
      </div>
    );
  }

  return (
    <div className="flex items-center text-xs text-ink-light space-x-2">
      {getWeatherIcon(forecast.weatherCondition || (forecast as any).weather_condition)}
      <span>
        {formatTemperature(forecast.temperatureHigh || (forecast as any).temperature_high)}/{formatTemperature(forecast.temperatureLow || (forecast as any).temperature_low)}
      </span>
      <span className="capitalize">{forecast.weatherCondition || (forecast as any).weather_condition || 'Unknown'}</span>
      {(forecast.precipitationProbability || (forecast as any).precipitation_chance) && (forecast.precipitationProbability || (forecast as any).precipitation_chance) > 30 && (
        <span className="text-blue-500">
          {forecast.precipitationProbability || (forecast as any).precipitation_chance}% rain
        </span>
      )}
    </div>
  );
}