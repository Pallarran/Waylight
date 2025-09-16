import {
  LiveParkData,
  LiveAttractionData,
  LiveEntertainmentData,
  LiveParkEventData,
  ParkCrowdData,
  LiveDataConfig,
  CacheEntry,
  LiveDataError,
  LiveDataServiceInterface
} from '../types/liveData';
import { liveDataRepository } from './liveDataRepository';
import { isParkSupported } from '../config/parkMappings';

const DEFAULT_CONFIG: LiveDataConfig = {
  refreshIntervals: {
    waitTimes: 5 * 60 * 1000,      // 5 minutes (for cache)
    parkHours: 60 * 60 * 1000,     // 1 hour (for cache)
    crowdPredictions: 24 * 60 * 60 * 1000, // 24 hours (for cache)
    entertainment: 30 * 60 * 1000   // 30 minutes (for cache)
  },
  enabledFeatures: {
    waitTimes: true,
    parkHours: true,
    crowdPredictions: true,
    rideStatus: true,
    entertainment: true
  },
  offlineMode: false  // Use database mode - no more direct API calls
};

export class LiveDataService implements LiveDataServiceInterface {
  private config: LiveDataConfig = DEFAULT_CONFIG;
  private globalCache: Map<string, CacheEntry<any>> = new Map();
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();
  private errorHandlers: Map<string, (error: LiveDataError) => void> = new Map();

