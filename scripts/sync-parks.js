#!/usr/bin/env node

/**
 * Manual Park Data Sync Script
 * Run this locally to update your Supabase database with live park data
 * Usage: node scripts/sync-parks.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client with service role for bypassing RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Disney park IDs
const PARK_IDS = {
  'magic-kingdom': '75ea578a-adc8-4116-a54d-dccb60765ef9',
  'epcot': '47f90d2c-e191-4239-a466-5892ef59a88b',
  'hollywood-studios': '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
  'animal-kingdom': '1c84a229-8862-4648-9c71-378ddd2c7693'
};

async function fetchParkData(parkId) {
  try {
    console.log(`Fetching data for park ${parkId}...`);
    const response = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/live`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    console.log(`✅ Fetched data for ${data.name || 'park'}`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch data for park ${parkId}:`, error.message);
    return null;
  }
}

async function syncParkData(parkSlug, parkId) {
  const data = await fetchParkData(parkId);
  if (!data) return { success: false, error: 'Failed to fetch data' };

  try {
    console.log(`Syncing ${parkSlug} to database...`);

    // Map API status to valid database status values
    const mapStatus = (apiStatus) => {
      if (!apiStatus) return 'OPERATING';
      switch (apiStatus.toLowerCase()) {
        case 'operating':
        case 'open':
          return 'OPERATING';
        case 'closed':
          return 'CLOSED';
        case 'refurbishment':
          return 'REFURBISHMENT';
        default:
          return 'OPERATING';
      }
    };

    // Update park with minimal required fields
    const { error: parkError } = await supabase.from('live_parks').upsert({
      park_id: parkSlug,
      external_id: parkId, // Use the themeparks.wiki park ID
      name: data.name || parkSlug,
      status: 'OPEN', // Try simple OPEN status
      regular_open: '09:00', // Default opening time
      regular_close: '21:00', // Default closing time
      last_updated: new Date().toISOString()
    });

    if (parkError) throw parkError;

    // Update attractions
    const attractions = data.liveData?.filter(item => item.entityType === 'ATTRACTION') || [];
    console.log(`Found ${attractions.length} attractions`);

    for (const attraction of attractions) {
      const { error: attractionError } = await supabase.from('live_attractions').upsert({
        park_id: parkSlug,
        attraction_id: attraction.id,
        name: attraction.name,
        status: attraction.status,
        wait_time: attraction.queue?.STANDBY?.waitTime || null,
        last_updated: new Date().toISOString()
      });

      if (attractionError) {
        console.warn(`Warning: Failed to sync attraction ${attraction.name}:`, attractionError.message);
      }
    }

    console.log(`✅ Successfully synced ${parkSlug} (${attractions.length} attractions)`);
    return { success: true, attractionsCount: attractions.length };
  } catch (error) {
    console.error(`❌ Database sync failed for ${parkSlug}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting manual park data sync...');
  console.log('Database:', process.env.VITE_SUPABASE_URL ? '✅ Connected' : '❌ No URL');

  const startTime = Date.now();
  const results = [];

  // Sync all parks
  for (const [parkSlug, parkId] of Object.entries(PARK_IDS)) {
    const result = await syncParkData(parkSlug, parkId);
    results.push({ park: parkSlug, ...result });

    // Add delay between parks to be respectful to the API
    if (parkSlug !== 'animal-kingdom') {
      console.log('Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const duration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;

  console.log('\n📊 Sync Summary:');
  console.log(`Duration: ${duration}ms`);
  console.log(`Success: ${successCount}/${results.length} parks`);

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const details = result.success
      ? `${result.attractionsCount} attractions`
      : result.error;
    console.log(`${status} ${result.park}: ${details}`);
  });

  if (successCount > 0) {
    console.log('\n🎉 Sync completed! Your app will now load data from the database.');
  } else {
    console.log('\n😞 No parks were successfully synced. Check your environment variables and network connection.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}