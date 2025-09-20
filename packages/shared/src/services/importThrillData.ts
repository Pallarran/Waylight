import { thrillDataService } from './thrillDataService';
import { crowdPredictionRepository, CrowdPredictionRepository } from './crowdPredictionRepository';
import { SUPPORTED_PARK_IDS } from '../config/parkMappings';
import { LiveDataError } from '../types/liveData';

export interface ImportProgress {
  currentPark: string;
  parksCompleted: number;
  totalParks: number;
  recordsImported: number;
  status: 'starting' | 'in_progress' | 'completed' | 'error';
  error?: string;
}

export interface ImportResult {
  success: boolean;
  recordsImported: number;
  parksProcessed: string[];
  errors: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

export class ThrillDataImporter {
  async importCrowdPredictionsForYear(
    year: number,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      recordsImported: 0,
      parksProcessed: [],
      errors: [],
      dateRange: { start: '', end: '' }
    };

    const totalParks = SUPPORTED_PARK_IDS.length;
    let parksCompleted = 0;

    onProgress?.({
      currentPark: '',
      parksCompleted: 0,
      totalParks,
      recordsImported: 0,
      status: 'starting'
    });

    try {
      for (const parkId of SUPPORTED_PARK_IDS) {
        onProgress?.({
          currentPark: parkId,
          parksCompleted,
          totalParks,
          recordsImported: result.recordsImported,
          status: 'in_progress'
        });

        try {
          // Fetch crowd predictions for this park
          const predictions = await thrillDataService.fetchCrowdPredictionsForYear(parkId, year);

          if (predictions.length > 0) {
            // Transform to database format
            const dbPredictions = predictions.map(prediction =>
              CrowdPredictionRepository.transformPredictionToDb(prediction)
            );

            // Upsert to database
            await crowdPredictionRepository.upsertCrowdPredictions(dbPredictions);

            result.recordsImported += predictions.length;
            result.parksProcessed.push(parkId);

            // Update date range
            const dates = predictions.map(p => p.predictionDate).sort();
            if (!result.dateRange.start || (dates[0] && dates[0] < result.dateRange.start)) {
              result.dateRange.start = dates[0] || '';
            }
            const lastDate = dates[dates.length - 1];
            if (!result.dateRange.end || (lastDate && lastDate > result.dateRange.end)) {
              result.dateRange.end = lastDate || '';
            }

            console.log(`✅ Imported ${predictions.length} predictions for ${parkId}`);
          } else {
            console.warn(`⚠️ No predictions found for ${parkId}`);
            result.errors.push(`No predictions found for ${parkId}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : `Unknown error for ${parkId}`;
          console.error(`❌ Failed to import ${parkId}:`, errorMessage);
          result.errors.push(`${parkId}: ${errorMessage}`);
        }

        parksCompleted++;
        onProgress?.({
          currentPark: parkId,
          parksCompleted,
          totalParks,
          recordsImported: result.recordsImported,
          status: 'in_progress'
        });

        // Add a small delay between parks to be respectful to Thrill Data
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      result.success = result.parksProcessed.length > 0;

      onProgress?.({
        currentPark: '',
        parksCompleted,
        totalParks,
        recordsImported: result.recordsImported,
        status: result.success ? 'completed' : 'error'
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
      result.errors.push(errorMessage);

      onProgress?.({
        currentPark: '',
        parksCompleted,
        totalParks,
        recordsImported: result.recordsImported,
        status: 'error',
        error: errorMessage
      });

      const apiError: LiveDataError = {
        code: 'API_ERROR',
        message: `Failed to import Thrill Data for ${year}`,
        details: { year, error },
        timestamp: new Date().toISOString()
      };
      throw apiError;
    }
  }

  async getImportStats(): Promise<{
    totalPredictions: number;
    dateRange: { earliest: string; latest: string };
    avgCrowdLevel: number;
    lastSyncTime: string;
    parkCounts: Record<string, number>;
  }> {
    try {
      const stats = await crowdPredictionRepository.getCrowdPredictionStats();

      // Get per-park counts
      const parkCounts: Record<string, number> = {};
      for (const parkId of SUPPORTED_PARK_IDS) {
        const parkStats = await crowdPredictionRepository.getCrowdPredictionStats(parkId);
        parkCounts[parkId] = parkStats.totalPredictions;
      }

      return {
        ...stats,
        parkCounts
      };
    } catch (error) {
      const apiError: LiveDataError = {
        code: 'API_ERROR',
        message: 'Failed to get import statistics',
        details: { error },
        timestamp: new Date().toISOString()
      };
      throw apiError;
    }
  }

  async clearExistingPredictions(year: number): Promise<number> {
    try {
      // This would require a custom delete method in the repository
      // For now, we'll rely on upsert behavior to overwrite existing data
      console.log(`Clearing existing predictions for ${year} (will be overwritten on import)`);
      return 0;
    } catch (error) {
      const apiError: LiveDataError = {
        code: 'API_ERROR',
        message: `Failed to clear existing predictions for ${year}`,
        details: { year, error },
        timestamp: new Date().toISOString()
      };
      throw apiError;
    }
  }
}

// Export singleton instance
export const thrillDataImporter = new ThrillDataImporter();

// Convenience function for simple imports
export async function importThrillData2025(
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  return thrillDataImporter.importCrowdPredictionsForYear(2025, onProgress);
}