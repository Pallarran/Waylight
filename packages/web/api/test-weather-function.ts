import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Call the Supabase Edge Function
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({
        success: false,
        message: 'Missing Supabase configuration'
      }, { status: 500 });
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-weather`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    return Response.json({
      success: response.ok,
      message: response.ok ? 'Edge function executed successfully' : 'Edge function failed',
      status: response.status,
      data: result
    });

  } catch (error) {
    return Response.json({
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 500 });
  }
}