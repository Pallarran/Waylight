@echo off
echo 🚀 Deploying Simple Email Test Function...
echo.

set SUPABASE_ACCESS_TOKEN=sbp_73e761a195ac8d2ce690cd7f5fdccb4d554ac26d

echo Deploying simplified test function...
npx supabase functions deploy send-invitation-simple

echo.
echo ✅ Deployment complete!
echo.
echo Test URL: https://zclzhvkoqwelhfxahaly.supabase.co/functions/v1/send-invitation-simple
echo.
pause