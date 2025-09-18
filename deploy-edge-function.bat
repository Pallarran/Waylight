@echo off
echo 🚀 Deploying Waylight Email Service...
echo.

echo Please enter your Supabase access token (from dashboard):
set /p SUPABASE_ACCESS_TOKEN="Token (sbp_...): "

echo.
echo Setting environment variable...
set SUPABASE_ACCESS_TOKEN=%SUPABASE_ACCESS_TOKEN%

echo.
echo Linking to project...
npx supabase link --project-ref zclzhvkoqwelhfxahaly

echo.
echo Deploying Edge Function...
npx supabase functions deploy send-invitation

echo.
echo ✅ Deployment complete!
echo.
echo Next steps:
echo 1. Go to your Supabase dashboard
echo 2. Navigate to Edge Functions
echo 3. Set environment variables:
echo    - RESEND_API_KEY: (your Resend API key)
echo    - APP_URL: https://your-domain.com (or http://localhost:5173 for testing)
echo.
pause