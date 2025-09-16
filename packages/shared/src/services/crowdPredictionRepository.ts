import { supabase, Database } from './supabase';
import {
  ParkCrowdPrediction,
  LiveDataError
} from '../types/liveData';

// Type aliases for database types
type ParkCrowdPredictionRow = Database['public']['Tables']['park_crowd_predictions']['Row'];
type ParkCrowdPredictionInsert = Database['public']['Tables']['park_crowd_predictions']['Insert'];

/**
 * Repository class for managing park crowd predictions in the database
 */
export class CrowdPredictionRepository {

  /**
   * Get crowd predictions for a specific park and date range
   */
  async getCrowdPredictionsForDateRange(
    parkId: string,
    startDate: string,
    endDate: string
  ): Promise<ParkCrowdPrediction[]> {
    try {
      const { data, error } = await supabase
        .from('park_crowd_predictions')
        .select('*')
        .eq('park_id', parkId)
        .gte('prediction_date', startDate)
        .lte('prediction_date', endDate)
        .order('prediction_date');

      if (error) throw error;

      return (data || []).map(this.transformDbToPrediction);
    } catch (error) {
      const liveDataError: LiveDataError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Database error',
        details: { parkId, startDate, endDate, error },
        timestamp: new Date().toISOString()
      };
      throw liveDataError;
    }
  }

  /**
   * Get crowd prediction for a specific park and date
   */
  async getCrowdPredictionForDate(parkId: string, date: string): Promise<ParkCrowdPrediction | null> {
    try {
      const { data, error } = await supabase
        .from('park_crowd_predictions')
        .select('*')
        .eq('park_id', parkId)
        .eq('prediction_date', date)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw error;
      }

      return this.transformDbToPrediction(data);
    } catch (error) {
      const liveDataError: LiveDataError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Database error',
        details: { parkId, date, error },
        timestamp: new Date().toISOString()
      };
      throw liveDataError;
    }
  }

  /**
   * Get all crowd predictions for multiple parks within a date range
   */
  async getMultipleParkCrowdPredictions(
    parkIds: string[],
    startDate: string,
    endDate: string
  ): Promise<ParkCrowdPrediction[]> {
    try {
      const { data, error } = await supabase
        .from('park_crowd_predictions')
        .select('*')
        .in('park_id', parkIds)
        .gte('prediction_date', startDate)
        .lte('prediction_date', endDate)
        .order('park_id')
        .order('prediction_date');

      if (error) throw error;

      return (data || []).map(this.transformDbToPrediction);
    } catch (error) {
      const liveDataError: LiveDataError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Database error',
        details: { parkIds, startDate, endDate, error },
        timestamp: new Date().toISOString()
      };
      throw liveDataError;
    }
  }

  /**
   * Upsert crowd predictions for a park (bulk operation)
   */
  async upsertCrowdPredictions(predictions: ParkCrowdPredictionInsert[]): Promise<void> {
    if (predictions.length === 0) return;

    try {
      const { error } = await supabase
        .from('park_crowd_predictions')
        .upsert(predictions, { onConflict: 'park_id,prediction_date' });

      if (error) throw error;
    } catch (error) {
      const liveDataError: LiveDataError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Database upsert error',
        details: { predictionsCount: predictions.length, error },
        timestamp: new Date().toISOString()
      };
      throw liveDataError;
    }
  }

  /**
   * Get crowd predictions by crowd level (for finding low-crowd days)
   */
  async getCrowdPredictionsByLevel(
    parkId: string,
    maxCrowdLevel: number,
    startDate: string,
    endDate: string
  ): Promise<ParkCrowdPrediction[]> {
    try {
      const { data, error } = await supabase
        .from('park_crowd_predictions')
        .select('*')
        .eq('park_id', parkId)
        .lte('crowd_level', maxCrowdLevel)
        .gte('prediction_date', startDate)
        .lte('prediction_date', endDate)
        .order('crowd_level')
        .order('prediction_date');

      if (error) throw error;

      return (data || []).map(this.transformDbToPrediction);
    } catch (error) {
      const liveDataError: LiveDataError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Database error',
        details: { parkId, maxCrowdLevel, startDate, endDate, error },
        timestamp: new Date().toISOString()
      };
      throw liveDataError;
    }
  }

  /**
   * Clean up old crowd predictions (past dates)
   */
  async cleanupOldPredictions(): Promise<number> {
    try {
      // Use the database function for cleanup
      const { data, error } = await supabase.rpc('cleanup_old_crowd_predictions');

      if (error) throw error;

      return data || 0;
    } catch (error) {
      // Fallback to manual cleanup if function doesn't exist
      console.warn('cleanup_old_crowd_predictions function not found, using fallback');

      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const cutoffDate = yesterday.toISOString().split('T')[0];

        const { count, error: deleteError } = await supabase
          .from('park_crowd_predictions')
          .delete({ count: 'exact' })
          .lt('prediction_date', cutoffDate);

        if (deleteError) throw deleteError;

        return count || 0;
      } catch (fallbackError) {
        const liveDataError: LiveDataError = {
          code: 'API_ERROR',
          message: fallbackError instanceof Error ? fallbackError.message : 'Cleanup error',
          details: { error: fallbackError },
          timestamp: new Date().toISOString()
        };
        throw liveDataError;
      }
    }
  }

  /**
   * Get statistics about crowd predictions data
   */
  async getCrowdPredictionStats(parkId?: string): Promise<{
    totalPredictions: number;
    dateRange: { earliest: string; latest: string };
    avgCrowdLevel: number;
    lastSyncTime: string;
  }> {
    try {
      let query = supabase.from('park_crowd_predictions').select('*');

      if (parkId) {
        query = query.eq('park_id', parkId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          totalPredictions: 0,
          dateRange: { earliest: '', latest: '' },
          avgCrowdLevel: 0,
          lastSyncTime: ''
        };
      }

      const sortedDates = data.map(p => p.prediction_date).sort();
      const avgCrowdLevel = data.reduce((sum, p) => sum + p.crowd_level, 0) / data.length;
      const latestSync = data.reduce((latest, p) =>
        p.synced_at > latest ? p.synced_at : latest, data[0].synced_at
      );

      return {
        totalPredictions: data.length,
        dateRange: {
          earliest: sortedDates[0],
          latest: sortedDates[sortedDates.length - 1]
        },
        avgCrowdLevel: Math.round(avgCrowdLevel * 100) / 100,
        lastSyncTime: latestSync
      };
    } catch (error) {
      const liveDataError: LiveDataError = {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Stats query error',
        details: { parkId, error },
        timestamp: new Date().toISOString()
      };
      throw liveDataError;
    }
  }

  /**
   * Transform database row to ParkCrowdPrediction interface
   */
  private transformDbToPrediction(row: ParkCrowdPredictionRow): ParkCrowdPrediction {
    return {
      parkId: row.park_id,
      predictionDate: row.prediction_date,
      crowdLevel: row.crowd_level,
      description: row.crowd_level_description,
      recommendation: row.recommendation || undefined,
      dataSource: row.data_source,
      confidenceScore: row.confidence_score || undefined,
      lastUpdated: row.synced_at
    };
  }

  /**
   * Transform ParkCrowdPrediction to database insert format
   */
  static transformPredictionToDb(prediction: ParkCrowdPrediction): ParkCrowdPredictionInsert {
    return {
      park_id: prediction.parkId,
      prediction_date: prediction.predictionDate,
      crowd_level: prediction.crowdLevel,
      crowd_level_description: prediction.description,
      recommendation: prediction.recommendation || null,
      data_source: prediction.dataSource,
      confidence_score: prediction.confidenceScore || null,
      synced_at: prediction.lastUpdated
    };
  }
}

// Export singleton instance
export const crowdPredictionRepository = new CrowdPredictionRepository();