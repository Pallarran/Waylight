/**
 * Vercel Serverless Function for Thrill Data Import
 * This function imports crowd prediction data from Thrill Data website and populates the database
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Define types locally to avoid monorepo dependency issues
interface ImportResult {
  success: boolean;
  recordsImported: number;
  parksProcessed: string[];
  errors: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

interface ThrillDataDayPrediction {
  date: string; // YYYY-MM-DD
  waitTime: number; // minutes
  colorLevel: 'Lowest' | 'Lower' | 'Average' | 'Higher' | 'Highest';
}

// Park mappings with Thrill Data IDs
const PARK_MAPPINGS = [
  { waypointParkId: 'magic-kingdom', thrillDataId: 'magic-kingdom', displayName: 'Magic Kingdom' },
  { waypointParkId: 'epcot', thrillDataId: 'epcot', displayName: 'EPCOT' },
  { waypointParkId: 'hollywood-studios', thrillDataId: 'hollywood-studios', displayName: 'Hollywood Studios' },
  { waypointParkId: 'animal-kingdom', thrillDataId: 'animal-kingdom', displayName: 'Animal Kingdom' }
];

const THRILL_DATA_BASE_URL = 'https://www.thrill-data.com/trip-planning/crowd-calendar';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Web scraping functions
async function fetchCrowdPredictionsForYear(
  waypointParkId: string,
  thrillDataId: string,
  year: number
): Promise<any[]> {
  const url = `${THRILL_DATA_BASE_URL}/${thrillDataId}/calendar/${year}`;
  console.log(`Fetching data from: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limited by Thrill Data API');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const predictions = parseCalendarHTML(html, year);

    return predictions.map(prediction => ({
      park_id: waypointParkId,
      prediction_date: prediction.date,
      crowd_level: mapWaitTimeToCrowdLevel(prediction.waitTime),
      crowd_level_description: mapCrowdLevelToDescription(mapWaitTimeToCrowdLevel(prediction.waitTime)),
      recommendation: getCrowdRecommendation(mapWaitTimeToCrowdLevel(prediction.waitTime)),
      data_source: 'thrill_data_scraping',
      synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`Failed to fetch data from ${url}:`, error);
    throw error;
  }
}

function parseCalendarHTML(html: string, year: number): ThrillDataDayPrediction[] {
  const predictions: ThrillDataDayPrediction[] = [];

  // Parse calendar links in format: [Jan 01 31] where 31 is wait time
  const linkPattern = /\[([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d+)\]/g;

  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const [, monthName, dayStr, waitTimeStr] = match;
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
      colorLevel: mapWaitTimeToColorLevel(waitTime)
    });
  }

  // Alternative parsing: look for direct href patterns with dates
  if (predictions.length === 0) {
    const hrefPattern = /href="[^"]*\/(\d{2})\/(\d{2})"[^>]*>\s*\[([A-Z][a-z]{2})\s+\d{1,2}\s+(\d+)\]/g;

    while ((match = hrefPattern.exec(html)) !== null) {
      const [, monthStr, dayStr, , waitTimeStr] = match;
      const waitTime = parseInt(waitTimeStr, 10);
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);

      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      predictions.push({
        date,
        waitTime,
        colorLevel: mapWaitTimeToColorLevel(waitTime)
      });
    }
  }

  console.log(`Parsed ${predictions.length} predictions from Thrill Data calendar for ${year}`);
  return predictions;
}

function mapWaitTimeToColorLevel(waitTime: number): 'Lowest' | 'Lower' | 'Average' | 'Higher' | 'Highest' {
  // Based on 14-41 minute range from Thrill Data
  if (waitTime <= 19) return 'Lowest';   // 14-19 min
  if (waitTime <= 25) return 'Lower';    // 20-25 min
  if (waitTime <= 31) return 'Average';  // 26-31 min
  if (waitTime <= 37) return 'Higher';   // 32-37 min
  return 'Highest';                      // 38+ min
}

function mapWaitTimeToCrowdLevel(waitTime: number): number {
  // Map to our 1-10 scale based on Thrill Data's 14-41 minute range
  if (waitTime <= 19) return 2;  // Very Low (Lowest)
  if (waitTime <= 25) return 4;  // Low (Lower)
  if (waitTime <= 31) return 6;  // Moderate (Average)
  if (waitTime <= 37) return 8;  // High (Higher)
  return 10;                     // Very High (Highest)
}

function mapCrowdLevelToDescription(level: number): string {
  if (level <= 2) return 'Very Low';
  if (level <= 4) return 'Low';
  if (level <= 6) return 'Moderate';
  if (level <= 8) return 'High';
  return 'Very High';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 Starting Thrill Data import...');

    // Get year from request body, default to current year
    const { year = new Date().getFullYear() } = req.body || {};

    const result: ImportResult = {
      success: true,
      recordsImported: 0,
      parksProcessed: [],
      errors: [],
      dateRange: { start: '', end: '' }
    };

    let earliestDate = '';
    let latestDate = '';

    // Import crowd predictions for each park
    for (const parkMapping of PARK_MAPPINGS) {
      console.log(`Importing predictions for ${parkMapping.displayName} (${year})...`);

      try {
        // Fetch predictions from Thrill Data
        const predictions = await fetchCrowdPredictionsForYear(
          parkMapping.waypointParkId,
          parkMapping.thrillDataId,
          year
        );

        if (predictions.length === 0) {
          console.warn(`No predictions found for ${parkMapping.displayName}`);
          continue;
        }

        // Track date range
        const dates = predictions.map(p => p.prediction_date).sort();
        if (!earliestDate || dates[0] < earliestDate) earliestDate = dates[0];
        if (!latestDate || dates[dates.length - 1] > latestDate) latestDate = dates[dates.length - 1];

        // Insert into database using upsert
        const { error } = await supabase
          .from('park_crowd_predictions')
          .upsert(predictions, {
            onConflict: 'park_id,prediction_date',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`❌ Failed to import ${parkMapping.displayName}:`, error);
          result.errors.push(`${parkMapping.displayName}: ${error.message}`);
        } else {
          result.recordsImported += predictions.length;
          result.parksProcessed.push(parkMapping.displayName);
          console.log(`✅ Imported ${predictions.length} predictions for ${parkMapping.displayName}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to fetch data for ${parkMapping.displayName}:`, error);
        result.errors.push(`${parkMapping.displayName}: ${errorMessage}`);
      }
    }

    result.success = result.parksProcessed.length > 0;
    result.dateRange = { start: earliestDate, end: latestDate };

    const duration = Date.now() - startTime;
    console.log(`✅ Import completed in ${duration}ms`);

    return res.status(200).json({
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ Import failed:', error);

    const errorResult: ImportResult = {
      success: false,
      recordsImported: 0,
      parksProcessed: [],
      errors: [errorMessage],
      dateRange: { start: '', end: '' }
    };

    return res.status(500).json({
      ...errorResult,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
}

function getCrowdDescription(level: number): string {
  if (level <= 2) return 'Very Low';
  if (level <= 4) return 'Low';
  if (level <= 6) return 'Moderate';
  if (level <= 8) return 'High';
  return 'Very High';
}

function getCrowdRecommendation(level: number): string {
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

// Export configuration for Vercel
export const config = {
  maxDuration: 300, // 5 minutes
  regions: ['iad1'], // Deploy to US East
};