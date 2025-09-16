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

  // Only check auth if environment variable is set
  if (expectedKey && authKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please provide a valid key parameter'
    });
  }

  // If no expected key is set, allow all requests (for development/testing)
  if (!expectedKey) {
    console.log('🔓 No MANUAL_SYNC_KEY set - allowing manual sync request');
  }

  const startTime = Date.now();

  try {
    console.log('🔧 Manual sync triggered...');

    // Get days parameter or use default
    const days = parseInt(req.query.days as string || '7');
    console.log(`Syncing next ${days} days of park data`);

    // Use the background sync service directly
    const syncResult = await backgroundSyncService.syncAllParks();

    console.log('✅ Sync completed:', {
      success: syncResult.success,
      parksProcessed: syncResult.parksProcessed,
      errors: syncResult.errors?.length || 0
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Manual sync completed in ${duration}ms`);

    // Return HTML response for browser testing
    if (req.headers.accept?.includes('text/html')) {
      const statusEmoji = syncResult.success ? '✅' : '❌';
      const statusText = syncResult.success ? 'Manual Sync Completed' : 'Manual Sync Failed';

      return res.status(syncResult.success ? 200 : 500).send(`
        <html>
          <head><title>Waylight Manual Sync</title></head>
          <body style="font-family: Arial, sans-serif; margin: 40px;">
            <h1>${statusEmoji} ${statusText}</h1>
            <p><strong>Duration:</strong> ${duration}ms</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Parks processed:</strong> ${syncResult.parksProcessed || 0}</p>
            <p><strong>Errors:</strong> ${syncResult.errors?.length || 0}</p>
            ${syncResult.errors?.length ? `<h3>Errors:</h3><pre style="background: #ffe6e6; padding: 15px; border-radius: 5px;">${syncResult.errors.join('\n')}</pre>` : ''}
            <p><a href="/api/manual-sync">Run Again</a></p>
          </body>
        </html>
      `);
    }

    // Return JSON response for API calls
    return res.status(syncResult.success ? 200 : 500).json({
      success: syncResult.success,
      message: syncResult.success ? 'Manual sync completed successfully' : 'Manual sync failed',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      parksProcessed: syncResult.parksProcessed || 0,
      errors: syncResult.errors || [],
      details: syncResult
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
            <p><a href="/api/manual-sync">Try Again</a></p>
          </body>
        </html>
      `);
    }

    return res.status(500).json({
      success: false,
      message: 'Manual sync failed with exception',
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