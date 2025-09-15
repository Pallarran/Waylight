/**
 * Simple test function to debug Vercel deployment issues
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  try {
    // Simple test - no external dependencies
    const testData = {
      success: true,
      message: 'Test function working!',
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - startTime}ms`,
      env: {
        hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY,
        hasManualKey: !!process.env.MANUAL_SYNC_KEY
      }
    };

    return res.status(200).json(testData);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

export const config = {
  maxDuration: 10,
  regions: ['iad1'],
};