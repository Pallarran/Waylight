import { useState, useEffect } from 'react';
import { LogIn, LogOut, User, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { authService, syncService, type AuthState, type SyncStatus } from '@waylight/shared';
import AuthModal from './AuthModal';

export default function AuthStatus() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const handleSync = () => {
    syncService.syncTrips();
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
        {/* Sync Status */}
        <button
          onClick={handleSync}
          disabled={syncStatus.syncing || !syncStatus.online}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={syncStatus.online ? 'Sync trips' : 'Offline'}
        >
          {syncStatus.syncing ? (
            <Loader2 className="h-4 w-4 animate-spin text-sea" />
          ) : syncStatus.online ? (
            <Cloud className="h-4 w-4 text-sea" />
          ) : (
            <CloudOff className="h-4 w-4 text-ink-light" />
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
                  onClick={handleSync}
                  disabled={syncStatus.syncing || !syncStatus.online}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-light hover:text-ink hover:bg-surface rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncStatus.syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Cloud className="h-4 w-4" />
                  )}
                  {syncStatus.syncing ? 'Syncing...' : 'Sync Trips'}
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