  constructor(config?: Partial<LiveDataConfig>) {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }
  }

  updateConfig(config: Partial<LiveDataConfig>): void {
    this.config = { ...this.config, ...config };

    // Clear existing timers and restart with new intervals
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.refreshTimers.clear();
  }

  async getParkData(parkId: string): Promise<LiveParkData> {
    if (!isParkSupported(parkId)) {
      throw new Error(`Park ${parkId} is not supported for live data`);
    }

    // Check in-memory cache first
    const cacheKey = `park_data_${parkId}`;
    const cached = this.getCachedData<LiveParkData>(cacheKey, this.config.refreshIntervals.parkHours);

    if (cached) {
      return cached;
    }

    try {
      // Fetch from database instead of external APIs
      const parkData = await liveDataRepository.getParkData(parkId);

      if (parkData) {
        // Cache the result
        this.setCachedData(cacheKey, parkData, this.config.refreshIntervals.parkHours);
        return parkData;
      } else {
        // No data in database, return fallback
        return this.getMockParkData(parkId);
      }
    } catch (error) {
      this.handleError('getParkData', error as LiveDataError);
      // Fall back to mock data if database fails
      console.warn(`Database failed for ${parkId}, falling back to mock data`);
      return this.getMockParkData(parkId);
    }
  }

  // Date-specific park data method for trip planning
  async getParkDataForDate(parkId: string, date: string): Promise<LiveParkData> {
    if (!isParkSupported(parkId)) {
      throw new Error(`Park ${parkId} is not supported for live data`);
    }

    // Check in-memory cache first
    const cacheKey = `park_data_${parkId}_${date}`;
    const cached = this.getCachedData<LiveParkData>(cacheKey, this.config.refreshIntervals.parkHours);

    if (cached) {
      return cached;
    }

    try {
      // Get date-specific schedule data
      const scheduleData = await liveDataRepository.getParkScheduleForDate(parkId, date);

      if (scheduleData) {
        // Create LiveParkData from schedule data
        const parkData: LiveParkData = {
          parkId,
          status: 'operating', // Assume operating if we have schedule data
          hours: {
            regular: {
              open: scheduleData.regular_open,
              close: scheduleData.regular_close
            },
            ...(scheduleData.early_entry_open && {
              earlyEntry: { open: scheduleData.early_entry_open }
            }),
            ...(scheduleData.extended_evening_close && {
              extendedEvening: { close: scheduleData.extended_evening_close }
            })
          },
          lastUpdated: scheduleData.synced_at,
          attractions: [], // Attractions are not date-specific
          entertainment: [], // Entertainment is not date-specific
          dataSource: scheduleData.data_source,
          isEstimated: scheduleData.is_estimated
        };

        // Cache the result
        this.setCachedData(cacheKey, parkData, this.config.refreshIntervals.parkHours);
        return parkData;
      } else {
        // No schedule data for this date - return with fallback messaging
        const parkData: LiveParkData = {
          parkId,
          status: 'operating',
          hours: {
            regular: {
              open: null,
              close: null
            }
          },
          lastUpdated: new Date().toISOString(),
          attractions: [],
          entertainment: [],
          dataSource: 'unavailable',
          isEstimated: true
        };

        return parkData;
      }
    } catch (error) {
      this.handleError('getParkDataForDate', error as LiveDataError);
      // Fall back to mock data if database fails
      console.warn(`Database failed for ${parkId} on ${date}, falling back to mock data`);
      return this.getMockParkData(parkId);
    }
  }

  private getMockParkData(parkId: string): LiveParkData {
    return {
      parkId,
      status: 'operating',
      hours: {
        regular: { open: '09:00', close: '22:00' }
      },
      lastUpdated: new Date().toISOString(),
      attractions: [], // Empty - will be populated by background sync
      entertainment: [] // Empty - will be populated by background sync
    };
  }

  async getMultipleParkData(parkIds: string[]): Promise<LiveParkData[]> {
    const promises = parkIds.map(parkId =>
      this.getParkData(parkId).catch(error => {
        console.warn(`Failed to get data for park ${parkId}:`, error);
        return null;
      })
    );

    const results = await Promise.allSettled(promises);
    return results
      .map(result => result.status === 'fulfilled' ? result.value : null)
      .filter((data): data is LiveParkData => data !== null);
  }

  async getAttractionWaitTimes(parkId: string): Promise<LiveAttractionData[]> {
    if (!this.config.enabledFeatures.waitTimes) {
      return [];
    }

    const cacheKey = `wait_times_${parkId}`;
    const cached = this.getCachedData<LiveAttractionData[]>(cacheKey, this.config.refreshIntervals.waitTimes);

    if (cached) {
      return cached;
    }

    try {
      const waitTimes = await liveDataRepository.getAttractionWaitTimes(parkId);
      this.setCachedData(cacheKey, waitTimes, this.config.refreshIntervals.waitTimes);
      return waitTimes;
    } catch (error) {
      this.handleError('getAttractionWaitTimes', error as LiveDataError);
      return []; // Return empty array instead of throwing
    }
  }

  async getAttractionStatus(_attractionId: string): Promise<LiveAttractionData> {
    // This would need to be enhanced to find which park the attraction belongs to
    // For now, we'll throw an error as this requires more complex logic
    throw new Error('getAttractionStatus not implemented - use getAttractionWaitTimes with park filtering');
  }

  async getEntertainmentSchedule(parkId: string): Promise<LiveEntertainmentData[]> {
    if (!this.config.enabledFeatures.entertainment) {
      return [];
    }

    const cacheKey = `entertainment_${parkId}`;
    const cached = this.getCachedData<LiveEntertainmentData[]>(cacheKey, this.config.refreshIntervals.entertainment);

    if (cached) {
      return cached;
    }

    try {
      const entertainment = await liveDataRepository.getEntertainmentSchedule(parkId);
      this.setCachedData(cacheKey, entertainment, this.config.refreshIntervals.entertainment);
      return entertainment;
    } catch (error) {
      this.handleError('getEntertainmentSchedule', error as LiveDataError);
      return []; // Return empty array instead of throwing
    }
  }

  async getParkEventsForDate(parkId: string, date: string): Promise<LiveParkEventData[]> {
    if (!isParkSupported(parkId)) {
      throw new Error(`Park ${parkId} is not supported for live data`);
    }
    const cacheKey = `park_events_${parkId}_${date}`;
    const cached = this.getCachedData<LiveParkEventData[]>(cacheKey, this.config.refreshIntervals.parkHours);
    if (cached) {
      return cached;
    }
    try {
      const events = await liveDataRepository.getParkEventsForDate(parkId, date);
      this.setCachedData(cacheKey, events, this.config.refreshIntervals.parkHours);
      return events;
    } catch (error) {
      this.handleError('getParkEventsForDate', error as LiveDataError);
      return []; // Return empty array instead of throwing
    }
  }

  async getCrowdPredictions(parkId: string, days: number = 7): Promise<ParkCrowdData> {
    if (!this.config.enabledFeatures.crowdPredictions) {
      throw new Error('Crowd predictions feature is disabled');
    }

    const cacheKey = `crowd_predictions_${parkId}_${days}`;
    const cached = this.getCachedData<ParkCrowdData>(cacheKey, this.config.refreshIntervals.crowdPredictions);

    if (cached) {
      return cached;
    }

    try {
      // Get current park data from database for crowd level
      const parkData = await liveDataRepository.getParkData(parkId);

      if (parkData && parkData.crowdLevel) {
        // Create crowd predictions based on current crowd level from database
        const getCrowdDescription = (level: number): string => {
          if (level <= 2) return 'Very Low';
          if (level <= 4) return 'Low';
          if (level <= 6) return 'Moderate';
          if (level <= 8) return 'High';
          return 'Very High';
        };

        const mockCrowdData: ParkCrowdData = {
          parkId,
          predictions: Array.from({ length: days }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
            level: parkData.crowdLevel || 5, // Use database crowd level
            description: getCrowdDescription(parkData.crowdLevel || 5)
          })),
          lastUpdated: new Date().toISOString()
        };

        this.setCachedData(cacheKey, mockCrowdData, this.config.refreshIntervals.crowdPredictions);
        return mockCrowdData;
      } else {
        // Fallback to mock data if no database data available
        const getCrowdDescription = (level: number): string => {
          if (level <= 2) return 'Very Low';
          if (level <= 4) return 'Low';
          if (level <= 6) return 'Moderate';
          if (level <= 8) return 'High';
          return 'Very High';
        };

        const mockCrowdData: ParkCrowdData = {
          parkId,
          predictions: Array.from({ length: days }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
            level: 5, // Default moderate crowd level
            description: getCrowdDescription(5)
          })),
          lastUpdated: new Date().toISOString()
        };

        this.setCachedData(cacheKey, mockCrowdData, this.config.refreshIntervals.crowdPredictions);
        return mockCrowdData;
      }
    } catch (error) {
      this.handleError('getCrowdPredictions', error as LiveDataError);
      throw error;
    }
  }

  // Auto-refresh functionality
  startAutoRefresh(parkIds: string[]): void {
    parkIds.forEach(parkId => {
      if (!isParkSupported(parkId)) return;

      // Set up refresh timers for different data types
      const waitTimesTimer = setInterval(async () => {
        try {
          await this.getAttractionWaitTimes(parkId);
        } catch (error) {
          console.warn(`Auto-refresh failed for wait times in ${parkId}:`, error);
        }
      }, this.config.refreshIntervals.waitTimes);

      const parkHoursTimer = setInterval(async () => {
        try {
          await this.getParkData(parkId);
        } catch (error) {
          console.warn(`Auto-refresh failed for park data in ${parkId}:`, error);
        }
      }, this.config.refreshIntervals.parkHours);

      this.refreshTimers.set(`${parkId}_wait_times`, waitTimesTimer);
      this.refreshTimers.set(`${parkId}_park_hours`, parkHoursTimer);
    });
  }

  stopAutoRefresh(): void {
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.refreshTimers.clear();
  }

  // Cache management
  clearCache(type?: 'all' | 'wait_times' | 'park_hours' | 'crowds'): void {
    if (type === 'all' || !type) {
      this.globalCache.clear();
      return;
    }

    // Clear specific cache types
    for (const [key] of this.globalCache.entries()) {
      if (key.includes(type)) {
        this.globalCache.delete(key);
      }
    }
  }

  getCacheStats(): Record<string, { size: number; oldestEntry: string; newestEntry: string }> {
    const stats: Record<string, { size: number; oldestEntry: string; newestEntry: string }> = {};

    for (const [key, value] of this.globalCache.entries()) {
      const category = key.split('_')[0] || 'general';

      if (!stats[category]) {
        stats[category] = {
          size: 0,
          oldestEntry: new Date(value.timestamp).toISOString(),
          newestEntry: new Date(value.timestamp).toISOString()
        };
      }

      stats[category].size++;

      const entryTime = new Date(value.timestamp).toISOString();
      if (entryTime < stats[category].oldestEntry) {
        stats[category].oldestEntry = entryTime;
      }
      if (entryTime > stats[category].newestEntry) {
        stats[category].newestEntry = entryTime;
      }
    }

    return stats;
  }

  // Error handling
  onError(type: string, handler: (error: LiveDataError) => void): void {
    this.errorHandlers.set(type, handler);
  }

  private handleError(type: string, error: LiveDataError): void {
    const handler = this.errorHandlers.get(type);
    if (handler) {
      handler(error);
    } else {
      console.error(`LiveDataService ${type} error:`, error);
    }
  }

  // Private cache helpers
  private getCachedData<T>(key: string, ttl: number): T | null {
    const cached = this.globalCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > ttl) {
      this.globalCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCachedData<T>(key: string, data: T, ttl: number): void {
    this.globalCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
}

// Singleton instance
export const liveDataService = new LiveDataService();