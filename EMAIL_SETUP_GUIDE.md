# 📧 Email Service Setup Guide

## Step 1: Set up Resend Account

1. Go to [resend.com](https://resend.com) and create a free account
2. Verify your email address
3. Navigate to **API Keys** in the dashboard
4. Click **Create API Key**
5. Name it "Waylight Invitations"
6. Copy the API key (starts with `re_`)
re_5VhXp3CG_F7GQmUdwwgYJjYX57eh5xj8k

## Step 2: Configure Domain (Optional but Recommended)

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `waylight.app`)
4. Add the DNS records to your domain provider
5. Wait for verification

## Step 3: Deploy the Supabase Edge Function

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Navigate to your project
cd /path/to/waylight

# Login to Supabase (if not already logged in)
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy send-invitation
```

## Step 4: Set Environment Variables in Supabase

1. Go to your Supabase dashboard
2. Navigate to **Edge Functions** → **send-invitation**
3. Click on **Settings** or **Environment Variables**
4. Add these variables:

```env
RESEND_API_KEY=re_your_api_key_here
APP_URL=https://your-domain.com
```

If you're testing locally, use:
```env
APP_URL=http://localhost:5173
```

## Step 5: Test the Function

You can test the deployed function using curl:

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/send-invitation' \
  -H 'Authorization: Bearer your-supabase-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "invitationId": "test-id",
    "invitedEmail": "test@example.com",
    "inviterName": "Test User",
    "tripName": "Test Trip",
    "invitationToken": "test-token",
    "permissionLevel": "edit",
    "message": "Join me for an amazing trip!",
    "expiresAt": "2024-12-31T23:59:59Z"
  }'
```

## Step 6: Update Your Environment Variables

Add to your `.env.local`:

```env
# Supabase (if not already there)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Your app URL for invitation links
VITE_APP_URL=https://your-domain.com
```

## Step 7: Verify Email Deliverability

1. **Check Spam Folder**: First emails might go to spam
2. **SPF/DKIM Records**: If using custom domain, ensure DNS records are properly set
3. **Resend Dashboard**: Check the **Logs** section for delivery status

## Troubleshooting

### Function Deployment Issues
```bash
# Check function logs
supabase functions logs send-invitation

# Test locally first
supabase functions serve --debug
```

### Email Not Sending
1. Check Resend API key is correct
2. Verify environment variables are set in Supabase
3. Check function logs for errors
4. Ensure sender email domain is verified

### Authentication Errors
- Make sure the Authorization header includes the user's JWT token
- Verify RLS policies allow the user to access the invitation

## Email Limits

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for getting started

**Production Recommendations:**
- Upgrade to Resend Pro if needed
- Set up proper domain authentication
- Monitor bounce rates and spam reports

## Security Notes

- ✅ Edge Function validates user permissions
- ✅ Invitation tokens are secure and expire
- ✅ Email content is sanitized
- ✅ Rate limiting built into Resend
- ✅ No sensitive data in email templates

Your email service is now ready! 🎉