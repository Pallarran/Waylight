import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const emailData: InvitationEmailRequest = await req.json()

    // Verify the invitation exists and the user has permission to send it
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('trip_invitations')
      .select(`
        *,
        trips!inner(name, user_id),
        profiles!trip_invitations_invited_by_fkey(full_name, email)
      `)
      .eq('id', emailData.invitationId)
      .eq('invitation_token', emailData.invitationToken)
      .single()

    if (inviteError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user has permission to send this invitation
    if (invitation.trips.user_id !== user.id && invitation.invited_by !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://waylight.app'
    const invitationUrl = `${appUrl}/invite/${emailData.invitationToken}`

    const emailHtml = generateInvitationEmail({
      inviterName: emailData.inviterName,
      tripName: emailData.tripName,
      invitationUrl,
      permissionLevel: emailData.permissionLevel,
      message: emailData.message,
      expiresAt: emailData.expiresAt
    })

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Waylight <invitations@waylight.app>',
        to: [emailData.invitedEmail],
        subject: `🎢 ${emailData.inviterName} invited you to collaborate on "${emailData.tripName}"`,
        html: emailHtml,
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailResult)
      throw new Error(`Email sending failed: ${emailResult.message || 'Unknown error'}`)
    }

    // Update invitation with sent timestamp
    await supabaseClient
      .from('trip_invitations')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailData.invitationId)

    // Log the email sending activity
    await supabaseClient
      .from('trip_activity_log')
      .insert({
        trip_id: invitation.trip_id,
        user_id: user.id,
        action_type: 'shared',
        description: `Invitation email sent to ${emailData.invitedEmail}`,
        metadata: {
          invitationId: emailData.invitationId,
          emailId: emailResult.id,
          recipientEmail: emailData.invitedEmail
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult.id,
        message: 'Invitation email sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error sending invitation email:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to send invitation email',
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
    <title>Trip Collaboration Invitation</title>
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
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 16px;
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
        .permission-badge {
            display: inline-block;
            background-color: #0ea5a8;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .message-box {
            background-color: #dbeafe;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            font-style: italic;
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
            transition: background-color 0.2s;
        }
        .cta-button:hover {
            background-color: #0891b2;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px 32px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #64748b;
        }
        .expiry-notice {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 12px;
            margin: 16px 0;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .header, .content, .footer {
                padding: 24px 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎢 You're Invited!</h1>
            <p>Join a collaborative trip planning adventure</p>
        </div>

        <div class="content">
            <p>Hi there!</p>

            <p><strong>${inviterName}</strong> has invited you to collaborate on their trip planning.</p>

            <div class="trip-info">
                <div class="trip-name">${tripName}</div>
                <p style="margin: 8px 0;">You'll be able to <strong>${permissionDescription}</strong></p>
                <span class="permission-badge">${permissionLevel} access</span>
            </div>

            ${message ? `
            <div class="message-box">
                <strong>Personal message from ${inviterName}:</strong><br>
                "${message}"
            </div>
            ` : ''}

            <div style="text-align: center; margin: 32px 0;">
                <a href="${invitationUrl}" class="cta-button">
                    Accept Invitation & Start Planning
                </a>
            </div>

            <div class="expiry-notice">
                <strong>⏰ This invitation expires on ${expiryDate}</strong><br>
                Don't wait too long to accept!
            </div>

            <p>If you don't have a Waylight account yet, you'll be able to create one when you accept the invitation.</p>

            <p style="font-size: 14px; color: #64748b;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${invitationUrl}" style="color: #0ea5a8; word-break: break-all;">${invitationUrl}</a>
            </p>
        </div>

        <div class="footer">
            <p>This invitation was sent by Waylight on behalf of ${inviterName}.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p style="margin-top: 16px;">
                <strong>Waylight</strong> - Plan smarter. Wander farther.<br>
                <a href="https://waylight.app" style="color: #0ea5a8;">waylight.app</a>
            </p>
        </div>
    </div>
</body>
</html>
  `
}