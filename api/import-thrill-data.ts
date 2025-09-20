/**
 * Vercel Serverless Function for Thrill Data Import
 * This function imports crowd prediction data and populates the database
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { type ImportResult, SUPPORTED_PARK_IDS, crowdPredictionRepository, CrowdPredictionRepository } from '@waylight/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 Starting Thrill Data import...');

    // For now, create demo data since we can't scrape from client-side
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
          parkId,
          predictionDate: date.toISOString().split('T')[0],
          crowdLevel,
          description: getCrowdDescription(crowdLevel),
          recommendation: getCrowdRecommendation(crowdLevel),
          dataSource: 'thrill_data_demo',
          lastUpdated: new Date().toISOString()
        };

        predictions.push(CrowdPredictionRepository.transformPredictionToDb(prediction));
      }

      // Insert into database
      await crowdPredictionRepository.upsertCrowdPredictions(predictions);

      result.recordsImported += predictions.length;
      result.parksProcessed.push(parkId);

      console.log(`✅ Imported ${predictions.length} predictions for ${parkId}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Import completed successfully in ${duration}ms`);

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
  maxDuration: 5 * 60, // 5 minutes should be enough for data generation
  regions: ['iad1'], // Deploy to US East
};