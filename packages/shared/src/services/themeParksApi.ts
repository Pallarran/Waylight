import {
  LiveParkData,
  LiveAttractionData,
  LiveEntertainmentData,
  ThemeParksAPILiveData,
  LiveDataError
} from '../types/liveData';
import { getParkMapping } from '../config/parkMappings';

const THEMEPARKS_API_BASE = 'https://api.themeparks.wiki/v1';

export class ThemeParksAPIClient {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private defaultCacheTTL = 5 * 60 * 1000; // 5 minutes

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
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Waylight/1.0.0',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
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
      const apiError: LiveDataError = {
        code: error instanceof Error && error.name === 'AbortError' ? 'NETWORK_ERROR' : 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown API error',
        details: { url, error },
        timestamp: new Date().toISOString()
      };
      throw apiError;
    }
  }

  async getParkLiveData(waypointParkId: string): Promise<LiveParkData> {
    const mapping = getParkMapping(waypointParkId);
    if (!mapping) {
      throw new Error(`No mapping found for park: ${waypointParkId}`);
    }

    try {
      const liveData = await this.fetchWithCache<ThemeParksAPILiveData[]>(
        `${THEMEPARKS_API_BASE}/entity/${mapping.themeParksWikiId}/live`
      );

      const parkData = liveData.find(entity => entity.id === mapping.themeParksWikiId);
      if (!parkData) {
        throw new Error(`Park data not found for ${waypointParkId}`);
      }

      // Extract park hours from operating hours
      const hours = this.extractParkHours(parkData);

      // Filter attractions and entertainment
      const attractions = liveData
        .filter(entity => entity.entityType === 'ATTRACTION')
        .map(entity => this.transformToAttractionData(entity));

      const entertainment = liveData
        .filter(entity => entity.entityType === 'SHOW')
        .map(entity => this.transformToEntertainmentData(entity));

      return {
        parkId: waypointParkId,
        status: this.mapParkStatus(parkData.status.status),
        hours,
        lastUpdated: parkData.lastUpdate,
        attractions,
        entertainment
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw LiveDataError
      }

      const apiError: LiveDataError = {
        code: 'PARSE_ERROR',
        message: `Failed to parse park data for ${waypointParkId}`,
        details: { waypointParkId, error },
        timestamp: new Date().toISOString()
      };
      throw apiError;
    }
  }

  async getAttractionWaitTimes(waypointParkId: string): Promise<LiveAttractionData[]> {
    const parkData = await this.getParkLiveData(waypointParkId);
    return parkData.attractions;
  }

  async getEntertainmentSchedule(waypointParkId: string): Promise<LiveEntertainmentData[]> {
    const parkData = await this.getParkLiveData(waypointParkId);
    return parkData.entertainment;
  }

  private extractParkHours(parkData: ThemeParksAPILiveData) {
    const today = new Date().toISOString().split('T')[0];
    const todayHours = parkData.operatingHours?.find(hours => hours.date === today);

    if (!todayHours) {
      return {
        regular: { open: '09:00', close: '22:00' } // Default fallback
      };
    }

    // Find regular, early entry, and extended hours
    const regularHours = parkData.operatingHours?.filter(h => h.type === 'OPERATING' && h.date === today)[0];
    const earlyEntry = parkData.operatingHours?.filter(h => h.type === 'EXTRA_HOURS' && h.date === today)[0];
    const extendedEvening = parkData.operatingHours?.filter(h => h.type === 'PRIVATE' && h.date === today)[0];

    return {
      regular: {
        open: regularHours?.startTime || todayHours.startTime,
        close: regularHours?.endTime || todayHours.endTime
      },
      ...(earlyEntry && { earlyEntry: { open: earlyEntry.startTime } }),
      ...(extendedEvening && { extendedEvening: { close: extendedEvening.endTime } })
    };
  }

  private transformToAttractionData(entity: ThemeParksAPILiveData): LiveAttractionData {
    const waitTime = entity.queue?.standBy?.waitTime ?? -1;
    const status = this.mapAttractionStatus(entity.status.status);

    return {
      id: entity.id,
      waitTime,
      status,
      lastUpdated: entity.lastUpdate,
      ...(entity.queue?.fastLane && {
        lightningLane: {
          available: entity.queue.fastLane.available,
          returnTime: entity.queue.fastLane.returnTime?.fastLane
        }
      }),
      ...(entity.queue?.singleRider && {
        singleRider: {
          available: true,
          waitTime: entity.queue.singleRider.waitTime
        }
      })
    };
  }

  private transformToEntertainmentData(entity: ThemeParksAPILiveData): LiveEntertainmentData {
    const showTimes = entity.showtimes?.map(show => show.startTime) || [];
    const nextShow = showTimes.find(time => {
      const showTime = new Date(time);
      return showTime > new Date();
    });

    return {
      id: entity.id,
      showTimes,
      status: this.mapEntertainmentStatus(entity.status.status),
      nextShowTime: nextShow,
      lastUpdated: entity.lastUpdate
    };
  }

  private mapParkStatus(status: string): 'operating' | 'closed' | 'limited' {
    switch (status.toLowerCase()) {
      case 'operating':
        return 'operating';
      case 'closed':
        return 'closed';
      case 'limited':
      case 'refurbishment':
        return 'limited';
      default:
        return 'closed';
    }
  }

  private mapAttractionStatus(status: string): 'operating' | 'down' | 'delayed' | 'temporary_closure' {
    switch (status.toLowerCase()) {
      case 'operating':
        return 'operating';
      case 'down':
        return 'down';
      case 'delayed':
        return 'delayed';
      case 'closed':
      case 'refurbishment':
        return 'temporary_closure';
      default:
        return 'down';
    }
  }

  private mapEntertainmentStatus(status: string): 'operating' | 'cancelled' | 'delayed' {
    switch (status.toLowerCase()) {
      case 'operating':
        return 'operating';
      case 'delayed':
        return 'delayed';
      case 'closed':
      case 'cancelled':
      case 'refurbishment':
      case 'down':
        return 'cancelled';
      default:
        return 'cancelled';
    }
  }

  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const [key] of this.cache.entries()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getCacheStats() {
    const stats: Record<string, { size: number; oldestEntry: string; newestEntry: string }> = {};

    for (const [key, value] of this.cache.entries()) {
      const category = key.split('/')[4] || 'general'; // Extract category from URL

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

export const themeParksApiClient = new ThemeParksAPIClient();