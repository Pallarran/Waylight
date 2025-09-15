import { supabase, Database } from './supabase';
import {
  LiveParkData,
  LiveAttractionData,
  LiveEntertainmentData,
  LiveDataError
} from '../types/liveData';

// Type aliases for database types
type LiveParkRow = Database['public']['Tables']['live_parks']['Row'];
type LiveAttractionRow = Database['public']['Tables']['live_attractions']['Row'];
type LiveEntertainmentRow = Database['public']['Tables']['live_entertainment']['Row'];
type LiveSyncStatusRow = Database['public']['Tables']['live_sync_status']['Row'];

type LiveParkInsert = Database['public']['Tables']['live_parks']['Insert'];
type LiveAttractionInsert = Database['public']['Tables']['live_attractions']['Insert'];
type LiveEntertainmentInsert = Database['public']['Tables']['live_entertainment']['Insert'];
type LiveSyncStatusInsert = Database['public']['Tables']['live_sync_status']['Insert'];

/**
 * Repository class for managing live park data in the database
 */
export class LiveDataRepository {

  // Park Operations
  async getParkData(parkId: string): Promise<LiveParkData | null> {
    try {
      const { data: parkData, error: parkError } = await supabase
        .from('live_parks')
        .select('*')
        .eq('park_id', parkId)
        .single();

      if (parkError) {
        if (parkError.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw parkError;
      }

      // Get attractions for this park
      const { data: attractions, error: attractionsError } = await supabase
        .from('live_attractions')
        .select('*')
        .eq('park_id', parkId);

      if (attractionsError) throw attractionsError;

      // Get entertainment for this park
      const { data: entertainment, error: entertainmentError } = await supabase
        .from('live_entertainment')
        .select('*')
        .eq('park_id', parkId);

      if (entertainmentError) throw entertainmentError;

      // Transform database data to LiveParkData format
      return this.transformDbParkToLive(parkData, attractions || [], entertainment || []);
    } catch (error) {
      const liveDataError: LiveDataError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Database error',
        details: { parkId, error },
        timestamp: new Date().toISOString()
      };
      throw liveDataError;
    }
  }

  async getMultipleParkData(parkIds: string[]): Promise<LiveParkData[]> {
    const results = await Promise.allSettled(
      parkIds.map(parkId => this.getParkData(parkId))
    );

    return results
      .map(result => result.status === 'fulfilled' ? result.value : null)
      .filter((data): data is LiveParkData => data !== null);
  }

  async upsertParkData(parkData: LiveParkInsert): Promise<void> {
    const { error } = await supabase
      .from('live_parks')
      .upsert(parkData, { onConflict: 'park_id' });

    if (error) throw error;
  }

