import { createClient } from '@supabase/supabase-js';
import type {
  WeatherServiceInterface,
  WeatherForecast,
  WeatherLocation,
  WeatherRecommendation,
  WeatherCondition,
  WeatherError,
  ComfortIndex
} from '../types/weather';
import { weatherRecommendationEngine } from './weatherRecommendationEngine';

export class WeatherService implements WeatherServiceInterface {
  private supabase;
  private defaultLocationName = 'Walt Disney World';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getForecastForDate(date: string, locationId?: string): Promise<WeatherForecast | null> {
    try {
      let query = this.supabase
        .from('weather_forecasts')
        .select('*')
        .eq('forecast_date', date)
        .order('forecast_time', { ascending: false })
        .limit(1);

      if (locationId) {
        query = query.eq('location_id', locationId);
      } else {
        // Get the default location first
        const { data: location } = await this.supabase
          .from('weather_locations')
          .select('id')
          .eq('name', this.defaultLocationName)
          .single();

        if (location) {
          query = query.eq('location_id', location.id);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw this.createWeatherError('API_ERROR', `Failed to fetch forecast: ${error.message}`, error);
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('WeatherError')) {
        throw error;
      }
      throw this.createWeatherError('NETWORK_ERROR', 'Network error while fetching forecast', error);
    }
  }

  async getForecastForDateRange(startDate: string, endDate: string, locationId?: string): Promise<WeatherForecast[]> {
    try {
      let query = this.supabase
        .from('weather_forecasts')
        .select(`
          *,
          weather_locations!inner(name, latitude, longitude)
        `)
        .gte('forecast_date', startDate)
        .lte('forecast_date', endDate)
        .order('forecast_date', { ascending: true });

      if (locationId) {
        query = query.eq('location_id', locationId);
      } else {
        // Default to Disney World location
        query = query.eq('weather_locations.name', this.defaultLocationName);
      }

      const { data, error } = await query;

      if (error) {
        throw this.createWeatherError('API_ERROR', `Failed to fetch forecast range: ${error.message}`, error);
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.includes('WeatherError')) {
        throw error;
      }
      throw this.createWeatherError('NETWORK_ERROR', 'Network error while fetching forecast range', error);
    }
  }

  async getRecommendationsForWeather(condition: WeatherCondition): Promise<WeatherRecommendation[]> {
    try {
      const { data, error } = await this.supabase
        .from('weather_recommendations')
        .select('*')
        .eq('weather_condition', condition)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        throw this.createWeatherError('API_ERROR', `Failed to fetch recommendations: ${error.message}`, error);
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.includes('WeatherError')) {
        throw error;
      }
      throw this.createWeatherError('NETWORK_ERROR', 'Network error while fetching recommendations', error);
    }
  }

