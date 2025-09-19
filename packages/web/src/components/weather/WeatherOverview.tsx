import { useState, useEffect, useCallback } from 'react';
import { Calendar, Cloud } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { createWeatherService } from '@waylight/shared';
import WeatherCard from './WeatherCard';
import WeatherRecommendationsModal from './WeatherRecommendationsModal';
import type { WeatherForecast, WeatherRecommendation, Trip } from '@waylight/shared';

interface WeatherOverviewProps {
  trip: Trip;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

const WeatherOverview = ({ trip, selectedDate, onDateSelect }: WeatherOverviewProps) => {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    recommendations: WeatherRecommendation[];
    forecast: WeatherForecast;
  } | null>(null);

  // Initialize weather service
  const weatherService = createWeatherService(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const loadWeatherForTrip = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const forecasts = await weatherService.getForecastForDateRange(
        trip.startDate,
        trip.endDate
      );

      setForecasts(forecasts);
    } catch (err) {
      console.error('Error loading weather for trip:', err);
      setError('Failed to load weather data');
    } finally {
      setLoading(false);
    }
  }, [trip.startDate, trip.endDate, weatherService]);

  useEffect(() => {
    loadWeatherForTrip();
  }, [loadWeatherForTrip]);

  const handleRecommendationClick = async (recommendations: WeatherRecommendation[], forecast: WeatherForecast) => {
    // Get all recommendations for this weather condition
    const allRecommendations = await weatherService.getRecommendationsForWeather(forecast.weatherCondition);

    setModalData({
      recommendations: allRecommendations,
      forecast
    });
    setModalOpen(true);
  };

  const getTripDays = () => {
    const days = [];
    const start = parseISO(trip.startDate);
    const end = parseISO(trip.endDate);

    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
      days.push(format(date, 'yyyy-MM-dd'));
    }

    return days;
  };

  const getWeatherSummary = () => {
    if (forecasts.length === 0) return null;

    const conditions = forecasts.reduce((acc, forecast) => {
      acc[forecast.weatherCondition] = (acc[forecast.weatherCondition] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommon = Object.entries(conditions)
      .sort(([,a], [,b]) => b - a)[0];

    const avgHigh = Math.round(
      forecasts.reduce((sum, f) => sum + f.temperatureHigh, 0) / forecasts.length
    );

    const avgLow = Math.round(
      forecasts.reduce((sum, f) => sum + f.temperatureLow, 0) / forecasts.length
    );

    const maxRainChance = Math.max(...forecasts.map(f => f.precipitationChance));

    return {
      mostCommonCondition: mostCommon?.[0] || 'clear',
      conditionDays: mostCommon?.[1] || 0,
      totalDays: forecasts.length,
      avgHigh,
      avgLow,
      maxRainChance
    };
  };

  const summary = getWeatherSummary();
  const tripDays = getTripDays();
  const today = format(new Date(), 'yyyy-MM-dd');

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Cloud className="w-6 h-6 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Weather Forecast</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Cloud className="w-6 h-6 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Weather Forecast</h2>
        </div>
        <div className="text-center py-8">
          <Cloud className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{error}</p>
          <button
            onClick={loadWeatherForTrip}
            className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cloud className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Weather Forecast</h2>
            </div>
            {summary && (
              <div className="text-right text-sm">
                <p className="text-gray-600">
                  Avg: {summary.avgHigh}°/{summary.avgLow}°
                </p>
                {summary.maxRainChance > 30 && (
                  <p className="text-blue-600">
                    Up to {summary.maxRainChance}% rain
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Trip Weather Summary */}
          {summary && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Trip Overview:</span> Expect mostly{' '}
                <span className="font-medium capitalize">{summary.mostCommonCondition}</span> weather
                {summary.conditionDays < summary.totalDays && ` for ${summary.conditionDays} of ${summary.totalDays} days`}.
                {summary.maxRainChance > 50 && ' Rain is likely on some days.'}
                {summary.avgHigh > 90 && ' Very hot temperatures expected.'}
              </p>
            </div>
          )}
        </div>

        {/* Weather Cards */}
        <div className="p-6">
          <div className="space-y-4">
            {tripDays.map((date) => {
              const forecast = forecasts.find(f => f.forecastDate === date);
              const isToday = date === today;
              const isSelected = date === selectedDate;

              return (
                <div
                  key={date}
                  className={`transition-all duration-200 ${
                    isSelected ? 'transform scale-[1.02]' : ''
                  }`}
                >
                  {forecast ? (
                    <div
                      className={`cursor-pointer ${onDateSelect ? 'hover:shadow-md' : ''}`}
                      onClick={() => onDateSelect?.(date)}
                    >
                      <WeatherCard
                        date={date}
                        isToday={isToday}
                        showDetails={isSelected}
                        onRecommendationClick={(recommendations) =>
                          handleRecommendationClick(recommendations, forecast)
                        }
                      />
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {isToday ? 'Today' : format(parseISO(date), 'EEEE')}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(date), 'MMM d')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500">No forecast available</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {forecasts.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No weather data available for this trip</p>
              <p className="text-sm text-gray-400 mt-1">
                Weather forecasts will appear here once available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Weather Recommendations Modal */}
      {modalData && (
        <WeatherRecommendationsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          recommendations={modalData.recommendations}
          forecast={modalData.forecast}
        />
      )}
    </>
  );
};

export default WeatherOverview;