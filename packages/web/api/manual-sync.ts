/**
 * Manual Sync Trigger - For testing and manual data updates
 * This function allows manual triggering of the live data sync
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { backgroundSyncService } from '@waylight/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow both GET and POST for manual testing
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  // Simple authentication check for manual triggers
  const authKey = req.query.key || req.body?.key;
  const expectedKey = process.env.MANUAL_SYNC_KEY;

  if (expectedKey && authKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please provide a valid key parameter'
    });
  }

  const startTime = Date.now();

  try {
    console.log('🔧 Manual sync triggered...');

    // Get configuration from query params or use defaults
    const syncConfig = {
      syncIntervalMinutes: 15,
      enabledParks: (req.query.parks as string || 'magic-kingdom,epcot,hollywood-studios,animal-kingdom').split(','),
      enabledServices: {
        themeparks: req.query.themeparks !== 'false',
        queueTimes: req.query.queueTimes !== 'false'
      },
      retryAttempts: parseInt(req.query.retries as string || '3'),
      retryDelayMs: 5000
    };

    // Update configuration and run sync
    backgroundSyncService.updateConfig(syncConfig);
    await backgroundSyncService.runFullSync();

    // Get statistics
    const stats = await backgroundSyncService.getSyncStats();
    const duration = Date.now() - startTime;

    console.log(`✅ Manual sync completed in ${duration}ms`);

    // Return HTML response for browser testing
    if (req.headers.accept?.includes('text/html')) {
      return res.status(200).send(`
        <html>
          <head><title>Waylight Manual Sync</title></head>
          <body style="font-family: Arial, sans-serif; margin: 40px;">
            <h1>✅ Manual Sync Completed</h1>
            <p><strong>Duration:</strong> ${duration}ms</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <h3>Configuration:</h3>
            <pre>${JSON.stringify(syncConfig, null, 2)}</pre>
            <h3>Sync Statistics:</h3>
            <pre>${JSON.stringify(stats, null, 2)}</pre>
            <p><a href="/api/manual-sync?key=${authKey}">Run Again</a></p>
          </body>
        </html>
      `);
    }

    // Return JSON response for API calls
    return res.status(200).json({
      success: true,
      message: 'Manual sync completed successfully',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      stats,
      config: syncConfig
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('❌ Manual sync failed:', error);

    // Return error response
    if (req.headers.accept?.includes('text/html')) {
      return res.status(500).send(`
        <html>
          <head><title>Waylight Manual Sync - Error</title></head>
          <body style="font-family: Arial, sans-serif; margin: 40px;">
            <h1>❌ Manual Sync Failed</h1>
            <p><strong>Error:</strong> ${errorMessage}</p>
            <p><strong>Duration:</strong> ${duration}ms</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><a href="/api/manual-sync?key=${authKey}">Try Again</a></p>
          </body>
        </html>
      `);
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
}

export const config = {
  maxDuration: 14 * 60, // 14 minutes
  regions: ['iad1'],
};