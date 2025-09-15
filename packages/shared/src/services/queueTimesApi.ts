import {
  ParkCrowdData,
  CrowdPrediction,
  LiveDataError
} from '../types/liveData';
import { getParkMapping } from '../config/parkMappings';

const QUEUE_TIMES_API_BASE = 'https://queue-times.com/en-US/parks';

interface QueueTimesResponse {
  id: number;
  name: string;
  timezone: string;
  country: string;
  state: string;
  city: string;
  continent: string;
  latitude: number;
  longitude: number;
  forecast: Array<{
    date: string;
    crowd_level: number;
    crowd_level_string: string;
  }>;
}

export class QueueTimesAPIClient {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private defaultCacheTTL = 24 * 60 * 60 * 1000; // 24 hours for crowd predictions

  private async fetchWithCache<T>(
    url: string,
    ttl: number = this.defaultCacheTTL
  ): Promise<T> {
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          const apiError: LiveDataError = {
            code: 'RATE_LIMITED',
            message: 'Queue-Times API rate limit exceeded',
            details: { url, status: response.status },
            timestamp: new Date().toISOString()
          };
          throw apiError;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl
      });

      return data as T;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw LiveDataError
      }

      const apiError: LiveDataError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown Queue-Times API error',
        details: { url, error },
        timestamp: new Date().toISOString()
      };
      throw apiError;
    }
  }

  async getCrowdPredictions(waypointParkId: string, days: number = 30): Promise<ParkCrowdData> {
    const mapping = getParkMapping(waypointParkId);
    if (!mapping?.queueTimesId) {
      throw new Error(`No Queue-Times mapping found for park: ${waypointParkId}`);
    }

    try {
      // Queue-Times uses a different URL structure - we need to map our park IDs
      const queueTimesUrl = this.getQueueTimesUrl(mapping.queueTimesId);

      const response = await this.fetchWithCache<QueueTimesResponse>(
        `${queueTimesUrl}.json`
      );

      const predictions: CrowdPrediction[] = response.forecast
        .slice(0, days)
        .map(forecast => ({
          date: forecast.date,
          level: forecast.crowd_level,
          description: this.mapCrowdLevelToDescription(forecast.crowd_level),
          recommendation: this.getCrowdRecommendation(forecast.crowd_level)
        }));

      return {
        parkId: waypointParkId,
        predictions,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw LiveDataError
      }

      const apiError: LiveDataError = {
        code: 'PARSE_ERROR',
        message: `Failed to parse crowd data for ${waypointParkId}`,
        details: { waypointParkId, error },
        timestamp: new Date().toISOString()
      };
      throw apiError;
    }
  }

  async getCurrentCrowdLevel(waypointParkId: string): Promise<number | null> {
    try {
      const crowdData = await this.getCrowdPredictions(waypointParkId, 1);
      const today = new Date().toISOString().split('T')[0];
      const todayPrediction = crowdData.predictions.find(p => p.date === today);
      return todayPrediction?.level || null;
    } catch (error) {
      console.warn(`Failed to get current crowd level for ${waypointParkId}:`, error);
      return null;
    }
  }

  private getQueueTimesUrl(queueTimesId: string): string {
    // Map our park IDs to Queue-Times URLs
    const urlMappings: Record<string, string> = {
      'magic-kingdom': `${QUEUE_TIMES_API_BASE}/1/queue_times`,
      'epcot': `${QUEUE_TIMES_API_BASE}/2/queue_times`,
      'hollywood-studios': `${QUEUE_TIMES_API_BASE}/3/queue_times`,
      'animal-kingdom': `${QUEUE_TIMES_API_BASE}/4/queue_times`
    };

    const url = urlMappings[queueTimesId];
    if (!url) {
      throw new Error(`No Queue-Times URL mapping for: ${queueTimesId}`);
    }

    return url;
  }

  private mapCrowdLevelToDescription(level: number): string {
    if (level <= 2) return 'Very Low';
    if (level <= 4) return 'Low';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Very High';
  }

  private getCrowdRecommendation(level: number): string {
    if (level <= 2) {
      return 'Perfect day to visit! Short wait times expected.';
    }
    if (level <= 4) {
      return 'Great day to visit with manageable crowds.';
    }
    if (level <= 6) {
      return 'Moderate crowds. Consider Lightning Lanes for popular attractions.';
    }
    if (level <= 8) {
      return 'Busy day. Arrive early and use Lightning Lanes strategically.';
    }
    return 'Very busy day. Early arrival and Lightning Lanes highly recommended.';
  }

  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const [key, _] of this.cache.entries()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getCacheStats() {
    const stats: Record<string, { size: number; oldestEntry: string; newestEntry: string }> = {};

    for (const [, value] of this.cache.entries()) {
      const category = 'crowd_predictions';

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
}

export const queueTimesApiClient = new QueueTimesAPIClient();