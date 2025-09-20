/**
 * Vercel Serverless Function for Thrill Data Import
 * Plain JavaScript version to debug TypeScript issues
 */

export default async function handler(req, res) {
  try {
    // Ultra minimal test in plain JavaScript
    return res.status(200).json({
      success: true,
      message: 'Plain JavaScript API test successful',
      method: req.method,
      timestamp: new Date().toISOString(),
      body: req.body
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack || 'No stack'
    });
  }
}

// Export configuration for Vercel
export const config = {
  maxDuration: 300,
  regions: ['iad1'],
};