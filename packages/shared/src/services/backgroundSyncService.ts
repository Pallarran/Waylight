import { themeParksApiClient } from './themeParksApi';
import { queueTimesApiClient } from './queueTimesApi';
import { liveDataRepository } from './liveDataRepository';
import { getParkMapping } from '../config/parkMappings';
import { Database } from './supabase';

// Type aliases for easier usage
type LiveParkInsert = Database['public']['Tables']['live_parks']['Insert'];
type LiveAttractionInsert = Database['public']['Tables']['live_attractions']['Insert'];
type LiveEntertainmentInsert = Database['public']['Tables']['live_entertainment']['Insert'];

interface SyncConfig {
  syncIntervalMinutes: number;
  enabledParks: string[];
  enabledServices: {
    themeparks: boolean;
    queueTimes: boolean;
  };
  retryAttempts: number;
  retryDelayMs: number;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  syncIntervalMinutes: 15, // Sync every 15 minutes
  enabledParks: ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom'],
  enabledServices: {
    themeparks: true,
    queueTimes: true
  },
  retryAttempts: 3,
  retryDelayMs: 5000
};

/**
 * Background service that periodically syncs live data from external APIs to database
 */
export class BackgroundSyncService {
  private config: SyncConfig;
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_SYNC_CONFIG, ...config };
  }

  /**
   * Start the background sync process
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Background sync service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting background sync service...');

    // Run initial sync immediately
    await this.runFullSync();

    // Schedule periodic syncs
    const syncTimer = setInterval(async () => {
      try {
        await this.runFullSync();
      } catch (error) {
        console.error('Scheduled sync failed:', error);
      }
    }, this.config.syncIntervalMinutes * 60 * 1000);

    this.syncTimers.set('main', syncTimer);
    console.log(`Background sync scheduled every ${this.config.syncIntervalMinutes} minutes`);
  }

  /**
   * Stop the background sync process
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.syncTimers.forEach(timer => clearInterval(timer));
    this.syncTimers.clear();
    console.log('Background sync service stopped');
  }

  /**
   * Run a full sync of all enabled services and parks
   */
  async runFullSync(): Promise<void> {
    console.log('Starting full sync...');
    const startTime = Date.now();

    const syncPromises: Promise<void>[] = [];

    if (this.config.enabledServices.themeparks) {
      syncPromises.push(this.syncThemeParksData());
    }

    if (this.config.enabledServices.queueTimes) {
      syncPromises.push(this.syncQueueTimesData());
    }

    // Run syncs in parallel
    await Promise.allSettled(syncPromises);

    // Clean up old data
    await this.cleanupOldData();

    const duration = Date.now() - startTime;
    console.log(`Full sync completed in ${duration}ms`);
  }

  /**
   * Sync data from ThemeParks.wiki API
   */
  private async syncThemeParksData(): Promise<void> {
    const serviceName = 'themeparks_api';
    console.log(`Syncing ${serviceName}...`);

    try {
      for (const parkId of this.config.enabledParks) {
        await this.syncSingleParkFromThemeParks(parkId);
      }

      await liveDataRepository.updateSyncStatus(serviceName, true);
      console.log(`${serviceName} sync successful`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await liveDataRepository.updateSyncStatus(serviceName, false, errorMessage);
      console.error(`${serviceName} sync failed:`, error);
    }
  }

  /**
   * Sync data from Queue-Times API
   */
  private async syncQueueTimesData(): Promise<void> {
    const serviceName = 'queue_times_api';
    console.log(`Syncing ${serviceName}...`);

    try {
      for (const parkId of this.config.enabledParks) {
        await this.syncCrowdDataFromQueueTimes(parkId);
      }

      await liveDataRepository.updateSyncStatus(serviceName, true);
      console.log(`${serviceName} sync successful`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await liveDataRepository.updateSyncStatus(serviceName, false, errorMessage);
      console.error(`${serviceName} sync failed:`, error);
    }
  }

  /**
   * Sync a single park's data from ThemeParks.wiki
   */
  private async syncSingleParkFromThemeParks(parkId: string): Promise<void> {
    const mapping = getParkMapping(parkId);
    if (!mapping) {
      console.warn(`No mapping found for park: ${parkId}`);
      return;
    }

    let attempt = 0;
    while (attempt < this.config.retryAttempts) {
      try {
        console.log(`Syncing ${parkId} (attempt ${attempt + 1})`);

        // Get park data from API
        const parkData = await themeParksApiClient.getParkLiveData(parkId);

        // Transform and save park data
        const parkInsert: LiveParkInsert = {
          park_id: parkId,
          external_id: mapping.themeParksWikiId,
          name: mapping.displayName,
          status: parkData.status,
          regular_open: parkData.hours.regular.open || '09:00',
          regular_close: parkData.hours.regular.close || '21:00',
          early_entry_open: parkData.hours.earlyEntry?.open || null,
          extended_evening_close: parkData.hours.extendedEvening?.close || null,
          crowd_level: parkData.crowdLevel || null,
          last_updated: parkData.lastUpdated
        };

        await liveDataRepository.upsertParkData(parkInsert);

        // Transform and save attraction data
        if (parkData.attractions.length > 0) {
          const attractionInserts: LiveAttractionInsert[] = parkData.attractions.map(attraction => ({
            park_id: parkId,
            external_id: attraction.id,
            name: this.extractNameFromId(attraction.id),
            wait_time: attraction.waitTime,
            status: attraction.status,
            lightning_lane_available: attraction.lightningLane?.available || false,
            lightning_lane_return_time: attraction.lightningLane?.returnTime || null,
            single_rider_available: attraction.singleRider?.available || false,
            single_rider_wait_time: attraction.singleRider?.waitTime || null,
            last_updated: attraction.lastUpdated
          }));

          await liveDataRepository.upsertAttractionData(attractionInserts);
        }

        // Transform and save entertainment data
        if (parkData.entertainment.length > 0) {
          const entertainmentInserts: LiveEntertainmentInsert[] = parkData.entertainment.map(entertainment => ({
            park_id: parkId,
            external_id: entertainment.id,
            name: this.extractNameFromId(entertainment.id),
            show_times: entertainment.showTimes,
            status: entertainment.status,
            next_show_time: entertainment.nextShowTime || null,
            last_updated: entertainment.lastUpdated
          }));

          await liveDataRepository.upsertEntertainmentData(entertainmentInserts);
        }

        console.log(`Successfully synced ${parkId}`);
        break; // Success, exit retry loop
      } catch (error) {
        attempt++;
        console.error(`Sync attempt ${attempt} failed for ${parkId}:`, error);

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelayMs * attempt); // Exponential backoff
        } else {
          throw error; // All attempts failed
        }
      }
    }
  }

  /**
   * Sync crowd data from Queue-Times API
   */
  private async syncCrowdDataFromQueueTimes(parkId: string): Promise<void> {
    try {
      const crowdLevel = await queueTimesApiClient.getCurrentCrowdLevel(parkId);

      if (crowdLevel !== null) {
        // Update the park's crowd level
        const existingPark = await liveDataRepository.getParkData(parkId);
        if (existingPark) {
          const mapping = getParkMapping(parkId);
          if (mapping) {
            const parkUpdate: LiveParkInsert = {
              park_id: parkId,
              external_id: mapping.themeParksWikiId,
              name: mapping.displayName,
              status: existingPark.status,
              regular_open: existingPark.hours.regular.open || '09:00',
              regular_close: existingPark.hours.regular.close || '21:00',
              early_entry_open: existingPark.hours.earlyEntry?.open || null,
              extended_evening_close: existingPark.hours.extendedEvening?.close || null,
              crowd_level: crowdLevel,
              last_updated: new Date().toISOString()
            };

            await liveDataRepository.upsertParkData(parkUpdate);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to sync crowd data for ${parkId}:`, error);
      // Don't throw here as crowd data is supplementary
    }
  }

  /**
   * Clean up old data from database
   */
  private async cleanupOldData(): Promise<void> {
    try {
      await liveDataRepository.cleanOldData(24); // Remove data older than 24 hours
      console.log('Old data cleanup completed');
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  }

  /**
   * Extract a readable name from an entity ID
   * This is a fallback for when API doesn't provide names
   */
  private extractNameFromId(id: string): string {
    // Convert UUID or slug to readable name
    return id.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    themeparks: any;
    queueTimes: any;
  }> {
    const [themeparksStatus, queueTimesStatus] = await Promise.all([
      liveDataRepository.getSyncStatus('themeparks_api'),
      liveDataRepository.getSyncStatus('queue_times_api')
    ]);

    return {
      themeparks: themeparksStatus,
      queueTimes: queueTimesStatus
    };
  }

  /**
   * Update sync configuration
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.isRunning) {
      console.log('Restarting sync service with new configuration...');
      this.stop();
      this.start();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * Check if service is running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const backgroundSyncService = new BackgroundSyncService();