# Waylight Deployment Guide

This guide walks you through deploying the Waylight app with database-backed live data synchronization.

## Architecture Overview

```
Frontend (Vercel) → Database (Supabase) ← Background Sync (Vercel Functions)
                                         ↑
                                    External APIs
                                    (ThemeParks.wiki, Queue-Times)
```

## Prerequisites

1. **Supabase Project**: https://supabase.com/dashboard/project/zclzhvkoqwelhfxahaly
2. **Vercel Account**: Connected to your GitHub repository
3. **Database Migrations**: Applied to Supabase

## Step-by-Step Deployment

### 1. Database Setup (Supabase)

1. **Apply Migrations**:
   - Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/zclzhvkoqwelhfxahaly/sql/new)
   - Copy and paste the SQL from `scripts/run-migrations.ts` output (run: `cd scripts && npx tsx run-migrations.ts`)
   - Execute Migration 1: Creates live data tables
   - Execute Migration 2: Creates sync status function

2. **Verify Tables**:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE 'live_%';
   ```
   Should show: `live_parks`, `live_attractions`, `live_entertainment`, `live_sync_status`

### 2. Environment Variables

#### Vercel Production Environment

Set these in your [Vercel Dashboard](https://vercel.com/your-team/waylight/settings/environment-variables):

```bash
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zclzhvkoqwelhfxahaly.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Required - Background Sync Config
LIVE_DATA_SYNC_INTERVAL_MINUTES=15
LIVE_DATA_ENABLED_PARKS=magic-kingdom,epcot,hollywood-studios,animal-kingdom
LIVE_DATA_RETRY_ATTEMPTS=3
LIVE_DATA_RETRY_DELAY_MS=5000

# Required - Security
CRON_SECRET=your-secure-random-string-here
MANUAL_SYNC_KEY=your-manual-sync-key-here

# Optional - External API Keys
THEMEPARKS_API_KEY=optional
QUEUE_TIMES_API_KEY=optional
```

#### Local Development

Copy `.env.local` (already created) and ensure it has the basic configuration.

### 3. Deploy to Vercel

1. **Connect Repository**:
   - Link your GitHub repository to Vercel
   - Select the Waylight project

2. **Configure Build Settings**:
   - Build Command: `pnpm --filter @waylight/shared build && pnpm --filter @waylight/web build`
   - Output Directory: `packages/web/dist`
   - Install Command: `pnpm install`

3. **Deploy**:
   - Push to main branch or manually trigger deployment
   - Vercel will automatically build and deploy

### 4. Verify Deployment

#### Check Frontend
- Visit your Vercel deployment URL
- Verify the app loads correctly

#### Check API Functions
- Visit `https://your-app.vercel.app/api/manual-sync?key=your-manual-sync-key`
- Should trigger a manual sync and show results

#### Check Scheduled Sync
- The cron job runs every 15 minutes automatically
- Check Vercel Function logs for sync activity
- Monitor Supabase database for new data

### 5. Monitoring

#### Vercel Function Logs
- Go to Vercel Dashboard → Functions → sync-live-data
- Monitor execution logs and errors

#### Supabase Monitoring
```sql
-- Check sync status
SELECT * FROM live_sync_status ORDER BY last_sync_at DESC;

-- Check latest data
SELECT park_id, name, status, last_updated
FROM live_parks
ORDER BY last_updated DESC;

-- Check data freshness
SELECT
  COUNT(*) as total_attractions,
  MAX(last_updated) as latest_update,
  NOW() - MAX(last_updated) as age
FROM live_attractions;
```

## Configuration Options

### Sync Frequency
- Default: Every 15 minutes (`*/15 * * * *`)
- Modify in `vercel.json` crons section
- Vercel free tier allows up to 100 cron executions per month

### Enabled Parks
Modify `LIVE_DATA_ENABLED_PARKS` to include/exclude parks:
- `magic-kingdom` - Magic Kingdom
- `epcot` - EPCOT
- `hollywood-studios` - Hollywood Studios
- `animal-kingdom` - Animal Kingdom

### API Rate Limiting
- Current setup respects API rate limits with retry logic
- 3 retry attempts with exponential backoff
- 5-second initial delay between retries

## Troubleshooting

### Common Issues

1. **Sync Function Timeouts**:
   - Vercel functions have 10-second timeout on free tier
   - Consider reducing number of enabled parks
   - Check external API response times

2. **Database Connection Errors**:
   - Verify Supabase environment variables
   - Check RLS policies allow write access for service functions

3. **Missing Data**:
   - Check sync status: `SELECT * FROM live_sync_status`
   - Review function logs in Vercel dashboard
   - Manually trigger sync to debug issues

### Manual Sync Testing

```bash
# Test sync locally (if running dev server)
curl "http://localhost:3000/api/manual-sync?key=test-key-123"

# Test sync in production
curl "https://your-app.vercel.app/api/manual-sync?key=your-manual-sync-key"
```

### Database Debugging

```sql
-- Clear all live data (for testing)
TRUNCATE live_attractions, live_entertainment, live_parks, live_sync_status CASCADE;

-- Reset sync status
UPDATE live_sync_status SET
  last_sync_at = NOW() - INTERVAL '1 day',
  total_syncs = 0,
  successful_syncs = 0,
  failed_syncs = 0;
```

## Security Notes

1. **Environment Variables**: Never commit actual secrets to Git
2. **API Keys**: Use environment variables for all external API keys
3. **Cron Security**: Use `CRON_SECRET` to prevent unauthorized sync triggers
4. **Manual Sync**: Use `MANUAL_SYNC_KEY` to protect manual sync endpoint

## Performance Optimization

1. **Caching**: Live data is cached in-memory on frontend for 5 minutes (wait times) to 1 hour (park hours)
2. **Database Cleanup**: Old data is automatically cleaned up (attractions/entertainment: 24h, parks: 7 days)
3. **Function Optimization**: Functions are deployed to US East (iad1) for better API performance

Your database-backed live data system is now ready for production! 🎉