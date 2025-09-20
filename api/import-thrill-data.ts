/**
 * Vercel Serverless Function for Thrill Data Import
 * This function imports crowd prediction data and populates the database
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

// Park IDs supported by the system
const SUPPORTED_PARK_IDS = ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom'];

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 Starting Thrill Data import...');

    const result: ImportResult = {
      success: true,
      recordsImported: 0,
      parksProcessed: [],
      errors: [],
      dateRange: { start: '2025-01-01', end: '2025-12-31' }
    };

    // Generate demo crowd predictions for each park
    for (const parkId of SUPPORTED_PARK_IDS) {
      console.log(`Generating predictions for ${parkId}...`);
      const predictions = [];

      // Generate 180 days of demo data
      for (let i = 0; i < 180; i++) {
        const date = new Date('2025-01-01');
        date.setDate(date.getDate() + i);

        // Generate semi-realistic crowd levels (higher on weekends, holidays)
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const baseLevel = isWeekend ? 6 : 4;
        const crowdLevel = Math.min(10, Math.max(1, baseLevel + Math.floor(Math.random() * 3) - 1));

        const prediction = {
          park_id: parkId,
          prediction_date: date.toISOString().split('T')[0],
          crowd_level: crowdLevel,
          crowd_level_description: getCrowdDescription(crowdLevel),
          recommendation: getCrowdRecommendation(crowdLevel),
          data_source: 'thrill_data_demo',
          synced_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        predictions.push(prediction);
      }

      // Insert into database using upsert
      const { error } = await supabase
        .from('park_crowd_predictions')
        .upsert(predictions, {
          onConflict: 'park_id,prediction_date',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ Failed to import ${parkId}:`, error);
        result.errors.push(`${parkId}: ${error.message}`);
      } else {
        result.recordsImported += predictions.length;
        result.parksProcessed.push(parkId);
        console.log(`✅ Imported ${predictions.length} predictions for ${parkId}`);
      }
    }

    result.success = result.parksProcessed.length > 0;

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