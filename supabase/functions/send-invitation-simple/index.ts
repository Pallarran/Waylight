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

  // Waylight logo SVG embedded as data URL
  const logoSvg = `data:image/svg+xml;base64,${btoa(`
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lightBeam" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FBBF24;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#FBBF24;stop-opacity:0.1" />
        </linearGradient>
        <linearGradient id="sailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E2E8F0;stop-opacity:1" />
        </linearGradient>
      </defs>
      <path d="M25 25 L75 25 L75 75 L25 75 Z" fill="url(#lightBeam)" opacity="0.2"/>
      <path d="M25 70 Q35 75 50 75 Q65 75 75 70 L70 65 L30 65 Z" fill="#FFFFFF"/>
      <line x1="50" y1="65" x2="50" y2="25" stroke="#FFFFFF" stroke-width="2"/>
      <path d="M50 25 L35 35 L50 65 Z" fill="url(#sailGradient)"/>
      <path d="M50 30 L65 35 L50 55 Z" fill="#4ECDC4" opacity="0.9"/>
      <path d="M20 75 Q30 77 40 75 Q50 73 60 75 Q70 77 80 75" stroke="#4ECDC4" stroke-width="1.5" fill="none" opacity="0.8"/>
      <circle cx="72" cy="32" r="2" fill="#FBBF24" opacity="0.9"/>
    </svg>
  `)}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trip Collaboration Invitation - Waylight</title>
    <style>
        body {
            font-family: 'Inter', 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #0F172A;
            background-color: #F8FAFC;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2);
        }
        .header {
            background: linear-gradient(135deg, #0891B2 0%, #4ECDC4 100%);
            color: white;
            padding: 40px 32px;
            text-align: center;
            position: relative;
        }
        .logo {
            width: 48px;
            height: 48px;
            margin: 0 auto 16px auto;
            display: block;
        }
        .brand-name {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
            letter-spacing: -0.025em;
        }
        .header-subtitle {
            margin: 0;
            opacity: 0.95;
            font-size: 16px;
            font-weight: 400;
        }
        .content {
            padding: 40px 32px;
        }
        .greeting {
            font-size: 18px;
            color: #0F172A;
            margin-bottom: 24px;
        }
        .trip-info {
            background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
            border-left: 4px solid #0891B2;
            position: relative;
        }
        .trip-name {
            font-size: 22px;
            font-weight: 700;
            color: #0F172A;
            margin: 0 0 12px 0;
            letter-spacing: -0.025em;
        }
        .permission-badge {
            display: inline-block;
            background-color: rgba(8, 145, 178, 0.1);
            color: #0E7490;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 8px;
        }
        .cta-section {
            text-align: center;
            margin: 40px 0;
            padding: 32px 24px;
            background: linear-gradient(135deg, rgba(8, 145, 178, 0.05) 0%, rgba(78, 205, 196, 0.05) 100%);
            border-radius: 12px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #0891B2 0%, #0E7490 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 25px -5px rgba(8, 145, 178, 0.3);
            transition: all 0.2s ease;
        }
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 35px -5px rgba(8, 145, 178, 0.4);
        }
        .message-box {
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%);
            border: 1px solid rgba(251, 191, 36, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            position: relative;
        }
        .message-box::before {
            content: '💬';
            position: absolute;
            top: 20px;
            left: 20px;
            font-size: 18px;
        }
        .message-content {
            margin-left: 32px;
            font-style: italic;
            color: #0F172A;
        }
        .steps-list {
            background-color: #F8FAFC;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
        }
        .steps-list h3 {
            margin: 0 0 16px 0;
            color: #0F172A;
            font-weight: 600;
        }
        .steps-list ul {
            margin: 0;
            padding-left: 20px;
        }
        .steps-list li {
            margin-bottom: 8px;
            color: #475569;
        }
        .footer {
            background-color: #F8FAFC;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #E2E8F0;
        }
        .footer-text {
            color: #475569;
            font-size: 14px;
            margin: 0;
        }
        .expiry-notice {
            background-color: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.3);
            border-radius: 8px;
            padding: 12px 16px;
            margin: 16px 0;
            font-size: 14px;
            color: #92400E;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoSvg}" alt="Waylight" class="logo" />
            <h1 class="brand-name">Waylight</h1>
            <p class="header-subtitle">You're invited to plan an amazing trip together!</p>
        </div>

        <div class="content">
            <div class="greeting">
                Hi there! 👋
            </div>

            <p><strong>${inviterName}</strong> has invited you to collaborate on their trip planning with Waylight.</p>

            <div class="trip-info">
                <div class="trip-name">🎢 ${tripName}</div>
                <p style="margin: 8px 0; color: #475569;">You'll be able to <strong>${permissionDescription}</strong></p>
                <span class="permission-badge">${permissionLevel.charAt(0).toUpperCase() + permissionLevel.slice(1)} Access</span>
            </div>

            ${message ? `
            <div class="message-box">
                <div class="message-content">
                    <strong>Personal message from ${inviterName}:</strong><br>
                    "${message}"
                </div>
            </div>
            ` : ''}

            <div class="cta-section">
                <a href="${invitationUrl}" class="cta-button">
                    ✨ Accept Invitation
                </a>
                <div class="expiry-notice">
                    ⏰ This invitation expires on ${expiryDate}
                </div>
            </div>

            <div class="steps-list">
                <h3>What happens next?</h3>
                <ul>
                    <li>✅ Click the button above to accept the invitation</li>
                    <li>✅ Create an account or sign in if you don't have one</li>
                    <li>✅ Start collaborating on the trip planning</li>
                    <li>🎯 Access all the amazing features Waylight offers</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p class="footer-text">
                Sent with ❤️ by Waylight • Making trip planning collaborative and fun
            </p>
        </div>
    </div>
</body>
</html>
  `
}