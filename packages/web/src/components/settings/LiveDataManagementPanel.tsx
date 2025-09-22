import { useState } from 'react';
import { Download, CheckCircle, XCircle, Clock, Database, CloudRain, Calendar, TrendingUp, Info, X } from 'lucide-react';
import { supabase } from '@waylight/shared';

interface ImportResult {
  success: boolean;
  recordsImported?: number;
  parksProcessed?: string[];
  errors?: string[];
  message?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function LiveDataManagementPanel() {
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [importingType, setImportingType] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Helper function for API calls with retry logic (improved for better reliability)
  const fetchWithRetry = async (url: string, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) return response;
        if (response.status === 429 || response.status === 503) {
          // Rate limited or service unavailable - wait longer with exponential backoff
          if (attempt <= maxRetries) {
            const waitTime = Math.min(attempt * 5000, 30000); // Max 30 seconds
            console.log(`Rate limited, waiting ${waitTime/1000} seconds before retry ${attempt}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (attempt <= maxRetries) {
          const waitTime = Math.min(attempt * 3000, 15000); // Max 15 seconds
          console.log(`Attempt ${attempt} failed, retrying in ${waitTime/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw error;
      }
    }
    return null;
  };

  const handleCrowdDataImport = async () => {
    setIsImporting(true);
    setImportingType('crowd-data');
    setLastResult(null);

    try {
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 1, currentYear, currentYear + 1]; // Last year, current year, next year
      console.log(`Importing crowd data for years: ${years.join(', ')}`);

      let totalRecords = 0;
      let allParks: string[] = [];
      let allErrors: string[] = [];
      let dateRange = { start: '', end: '' };

      for (const year of years) {
        console.log(`Importing crowd data for ${year}...`);

        const response = await fetch('/api/import-thrill-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ year }),
        });

        if (!response.ok) {
          const errorResult = await response.json().catch(() => ({
            error: `HTTP ${response.status}: ${response.statusText}`
          }));

          console.error(`Failed to import year ${year}:`, errorResult);
          if (errorResult.debug) {
            console.error('Debug Info:', errorResult.debug);
            allErrors.push(`${year}: ${errorResult.debug.errorMessage}`);
          } else {
            allErrors.push(`${year}: ${errorResult.error || 'Unknown error'}`);
          }
          continue;
        }

        const result = await response.json();

        if (result.success) {
          totalRecords += result.recordsImported || 0;
          if (result.parksProcessed) {
            allParks = [...new Set([...allParks, ...result.parksProcessed])]; // Deduplicate
          }

          // Set overall date range
          if (!dateRange.start || (result.dateRange?.start && result.dateRange.start < dateRange.start)) {
            dateRange.start = result.dateRange?.start || '';
          }
          if (!dateRange.end || (result.dateRange?.end && result.dateRange.end > dateRange.end)) {
            dateRange.end = result.dateRange?.end || '';
          }
        } else {
          allErrors.push(`${year}: ${result.errors?.join(', ') || 'Import failed'}`);
        }
      }

      setLastResult({
        success: totalRecords > 0,
        recordsImported: totalRecords,
        parksProcessed: allParks,
        errors: allErrors,
        dateRange,
        message: totalRecords > 0 ? `Successfully imported crowd data for ${years.join(', ')}` : 'No data imported'
      });

    } catch (error) {
      console.error('Multi-year import failed:', error);
      setLastResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Multi-year import failed'
      });
    } finally {
      setIsImporting(false);
      setImportingType(null);
    }
  };

  const handleWeatherDataImport = async () => {
    setIsImporting(true);
    setImportingType('weather-data');
    setLastResult(null);

    try {
      console.log('Importing weather data...');

      // Call Supabase Edge Function directly (same as header button)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase configuration for weather import');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-weather`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));

        console.error('Failed to import weather data:', errorResult);
        setLastResult({
          success: false,
          errors: [errorResult.error || 'Unknown error'],
          message: 'Weather import failed'
        });
        return;
      }

      const result = await response.json();

      setLastResult({
        success: true,
        recordsImported: result.forecasts || 0,
        message: `Successfully imported weather forecasts for ${result.location || 'Walt Disney World'}`,
        dateRange: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });

    } catch (error) {
      console.error('Weather import failed:', error);
      setLastResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Weather import failed'
      });
    } finally {
      setIsImporting(false);
      setImportingType(null);
    }
  };

  const handleParkHoursImport = async () => {
    setIsImporting(true);
    setImportingType('park-hours');
    setLastResult(null);

    // Add timeout protection (increased to 15 minutes for 4 parks)
    let timeoutId = setTimeout(() => {
      console.error('⏰ Park hours import timed out after 15 minutes');
      setLastResult({
        success: false,
        errors: ['Import timed out after 15 minutes'],
        message: 'Park hours import timed out'
      });
      setIsImporting(false);
      setImportingType(null);
    }, 15 * 60 * 1000); // 15 minute timeout

    try {
      console.log('Importing park hours and events using working header button logic...');

      // Disney park IDs for ThemeParks.wiki API (same as header button)
      const parkIds = {
        'magic-kingdom': '75ea578a-adc8-4116-a54d-dccb60765ef9',
        'epcot': '47f90d2c-e191-4239-a466-5892ef59a88b',
        'hollywood-studios': '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
        'animal-kingdom': '1c84a229-8862-4648-9c71-378ddd2c7693'
      };

      let successCount = 0;
      const errors: string[] = [];
      let totalEventsImported = 0;
      let totalSchedulesImported = 0;

      // Fetch schedule data for each park (same logic as header button)
      for (const [parkName, parkId] of Object.entries(parkIds)) {
        console.log(`🏰 Starting to process ${parkName} (${parkId})...`);
        try {
          // Add delay between parks to avoid rate limiting
          if (successCount > 0) {
            console.log(`⏰ Waiting 3 seconds before processing next park...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

          console.log(`📡 Fetching schedule data for ${parkName}...`);

          // Get schedule data for current + next 2 months (3 months total, future-focused)
          const today = new Date();
          const currentMonth = today.getMonth() + 1;
          const currentYear = today.getFullYear();

          const monthsToFetch = [];
          for (let i = 0; i < 3; i++) {
            const month = ((currentMonth - 1 + i) % 12) + 1;
            const year = currentYear + Math.floor((currentMonth - 1 + i) / 12);
            monthsToFetch.push({ year, month: month.toString().padStart(2, '0') });
          }

          let allScheduleData = [];
          for (const { year, month } of monthsToFetch) {
            try {
              console.log(`Fetching schedule for ${parkName} ${year}/${month}...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay
              const monthlyResponse = await fetchWithRetry(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule/${year}/${month}`);
              if (monthlyResponse) {
                const monthlyData = await monthlyResponse.json();
                if (monthlyData.schedule && Array.isArray(monthlyData.schedule)) {
                  allScheduleData.push(...monthlyData.schedule);
                  console.log(`✓ Added ${monthlyData.schedule.length} schedule entries for ${parkName} ${year}/${month}`);
                } else {
                  console.log(`No schedule data found for ${parkName} ${year}/${month}`);
                }
              } else {
                console.warn(`No response received for ${parkName} ${year}/${month}`);
              }
            } catch (error) {
              console.warn(`Failed to fetch schedule for ${parkName} ${year}/${month}:`, error);
              // Continue with other months even if one fails
            }
          }

          console.log(`✅ Successfully fetched ${allScheduleData.length} schedule entries for ${parkName}`);

          // Clean up old schedules first (same as header button)
          const scheduleCleanupDate = new Date();
          scheduleCleanupDate.setDate(scheduleCleanupDate.getDate() - 30);
          const scheduleCleanupDateStr = scheduleCleanupDate.toISOString().split('T')[0];
          const { error: scheduleCleanupError } = await supabase
            .from('live_park_schedules')
            .delete()
            .eq('park_id', parkName)
            .lt('schedule_date', scheduleCleanupDateStr);

          if (scheduleCleanupError && !scheduleCleanupError.message.includes('row-level security')) {
            console.warn(`Warning: Could not clean up old schedules for ${parkName}:`, scheduleCleanupError);
          }

          // Process park schedules (future dates only)
          let schedulesCount = 0;
          const todayStr = new Date().toISOString().split('T')[0]; // Today in YYYY-MM-DD format

          for (const schedule of allScheduleData) {
            try {
              const scheduleDate = schedule.date; // Already in YYYY-MM-DD format

              // Skip past dates - only process today and future dates
              if (scheduleDate < todayStr) {
                continue;
              }
              // Parse ISO time strings and extract HH:MM format (same as header)
              const openTimeMatch = schedule.openingTime?.match(/T(\d{2}:\d{2})/);
              const closeTimeMatch = schedule.closingTime?.match(/T(\d{2}:\d{2})/);
              const regularOpen = openTimeMatch ? openTimeMatch[1] : null;
              const regularClose = closeTimeMatch ? closeTimeMatch[1] : null;

              // Look for early entry and extended evening hours from events (same as header)
              const sameDate = allScheduleData.filter((s: any) => s.date === scheduleDate);
              const earlyEntryEvent = sameDate.find((item: any) =>
                item.type === 'TICKETED_EVENT' &&
                item.description?.toLowerCase().includes('early entry')
              );
              const extendedEvent = sameDate.find((item: any) =>
                item.type === 'TICKETED_EVENT' &&
                item.description?.toLowerCase().includes('extended evening')
              );
              const earlyEntryOpenMatch = earlyEntryEvent?.openingTime?.match(/T(\d{2}:\d{2})/);
              const extendedCloseMatch = extendedEvent?.closingTime?.match(/T(\d{2}:\d{2})/);
              const earlyEntryOpen = earlyEntryOpenMatch ? earlyEntryOpenMatch[1] : null;
              const extendedClose = extendedCloseMatch ? extendedCloseMatch[1] : null;

              // Log early entry/extended hours when found
              if (earlyEntryOpen) {
                console.log(`🌅 Found early entry for ${parkName} on ${scheduleDate}: ${earlyEntryOpen}`);
              }
              if (extendedClose) {
                console.log(`🌙 Found extended hours for ${parkName} on ${scheduleDate}: ${extendedClose}`);
              }

              try {
                // Delete existing record first, then insert (same as header)
                await supabase
                  .from('live_park_schedules')
                  .delete()
                  .eq('park_id', parkName)
                  .eq('schedule_date', scheduleDate);

                const { error: scheduleError } = await supabase.from('live_park_schedules').insert({
                  park_id: parkName,
                  schedule_date: scheduleDate,
                  regular_open: regularOpen,
                  regular_close: regularClose,
                  early_entry_open: earlyEntryOpen,
                  extended_evening_close: extendedClose,
                  data_source: 'themeparks_wiki',
                  is_estimated: false,
                  synced_at: new Date().toISOString()
                });

                if (!scheduleError) {
                  schedulesCount++;
                  totalSchedulesImported++;
                }
              } catch (error) {
                console.warn(`Failed to insert schedule for ${parkName} on ${scheduleDate}:`, error);
              }
            } catch (error) {
              console.warn(`Failed to process schedule entry for ${parkName}:`, error);
            }
          }

          console.log(`✅ Imported ${schedulesCount} schedules for ${parkName}`);

          // Clean up old events first (older than 30 days, same as header button)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const cleanupDate = thirtyDaysAgo.toISOString().split('T')[0];
          const { error: cleanupError } = await supabase
            .from('live_park_events')
            .delete()
            .eq('park_id', parkName)
            .lt('event_date', cleanupDate);

          if (cleanupError && !cleanupError.message.includes('row-level security')) {
            console.warn(`Warning: Could not clean up old events for ${parkName}:`, cleanupError);
          }

          // Process events from schedule data (same logic as header button)
          const targetDates = [];
          for (let i = 0; i < 90; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            targetDates.push(date.toISOString().split('T')[0]);
          }

          let eventsCount = 0;
          for (const targetDate of targetDates) {
            const daySchedule = allScheduleData.filter((s: any) => s.date === targetDate) || [];

            // Find special events (same filtering as header button)
            const specialEvents = daySchedule.filter((s: any) =>
              s.type === 'TICKETED_EVENT' &&
              s.description &&
              !s.description.toLowerCase().includes('early') &&
              !s.description.toLowerCase().includes('extended')
            );

            for (const event of specialEvents) {
              try {
                // Parse ISO date/time strings to extract HH:MM:SS format (same as header button)
                const eventDate = targetDate; // Already in YYYY-MM-DD format
                const openTimeMatch = event.openingTime?.match(/T(\d{2}:\d{2}:\d{2})/);
                const closeTimeMatch = event.closingTime?.match(/T(\d{2}:\d{2}:\d{2})/);
                const openTime = openTimeMatch ? openTimeMatch[1] : null;
                const closeTime = closeTimeMatch ? closeTimeMatch[1] : null;
                const eventName = event.description || 'Special Ticketed Event';
                const eventType = 'special_event';

                const eventData = {
                  park_id: parkName,
                  event_date: eventDate,
                  event_name: eventName,
                  event_type: eventType,
                  event_open: openTime,
                  event_close: closeTime,
                  description: event.description,
                  data_source: 'themeparks_wiki',  // Match header button
                  synced_at: new Date().toISOString()
                };

                // Use delete + insert pattern (same as working header button)
                await supabase.from('live_park_events')
                  .delete()
                  .eq('park_id', parkName)
                  .eq('event_date', eventDate)
                  .eq('event_name', eventName);

                console.log('📅 Inserting event data:', eventData);
                const { error: eventError } = await supabase.from('live_park_events').insert(eventData);

                if (!eventError) {
                  eventsCount++;
                  totalEventsImported++;
                } else {
                  console.error(`❌ Event ${event.description} failed:`, eventError);
                  if (eventError.message.includes('row-level security')) {
                    console.warn(`🔒 RLS policy issue for events in ${parkName}`);
                  }
                  if (eventError.message.includes('violates')) {
                    console.warn(`🔒 Constraint violation for events in ${parkName}:`, eventError.message);
                  }
                }
              } catch (error) {
                console.error(`Failed to import event for ${parkName}:`, error);
              }
            }
          }

          console.log(`✅ SUCCESS: ${parkName} - Imported ${schedulesCount} schedules and ${eventsCount} events`);
          totalSchedulesImported += schedulesCount;
          totalEventsImported += eventsCount;
          successCount++;

          // Reset timeout after each successful park to give more time for remaining parks
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            console.error('⏰ Park hours import timed out after 15 minutes');
            setLastResult({
              success: false,
              errors: ['Import timed out after 15 minutes'],
              message: 'Park hours import timed out'
            });
            setIsImporting(false);
            setImportingType(null);
          }, 15 * 60 * 1000);

        } catch (error) {
          const errorMsg = `${parkName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ FAILED: ${parkName} - ${errorMsg}`);
          console.error('Full error details:', error);
          errors.push(errorMsg);
          // Continue to next park even if this one fails
        }

        console.log(`📊 Progress: ${successCount}/${Object.keys(parkIds).length} parks completed`);
      }

      clearTimeout(timeoutId); // Clear timeout since we're finishing normally

      setLastResult({
        success: successCount > 0,
        recordsImported: totalEventsImported + totalSchedulesImported,
        parksProcessed: Object.keys(parkIds).slice(0, successCount),
        message: successCount === Object.keys(parkIds).length
          ? `Successfully imported park hours and events for all ${successCount} parks (${totalSchedulesImported} schedules, ${totalEventsImported} events)`
          : successCount > 0
          ? `Partial success: Imported hours for ${successCount}/${Object.keys(parkIds).length} parks`
          : 'Failed to import park hours for any parks',
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Park hours import failed:', error);
      setLastResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Park hours import failed'
      });
    } finally {
      clearTimeout(timeoutId); // Clear timeout if we finish normally
      setIsImporting(false);
      setImportingType(null);
    }
  };

  const handleWaitTimesImport = async () => {
    setIsImporting(true);
    setImportingType('wait-times');
    setLastResult(null);

    try {
      console.log('Importing live wait times using working header button logic...');

      // Disney park IDs for ThemeParks.wiki API (same as header button)
      const parkIds = {
        'magic-kingdom': '75ea578a-adc8-4116-a54d-dccb60765ef9',
        'epcot': '47f90d2c-e191-4239-a466-5892ef59a88b',
        'hollywood-studios': '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
        'animal-kingdom': '1c84a229-8862-4648-9c71-378ddd2c7693'
      };

      let successCount = 0;
      const errors: string[] = [];
      let totalAttractionsImported = 0;
      let totalEntertainmentImported = 0;

      // Fetch live data for each park (same logic as header button)
      for (const [parkName, parkId] of Object.entries(parkIds)) {
        try {
          console.log(`Fetching live data for ${parkName}...`);

          // Add delay between requests to avoid rate limiting
          if (successCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          const liveResponse = await fetchWithRetry(`https://api.themeparks.wiki/v1/entity/${parkId}/live`);
          if (!liveResponse) {
            throw new Error(`Failed to fetch live data for ${parkName} after retries`);
          }
          const liveData = await liveResponse.json();

          // Categorize live data (same as header button)
          const attractionsData = liveData.liveData?.filter((item: any) => item.entityType === 'ATTRACTION') || [];
          const entertainmentData = liveData.liveData?.filter((item: any) => item.entityType === 'SHOW') || [];

          console.log(`Processing ${attractionsData.length} attractions and ${entertainmentData.length} entertainment for ${parkName}`);

          // Update attractions in database (same logic as header button)
          let attractionUpdateCount = 0;
          for (const attraction of attractionsData) {
            try {
              // Map status from API to database format
              let dbStatus: 'operating' | 'down' | 'delayed' | 'temporary_closure' = 'operating';
              if (attraction.status === 'DOWN' || attraction.status === 'CLOSED') {
                dbStatus = 'down';
              } else if (attraction.status === 'DELAYED') {
                dbStatus = 'delayed';
              } else if (attraction.status === 'TEMPORARY_CLOSURE') {
                dbStatus = 'temporary_closure';
              }

              const { error: attractionError } = await supabase.from('live_attractions').upsert({
                park_id: parkName,
                external_id: attraction.id,
                name: attraction.name,
                wait_time: attraction.queue?.STANDBY?.waitTime || -1,
                status: dbStatus,
                lightning_lane_available: !!attraction.queue?.LIGHTNING_LANE?.waitTime,
                lightning_lane_return_time: attraction.queue?.LIGHTNING_LANE?.returnTime || null,
                single_rider_available: !!attraction.queue?.SINGLE_RIDER?.waitTime,
                single_rider_wait_time: attraction.queue?.SINGLE_RIDER?.waitTime || null,
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'park_id,external_id'
              });

              if (!attractionError) {
                attractionUpdateCount++;
                totalAttractionsImported++;
              } else {
                console.error(`❌ Attraction ${attraction.name} failed:`, attractionError);
                if (attractionError.message.includes('row-level security')) {
                  console.warn(`🔒 RLS policy issue for attractions in ${parkName}`);
                }
              }
            } catch (error) {
              console.warn(`Failed to update attraction ${attraction.name}:`, error);
            }
          }

          // Update entertainment in database (same logic as header button)
          let entertainmentUpdateCount = 0;
          for (const entertainment of entertainmentData) {
            try {
              // Map status from API to database format
              let dbStatus: 'operating' | 'cancelled' | 'delayed' = 'operating';
              if (entertainment.status === 'DOWN' || entertainment.status === 'CLOSED' || entertainment.status === 'REFURBISHMENT') {
                dbStatus = 'cancelled';
              } else if (entertainment.status === 'DELAYED') {
                dbStatus = 'delayed';
              }

              // Extract show times and find next show
              const showTimes = entertainment.showtimes?.map((show: any) => show.startTime) || [];
              const nextShow = showTimes.find((time: string) => {
                const showTime = new Date(time);
                return showTime > new Date();
              });

              const { error: entertainmentError } = await supabase.from('live_entertainment').upsert({
                park_id: parkName,
                external_id: entertainment.id,
                name: entertainment.name,
                show_times: showTimes,
                status: dbStatus,
                next_show_time: nextShow || null,
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'park_id,external_id'
              });

              if (!entertainmentError) {
                entertainmentUpdateCount++;
                totalEntertainmentImported++;
              } else {
                console.error(`❌ Entertainment ${entertainment.name} failed:`, entertainmentError);
                if (entertainmentError.message.includes('row-level security')) {
                  console.warn(`🔒 RLS policy issue for entertainment in ${parkName}`);
                }
              }
            } catch (error) {
              console.warn(`Failed to update entertainment ${entertainment.name}:`, error);
            }
          }

          console.log(`✅ Updated ${attractionUpdateCount} attractions and ${entertainmentUpdateCount} entertainment for ${parkName}`);
          successCount++;

        } catch (error) {
          const errorMsg = `${parkName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ Failed to import wait times for ${parkName}:`, error);
          errors.push(errorMsg);
        }
      }

      setLastResult({
        success: successCount > 0,
        recordsImported: totalAttractionsImported + totalEntertainmentImported,
        parksProcessed: Object.keys(parkIds).slice(0, successCount),
        message: successCount === Object.keys(parkIds).length
          ? `Successfully imported wait times for all ${successCount} parks (${totalAttractionsImported} attractions, ${totalEntertainmentImported} shows)`
          : successCount > 0
          ? `Partial success: Imported wait times for ${successCount}/${Object.keys(parkIds).length} parks`
          : 'Failed to import wait times for any parks',
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Wait times import failed:', error);
      setLastResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Wait times import failed'
      });
    } finally {
      setIsImporting(false);
      setImportingType(null);
    }
  };

  const getStatusIcon = (type: string) => {
    if (importingType === type && isImporting) {
      return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    if (lastResult?.success) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (lastResult && !lastResult.success) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    return <Database className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <h3 className="font-medium text-ink">Live Data Management</h3>
          <button
            onClick={() => setShowInfoModal(true)}
            className="p-1 hover:bg-surface-dark/20 rounded-full transition-colors"
            title="About Live Data Management"
          >
            <Info className="w-4 h-4 text-ink-light hover:text-sea" />
          </button>
        </div>
        <p className="text-sm text-ink-light mb-4">
          Import and update real-time park data from various sources to enhance your trip planning experience.
        </p>
      </div>

      {/* Import Buttons - All in One Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Crowd Data */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            {getStatusIcon('crowd-data')}
            <div>
              <h4 className="font-medium text-ink">Crowd Predictions</h4>
              <p className="text-sm text-ink-light">Import 3-year crowd data</p>
            </div>
          </div>
          <button
            onClick={handleCrowdDataImport}
            disabled={isImporting}
            className={`btn-primary w-full flex items-center justify-center ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {importingType === 'crowd-data' ? 'Importing...' : 'Import Crowd Data'}
          </button>
        </div>

        {/* Weather Data */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            {getStatusIcon('weather-data')}
            <div>
              <h4 className="font-medium text-ink">Weather Data</h4>
              <p className="text-sm text-ink-light">Import weather forecasts</p>
            </div>
          </div>
          <button
            onClick={handleWeatherDataImport}
            disabled={isImporting}
            className={`btn-secondary w-full flex items-center justify-center ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <CloudRain className="w-4 h-4 mr-2" />
            {importingType === 'weather-data' ? 'Importing...' : 'Import Weather'}
          </button>
        </div>

        {/* Park Hours */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            {getStatusIcon('park-hours')}
            <div>
              <h4 className="font-medium text-ink">Park Hours & Events</h4>
              <p className="text-sm text-ink-light">Import operating hours and special events</p>
            </div>
          </div>
          <button
            onClick={handleParkHoursImport}
            disabled={isImporting}
            className={`btn-secondary w-full flex items-center justify-center ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {importingType === 'park-hours' ? 'Importing...' : 'Import Hours'}
          </button>
        </div>

        {/* Wait Times */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            {getStatusIcon('wait-times')}
            <div>
              <h4 className="font-medium text-ink">Live Wait Times</h4>
              <p className="text-sm text-ink-light">Import current attraction wait times</p>
            </div>
          </div>
          <button
            onClick={handleWaitTimesImport}
            disabled={isImporting}
            className={`btn-secondary w-full flex items-center justify-center ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            {importingType === 'wait-times' ? 'Importing...' : 'Import Wait Times'}
          </button>
        </div>
      </div>

      {/* Import Status */}
      {lastResult && (
        <div className={`p-4 rounded-lg border ${
          lastResult.success
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        }`}>
          <div className="text-sm">
            {lastResult.success ? (
              <div className="space-y-2">
                <div className="font-medium text-green-800">
                  ✅ {lastResult.message || `Successfully imported ${lastResult.recordsImported || 0} predictions`}
                </div>
                {lastResult.parksProcessed && lastResult.parksProcessed.length > 0 && (
                  <div className="text-green-700">
                    Parks: {lastResult.parksProcessed.join(', ')}
                  </div>
                )}
                {lastResult.dateRange?.start && (
                  <div className="text-green-700">
                    Date range: {lastResult.dateRange.start} to {lastResult.dateRange.end}
                  </div>
                )}
                {lastResult.recordsImported && lastResult.recordsImported > 0 && (
                  <div className="text-green-700">
                    Total records: {lastResult.recordsImported.toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="font-medium text-red-800">
                  ❌ {lastResult.message || 'Import failed'}
                </div>
                {lastResult.errors && lastResult.errors.map((error, index) => (
                  <div key={index} className="text-red-700 text-xs">
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                <Database className="w-5 h-5 mr-2 text-sea" />
                About Live Data Management
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-ink-light hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-ink">Crowd Data</div>
                    <div className="text-sm text-ink-light">Imports 3 years of predictions from Thrill Data (thousands of records)</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CloudRain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-ink">Weather Data</div>
                    <div className="text-sm text-ink-light">Real-time weather forecasts for trip planning</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-ink">Park Hours & Events</div>
                    <div className="text-sm text-ink-light">Operating schedules and special events</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-ink">Wait Times</div>
                    <div className="text-sm text-ink-light">Live attraction wait times for real-time planning</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-dark/20">
                  <div className="text-sm text-ink-light">
                    All data sources integrate seamlessly with your trip planning tools.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}