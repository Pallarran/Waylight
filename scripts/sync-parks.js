#!/usr/bin/env node

/**
 * Enhanced Park Data Sync Script
 * Syncs park schedules and live data to Supabase database for trip planning
 *
 * Usage:
 *   node scripts/sync-parks.js                    # Sync today + next 7 days
 *   node scripts/sync-parks.js --days 30          # Sync next 30 days
 *   node scripts/sync-parks.js --start-date 2025-10-01 --end-date 2025-10-07
 *   node scripts/sync-parks.js --today-only       # Sync only today (legacy mode)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    days: 7, // Default to sync next 7 days
    startDate: null,
    endDate: null,
    todayOnly: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--days':
        options.days = parseInt(args[++i]);
        break;
      case '--start-date':
        options.startDate = args[++i];
        break;
      case '--end-date':
        options.endDate = args[++i];
        break;
      case '--today-only':
        options.todayOnly = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Enhanced Park Data Sync Script

Usage:
  node scripts/sync-parks.js [options]

Options:
  --days N              Sync next N days from today (default: 7)
  --start-date YYYY-MM-DD   Start date for sync range
  --end-date YYYY-MM-DD     End date for sync range
  --today-only          Sync only today's data (legacy mode)
  --help, -h            Show this help message

Examples:
  node scripts/sync-parks.js --days 30
  node scripts/sync-parks.js --start-date 2025-10-01 --end-date 2025-10-07
        `);
        process.exit(0);
    }
  }

  return options;
}

const options = parseArgs();

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

// Date utility functions
function formatDate(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDateRange() {
  const today = new Date();

  if (options.todayOnly) {
    return [formatDate(today)];
  }

  let startDate, endDate;

  if (options.startDate && options.endDate) {
    startDate = new Date(options.startDate);
    endDate = new Date(options.endDate);
  } else {
    startDate = today;
    endDate = addDays(today, options.days - 1);
  }

  // Generate array of dates in range
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

async function fetchParkData(parkId, targetDates = []) {
  try {
    console.log(`Fetching data for park ${parkId}...`);

    // Always fetch current month, next month, and second next month for extended coverage
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() is 0-based

    // Calculate next month
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    // Calculate second next month
    const secondNextMonth = nextMonth === 12 ? 1 : nextMonth + 1;
    const secondNextMonthYear = nextMonth === 12 ? nextMonthYear + 1 : nextMonthYear;

    const monthsToFetch = [
      `${currentYear}/${currentMonth.toString().padStart(2, '0')}`,
      `${nextMonthYear}/${nextMonth.toString().padStart(2, '0')}`,
      `${secondNextMonthYear}/${secondNextMonth.toString().padStart(2, '0')}`
    ];

    console.log(`   - Fetching months: ${monthsToFetch.join(', ')}`);

    // Fetch live data, regular schedule, and all monthly schedules
    const [liveResponse, scheduleResponse, ...monthlyResponses] = await Promise.all([
      fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/live`),
      fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule`),
      ...monthsToFetch.map(monthYear =>
        fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule/${monthYear}`)
      )
    ]);

    if (!liveResponse.ok) throw new Error(`Live data HTTP ${liveResponse.status}`);
    if (!scheduleResponse.ok) throw new Error(`Schedule data HTTP ${scheduleResponse.status}`);

    // Parse responses
    const [liveData, scheduleData] = await Promise.all([
      liveResponse.json(),
      scheduleResponse.json()
    ]);

    const monthlyDataArrays = await Promise.all(
      monthlyResponses.map(async (response, index) => {
        const monthYear = monthsToFetch[index];
        if (response.ok) {
          const data = await response.json();
          console.log(`   - Month ${monthYear}: ${data.schedule?.length || 0} entries`);
          return data;
        } else {
          console.log(`   - Month ${monthYear}: HTTP ${response.status} (no data)`);
          return { schedule: [] };
        }
      })
    );

    console.log(`✅ Fetched data for ${liveData.name || 'park'}`);
    console.log(`   - Regular schedule: ${scheduleData.schedule?.length || 0} entries`);

    // Merge all schedule data, removing duplicates by date and preferring monthly data
    const allSchedules = [
      ...(scheduleData.schedule || []),
      ...monthlyDataArrays.flatMap(data => data.schedule || [])
    ];

    // Remove duplicates, keeping the last occurrence (monthly data overrides regular schedule)
    // Use a more specific key that includes description to avoid conflicts between different TICKETED_EVENTs
    const scheduleMap = new Map();
    allSchedules.forEach(entry => {
      const key = `${entry.date}_${entry.type}_${entry.description || 'none'}`;
      scheduleMap.set(key, entry);
    });

    const mergedSchedule = Array.from(scheduleMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    console.log(`   - Total merged schedule: ${mergedSchedule.length} entries`);

    // Combine the data
    return {
      ...liveData,
      schedule: mergedSchedule
    };
  } catch (error) {
    console.error(`❌ Failed to fetch data for park ${parkId}:`, error.message);
    return null;
  }
}

async function syncParkData(parkSlug, parkId, targetDates) {
  const data = await fetchParkData(parkId, targetDates);
  if (!data) return { success: false, error: 'Failed to fetch data' };

  try {
    console.log(`Syncing ${parkSlug} to database...`);

    // Extract times (convert from ISO to HH:MM format)
    const parseTime = (isoString) => {
      if (!isoString) return null;
      const date = new Date(isoString);
      return date.toTimeString().slice(0, 5); // Extract HH:MM
    };

    // Get today's schedule for the legacy live_parks table (backward compatibility)
    const today = new Date().toISOString().split('T')[0];
    const todaySchedule = data.schedule?.filter(s => s.date === today) || [];
    const todayOperating = todaySchedule.find(s => s.type === 'OPERATING');
    const todayEarly = todaySchedule.find(s => s.type === 'TICKETED_EVENT' && s.description?.toLowerCase().includes('early'));
    const todayExtended = todaySchedule.find(s => s.type === 'TICKETED_EVENT' && s.description?.toLowerCase().includes('extended'));

    // Update legacy live_parks table with today's hours
    const { error: parkError } = await supabase.from('live_parks').upsert({
      park_id: parkSlug,
      external_id: parkId,
      name: data.name || parkSlug,
      status: 'operating',
      regular_open: parseTime(todayOperating?.openingTime) || '09:00',
      regular_close: parseTime(todayOperating?.closingTime) || '21:00',
      early_entry_open: parseTime(todayEarly?.openingTime),
      extended_evening_close: parseTime(todayExtended?.closingTime),
      last_updated: new Date().toISOString()
    }, {
      onConflict: 'park_id'
    });

    if (parkError) throw parkError;

    // Sync date-specific schedules to new live_park_schedules table
    let schedulesCount = 0;
    for (const targetDate of targetDates) {
      const daySchedule = data.schedule?.filter(s => s.date === targetDate) || [];

      if (daySchedule.length === 0) {
        // No schedule data for this date - maybe too far in future
        console.log(`  ⚠️  No schedule data for ${targetDate} (may be too far in future)`);
        continue;
      }

      // Find different types of schedules for this specific date
      const operating = daySchedule.find(s => s.type === 'OPERATING');
      const earlyEntry = daySchedule.find(s => s.type === 'TICKETED_EVENT' && s.description?.toLowerCase().includes('early'));
      const extendedEvening = daySchedule.find(s => s.type === 'TICKETED_EVENT' && s.description?.toLowerCase().includes('extended'));

      const scheduleData = {
        park_id: parkSlug,
        schedule_date: targetDate,
        regular_open: parseTime(operating?.openingTime),
        regular_close: parseTime(operating?.closingTime),
        early_entry_open: parseTime(earlyEntry?.openingTime),
        extended_evening_close: parseTime(extendedEvening?.closingTime),
        data_source: 'themeparks_api',
        is_estimated: false,
        synced_at: new Date().toISOString()
      };

      const { error: scheduleError } = await supabase.from('live_park_schedules').upsert(scheduleData, {
        onConflict: 'park_id,schedule_date'
      });

      if (scheduleError) {
        console.warn(`Warning: Failed to sync schedule for ${targetDate}:`, scheduleError.message);
      } else {
        schedulesCount++;

        // Show hours for this date
        const hours = `${scheduleData.regular_open || 'TBD'} - ${scheduleData.regular_close || 'TBD'}`;
        const extras = [];
        if (scheduleData.early_entry_open) extras.push(`Early: ${scheduleData.early_entry_open}`);
        if (scheduleData.extended_evening_close) extras.push(`EEH: ${scheduleData.extended_evening_close}`);
        const extrasStr = extras.length > 0 ? ` (${extras.join(', ')})` : '';

        console.log(`  📅 ${targetDate}: ${hours}${extrasStr}`);
      }
    }

    // Sync special events to live_park_events table
    let eventsCount = 0;
    for (const targetDate of targetDates) {
      const daySchedule = data.schedule?.filter(s => s.date === targetDate) || [];

      // Find special events (TICKETED_EVENT that are not Early Entry or Extended Evening)
      const specialEvents = daySchedule.filter(s =>
        s.type === 'TICKETED_EVENT' &&
        s.description &&
        !s.description.toLowerCase().includes('early') &&
        !s.description.toLowerCase().includes('extended')
      );

      for (const event of specialEvents) {
        const eventData = {
          park_id: parkSlug,
          event_date: targetDate,
          event_name: event.description,
          event_type: 'SPECIAL_TICKETED_EVENT',
          event_open: parseTime(event.openingTime),
          event_close: parseTime(event.closingTime),
          description: event.description,
          data_source: 'themeparks_api',
          synced_at: new Date().toISOString()
        };

        const { error: eventError } = await supabase.from('live_park_events').upsert(eventData, {
          onConflict: 'park_id,event_date,event_type,event_name'
        });

        if (eventError) {
          console.warn(`Warning: Failed to sync event ${event.description} for ${targetDate}:`, eventError.message);
        } else {
          eventsCount++;
          console.log(`  🎉 ${targetDate}: ${event.description} (${eventData.event_open} - ${eventData.event_close})`);
        }
      }
    }

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

    console.log(`✅ Successfully synced ${parkSlug} (${schedulesCount} schedules, ${eventsCount} events, ${attractions.length} attractions)`);
    return { success: true, schedulesCount, eventsCount, attractionsCount: attractions.length };
  } catch (error) {
    console.error(`❌ Database sync failed for ${parkSlug}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting enhanced park data sync...');
  console.log('Database:', process.env.VITE_SUPABASE_URL ? '✅ Connected' : '❌ No URL');

  // Get target date range
  const targetDates = getDateRange();
  console.log(`📅 Syncing ${targetDates.length} days: ${targetDates[0]} to ${targetDates[targetDates.length - 1]}`);

  const startTime = Date.now();
  const results = [];

  // Sync all parks
  for (const [parkSlug, parkId] of Object.entries(PARK_IDS)) {
    const result = await syncParkData(parkSlug, parkId, targetDates);
    results.push({ park: parkSlug, ...result });

    // Add delay between parks to be respectful to the API
    if (parkSlug !== 'animal-kingdom') {
      console.log('Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const duration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const totalSchedules = results.filter(r => r.success).reduce((sum, r) => sum + (r.schedulesCount || 0), 0);
  const totalEvents = results.filter(r => r.success).reduce((sum, r) => sum + (r.eventsCount || 0), 0);
  const totalAttractions = results.filter(r => r.success).reduce((sum, r) => sum + (r.attractionsCount || 0), 0);

  console.log('\n📊 Enhanced Sync Summary:');
  console.log(`Duration: ${duration}ms`);
  console.log(`Success: ${successCount}/${results.length} parks`);
  console.log(`Total: ${totalSchedules} schedules, ${totalEvents} special events, ${totalAttractions} attractions`);

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const details = result.success
      ? `${result.schedulesCount || 0} schedules, ${result.eventsCount || 0} events, ${result.attractionsCount || 0} attractions`
      : result.error;
    console.log(`${status} ${result.park}: ${details}`);
  });

  if (successCount > 0) {
    console.log(`\n🎉 Enhanced sync completed! Your app now has ${targetDates.length} days of schedule data.`);
    console.log('✨ Perfect for trip planning with date-specific park hours!');
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