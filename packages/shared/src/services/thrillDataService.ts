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
      const predictions = await this.scrapeCrowdCalendar(url, year);

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

  private async scrapeCrowdCalendar(url: string, year: number): Promise<ThrillDataDayPrediction[]> {
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
      const predictions = this.parseCalendarHTML(html, year);

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

  private parseCalendarHTML(html: string, year: number): ThrillDataDayPrediction[] {
    const predictions: ThrillDataDayPrediction[] = [];

    // Parse calendar links in format: [Jan 01 31] where 31 is wait time
    // These appear as links with href like /research/magic-kingdom/01/01
    const linkPattern = /\[([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d+)\]/g;

    let match;
    while ((match = linkPattern.exec(html)) !== null) {
      const [, monthName, dayStr, waitTimeStr] = match;

      // Validate parsed values
      if (!monthName || !dayStr || !waitTimeStr) {
        console.warn(`Invalid date data: month=${monthName}, day=${dayStr}, waitTime=${waitTimeStr}`);
        continue;
      }

      const waitTime = parseInt(waitTimeStr, 10);
      const day = parseInt(dayStr, 10);

      // Convert month name to number
      const monthMap: Record<string, number> = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
        'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
      };

      const month = monthMap[monthName];
      if (!month) {
        console.warn(`Unknown month: ${monthName}`);
        continue;
      }

      // Create date string in YYYY-MM-DD format using the provided year
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      predictions.push({
        date,
        waitTime,
        colorLevel: this.mapWaitTimeToColorLevel(waitTime)
      });
    }

    // Alternative parsing: look for direct href patterns with dates
    if (predictions.length === 0) {
      const hrefPattern = /href="[^"]*\/(\d{2})\/(\d{2})"[^>]*>\s*\[([A-Z][a-z]{2})\s+\d{1,2}\s+(\d+)\]/g;

      while ((match = hrefPattern.exec(html)) !== null) {
        const [, monthStr, dayStr, , waitTimeStr] = match;

        // Validate parsed values
        if (!monthStr || !dayStr || !waitTimeStr) {
          console.warn(`Invalid href data: month=${monthStr}, day=${dayStr}, waitTime=${waitTimeStr}`);
          continue;
        }

        const waitTime = parseInt(waitTimeStr, 10);
        const month = parseInt(monthStr, 10);
        const day = parseInt(dayStr, 10);

        const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        predictions.push({
          date,
          waitTime,
          colorLevel: this.mapWaitTimeToColorLevel(waitTime)
        });
      }
    }

    // Fallback: extract any numeric patterns that might be wait times with dates
    if (predictions.length === 0) {
      console.warn('No calendar data found with standard patterns, trying fallback parsing');

      // Look for any date-like patterns in the HTML
      const fallbackPattern = /(\d{4})-(\d{2})-(\d{2})[^>]*>.*?(\d{2,3})/g;
      while ((match = fallbackPattern.exec(html)) !== null) {
        const [, year, month, day, waitTimeStr] = match;

        // Validate parsed values
        if (!year || !month || !day || !waitTimeStr) {
          continue;
        }

        const waitTime = parseInt(waitTimeStr, 10);

        // Only accept reasonable wait times (10-60 minutes)
        if (waitTime >= 10 && waitTime <= 60) {
          predictions.push({
            date: `${year}-${month}-${day}`,
            waitTime,
            colorLevel: this.mapWaitTimeToColorLevel(waitTime)
          });
        }
      }
    }

    console.log(`Parsed ${predictions.length} predictions from Thrill Data calendar`);
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