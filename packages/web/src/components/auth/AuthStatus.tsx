import { useState, useEffect } from 'react';
import { LogIn, LogOut, User, RefreshCw, Loader2 } from 'lucide-react';
import { authService, syncService, supabase, type AuthState, type SyncStatus } from '@waylight/shared';
import { createClient } from '@supabase/supabase-js';
import AuthModal from './AuthModal';

export default function AuthStatus() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshingParks, setIsRefreshingParks] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = authService.subscribe(setAuthState);
    const unsubscribeSync = syncService.subscribe(setSyncStatus);

    return () => {
      unsubscribeAuth();
      unsubscribeSync();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const fetchWithRetry = async (url: string, maxRetries = 2) => {
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) return response;

        if (response.status === 429 || response.status === 503) {
          // Rate limited or service unavailable - wait longer
          if (attempt <= maxRetries) {
            console.log(`Rate limited, waiting ${attempt * 3} seconds before retry ${attempt}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 3000));
            continue;
          }
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (attempt <= maxRetries) {
          console.log(`Request failed, retrying in ${attempt * 2} seconds... (${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        } else {
          throw error;
        }
      }
    }
  };

  const handleRefreshParks = async () => {
    if (isRefreshingParks) return;

    setIsRefreshingParks(true);
    try {
      console.log('🔧 Syncing live data to database from ThemeParks.wiki...');

      // Note: Using regular supabase client - RLS policies need to be configured
      // to allow authenticated users to insert/update live_parks and live_attractions
      console.log('Current user:', authState.user?.email);

      // Disney park IDs for ThemeParks.wiki API
      const parkIds = {
        'magic-kingdom': '75ea578a-adc8-4116-a54d-dccb60765ef9',
        'epcot': '47f90d2c-e191-4239-a466-5892ef59a88b',
        'hollywood-studios': '288747d1-8b4f-4a64-867e-ea7c9b27bad8',
        'animal-kingdom': '1c84a229-8862-4648-9c71-378ddd2c7693'
      };

      let successCount = 0;
      const errors: string[] = [];

      // Fetch data for each park and update database
      for (const [parkName, parkId] of Object.entries(parkIds)) {
        try {
          console.log(`Fetching live data for ${parkName}...`);

          // Add delay between requests to avoid rate limiting
          if (successCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          }

          const liveResponse = await fetchWithRetry(`https://api.themeparks.wiki/v1/entity/${parkId}/live`);
          if (!liveResponse) {
            throw new Error(`Failed to fetch live data for ${parkName} after retries`);
          }
          const liveData = await liveResponse.json();

          console.log(`Fetching schedule data for ${parkName}...`);

          // Add delay between API calls
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

          const scheduleResponse = await fetchWithRetry(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule`);
          if (!scheduleResponse) {
            throw new Error(`Failed to fetch schedule data for ${parkName} after retries`);
          }
          const scheduleData = await scheduleResponse.json();

          // Categorize live data
          const attractionsData = liveData.liveData?.filter((item: any) => item.entityType === 'ATTRACTION') || [];
          const entertainmentData = liveData.liveData?.filter((item: any) => item.entityType === 'SHOW') || [];

          console.log(`✅ Successfully fetched data for ${parkName}:`, {
            name: liveData.name,
            status: liveData.status,
            attractionsCount: attractionsData.length,
            entertainmentCount: entertainmentData.length,
            scheduleCount: scheduleData.schedule?.length || 0
          });

          // Update park status in database
          const { error: parkError } = await supabase.from('live_parks').upsert({
            park_id: parkName,
            external_id: parkId,
            name: liveData.name || parkName,
            status: liveData.status === 'OPERATING' ? 'operating' : 'closed',
            regular_open: '09:00',  // Default, would need to parse from schedule
            regular_close: '22:00', // Default, would need to parse from schedule
            early_entry_open: null,
            extended_evening_close: null,
            crowd_level: null,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'park_id'
          });

          if (parkError) {
            console.error(`❌ Failed to update park ${parkName} in database:`, parkError);

            if (parkError.message.includes('row-level security')) {
              throw new Error(`RLS Policy Error: The 'live_parks' table needs RLS policies configured to allow INSERT/UPDATE operations for authenticated users.`);
            }

            throw new Error(`Database error for ${parkName}: ${parkError.message}`);
          }

          // Update attractions in database
          let attractionUpdateCount = 0;
          for (const attraction of attractionsData) {
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

            if (attractionError) {
              console.error(`❌ Failed to update attraction ${attraction.name}:`, attractionError);
            } else {
              attractionUpdateCount++;
            }
          }

          console.log(`✅ Updated ${attractionUpdateCount}/${attractionsData.length} attractions for ${parkName}`);

          // Skip entertainment updates for now - table is not populating correctly
          console.log(`⏸️ Skipping ${entertainmentData.length} entertainment shows for ${parkName} (disabled for now)`);

          // Test RLS policies first with a simple read query
          const { error: rlsTestError } = await supabase
            .from('live_park_events')
            .select('id')
            .limit(1);

          if (rlsTestError && rlsTestError.message.includes('row-level security')) {
            console.warn(`⚠️ RLS Policy Error: live_park_events table needs proper policies for authenticated users`);
            console.log(`⏸️ Skipping events table updates for ${parkName} (RLS policies not configured)`);
            errors.push(`${parkName}: Events table RLS policies need configuration for INSERT/DELETE operations`);
          } else {
            console.log(`✅ Events table access confirmed for ${parkName}, proceeding with updates...`);

            // Clean up old events first (older than 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const cleanupDate = thirtyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format

            const { error: cleanupError } = await supabase
              .from('live_park_events')
              .delete()
              .eq('park_id', parkName)
              .lt('event_date', cleanupDate);

            if (cleanupError) {
              console.warn(`⚠️ Failed to cleanup old events for ${parkName}:`, cleanupError);
              if (cleanupError.message.includes('row-level security')) {
                errors.push(`${parkName}: Events table DELETE not allowed - RLS policy needed`);
                console.log(`⏸️ Skipping events table updates for ${parkName} (DELETE permission denied)`);
                continue;
              }
            } else {
              console.log(`🧹 Cleaned up old events for ${parkName} (before ${cleanupDate})`);
            }

            // Update events in database (only special ticketed events)
            let eventUpdateCount = 0;

            // Debug: Show all event types available
            const allEventTypes = [...new Set(scheduleData.schedule?.map((s: any) => s.type) || [])];
            console.log(`📊 Available event types for ${parkName}:`, allEventTypes);

            const eventsData = scheduleData.schedule?.filter((item: any) => {
              // Only include TICKETED_EVENT with valid times
              if (item.type !== 'TICKETED_EVENT' || !item.date || (!item.openingTime && !item.closingTime)) {
                return false;
              }

              // Exclude Early Entry and Extended Evening Hours (handled by another table)
              const description = item.description?.toLowerCase() || '';
              const isEarlyEntry = description.includes('early entry') || description.includes('early admission');
              const isExtendedHours = description.includes('extended evening') || description.includes('extended hours');

              return !isEarlyEntry && !isExtendedHours;
            }) || [];

            console.log(`🎫 Found ${eventsData.length} special ticketed events for ${parkName} (excluding EE/EEH)`);

            for (const event of eventsData) {
              try {
                // Parse ISO date/time strings to extract HH:MM:SS format
                const eventDate = event.date; // Already in YYYY-MM-DD format

                // Parse ISO time strings and extract time portion
                const openTimeMatch = event.openingTime?.match(/T(\d{2}:\d{2}:\d{2})/);
                const closeTimeMatch = event.closingTime?.match(/T(\d{2}:\d{2}:\d{2})/);

                const openTime = openTimeMatch ? openTimeMatch[1] : null;
                const closeTime = closeTimeMatch ? closeTimeMatch[1] : null;

                // Skip if neither opening nor closing time is available
                if (!openTime && !closeTime) {
                  console.warn(`⚠️ Skipping event for ${parkName} on ${eventDate}: no valid times`);
                  continue;
                }

                // Set event details for ticketed events
                const eventName = event.description || 'Special Ticketed Event';
                const eventType = 'special_event';

                try {
                  // Delete existing record first, then insert
                  await supabase
                    .from('live_park_events')
                    .delete()
                    .eq('park_id', parkName)
                    .eq('event_date', eventDate)
                    .eq('event_name', eventName);

                  const { error: eventError } = await supabase.from('live_park_events').insert({
                    park_id: parkName,
                    event_date: eventDate,
                    event_name: eventName,
                    event_type: eventType,
                    event_open: openTime,
                    event_close: closeTime,
                    description: event.description || `${eventType} for ${liveData.name}`,
                    data_source: 'themeparks_wiki',
                    synced_at: new Date().toISOString()
                  });

                  if (eventError) {
                    console.error(`❌ Failed to upsert event for ${parkName} on ${eventDate}:`, eventError);
                    console.error(`❌ Event data that failed:`, {
                      park_id: parkName,
                      event_date: eventDate,
                      event_name: `${liveData.name} Operating Hours`,
                      event_type: 'park_hours',
                      event_open: openTime,
                      event_close: closeTime,
                      data_source: 'themeparks_wiki'
                    });
                    if (eventError.message.includes('row-level security')) {
                      errors.push(`${parkName}: Events table INSERT not allowed - RLS policy needed`);
                      break; // Stop trying more events for this park
                    } else {
                      errors.push(`${parkName} event ${eventDate}: ${eventError.message} | Code: ${eventError.code} | Details: ${eventError.details}`);
                    }
                  } else {
                    eventUpdateCount++;
                  }
                } catch (networkError) {
                  console.error(`❌ Network/HTTP error for ${parkName} event ${eventDate}:`, networkError);
                  errors.push(`${parkName} event ${eventDate}: Network error - ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`);
                }
              } catch (error) {
                console.error(`❌ Failed to process event for ${parkName}:`, error);
                errors.push(`${parkName} event processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }

            console.log(`✅ Updated ${eventUpdateCount}/${eventsData.length} events for ${parkName}`);

          // Update park schedules in database (regular operating hours)
          let scheduleUpdateCount = 0;
          const scheduleData_filtered = scheduleData.schedule?.filter((item: any) =>
            item.type === 'OPERATING' && item.date && (item.openingTime || item.closingTime)
          ) || [];

          console.log(`📅 Found ${scheduleData_filtered.length} operating schedule entries for ${parkName}`);

          for (const schedule of scheduleData_filtered) {
            try {
              const scheduleDate = schedule.date; // Already in YYYY-MM-DD format

              // Parse ISO time strings and extract HH:MM format (not HH:MM:SS)
              const openTimeMatch = schedule.openingTime?.match(/T(\d{2}:\d{2})/);
              const closeTimeMatch = schedule.closingTime?.match(/T(\d{2}:\d{2})/);

              const regularOpen = openTimeMatch ? openTimeMatch[1] : null;
              const regularClose = closeTimeMatch ? closeTimeMatch[1] : null;

              // Look for Early Entry and Extended Evening Hours in the same date
              const sameDate = scheduleData.schedule?.filter((item: any) => item.date === scheduleDate) || [];

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

              try {
                // Delete existing record first, then insert
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

                if (scheduleError) {
                  console.error(`❌ Failed to insert schedule for ${parkName} on ${scheduleDate}:`, scheduleError);
                  errors.push(`${parkName} schedule ${scheduleDate}: ${scheduleError.message}`);
                } else {
                  scheduleUpdateCount++;
                }
              } catch (networkError) {
                console.error(`❌ Network/HTTP error for ${parkName} schedule ${scheduleDate}:`, networkError);
                errors.push(`${parkName} schedule ${scheduleDate}: Network error - ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`);
              }
            } catch (error) {
              console.error(`❌ Failed to process schedule for ${parkName}:`, error);
              errors.push(`${parkName} schedule processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }

          console.log(`✅ Updated ${scheduleUpdateCount}/${scheduleData_filtered.length} schedules for ${parkName}`);

          // Debug: Check if we have any errors accumulated
          console.log(`🔍 Current errors for ${parkName}:`, errors.length > 0 ? errors : 'No errors');

          // Add info message if no ticketed events were found
          if (eventUpdateCount === 0) {
            if (eventsData.length === 0) {
              console.log(`ℹ️ No ticketed events found for ${parkName} in current schedule period`);
            } else {
              errors.push(`${parkName}: No events were successfully updated despite ${eventsData.length} ticketed events in API data`);
              console.log(`🚨 Forced error message for ${parkName} - check popup`);
            }
          }
          }

          // Only increment success if no errors occurred for this park
          if (errors.length === 0) {
            successCount++;
          } else {
            console.log(`⚠️ ${parkName} had errors, not counting as success`);
          }
        } catch (error) {
          const errorMsg = `${parkName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ Failed to process ${parkName}:`, error);
        }
      }

      // Show results
      if (successCount === Object.keys(parkIds).length) {
        alert(`✅ Database sync successful!\n\nUpdated live data for all ${successCount} parks:\n• Attractions & wait times\n• Park status & info\n• Special ticketed events\n• Daily park schedules with EE/EEH`);
      } else if (successCount > 0) {
        alert(`⚠️ Partial success: Updated ${successCount}/${Object.keys(parkIds).length} parks in database.\n\nErrors:\n${errors.join('\n')}`);
      } else {
        throw new Error(`Failed to update any parks:\n${errors.join('\n')}`);
      }

      console.log(`✅ Database sync completed: ${successCount}/${Object.keys(parkIds).length} parks updated with attractions, park info, events, and schedules`);
    } catch (error) {
      console.error('Failed to sync live data:', error);
      alert(`❌ Failed to sync live data to database.\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRefreshingParks(false);
    }
  };

  if (authState.loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-ink-light">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!authState.user) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-ink-light hover:text-ink transition-colors"
        >
          <LogIn className="h-4 w-4" />
          <span className="text-sm font-medium">Sign In</span>
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Park Hours Refresh */}
        <button
          onClick={handleRefreshParks}
          disabled={isRefreshingParks}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh live database with current park data and attraction wait times"
        >
          {isRefreshingParks ? (
            <Loader2 className="h-4 w-4 animate-spin text-sea" />
          ) : (
            <RefreshCw className="h-4 w-4 text-sea" />
          )}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-ink-light hover:text-ink transition-colors"
          >
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">
              {authState.user.fullName || authState.user.email}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-surface-dark rounded-lg shadow-lg z-10">
              <div className="p-3 border-b border-surface-dark">
                <p className="text-sm font-medium text-ink">
                  {authState.user.fullName || 'User'}
                </p>
                <p className="text-xs text-ink-light">{authState.user.email}</p>
              </div>
              
              <div className="p-1">
                <button
                  onClick={handleRefreshParks}
                  disabled={isRefreshingParks}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-light hover:text-ink hover:bg-surface rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRefreshingParks ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isRefreshingParks ? 'Updating Database...' : 'Sync Live Data'}
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-light hover:text-ink hover:bg-surface rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>

              {syncStatus.lastSync && (
                <div className="p-3 border-t border-surface-dark">
                  <p className="text-xs text-ink-light">
                    Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString([], { hour12: false })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}