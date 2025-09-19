import { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut, User, RefreshCw, Loader2, ChevronDown } from 'lucide-react';
import { authService, syncService, supabase, type AuthState, type SyncStatus } from '@waylight/shared';
import { createClient } from '@supabase/supabase-js';
import AuthModal from './AuthModal';

export default function AuthStatus() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshingParks, setIsRefreshingParks] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = authService.subscribe(setAuthState);
    const unsubscribeSync = syncService.subscribe(setSyncStatus);

    return () => {
      unsubscribeAuth();
      unsubscribeSync();
    };
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const handleSignOut = async () => {
    try {
      console.log('🔘 User clicked sign out');
      setIsSigningOut(true);
      setShowUserMenu(false);

      // Note: The actual sync happens in the trip store's auth subscription
      // We just need to trigger the signOut, which will automatically:
      // 1. Sync pending changes to cloud
      // 2. Clear local data
      // 3. Update auth state
      await authService.signOut();

      console.log('🔘 Sign out completed');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
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

          // Get schedule data for next 3 months using monthly endpoints
          const today = new Date();
          const currentMonth = today.getMonth() + 1; // getMonth() is 0-based
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
              // Add delay between monthly requests
              await new Promise(resolve => setTimeout(resolve, 500));

              const monthlyResponse = await fetchWithRetry(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule/${year}/${month}`);
              if (monthlyResponse) {
                const monthlyData = await monthlyResponse.json();
                if (monthlyData.schedule && Array.isArray(monthlyData.schedule)) {
                  allScheduleData.push(...monthlyData.schedule);
                }
              }
            } catch (error) {
              // Silently continue if monthly schedule fetch fails
            }
          }

          // Create combined schedule data object
          const scheduleData = { schedule: allScheduleData };

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
            errors.push(`${parkName}: Events table RLS policies need configuration for INSERT/DELETE operations`);
          } else {

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
              if (cleanupError.message.includes('row-level security')) {
                errors.push(`${parkName}: Events table DELETE not allowed - RLS policy needed`);
                continue;
              }
            }

            // Update events in database (only special ticketed events)
            let eventUpdateCount = 0;

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
                    if (eventError.message.includes('row-level security')) {
                      errors.push(`${parkName}: Events table INSERT not allowed - RLS policy needed`);
                      break; // Stop trying more events for this park
                    } else {
                      errors.push(`${parkName} event ${eventDate}: ${eventError.message}`);
                    }
                  } else {
                    eventUpdateCount++;
                  }
                } catch (networkError) {
                  errors.push(`${parkName} event ${eventDate}: Network error - ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`);
                }
              } catch (error) {
                errors.push(`${parkName} event processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }

          }

          // Clean up old schedules first (older than 30 days)
          const scheduleCleanupDate = new Date();
          scheduleCleanupDate.setDate(scheduleCleanupDate.getDate() - 30);
          const scheduleCleanupDateStr = scheduleCleanupDate.toISOString().split('T')[0]; // YYYY-MM-DD format

          const { error: scheduleCleanupError } = await supabase
            .from('live_park_schedules')
            .delete()
            .eq('park_id', parkName)
            .lt('schedule_date', scheduleCleanupDateStr);

          if (scheduleCleanupError) {
            if (scheduleCleanupError.message.includes('row-level security')) {
              errors.push(`${parkName}: Schedules table DELETE not allowed - RLS policy needed`);
              break;
            }
          }

          // Update park schedules in database (regular operating hours)
          let scheduleUpdateCount = 0;
          const scheduleData_filtered = scheduleData.schedule?.filter((item: any) =>
            item.type === 'OPERATING' && item.date && (item.openingTime || item.closingTime)
          ) || [];

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
                  errors.push(`${parkName} schedule ${scheduleDate}: ${scheduleError.message}`);
                } else {
                  scheduleUpdateCount++;
                }
              } catch (networkError) {
                errors.push(`${parkName} schedule ${scheduleDate}: Network error - ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`);
              }
            } catch (error) {
              errors.push(`${parkName} schedule processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }

          // Only increment success if no errors occurred for this park
          if (errors.length === 0) {
            successCount++;
          }
        } catch (error) {
          const errorMsg = `${parkName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
        }
      }

      // Show results
      // Now sync weather data
      console.log('🌤️ Syncing weather data...');
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
          throw new Error('Weather sync requires Supabase service role key');
        }

        const weatherResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-weather`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
        });

        const weatherResult = await weatherResponse.json();

        if (weatherResponse.ok) {
          console.log('✅ Weather data synced successfully:', weatherResult);
        } else {
          console.warn('⚠️ Weather sync failed:', weatherResult);
          errors.push(`Weather sync: ${weatherResult.details || weatherResult.error || 'Unknown error'}`);
        }
      } catch (weatherError) {
        console.warn('⚠️ Weather sync error:', weatherError);
        errors.push(`Weather sync: ${weatherError instanceof Error ? weatherError.message : 'Unknown error'}`);
      }

      // Show results
      const weatherNote = errors.some(e => e.includes('Weather')) ?
        '\n\n⚠️ Weather data sync had issues (check console)' :
        '\n• Weather forecasts';

      if (successCount === Object.keys(parkIds).length) {
        alert(`✅ Database sync successful!\n\nUpdated live data for all ${successCount} parks:\n• Attractions & wait times\n• Park status & info\n• Special ticketed events\n• Daily park schedules with EE/EEH${weatherNote}`);
      } else if (successCount > 0) {
        alert(`⚠️ Partial success: Updated ${successCount}/${Object.keys(parkIds).length} parks in database.\n\nErrors:\n${errors.join('\n')}`);
      } else {
        throw new Error(`Failed to update any parks:\n${errors.join('\n')}`);
      }

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
          title="Refresh live database with current park data, attraction wait times, and weather forecasts"
        >
          {isRefreshingParks ? (
            <Loader2 className="h-4 w-4 animate-spin text-sea" />
          ) : (
            <RefreshCw className="h-4 w-4 text-sea" />
          )}
        </button>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 text-ink-light hover:text-ink transition-colors rounded-md hover:bg-surface-dark/50"
          >
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">
              {authState.user.fullName || authState.user.email}
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
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
                  {isRefreshingParks ? 'Updating Database...' : 'Sync Live Data & Weather'}
                </button>
                
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-light hover:text-ink hover:bg-surface rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSigningOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {isSigningOut ? 'Saving & Signing Out...' : 'Sign Out'}
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