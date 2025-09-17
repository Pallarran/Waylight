/**
 * Manual Sync Trigger - For testing and manual data updates
 * This function allows manual triggering of the live data sync
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Return environment debug info
    const envDebug = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
    };

    return res.status(200).json({
      success: false,
      message: 'Debug mode - showing environment variables',
      debug: envDebug,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to read environment variables'
    });
  }
}

export const config = {
  maxDuration: 14 * 60, // 14 minutes
  regions: ['iad1'],
};