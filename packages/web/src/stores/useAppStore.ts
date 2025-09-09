import { create } from 'zustand';

interface AppState {
  // UI State
  isSidebarOpen: boolean;
  isOffline: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: Date | null;
  
  // Loading states
  isLoadingTrips: boolean;
  isLoadingAttractions: boolean;
  
  // Error handling
  error: string | null;
  successMessage: string | null;
  
  // Actions
  toggleSidebar: () => void;
  setOfflineStatus: (isOffline: boolean) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error') => void;
  updateLastSyncTime: () => void;
  
  // Loading actions
  setLoadingTrips: (loading: boolean) => void;
  setLoadingAttractions: (loading: boolean) => void;
  
  // Message actions
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  clearMessages: () => void;
}

const useAppStore = create<AppState>((set) => ({
  // Initial state
  isSidebarOpen: false,
  isOffline: false,
  syncStatus: 'idle',
  lastSyncTime: null,
  isLoadingTrips: false,
  isLoadingAttractions: false,
  error: null,
  successMessage: null,
  
  // UI Actions
  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },
  
  setOfflineStatus: (isOffline) => {
    set({ isOffline });
  },
  
  setSyncStatus: (status) => {
    set({ syncStatus: status });
  },
  
  updateLastSyncTime: () => {
    set({ lastSyncTime: new Date() });
  },
  
  // Loading Actions
  setLoadingTrips: (loading) => {
    set({ isLoadingTrips: loading });
  },
  
  setLoadingAttractions: (loading) => {
    set({ isLoadingAttractions: loading });
  },
  
  // Message Actions
  setError: (error) => {
    set({ error, successMessage: null });
    if (error) {
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        set((state) => state.error === error ? { error: null } : {});
      }, 5000);
    }
  },
  
  setSuccessMessage: (message) => {
    set({ successMessage: message, error: null });
    if (message) {
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        set((state) => state.successMessage === message ? { successMessage: null } : {});
      }, 3000);
    }
  },
  
  clearMessages: () => {
    set({ error: null, successMessage: null });
  },
}));

// Network status monitoring
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.getState().setOfflineStatus(false);
  });
  
  window.addEventListener('offline', () => {
    useAppStore.getState().setOfflineStatus(true);
  });
}

export default useAppStore;