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

  const handleRefreshParks = async () => {
    if (isRefreshingParks) return;

    setIsRefreshingParks(true);
    try {
      console.log('🔧 Refreshing park hours from ThemeParks.wiki...');

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
          const liveResponse = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/live`);
          if (!liveResponse.ok) {
            throw new Error(`Failed to fetch live data for ${parkName}: HTTP ${liveResponse.status}`);
          }
          const liveData = await liveResponse.json();

          console.log(`Fetching schedule data for ${parkName}...`);
          const scheduleResponse = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule`);
          if (!scheduleResponse.ok) {
            throw new Error(`Failed to fetch schedule data for ${parkName}: HTTP ${scheduleResponse.status}`);
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

          // Update entertainment in database
          let entertainmentUpdateCount = 0;
          for (const entertainment of entertainmentData) {
            // Map status from API to database format
            let dbStatus: 'operating' | 'cancelled' | 'delayed' = 'operating';
            if (entertainment.status === 'CLOSED' || entertainment.status === 'CANCELLED') {
              dbStatus = 'cancelled';
            } else if (entertainment.status === 'DELAYED') {
              dbStatus = 'delayed';
            }

            // Extract show times
            const showTimes = entertainment.showtimes?.map((show: any) => {
              const startTime = new Date(show.startTime).toLocaleTimeString('en-US', {
                hour12: false,
                timeZone: liveData.timezone || 'America/New_York'
              });
              return startTime;
            }) || [];

            // Find next show time
            const nextShow = entertainment.showtimes?.find((show: any) =>
              new Date(show.startTime) > new Date()
            );
            const nextShowTime = nextShow ? new Date(nextShow.startTime).toISOString() : null;

            const { error: entertainmentError } = await supabase.from('live_entertainment').upsert({
              park_id: parkName,
              external_id: entertainment.id,
              name: entertainment.name,
              show_times: showTimes,
              status: dbStatus,
              next_show_time: nextShowTime,
              last_updated: new Date().toISOString()
            }, {
              onConflict: 'park_id,external_id'
            });

            if (entertainmentError) {
              console.error(`❌ Failed to update entertainment ${entertainment.name}:`, entertainmentError);
            } else {
              entertainmentUpdateCount++;
            }
          }

          console.log(`✅ Updated ${entertainmentUpdateCount}/${entertainmentData.length} entertainment shows for ${parkName}`);

          // Update park schedules in database
          let scheduleUpdateCount = 0;
          for (const scheduleItem of scheduleData.schedule || []) {
            // Only process OPERATING type schedules for regular hours
            if (scheduleItem.type === 'OPERATING') {
              const openTime = scheduleItem.openingTime ?
                new Date(scheduleItem.openingTime).toLocaleTimeString('en-US', {
                  hour12: false,
                  timeZone: scheduleData.timezone || 'America/New_York'
                }).slice(0, 5) : null;

              const closeTime = scheduleItem.closingTime ?
                new Date(scheduleItem.closingTime).toLocaleTimeString('en-US', {
                  hour12: false,
                  timeZone: scheduleData.timezone || 'America/New_York'
                }).slice(0, 5) : null;

              const { error: scheduleError } = await supabase.from('live_park_schedules').upsert({
                park_id: parkName,
                schedule_date: scheduleItem.date,
                regular_open: openTime,
                regular_close: closeTime,
                early_entry_open: null, // Would need additional parsing
                extended_evening_close: null, // Would need additional parsing
                data_source: 'themeparks.wiki',
                is_estimated: false,
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'park_id,schedule_date'
              });

              if (scheduleError) {
                console.error(`❌ Failed to update schedule for ${parkName} on ${scheduleItem.date}:`, scheduleError);
              } else {
                scheduleUpdateCount++;
              }
            }

            // Update park events for special events
            if (scheduleItem.type === 'TICKETED_EVENT' || scheduleItem.type === 'INFO') {
              const eventOpen = scheduleItem.openingTime ?
                new Date(scheduleItem.openingTime).toLocaleTimeString('en-US', {
                  hour12: false,
                  timeZone: scheduleData.timezone || 'America/New_York'
                }) : null;

              const eventClose = scheduleItem.closingTime ?
                new Date(scheduleItem.closingTime).toLocaleTimeString('en-US', {
                  hour12: false,
                  timeZone: scheduleData.timezone || 'America/New_York'
                }) : null;

              const { error: eventError } = await supabase.from('live_park_events').upsert({
                park_id: parkName,
                event_date: scheduleItem.date,
                event_name: scheduleItem.description || 'Special Event',
                event_type: scheduleItem.type,
                event_open: eventOpen,
                event_close: eventClose,
                description: scheduleItem.description,
                data_source: 'themeparks.wiki',
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'park_id,event_date,event_name'
              });

              if (eventError) {
                console.error(`❌ Failed to update event for ${parkName} on ${scheduleItem.date}:`, eventError);
              }
            }
          }

          console.log(`✅ Updated ${scheduleUpdateCount} schedule entries for ${parkName}`);
          successCount++;
        } catch (error) {
          const errorMsg = `${parkName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ Failed to process ${parkName}:`, error);
        }
      }

      // Show results
      if (successCount === Object.keys(parkIds).length) {
        alert(`✅ Complete park data refresh successful!\n\nUpdated all ${successCount} parks with:\n• Attractions & wait times\n• Entertainment shows & schedules  \n• Park schedules & hours\n• Special events`);
      } else if (successCount > 0) {
        alert(`⚠️ Partial success: Updated ${successCount}/${Object.keys(parkIds).length} parks in database.\n\nErrors:\n${errors.join('\n')}`);
      } else {
        throw new Error(`Failed to update any parks:\n${errors.join('\n')}`);
      }

      console.log(`✅ Complete park data refresh completed: ${successCount}/${Object.keys(parkIds).length} parks updated with attractions, entertainment, schedules, and events`);
    } catch (error) {
      console.error('Failed to refresh park hours:', error);
      alert(`❌ Failed to refresh park hours and update database.\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
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
          title="Refresh park data (attractions, entertainment, schedules, events)"
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
                  {isRefreshingParks ? 'Refreshing...' : 'Refresh Park Data'}
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