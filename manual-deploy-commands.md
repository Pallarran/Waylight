# Manual Deployment Commands

If the batch script doesn't work, run these commands one by one:

## 1. Set your access token (replace with your actual token):
```bash
set SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

## 2. Link to your project:
```bash
npx supabase link --project-ref zclzhvkoqwelhfxahaly
```

## 3. Deploy the function:
```bash
npx supabase functions deploy send-invitation
```

## 4. Verify deployment:
The function should appear in your Supabase dashboard under Edge Functions.

## 5. Set environment variables in Supabase dashboard:
- Go to Edge Functions → send-invitation → Settings
- Add these environment variables:
  - `RESEND_API_KEY`: Your Resend API key (from Step 1)
  - `APP_URL`: Your app URL (e.g., `https://waylight.app` or `http://localhost:5173` for testing)