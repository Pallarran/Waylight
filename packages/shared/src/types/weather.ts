// Weather Integration Types

export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'thunderstorm' | 'snow' | 'cloudy';

export interface WeatherLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherForecast {
  id: string;
  locationId: string;
  forecastDate: string; // YYYY-MM-DD
  forecastTime: string; // ISO timestamp when forecast was made
  temperatureHigh: number; // Fahrenheit
  temperatureLow: number; // Fahrenheit
  temperatureFeelsLike: number; // Fahrenheit average
  humidity: number; // Percentage
  precipitationChance: number; // Percentage 0-100
  precipitationAmount: number; // Inches
  weatherCondition: WeatherCondition;
  weatherDescription: string; // Human readable description
  windSpeed: number; // mph
  windDirection: number; // degrees
  uvIndex: number;
  visibility: number; // miles
  createdAt: string;
  updatedAt: string;
}

export interface WeatherRecommendation {
  id: string;
  weatherCondition: WeatherCondition;
  recommendationType: 'indoor_attraction' | 'outdoor_avoid' | 'clothing' | 'general' | 'dining' | 'shopping';
  title: string;
  description: string;
  priority: number; // 1-5, higher is more important
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Weather-aware itinerary types
export interface WeatherContext {
  primaryPlan: any[]; // ItineraryItem[] - will be defined later
  weatherBackup?: any[]; // ItineraryItem[] - backup plan for bad weather
  weatherForecast: WeatherForecast;
  recommendations: WeatherRecommendation[];
  lastUpdated: string;
}

export interface WeatherAwareTripDay {
  id: string;
  date: string;
  parkId: string;
  items: any[]; // ItineraryItem[]
  weatherContext?: WeatherContext;
  notes?: string;
}

// Weather service interfaces
export interface WeatherServiceInterface {
  // Forecast data
  getForecastForDate(date: string, locationId?: string): Promise<WeatherForecast | null>;
  getForecastForDateRange(startDate: string, endDate: string, locationId?: string): Promise<WeatherForecast[]>;
  getRecommendationsForWeather(condition: WeatherCondition): Promise<WeatherRecommendation[]>;

  // Location data
  getWeatherLocation(name: string): Promise<WeatherLocation | null>;
  getDefaultLocation(): Promise<WeatherLocation>;

  // Weather-aware recommendations
  getIndoorAttractions(attractionIds: string[]): string[];
  getOutdoorAttractions(attractionIds: string[]): string[];
  getWeatherAppropriateAttractions(
    attractionIds: string[],
    weatherCondition: WeatherCondition
  ): {
    recommended: string[];
    avoid: string[];
    neutral: string[];
  };

  // Backup plan generation
  generateBackupPlan(
    originalPlan: any[], // ItineraryItem[]
    weather: WeatherForecast,
    attractionPool: any[] // Available attractions to substitute
  ): Promise<any[]>; // ItineraryItem[]
}

// Weather display types for UI components
export interface WeatherDisplayData {
  forecast: WeatherForecast;
  icon: string; // Weather icon identifier
  recommendations: WeatherRecommendation[];
  isToday: boolean;
  dayOfWeek: string;
  formattedDate: string;
}

export interface WeatherAlert {
  id: string;
  type: 'info' | 'warning' | 'severe';
  title: string;
  message: string;
  weatherCondition: WeatherCondition;
  isActive: boolean;
  priority: number;
}

// Weather recommendation engine types
export interface WeatherRecommendationEngine {
  getClothingRecommendations(forecast: WeatherForecast): string[];
  getActivityRecommendations(
    forecast: WeatherForecast,
    availableAttractions: any[]
  ): {
    highly_recommended: any[];
    recommended: any[];
    neutral: any[];
    avoid: any[];
  };
  getPackingRecommendations(forecasts: WeatherForecast[]): string[];
  getDiningRecommendations(
    forecast: WeatherForecast,
    availableDining: any[]
  ): any[];
}

// Heat index and comfort calculations
export interface ComfortIndex {
  temperature: number;
  feelsLike: number;
  humidity: number;
  heatIndex: number;
  comfortLevel: 'comfortable' | 'warm' | 'hot' | 'dangerous';
  recommendations: string[];
}

// Weather data cache types
export interface WeatherCacheEntry {
  data: WeatherForecast | WeatherForecast[];
  timestamp: number;
  ttl: number; // time to live in milliseconds
  locationId: string;
}

export interface WeatherError {
  code: 'NETWORK_ERROR' | 'API_ERROR' | 'PARSE_ERROR' | 'NOT_FOUND' | 'LOCATION_ERROR';
  message: string;
  details?: any;
  timestamp: string;
}