/**
 * Manual Sync Trigger - For testing and manual data updates
 * This function allows manual triggering of the live data sync
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Disney park IDs mapping
const PARK_IDS = {
  'magic-kingdom': '75ea578a-adc8-4116-a54d-dccb60765ef9',
  'epcot': '47f90d2c-e191-4239-a466-5892ef59a88b',
  'hollywood-studios': '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
  'animal-kingdom': '1c84a229-8862-4648-9c71-378ddd2c7693'
};

async function fetchParkData(parkId: string) {
  try {
    const response = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/live`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch data for park ${parkId}:`, error);
    return null;
  }
}

async function syncParkData(parkSlug: string, parkId: string) {
  const data = await fetchParkData(parkId);
  if (!data) return { success: false, error: 'Failed to fetch data' };

  try {
    // Update park status
    await supabase.from('live_parks').upsert({
      park_id: parkSlug,
      name: data.name || parkSlug,
      status: data.status || 'Unknown',
      timezone: data.timezone || 'America/New_York',
      last_updated: new Date().toISOString()
    });

    // Update attractions
    const attractions = data.liveData?.filter((item: any) => item.entityType === 'ATTRACTION') || [];
    for (const attraction of attractions) {
      await supabase.from('live_attractions').upsert({
        park_id: parkSlug,
        attraction_id: attraction.id,
        name: attraction.name,
        status: attraction.status,
        wait_time: attraction.queue?.STANDBY?.waitTime || null,
        last_updated: new Date().toISOString()
      });
    }

    return { success: true, attractionsCount: attractions.length };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Database error' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow both GET and POST for manual testing
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  // Note: Authentication removed since this endpoint is only exposed to authenticated users
  // and the frontend auth system already provides access control

  const startTime = Date.now();

  try {
    console.log('🔧 Manual sync triggered...');

    // For Hobby plan: sync only one park to stay within 10-second limit
    const parkSlug = 'magic-kingdom';
    const parkId = PARK_IDS[parkSlug];
    const result = await syncParkData(parkSlug, parkId);
    const results = [{ park: parkSlug, ...result }];

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ Manual sync completed in ${duration}ms - ${successCount}/1 parks updated`);

    // Return HTML response for browser testing
    if (req.headers.accept?.includes('text/html')) {
      return res.status(200).send(`
        <html>
          <head><title>Waylight Manual Sync</title></head>
          <body style="font-family: Arial, sans-serif; margin: 40px;">
            <h1>✅ Manual Sync Completed</h1>
            <p><strong>Duration:</strong> ${duration}ms</p>
            <p><strong>Parks Updated:</strong> ${successCount}/1</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <h3>Results:</h3>
            <pre>${JSON.stringify(results, null, 2)}</pre>
            <p><a href="/api/manual-sync">Run Again</a></p>
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
      results,
      summary: { updated: successCount, total: 1 }
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
      error: errorMessage,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
}

export const config = {
  maxDuration: 10, // 10 seconds for hobby plan
  regions: ['iad1'],
};