  // Attraction Operations
  async getAttractionWaitTimes(parkId: string): Promise<LiveAttractionData[]> {
    try {
      const { data, error } = await supabase
        .from('live_attractions')
        .select('*')
        .eq('park_id', parkId)
        .order('name');

      if (error) throw error;

      return (data || []).map(this.transformDbAttractionToLive);
    } catch (error) {
      const liveDataError: LiveDataError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Database error',
        details: { parkId, error },
        timestamp: new Date().toISOString()
      };
      throw liveDataError;
    }
  }

  async upsertAttractionData(attractionData: LiveAttractionInsert[]): Promise<void> {
    if (attractionData.length === 0) return;

    const { error } = await supabase
      .from('live_attractions')
      .upsert(attractionData, { onConflict: 'park_id,external_id' });

    if (error) throw error;
  }

  // Entertainment Operations
  async getEntertainmentSchedule(parkId: string): Promise<LiveEntertainmentData[]> {
    try {
      const { data, error } = await supabase
        .from('live_entertainment')
        .select('*')
        .eq('park_id', parkId)
        .order('name');

      if (error) throw error;

      return (data || []).map(this.transformDbEntertainmentToLive);
    } catch (error) {
      const liveDataError: LiveDataError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Database error',
        details: { parkId, error },
        timestamp: new Date().toISOString()
      };
      throw liveDataError;
    }
  }

  async upsertEntertainmentData(entertainmentData: LiveEntertainmentInsert[]): Promise<void> {
    if (entertainmentData.length === 0) return;

    const { error } = await supabase
      .from('live_entertainment')
      .upsert(entertainmentData, { onConflict: 'park_id,external_id' });

    if (error) throw error;
  }

  // Sync Status Operations
  async getSyncStatus(serviceName: string): Promise<LiveSyncStatusRow | null> {
    const { data, error } = await supabase
      .from('live_sync_status')
      .select('*')
      .eq('service_name', serviceName)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateSyncStatus(serviceName: string, success: boolean, errorMessage?: string): Promise<void> {
    const now = new Date().toISOString();

    const updateData: Partial<LiveSyncStatusInsert> = {
      service_name: serviceName,
      last_sync_at: now,
      total_syncs: 1, // This will be incremented in SQL
    };

    if (success) {
      updateData.last_success_at = now;
      updateData.successful_syncs = 1;
      updateData.last_error = null;
    } else {
      updateData.failed_syncs = 1;
      updateData.last_error = errorMessage || 'Unknown error';
    }

    // Use raw SQL for atomic increment
    const { error } = await supabase.rpc('update_sync_status', {
      p_service_name: serviceName,
      p_success: success,
      p_error_message: errorMessage || null
    });

    if (error) {
      // Fallback to regular upsert if the function doesn't exist
      console.warn('Sync status function not found, using fallback');
      const { error: fallbackError } = await supabase
        .from('live_sync_status')
        .upsert(updateData, { onConflict: 'service_name' });

      if (fallbackError) throw fallbackError;
    }
  }

  // Data Cleanup Operations
  async cleanOldData(olderThanHours: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();

    // Clean old attraction data
    await supabase
      .from('live_attractions')
      .delete()
      .lt('last_updated', cutoffTime);

    // Clean old entertainment data
    await supabase
      .from('live_entertainment')
      .delete()
      .lt('last_updated', cutoffTime);

    // Keep park data longer (7 days)
    const parkCutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('live_parks')
      .delete()
      .lt('last_updated', parkCutoffTime);
  }

  // Transform functions to convert database types to live data types
  private transformDbParkToLive(
    park: LiveParkRow,
    attractions: LiveAttractionRow[],
    entertainment: LiveEntertainmentRow[]
  ): LiveParkData {
    return {
      parkId: park.park_id,
      status: park.status as 'operating' | 'closed' | 'limited',
      hours: {
        regular: {
          open: park.regular_open,
          close: park.regular_close
        },
        ...(park.early_entry_open && { earlyEntry: { open: park.early_entry_open } }),
        ...(park.extended_evening_close && { extendedEvening: { close: park.extended_evening_close } })
      },
      crowdLevel: park.crowd_level ?? undefined,
      lastUpdated: park.last_updated,
      attractions: attractions.map(this.transformDbAttractionToLive),
      entertainment: entertainment.map(this.transformDbEntertainmentToLive)
    };
  }

  private transformDbAttractionToLive(attraction: LiveAttractionRow): LiveAttractionData {
    return {
      id: attraction.external_id,
      waitTime: attraction.wait_time,
      status: attraction.status as 'operating' | 'down' | 'delayed' | 'temporary_closure',
      ...(attraction.lightning_lane_available && {
        lightningLane: {
          available: attraction.lightning_lane_available,
          returnTime: attraction.lightning_lane_return_time || undefined
        }
      }),
      ...(attraction.single_rider_available && {
        singleRider: {
          available: attraction.single_rider_available,
          waitTime: attraction.single_rider_wait_time || undefined
        }
      }),
      lastUpdated: attraction.last_updated
    };
  }

  private transformDbEntertainmentToLive(entertainment: LiveEntertainmentRow): LiveEntertainmentData {
    return {
      id: entertainment.external_id,
      showTimes: entertainment.show_times || [],
      status: entertainment.status as 'operating' | 'cancelled' | 'delayed',
      nextShowTime: entertainment.next_show_time || undefined,
      lastUpdated: entertainment.last_updated
    };
  }
}

// Export singleton instance
export const liveDataRepository = new LiveDataRepository();