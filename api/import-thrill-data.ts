/**
 * Vercel Serverless Function for Thrill Data Import
 * Ultra minimal test version to debug 500 errors
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Ultra minimal test - no imports, no environment variables, no complex logic
    return res.status(200).json({
      success: true,
      message: 'Minimal API test successful',
      method: req.method,
      timestamp: new Date().toISOString(),
      body: req.body
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
  }
}

// Export configuration for Vercel
export const config = {
  maxDuration: 300, // 5 minutes
  regions: ['iad1'], // Deploy to US East
};