  async getWeatherLocation(name: string): Promise<WeatherLocation | null> {
    try {
      const { data, error } = await this.supabase
        .from('weather_locations')
        .select('*')
        .eq('name', name)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw this.createWeatherError('API_ERROR', `Failed to fetch location: ${error.message}`, error);
      }

      return data || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('WeatherError')) {
        throw error;
      }
      throw this.createWeatherError('LOCATION_ERROR', 'Error while fetching weather location', error);
    }
  }

  async getDefaultLocation(): Promise<WeatherLocation> {
    const location = await this.getWeatherLocation(this.defaultLocationName);
    if (!location) {
      throw this.createWeatherError('LOCATION_ERROR', 'Default weather location not found', null);
    }
    return location;
  }

  getIndoorAttractions(attractionIds: string[]): string[] {
    // This would typically query attraction data to check for rain-safe or air conditioning features
    // For now, this is a placeholder that would need to be enhanced with actual attraction data
    return attractionIds.filter(_id => {
      // In a real implementation, you would:
      // 1. Query the attraction by ID
      // 2. Check features.rainSafe || features.airConditioning || !features.outdoorExperience
      return true; // Placeholder implementation
    });
  }

  getOutdoorAttractions(attractionIds: string[]): string[] {
    // Similar to indoor attractions, this would check attraction features
    return attractionIds.filter(_id => {
      // In a real implementation, you would:
      // 1. Query the attraction by ID
      // 2. Check features.outdoorExperience === true
      return true; // Placeholder implementation
    });
  }

  getWeatherAppropriateAttractions(
    attractionIds: string[],
    weatherCondition: WeatherCondition
  ): {
    recommended: string[];
    avoid: string[];
    neutral: string[];
  } {
    // Basic implementation using weather condition logic
    // In a full implementation, this would use actual attraction data

    switch (weatherCondition) {
      case 'rain':
      case 'thunderstorm':
        return {
          recommended: this.getIndoorAttractions(attractionIds),
          avoid: this.getOutdoorAttractions(attractionIds),
          neutral: []
        };

      case 'clear':
        return {
          recommended: attractionIds, // All attractions are good in clear weather
          avoid: [],
          neutral: []
        };

      default:
        return {
          recommended: [],
          avoid: [],
          neutral: attractionIds
        };
    }
  }

  // Weather-aware recommendation methods using the recommendation engine
  getActivityRecommendationsForWeather(
    forecast: WeatherForecast,
    availableAttractions: any[]
  ): {
    highly_recommended: any[];
    recommended: any[];
    neutral: any[];
    avoid: any[];
  } {
    return weatherRecommendationEngine.getActivityRecommendations(forecast, availableAttractions);
  }

  getClothingRecommendations(forecast: WeatherForecast): string[] {
    return weatherRecommendationEngine.getClothingRecommendations(forecast);
  }

  getPackingRecommendations(forecasts: WeatherForecast[]): string[] {
    return weatherRecommendationEngine.getPackingRecommendations(forecasts);
  }

  getDiningRecommendationsForWeather(
    forecast: WeatherForecast,
    availableDining: any[]
  ): any[] {
    return weatherRecommendationEngine.getDiningRecommendations(forecast, availableDining);
  }

  async generateBackupPlan(
    originalPlan: any[],
    weather: WeatherForecast,
    attractionPool: any[]
  ): Promise<any[]> {
    // Generate backup plan for bad weather
    if (weather.weatherCondition === 'rain' || weather.weatherCondition === 'thunderstorm') {
      // Get activity recommendations for this weather
      const recommendations = this.getActivityRecommendationsForWeather(weather, attractionPool);

      // Prioritize highly recommended and recommended attractions
      const goodWeatherOptions = [
        ...recommendations.highly_recommended,
        ...recommendations.recommended
      ];

      // Create backup plan by substituting problematic attractions
      return originalPlan.map(item => {
        // Find the original attraction
        const originalAttraction = attractionPool.find(a => a.id === item.attractionId);

        // Check if this attraction should be avoided in current weather
        const shouldAvoid = recommendations.avoid.some(avoided => avoided.id === item.attractionId);

        if (shouldAvoid && originalAttraction) {
          // Try to find a suitable replacement
          const replacement = goodWeatherOptions.find(option =>
            option.type === originalAttraction.type &&
            option.parkId === originalAttraction.parkId
          );

          if (replacement) {
            return {
              ...item,
              attractionId: replacement.id,
              notes: `${item.notes || ''} (Weather backup: ${replacement.name} - indoor alternative)`.trim()
            };
          }
        }

        return item;
      });
    }

    // For hot weather, prioritize air-conditioned or water attractions
    if (weather.temperatureHigh >= 95) {
      const recommendations = this.getActivityRecommendationsForWeather(weather, attractionPool);
      const coolOptions = [
        ...recommendations.highly_recommended,
        ...recommendations.recommended
      ];

      return originalPlan.map(item => {
        const originalAttraction = attractionPool.find(a => a.id === item.attractionId);
        const shouldAvoid = recommendations.avoid.some(avoided => avoided.id === item.attractionId);

        if (shouldAvoid && originalAttraction) {
          const replacement = coolOptions.find(option =>
            option.parkId === originalAttraction.parkId
          );

          if (replacement) {
            return {
              ...item,
              attractionId: replacement.id,
              notes: `${item.notes || ''} (Heat backup: ${replacement.name} - cooler alternative)`.trim()
            };
          }
        }

        return item;
      });
    }

    // For other weather conditions, return original plan
    return originalPlan;
  }

  // Utility methods

  calculateComfortIndex(forecast: WeatherForecast): ComfortIndex {
    return weatherRecommendationEngine.calculateComfortIndex(forecast);
  }

  getWeatherIcon(condition: WeatherCondition): string {
    const iconMap: Record<WeatherCondition, string> = {
      clear: '☀️',
      clouds: '☁️',
      rain: '🌧️',
      thunderstorm: '⛈️',
      snow: '❄️',
      cloudy: '🌥️'
    };

    return iconMap[condition] || '🌤️';
  }

  private createWeatherError(code: WeatherError['code'], message: string, details: any): WeatherError {
    return {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  }
}

// Create a singleton instance factory
let weatherServiceInstance: WeatherService | null = null;

export function createWeatherService(supabaseUrl: string, supabaseKey: string): WeatherService {
  if (!weatherServiceInstance) {
    weatherServiceInstance = new WeatherService(supabaseUrl, supabaseKey);
  }
  return weatherServiceInstance;
}

export { WeatherService as default };