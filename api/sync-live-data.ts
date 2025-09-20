/**
 * Vercel Serverless Function for Live Data Synchronization
 * This function runs the background sync to update live park data from external APIs
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { backgroundSyncService } from '@waylight/shared';

// Environment configuration
const SYNC_CONFIG = {
  syncIntervalMinutes: parseInt(process.env.LIVE_DATA_SYNC_INTERVAL_MINUTES || '15'),
  enabledParks: (process.env.LIVE_DATA_ENABLED_PARKS || 'magic-kingdom,epcot,hollywood-studios,animal-kingdom').split(','),
  enabledServices: {
    themeparks: true,
    queueTimes: true
  },
  retryAttempts: parseInt(process.env.LIVE_DATA_RETRY_ATTEMPTS || '3'),
  retryDelayMs: parseInt(process.env.LIVE_DATA_RETRY_DELAY_MS || '5000')
};

/**
 * Main sync handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests and Vercel cron jobs
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Verify the request is from Vercel Cron (basic security)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startTime = Date.now();

  try {
    console.log('🚀 Starting live data sync...');

    // Update background sync service configuration
    backgroundSyncService.updateConfig(SYNC_CONFIG);

    // Run a full sync
    await backgroundSyncService.runFullSync();

    // Get sync statistics
    const stats = await backgroundSyncService.getSyncStats();

    const duration = Date.now() - startTime;

    console.log(`✅ Sync completed successfully in ${duration}ms`);

    return res.status(200).json({
      success: true,
      message: 'Live data sync completed successfully',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      stats,
      config: {
        enabledParks: SYNC_CONFIG.enabledParks,
        enabledServices: SYNC_CONFIG.enabledServices
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ Sync failed:', error);

    // Return error but don't fail completely - this helps with monitoring
    return res.status(500).json({
      success: false,
      error: errorMessage,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      config: {
        enabledParks: SYNC_CONFIG.enabledParks,
        enabledServices: SYNC_CONFIG.enabledServices
      }
    });
  }
}

// Export configuration for Vercel
export const config = {
  maxDuration: 14 * 60, // 14 minutes (just under Vercel's 15-minute limit)
  regions: ['iad1'], // Deploy to US East for better performance with Disney APIs
};