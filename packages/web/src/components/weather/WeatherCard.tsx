import { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Zap, Eye, Wind, Droplets, Thermometer, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { createWeatherService } from '@waylight/shared';
import type { WeatherDisplayData, WeatherRecommendation } from '@waylight/shared';

interface WeatherCardProps {
  date: string; // YYYY-MM-DD format
  isToday?: boolean;
  showDetails?: boolean;
  onRecommendationClick?: (recommendations: WeatherRecommendation[]) => void;
}

const WeatherCard = ({ date, isToday = false, showDetails = false, onRecommendationClick }: WeatherCardProps) => {
  const [weatherData, setWeatherData] = useState<WeatherDisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize weather service (this would typically come from a context or hook)
  const weatherService = createWeatherService(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const loadWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const forecast = await weatherService.getForecastForDate(date);
      if (!forecast) {
        setWeatherData(null);
        return;
      }

      const recommendations = await weatherService.getRecommendationsForWeather(forecast.weatherCondition);

      const displayData: WeatherDisplayData = {
        forecast,
        icon: getWeatherIcon(forecast.weatherCondition),
        recommendations: recommendations.slice(0, 3), // Top 3 recommendations
        isToday,
        dayOfWeek: format(new Date(date), 'EEEE'),
        formattedDate: format(new Date(date), 'MMM d')
      };

      setWeatherData(displayData);
    } catch (err) {
      console.error('Error loading weather data:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  }, [date, weatherService]);

  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'clear':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'clouds':
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'thunderstorm':
        return <Zap className="w-8 h-8 text-purple-500" />;
      case 'snow':
        return <CloudSnow className="w-8 h-8 text-blue-300" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp >= 90) return 'text-red-600';
    if (temp >= 80) return 'text-orange-500';
    if (temp >= 70) return 'text-yellow-600';
    if (temp >= 60) return 'text-green-600';
    return 'text-blue-600';
  };

  const getPrecipitationColor = (chance: number) => {
    if (chance >= 70) return 'text-blue-600';
    if (chance >= 40) return 'text-blue-500';
    if (chance >= 20) return 'text-blue-400';
    return 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-3 text-gray-500">
          <Cloud className="w-8 h-8" />
          <div>
            <p className="font-medium">Weather Unavailable</p>
            <p className="text-sm">{error || 'No forecast data'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { forecast, icon, recommendations } = weatherData;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 transition-all duration-200 ${
      isToday ? 'ring-2 ring-blue-500 border-blue-300' : 'hover:shadow-md'
    }`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {icon}
            <div>
              <h3 className="font-semibold text-gray-900">
                {isToday ? 'Today' : weatherData.dayOfWeek}
              </h3>
              <p className="text-sm text-gray-500">{weatherData.formattedDate}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className={`text-2xl font-bold ${getTemperatureColor(forecast.temperatureHigh)}`}>
                {forecast.temperatureHigh}°
              </span>
              <span className="text-lg text-gray-500">
                {forecast.temperatureLow}°
              </span>
            </div>
            <p className="text-sm text-gray-600 capitalize">{forecast.weatherDescription}</p>
          </div>
        </div>

        {/* Weather Details */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">
                <span className={getPrecipitationColor(forecast.precipitationChance)}>
                  {forecast.precipitationChance}%
                </span> rain
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Wind className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{forecast.windSpeed} mph</span>
            </div>
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-600">Feels like {forecast.temperatureFeelsLike}°</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{forecast.visibility} mi</span>
            </div>
          </div>
        )}

        {/* Weather Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Recommendations</h4>
              {onRecommendationClick && (
                <button
                  onClick={() => onRecommendationClick(recommendations)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              )}
            </div>
            <div className="space-y-2">
              {recommendations.slice(0, 2).map((rec) => (
                <div key={rec.id} className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {rec.recommendationType === 'indoor_attraction' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    {rec.recommendationType === 'clothing' && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    )}
                    {rec.recommendationType === 'general' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weather Alerts */}
        {(forecast.precipitationChance >= 70 || forecast.temperatureHigh >= 95) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 p-2 rounded-md">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {forecast.precipitationChance >= 70 && 'High chance of rain. '}
                {forecast.temperatureHigh >= 95 && 'Very hot weather expected. '}
                Plan accordingly.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherCard;