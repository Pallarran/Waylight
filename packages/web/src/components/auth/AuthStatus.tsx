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
          console.log(`Fetching data for ${parkName}...`);
          const response = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/live`);

          if (!response.ok) {
            throw new Error(`Failed to fetch ${parkName}: HTTP ${response.status}`);
          }

          const data = await response.json();
          const attractionsData = data.liveData?.filter((item: any) => item.entityType === 'ATTRACTION') || [];

          console.log(`✅ Successfully fetched data for ${parkName}:`, {
            name: data.name,
            status: data.status,
            attractionsCount: attractionsData.length
          });

          // Update park status in database
          const { error: parkError } = await supabase.from('live_parks').upsert({
            park_id: parkName,
            external_id: parkId,
            name: data.name || parkName,
            status: data.status === 'OPERATING' ? 'operating' : 'closed',
            regular_open: '09:00',  // Default, would need to parse from schedule
            regular_close: '22:00', // Default, would need to parse from schedule
            early_entry_open: null,
            extended_evening_close: null,
            crowd_level: null,
            last_updated: new Date().toISOString()
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
            });

            if (attractionError) {
              console.error(`❌ Failed to update attraction ${attraction.name}:`, attractionError);
            } else {
              attractionUpdateCount++;
            }
          }

          console.log(`✅ Updated ${attractionUpdateCount}/${attractionsData.length} attractions for ${parkName}`);
          successCount++;
        } catch (error) {
          const errorMsg = `${parkName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ Failed to process ${parkName}:`, error);
        }
      }

      // Show results
      if (successCount === Object.keys(parkIds).length) {
        alert(`✅ Park hours refreshed and database updated successfully!\n\nUpdated data for all ${successCount} parks and their attractions.`);
      } else if (successCount > 0) {
        alert(`⚠️ Partial success: Updated ${successCount}/${Object.keys(parkIds).length} parks in database.\n\nErrors:\n${errors.join('\n')}`);
      } else {
        throw new Error(`Failed to update any parks:\n${errors.join('\n')}`);
      }

      console.log(`✅ Park refresh and database update completed: ${successCount}/${Object.keys(parkIds).length} parks updated`);
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
          title="Refresh park hours"
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
                  {isRefreshingParks ? 'Refreshing...' : 'Refresh Park Hours'}
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