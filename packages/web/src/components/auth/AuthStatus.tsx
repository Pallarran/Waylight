import { useState, useEffect } from 'react';
import { LogIn, LogOut, User, RefreshCw, Loader2 } from 'lucide-react';
import { authService, syncService, type AuthState, type SyncStatus } from '@waylight/shared';
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
      // Check if we're in development mode (Vite dev server doesn't support API routes)
      const isDevelopment = import.meta.env.DEV;

      if (isDevelopment) {
        // In development, simulate the refresh and show user feedback
        console.log('🔧 Development mode: API routes not available in Vite dev server');
        console.log('💡 To manually refresh park data, run: node scripts/sync-parks.js --days 7');

        // Simulate a short delay to show the loading state
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show user-friendly message
        alert('Development mode: API refresh not available.\n\nTo refresh park data manually, run:\nnode scripts/sync-parks.js --days 7\n\nThis button will work in production deployment.');
        return;
      }

      // Production path - call the API endpoint
      const response = await fetch('/api/manual-sync?key=test-key-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Park hours refresh completed:', result);

      // Show success message
      alert('Park hours refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh park hours:', error);
      alert('Failed to refresh park hours. Please try again.');
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
                    Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
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