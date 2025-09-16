/**
 * Manual Sync Trigger - For testing and manual data updates
 * This function allows manual triggering of the live data sync
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { spawn } from 'child_process';
import path from 'path';

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

    // Get days parameter or use default
    const days = parseInt(req.query.days as string || '7');

    // Run the sync-parks.js script
    const scriptPath = path.join(process.cwd(), '..', '..', 'scripts', 'sync-parks.js');
    const args = ['--days', days.toString()];

    console.log(`Running sync script: node ${scriptPath} ${args.join(' ')}`);

    const syncResult = await new Promise<{ success: boolean; output: string; error?: string }>((resolve) => {
      const child = spawn('node', [scriptPath, ...args], {
        cwd: path.join(process.cwd(), '..', '..'),
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        const message = data.toString();
        output += message;
        console.log(message.trim());
      });

      child.stderr?.on('data', (data) => {
        const message = data.toString();
        errorOutput += message;
        console.error(message.trim());
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          resolve({ success: false, output, error: errorOutput || `Process exited with code ${code}` });
        }
      });

      child.on('error', (error) => {
        resolve({ success: false, output, error: error.message });
      });
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
            <p><strong>Days synced:</strong> ${days}</p>
            ${syncResult.error ? `<p><strong>Error:</strong> ${syncResult.error}</p>` : ''}
            <h3>Output:</h3>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${syncResult.output}</pre>
            <p><a href="/api/manual-sync?key=${authKey}">Run Again</a></p>
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
      days,
      output: syncResult.output,
      error: syncResult.error
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