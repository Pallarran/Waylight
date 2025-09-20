import {
  ParkCrowdPrediction,
  LiveDataError
} from '../types/liveData';
import { getThrillDataId } from '../config/parkMappings';

const THRILL_DATA_BASE_URL = 'https://www.thrill-data.com/trip-planning/crowd-calendar';

interface ThrillDataDayPrediction {
  date: string; // YYYY-MM-DD
  waitTime: number; // minutes
  colorLevel: 'Lowest' | 'Lower' | 'Average' | 'Higher' | 'Highest';
}

export class ThrillDataService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private defaultCacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  async fetchCrowdPredictionsForYear(
    waypointParkId: string,
    year: number
  ): Promise<ParkCrowdPrediction[]> {
    const thrillDataId = getThrillDataId(waypointParkId);
    if (!thrillDataId) {
      throw new Error(`No Thrill Data mapping found for park: ${waypointParkId}`);
    }

    try {
      const url = `${THRILL_DATA_BASE_URL}/${thrillDataId}/calendar/${year}`;
      const predictions = await this.scrapeCrowdCalendar(url);

      return predictions.map(prediction => ({
        parkId: waypointParkId,
        predictionDate: prediction.date,
        crowdLevel: this.mapWaitTimeToCrowdLevel(prediction.waitTime),
        description: this.mapCrowdLevelToDescription(this.mapWaitTimeToCrowdLevel(prediction.waitTime)),
        recommendation: this.getCrowdRecommendation(this.mapWaitTimeToCrowdLevel(prediction.waitTime)),
        dataSource: 'thrill_data_api',
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      const apiError: LiveDataError = {
        code: 'API_ERROR',
        message: `Failed to fetch Thrill Data predictions for ${waypointParkId}`,
        details: { waypointParkId, year, error },
        timestamp: new Date().toISOString()
      };
      throw apiError;
    }
  }

  private async scrapeCrowdCalendar(url: string): Promise<ThrillDataDayPrediction[]> {
    const cacheKey = `thrill_data_${url}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as ThrillDataDayPrediction[];
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          const apiError: LiveDataError = {
            code: 'RATE_LIMITED',
            message: 'Thrill Data rate limit exceeded',
            details: { url, status: response.status },
            timestamp: new Date().toISOString()
          };
          throw apiError;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const predictions = this.parseCalendarHTML(html);

      this.cache.set(cacheKey, {
        data: predictions,
        timestamp: Date.now(),
        ttl: this.defaultCacheTTL
      });

      return predictions;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error; // Re-throw LiveDataError
      }

      const apiError: LiveDataError = {
        code: 'PARSE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown Thrill Data scraping error',
        details: { url, error },
        timestamp: new Date().toISOString()
      };
      throw apiError;
    }
  }

  private parseCalendarHTML(html: string): ThrillDataDayPrediction[] {
    const predictions: ThrillDataDayPrediction[] = [];

    // Parse the HTML to extract daily predictions
    // This will need to be implemented based on the actual HTML structure
    // For now, we'll use a placeholder that extracts basic data

    // Look for calendar data - Thrill Data likely has predictions in data attributes or JavaScript
    const dataMatches = html.match(/"(\d{4}-\d{2}-\d{2})"\s*:\s*(\d+)/g);

    if (dataMatches) {
      for (const match of dataMatches) {
        const [, date, waitTimeStr] = match.match(/"(\d{4}-\d{2}-\d{2})"\s*:\s*(\d+)/) || [];
        if (date && waitTimeStr) {
          const waitTime = parseInt(waitTimeStr, 10);
          predictions.push({
            date,
            waitTime,
            colorLevel: this.mapWaitTimeToColorLevel(waitTime)
          });
        }
      }
    }

    // If no structured data found, try to parse from visible elements
    if (predictions.length === 0) {
      // This would require more sophisticated HTML parsing
      // We might need to use a proper HTML parser like cheerio for server-side parsing
      console.warn('No structured calendar data found, may need enhanced parsing');
    }

    return predictions;
  }

  private mapWaitTimeToColorLevel(waitTime: number): 'Lowest' | 'Lower' | 'Average' | 'Higher' | 'Highest' {
    // Based on 14-41 minute range from Thrill Data
    if (waitTime <= 19) return 'Lowest';   // 14-19 min
    if (waitTime <= 25) return 'Lower';    // 20-25 min
    if (waitTime <= 31) return 'Average';  // 26-31 min
    if (waitTime <= 37) return 'Higher';   // 32-37 min
    return 'Highest';                      // 38+ min
  }

  private mapWaitTimeToCrowdLevel(waitTime: number): number {
    // Map to our 1-10 scale based on Thrill Data's 14-41 minute range
    if (waitTime <= 19) return 2;  // Very Low (Lowest)
    if (waitTime <= 25) return 4;  // Low (Lower)
    if (waitTime <= 31) return 6;  // Moderate (Average)
    if (waitTime <= 37) return 8;  // High (Higher)
    return 10;                     // Very High (Highest)
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
      return 'Perfect day to visit! Very short wait times expected.';
    }
    if (level <= 4) {
      return 'Great day to visit with manageable crowds.';
    }
    if (level <= 6) {
      return 'Moderate crowds. Plan your must-do attractions early.';
    }
    if (level <= 8) {
      return 'Busy day. Arrive early and consider Lightning Lanes for popular attractions.';
    }
    return 'Very busy day. Early arrival and strategic planning highly recommended.';
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
      const category = 'thrill_data_predictions';

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

export const thrillDataService = new ThrillDataService();