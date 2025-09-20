/**
 * Vercel Serverless Function for Thrill Data Import
 * Web scraping implementation in JavaScript to avoid TypeScript issues
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// Park mappings with Thrill Data IDs
const PARK_MAPPINGS = [
  { waypointParkId: 'magic-kingdom', thrillDataId: 'magic-kingdom', displayName: 'Magic Kingdom' },
  { waypointParkId: 'epcot', thrillDataId: 'epcot', displayName: 'EPCOT' },
  { waypointParkId: 'hollywood-studios', thrillDataId: 'hollywood-studios', displayName: 'Hollywood Studios' },
  { waypointParkId: 'animal-kingdom', thrillDataId: 'animal-kingdom', displayName: 'Animal Kingdom' }
];

const THRILL_DATA_BASE_URL = 'https://www.thrill-data.com/trip-planning/crowd-calendar';

// Utility functions
function mapWaitTimeToCrowdLevel(waitTime) {
  if (waitTime <= 19) return 2;  // Very Low (Lowest)
  if (waitTime <= 25) return 4;  // Low (Lower)
  if (waitTime <= 31) return 6;  // Moderate (Average)
  if (waitTime <= 37) return 8;  // High (Higher)
  return 10;                     // Very High (Highest)
}

function getCrowdDescription(level) {
  if (level <= 2) return 'Very Low';
  if (level <= 4) return 'Low';
  if (level <= 6) return 'Moderate';
  if (level <= 8) return 'High';
  return 'Very High';
}

function getCrowdRecommendation(level) {
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

function parseCalendarHTML(html, year) {
  const predictions = [];

  // Parse calendar data in actual HTML format:
  // title='Predicted wait time of 31 minutes on Jan 01'>31</div>
  const calendarPattern = /title='Predicted wait time of (\d+) minutes on ([A-Z][a-z]{2}) (\d{1,2})'>(\d+)<\/div>/g;

  let match;
  while ((match = calendarPattern.exec(html)) !== null) {
    const [, waitTimeStr, monthName, dayStr, displayWaitStr] = match;

    // Validate parsed values
    if (!waitTimeStr || !monthName || !dayStr || !displayWaitStr) {
      console.warn(`Invalid calendar data: waitTime=${waitTimeStr}, month=${monthName}, day=${dayStr}, display=${displayWaitStr}`);
      continue;
    }

    const waitTime = parseInt(waitTimeStr, 10);
    const day = parseInt(dayStr, 10);

    // Convert month name to number
    const monthMap = {
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
      colorLevel: mapWaitTimeToCrowdLevel(waitTime) > 6 ? 'Higher' : 'Lower'
    });
  }

  console.log(`Parsed ${predictions.length} predictions from Thrill Data calendar for ${year}`);
  return predictions;
}

async function fetchCrowdPredictionsForYear(waypointParkId, thrillDataId, year) {
  const url = `${THRILL_DATA_BASE_URL}/${thrillDataId}/calendar/${year}`;
  console.log(`Fetching data from: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limited by Thrill Data');
      }
      if (response.status === 403 || response.status === 404) {
        throw new Error(`Access denied or page not found: ${response.status}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`HTML content length: ${html.length}`);

    // Log first 500 characters for debugging
    console.log('HTML sample:', html.substring(0, 500));

    const predictions = parseCalendarHTML(html, year);
    console.log(`Parsed predictions: ${predictions.length}`);

    return predictions.map(prediction => ({
      park_id: waypointParkId,
      prediction_date: prediction.date,
      crowd_level: mapWaitTimeToCrowdLevel(prediction.waitTime),
      crowd_level_description: getCrowdDescription(mapWaitTimeToCrowdLevel(prediction.waitTime)),
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 Starting Thrill Data import...');
    console.log('Request body:', req.body);

    // Get year from request body, default to current year
    const { year = new Date().getFullYear() } = req.body || {};
    console.log('Using year:', year);

    // Validate year is reasonable (allow 10 years in the past and 5 years in the future)
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 10;
    const maxYear = currentYear + 5;

    if (year < minYear || year > maxYear) {
      return res.status(400).json({
        success: false,
        errors: [`Invalid year: ${year}. Must be between ${minYear} and ${maxYear}.`],
        recordsImported: 0,
        parksProcessed: [],
        dateRange: { start: '', end: '' }
      });
    }

    const result = {
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
        console.log(`Fetching from: ${THRILL_DATA_BASE_URL}/${parkMapping.thrillDataId}/calendar/${year}`);
        const predictions = await fetchCrowdPredictionsForYear(
          parkMapping.waypointParkId,
          parkMapping.thrillDataId,
          year
        );
        console.log(`Fetched ${predictions.length} predictions for ${parkMapping.displayName}`);

        if (predictions.length === 0) {
          console.warn(`No predictions found for ${parkMapping.displayName}`);
          continue;
        }

        // Track date range
        const dates = predictions.map(p => p.prediction_date).sort();
        if (!earliestDate || dates[0] < earliestDate) earliestDate = dates[0];
        if (!latestDate || dates[dates.length - 1] > latestDate) latestDate = dates[dates.length - 1];

        // Insert into database using upsert
        if (supabase) {
          const { error } = await supabase
            .from('park_crowd_predictions')
            .upsert(predictions, {
              onConflict: 'park_id,prediction_date',
              ignoreDuplicates: false
            });

          if (error) {
            console.error(`❌ Failed to insert ${parkMapping.displayName}:`, error);
            result.errors.push(`${parkMapping.displayName}: Database insert failed - ${error.message}`);
          } else {
            result.recordsImported += predictions.length;
            result.parksProcessed.push(parkMapping.displayName);
            console.log(`✅ Inserted ${predictions.length} predictions for ${parkMapping.displayName}`);
          }
        } else {
          console.warn('Supabase not configured - would insert predictions');
          result.recordsImported += predictions.length;
          result.parksProcessed.push(parkMapping.displayName);
          console.log(`✅ Simulated insert of ${predictions.length} predictions for ${parkMapping.displayName}`);
        }

      } catch (error) {
        const errorMessage = error.message || 'Unknown error';
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
    const errorMessage = error.message || 'Unknown error';
    const errorStack = error.stack || 'No stack trace';

    console.error('❌ Import failed:', error);

    return res.status(500).json({
      success: false,
      recordsImported: 0,
      parksProcessed: [],
      errors: [errorMessage],
      dateRange: { start: '', end: '' },
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      debug: {
        errorMessage,
        errorStack,
        errorType: error?.constructor?.name || 'Unknown',
        requestBody: req.body,
        year: req.body?.year || 'not provided'
      }
    });
  }
}

// Export configuration for Vercel
export const config = {
  maxDuration: 300, // 5 minutes
  regions: ['iad1'], // Deploy to US East
};