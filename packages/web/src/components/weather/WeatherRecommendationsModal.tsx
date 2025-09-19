import { X, Cloud, Shirt, Coffee, MapPin, AlertCircle } from 'lucide-react';
import type { WeatherRecommendation, WeatherForecast } from '@waylight/shared';

interface WeatherRecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendations: WeatherRecommendation[];
  forecast: WeatherForecast;
}

const WeatherRecommendationsModal = ({
  isOpen,
  onClose,
  recommendations,
  forecast
}: WeatherRecommendationsModalProps) => {
  if (!isOpen) return null;

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'indoor_attraction':
        return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'clothing':
        return <Shirt className="w-5 h-5 text-orange-600" />;
      case 'dining':
        return <Coffee className="w-5 h-5 text-green-600" />;
      case 'general':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'indoor_attraction':
        return 'bg-blue-50 border-blue-200';
      case 'clothing':
        return 'bg-orange-50 border-orange-200';
      case 'dining':
        return 'bg-green-50 border-green-200';
      case 'general':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const groupedRecommendations = recommendations.reduce((groups, rec) => {
    const type = rec.recommendationType;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(rec);
    return groups;
  }, {} as Record<string, WeatherRecommendation[]>);

  const typeLabels = {
    indoor_attraction: 'Indoor Activities',
    outdoor_avoid: 'Outdoor Considerations',
    clothing: 'What to Wear',
    general: 'General Tips',
    dining: 'Dining Suggestions',
    shopping: 'Shopping Recommendations'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Weather Recommendations</h2>
            <p className="text-sm text-gray-600 mt-1">
              {forecast.weatherDescription} • {forecast.temperatureHigh}°/{forecast.temperatureLow}°
              {forecast.precipitationChance > 0 && ` • ${forecast.precipitationChance}% chance of rain`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {Object.entries(groupedRecommendations).map(([type, recs]) => (
            <div key={type} className="mb-6 last:mb-0">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
                {getRecommendationIcon(type)}
                <span>{typeLabels[type as keyof typeof typeLabels] || type}</span>
              </h3>

              <div className="space-y-3">
                {recs
                  .sort((a, b) => b.priority - a.priority)
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-4 rounded-lg border ${getRecommendationColor(type)}`}
                    >
                      <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                      <p className="text-gray-700 text-sm">{rec.description}</p>
                      {rec.priority >= 4 && (
                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          High Priority
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {/* Weather Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-gray-600" />
              <span>Weather Details</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Temperature Range:</span>
                <span className="ml-2 font-medium">{forecast.temperatureLow}° - {forecast.temperatureHigh}°F</span>
              </div>
              <div>
                <span className="text-gray-600">Feels Like:</span>
                <span className="ml-2 font-medium">{forecast.temperatureFeelsLike}°F</span>
              </div>
              <div>
                <span className="text-gray-600">Humidity:</span>
                <span className="ml-2 font-medium">{forecast.humidity}%</span>
              </div>
              <div>
                <span className="text-gray-600">Wind Speed:</span>
                <span className="ml-2 font-medium">{forecast.windSpeed} mph</span>
              </div>
              <div>
                <span className="text-gray-600">Rain Chance:</span>
                <span className="ml-2 font-medium">{forecast.precipitationChance}%</span>
              </div>
              <div>
                <span className="text-gray-600">UV Index:</span>
                <span className="ml-2 font-medium">{forecast.uvIndex}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Forecast updated: {new Date(forecast.forecastTime).toLocaleString()}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherRecommendationsModal;