/**
 * Vercel Serverless Function for Live Data Synchronization
 * This function runs the background sync to update live park data from external APIs
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
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

    const parks = ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom'];
    const results = [];

    for (const parkSlug of parks) {
      const parkId = PARK_IDS[parkSlug as keyof typeof PARK_IDS];
      const result = await syncParkData(parkSlug, parkId);
      results.push({ park: parkSlug, ...result });
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ Sync completed successfully in ${duration}ms - ${successCount}/${parks.length} parks updated`);

    return res.status(200).json({
      success: true,
      message: 'Live data sync completed successfully',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      results,
      summary: { updated: successCount, total: parks.length }
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
      timestamp: new Date().toISOString()
    });
  }
}

// Export configuration for Vercel
export const config = {
  maxDuration: 14 * 60, // 14 minutes (just under Vercel's 15-minute limit)
  regions: ['iad1'], // Deploy to US East for better performance with Disney APIs
};