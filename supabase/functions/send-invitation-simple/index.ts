import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationEmailRequest {
  invitationId: string;
  invitedEmail: string;
  inviterName: string;
  tripName: string;
  invitationToken: string;
  permissionLevel: string;
  message?: string;
  expiresAt: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🧪 Simple email test function called');

    const emailData: InvitationEmailRequest = await req.json()
    console.log('📧 Email data received:', JSON.stringify(emailData, null, 2));

    // Skip all database validation for testing - just send the email
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'RESEND_API_KEY not configured in environment variables',
          details: 'Please set RESEND_API_KEY in Supabase Edge Function secrets'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const appUrl = (Deno.env.get('APP_URL') || 'https://waylight.app').replace(/\/$/, '')
    const invitationUrl = `${appUrl}/invite/${emailData.invitationToken}`

    console.log('🔗 Invitation URL:', invitationUrl);

    const emailHtml = generateInvitationEmail({
      inviterName: emailData.inviterName,
      tripName: emailData.tripName,
      invitationUrl,
      permissionLevel: emailData.permissionLevel,
      message: emailData.message,
      expiresAt: emailData.expiresAt
    })

    console.log('📤 Sending email to:', emailData.invitedEmail);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Waylight <noreply@waylight.whitetowers.org>',
        to: [emailData.invitedEmail],
        subject: `🎢 ${emailData.inviterName} invited you to collaborate on "${emailData.tripName}"`,
        html: emailHtml,
      }),
    })

    const emailResult = await emailResponse.json()
    console.log('📧 Resend response:', JSON.stringify(emailResult, null, 2));

    if (!emailResponse.ok) {
      console.error('❌ Resend API error:', emailResult)
      throw new Error(`Email sending failed: ${emailResult.message || 'Unknown error'}`)
    }

    console.log('✅ Email sent successfully! ID:', emailResult.id);

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult.id,
        message: 'Test invitation email sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in simple email test:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to send test email',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function generateInvitationEmail({
  inviterName,
  tripName,
  invitationUrl,
  permissionLevel,
  message,
  expiresAt
}: {
  inviterName: string;
  tripName: string;
  invitationUrl: string;
  permissionLevel: string;
  message?: string;
  expiresAt: string;
}): string {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const permissionDescription = {
    view: 'view trip details',
    edit: 'view and edit trip details',
    admin: 'view, edit, and manage the trip'
  }[permissionLevel] || 'collaborate on'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trip Collaboration Invitation - Waylight</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #0ea5a8 0%, #22d3ee 100%);
            color: white;
            padding: 32px;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 32px;
        }
        .trip-info {
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #0ea5a8;
        }
        .trip-name {
            font-size: 20px;
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 8px 0;
        }
        .cta-button {
            display: inline-block;
            background-color: #0ea5a8;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
        }
        .info-notice {
            background-color: #dbeafe;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎢 Trip Collaboration Invitation</h1>
            <p>You're invited to plan an amazing trip together!</p>
        </div>

        <div class="content">
            <p>Hi there!</p>

            <p><strong>${inviterName}</strong> has invited you to collaborate on their trip planning.</p>

            <div class="trip-info">
                <div class="trip-name">${tripName}</div>
                <p style="margin: 8px 0;">You'll be able to <strong>${permissionDescription}</strong></p>
            </div>

            ${message ? `
            <div style="background-color: #dbeafe; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0; font-style: italic;">
                <strong>Personal message from ${inviterName}:</strong><br>
                "${message}"
            </div>
            ` : ''}

            <div style="text-align: center; margin: 32px 0;">
                <a href="${invitationUrl}" class="cta-button">
                    🎢 Accept Invitation
                </a>
            </div>

            <p><strong>What happens next?</strong></p>
            <ul>
                <li>✅ Click the button above to accept the invitation</li>
                <li>✅ Create an account or sign in if you don't have one</li>
                <li>✅ Start collaborating on the trip planning</li>
            </ul>
        </div>
    </div>
</body>
</html>
  `
}