import { create } from 'zustand';
import type { Trip, TripDay, ItineraryItem, DayType } from '../types';
import { DatabaseService } from '../services/database';
import { createTrip } from '../utils/trip';
import { syncService, authService, type SyncStatus, type AuthState } from '@waylight/shared';

interface SimpleTripState {
  trips: Trip[];
  activeTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  isSyncing: boolean;
  
  // Trip management
  loadTrips: (skipSync?: boolean) => Promise<void>;
  createNewTrip: (name: string, startDate: string, endDate: string) => Promise<Trip>;
  setActiveTrip: (tripId: string | null) => void;
  deleteTripById: (tripId: string) => Promise<void>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  
  // Sync management
  syncTrips: () => Promise<void>;
  initializeSync: () => void;
  startPeriodicSync: () => void;
  stopPeriodicSync: () => void;
  
  // Day management
  addDay: (tripId: string, date: string, dayType?: DayType) => Promise<TripDay>;
  updateDay: (tripId: string, dayId: string, updates: Partial<TripDay>) => Promise<void>;
  deleteDay: (tripId: string, dayId: string) => Promise<void>;
  
  // Item management
  addItem: (tripId: string, dayId: string, item: Omit<ItineraryItem, 'id'>) => Promise<ItineraryItem>;
  updateItem: (tripId: string, dayId: string, itemId: string, updates: Partial<ItineraryItem>) => Promise<void>;
  deleteItem: (tripId: string, dayId: string, itemId: string) => Promise<void>;
  reorderItems: (tripId: string, dayId: string, fromIndex: number, toIndex: number) => Promise<void>;
  
  // Utility
  getTripById: (tripId: string) => Trip | undefined;
  clearError: () => void;
  clearSuccess: () => void;
  showSuccess: (message: string) => void;
  clearAllData: () => void;
}


const useSimpleTripStore = create<SimpleTripState>((set, get) => ({
  trips: [],
  activeTrip: null,
  isLoading: false,
  error: null,
  successMessage: null,
  isSyncing: false,
  
  initializeSync: () => {
    // Set up sync service callbacks
    syncService.setLocalDataCallbacks(
      () => DatabaseService.getTrips(),
      async (trips) => {
        // Update local trips when sync occurs
        await DatabaseService.clearAllData();
        for (const trip of trips) {
          await DatabaseService.createTrip(trip);
        }
        // Update the store with synced trips without triggering more syncs
        set({ trips });
      }
    );

    // Listen for sync status changes
    syncService.subscribe((status: SyncStatus) => {
      set({ isSyncing: status.syncing });
      if (status.error) {
        set({ error: status.error });
      }
    });

    // Auto-sync when user authenticates and start periodic sync
    authService.subscribe(async (authState: AuthState) => {
      if (authState.user && !authState.loading) {
        get().syncTrips();
        get().startPeriodicSync();
      } else if (!authState.loading) {
        // User signed out - sync any pending changes before clearing data
        console.log('🔄 User signing out, syncing pending changes...');
        get().stopPeriodicSync();

        try {
          // Sync all local trips to cloud before clearing (with timeout)
          await Promise.race([
            get().syncTrips(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Sync timeout')), 10000)
            )
          ]);
          console.log('✅ Final sync completed before logout');
        } catch (error) {
          console.warn('⚠️ Final sync failed before logout:', error);
          // Continue with clearing even if sync fails to avoid blocking logout
        }

        // Clear local data after sync attempt
        get().clearAllData();

        // Force immediate UI update by resetting all state
        set({
          trips: [],
          activeTrip: null,
          isLoading: false,
          error: null,
          successMessage: null,
          isSyncing: false
        });

        console.log('🧹 Local data and UI state cleared after logout');
      }
    });
  },

  startPeriodicSync: () => {
    syncService.startPeriodicSync(30); // Sync every 30 minutes
  },

  stopPeriodicSync: () => {
    syncService.stopPeriodicSync();
  },

  syncTrips: async () => {
    try {
      await syncService.syncTrips();
      // Don't reload trips here to avoid infinite loop
      // The sync service callback will update the store with synced trips
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Sync failed',
      });
    }
  },

  loadTrips: async (skipSync = false) => {
    set({ isLoading: true, error: null });
    try {
      // Check if user is authenticated first
      const authState = authService.getState();
      if (!authState.user && !authState.loading) {
        // User is not authenticated, don't load any trips
        set({ trips: [], isLoading: false });
        return;
      }

      const trips = await DatabaseService.getTrips();
      set({ trips, isLoading: false });

      // Only auto-sync on initial load, not on subsequent loads
      if (!skipSync) {
        if (authState.user && !authState.loading && navigator.onLine) {
          // Don't await sync to avoid blocking the UI
          get().syncTrips().catch(console.error);
        }
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load trips',
        isLoading: false
      });
    }
  },
  
  createNewTrip: async (name, startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const newTrip = createTrip(name, startDate, endDate);
      await DatabaseService.createTrip(newTrip);
      
      set((state) => ({
        trips: [newTrip, ...state.trips],
        activeTrip: newTrip,
        isLoading: false,
        successMessage: "Trip created — you're glowing!"
      }));
      
      // Sync to cloud
      const authState = authService.getState();
      if (authState.user && !authState.loading) {
        syncService.uploadTrip(newTrip).catch(console.error);
      }
      
      return newTrip;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create trip',
        isLoading: false 
      });
      throw error;
    }
  },
  
  setActiveTrip: (tripId) => {
    const trip = tripId ? get().getTripById(tripId) : null;
    set({ activeTrip: trip });
  },
  
  deleteTripById: async (tripId) => {
    set({ error: null });
    try {
      await DatabaseService.deleteTrip(tripId);
      set((state) => ({
        trips: state.trips.filter(trip => trip.id !== tripId),
        activeTrip: state.activeTrip?.id === tripId ? null : state.activeTrip
      }));
      
      // Sync deletion to cloud
      const authState = authService.getState();
      if (authState.user && !authState.loading) {
        syncService.deleteTrip(tripId).catch(console.error);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete trip' });
    }
  },

  updateTrip: async (tripId, updates) => {
    set({ error: null });
    try {
      const updatedData = { ...updates, updatedAt: new Date().toISOString() };
      await DatabaseService.updateTrip(tripId, updatedData);
      set((state) => ({
        trips: state.trips.map(trip => 
          trip.id === tripId ? { ...trip, ...updatedData } : trip
        ),
        activeTrip: state.activeTrip?.id === tripId 
          ? { ...state.activeTrip, ...updatedData } 
          : state.activeTrip
      }));
      
      // Sync update to cloud
      const authState = authService.getState();
      if (authState.user && !authState.loading) {
        const updatedTrip = get().getTripById(tripId);
        if (updatedTrip) {
          syncService.uploadTrip(updatedTrip).catch(console.error);
        }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update trip' });
    }
  },

  // Day management methods
  addDay: async (tripId, date, dayType) => {
    set({ error: null });
    try {
      const newDay = await DatabaseService.addDay(tripId, date, dayType);
      set((state) => ({
        trips: state.trips.map(trip => 
          trip.id === tripId 
            ? { ...trip, days: [...trip.days, newDay], updatedAt: new Date().toISOString() }
            : trip
        ),
        activeTrip: state.activeTrip?.id === tripId
          ? { ...state.activeTrip, days: [...state.activeTrip.days, newDay], updatedAt: new Date().toISOString() }
          : state.activeTrip
      }));
      
      // Sync update to cloud
      const authState = authService.getState();
      if (authState.user && !authState.loading) {
        const updatedTrip = get().getTripById(tripId);
        if (updatedTrip) {
          syncService.uploadTrip(updatedTrip).catch(console.error);
        }
      }
      
      return newDay;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add day' });
      throw error;
    }
  },

  updateDay: async (tripId, dayId, updates) => {
    set({ error: null });
    try {
      await DatabaseService.updateDay(tripId, dayId, updates);
      set((state) => ({
        trips: state.trips.map(trip => 
          trip.id === tripId 
            ? { 
                ...trip, 
                days: trip.days.map(day => 
                  day.id === dayId ? { ...day, ...updates } : day
                )
              }
            : trip
        ),
        activeTrip: state.activeTrip?.id === tripId
          ? { 
              ...state.activeTrip, 
              days: state.activeTrip.days.map(day => 
                day.id === dayId ? { ...day, ...updates } : day
              )
            }
          : state.activeTrip
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update day' });
    }
  },

  deleteDay: async (tripId, dayId) => {
    set({ error: null });
    try {
      await DatabaseService.deleteDay(tripId, dayId);
      set((state) => ({
        trips: state.trips.map(trip => 
          trip.id === tripId 
            ? { ...trip, days: trip.days.filter(day => day.id !== dayId) }
            : trip
        ),
        activeTrip: state.activeTrip?.id === tripId
          ? { ...state.activeTrip, days: state.activeTrip.days.filter(day => day.id !== dayId) }
          : state.activeTrip
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete day' });
    }
  },

  // Item management methods
  addItem: async (tripId, dayId, item) => {
    set({ error: null });
    try {
      const newItem = await DatabaseService.addItem(tripId, dayId, item);
      set((state) => ({
        trips: state.trips.map(trip => 
          trip.id === tripId 
            ? { 
                ...trip, 
                days: trip.days.map(day => 
                  day.id === dayId 
                    ? { ...day, items: [...day.items, newItem] }
                    : day
                )
              }
            : trip
        ),
        activeTrip: state.activeTrip?.id === tripId
          ? { 
              ...state.activeTrip, 
              days: state.activeTrip.days.map(day => 
                day.id === dayId 
                  ? { ...day, items: [...day.items, newItem] }
                  : day
              )
            }
          : state.activeTrip
      }));
      return newItem;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add item' });
      throw error;
    }
  },

  updateItem: async (tripId, dayId, itemId, updates) => {
    set({ error: null });
    try {
      await DatabaseService.updateItem(tripId, dayId, itemId, updates);
      set((state) => ({
        trips: state.trips.map(trip => 
          trip.id === tripId 
            ? { 
                ...trip, 
                days: trip.days.map(day => 
                  day.id === dayId 
                    ? { 
                        ...day, 
                        items: day.items.map(item => 
                          item.id === itemId ? { ...item, ...updates } : item
                        )
                      }
                    : day
                )
              }
            : trip
        ),
        activeTrip: state.activeTrip?.id === tripId
          ? { 
              ...state.activeTrip, 
              days: state.activeTrip.days.map(day => 
                day.id === dayId 
                  ? { 
                      ...day, 
                      items: day.items.map(item => 
                        item.id === itemId ? { ...item, ...updates } : item
                      )
                    }
                  : day
              )
            }
          : state.activeTrip
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update item' });
    }
  },

  deleteItem: async (tripId, dayId, itemId) => {
    set({ error: null });
    try {
      await DatabaseService.deleteItem(tripId, dayId, itemId);
      set((state) => ({
        trips: state.trips.map(trip => 
          trip.id === tripId 
            ? { 
                ...trip, 
                days: trip.days.map(day => 
                  day.id === dayId 
                    ? { ...day, items: day.items.filter(item => item.id !== itemId) }
                    : day
                )
              }
            : trip
        ),
        activeTrip: state.activeTrip?.id === tripId
          ? { 
              ...state.activeTrip, 
              days: state.activeTrip.days.map(day => 
                day.id === dayId 
                  ? { ...day, items: day.items.filter(item => item.id !== itemId) }
                  : day
              )
            }
          : state.activeTrip
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete item' });
    }
  },

  reorderItems: async (tripId, dayId, fromIndex, toIndex) => {
    set({ error: null });
    try {
      await DatabaseService.reorderItems(tripId, dayId, fromIndex, toIndex);
      set((state) => {
        const reorderArray = (items: ItineraryItem[]) => {
          const result = [...items];
          const removed = result[fromIndex];
          if (!removed) {
            throw new Error('Item not found at index');
          }
          result.splice(fromIndex, 1);
          result.splice(toIndex, 0, removed);
          return result;
        };

        return {
          trips: state.trips.map(trip => 
            trip.id === tripId 
              ? { 
                  ...trip, 
                  days: trip.days.map(day => 
                    day.id === dayId 
                      ? { ...day, items: reorderArray(day.items) }
                      : day
                  )
                }
              : trip
          ),
          activeTrip: state.activeTrip?.id === tripId
            ? { 
                ...state.activeTrip, 
                days: state.activeTrip.days.map(day => 
                  day.id === dayId 
                    ? { ...day, items: reorderArray(day.items) }
                    : day
                )
              }
            : state.activeTrip
        };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to reorder items' });
    }
  },
  
  getTripById: (tripId) => {
    return get().trips.find(trip => trip.id === tripId);
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  clearSuccess: () => {
    set({ successMessage: null });
  },
  
  showSuccess: (message) => {
    set({ successMessage: message });
    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      set({ successMessage: null });
    }, 3000);
  },

  clearAllData: () => {
    // Clear local IndexedDB data
    DatabaseService.clearAllData().catch(console.error);
    // Clear store state
    set({
      trips: [],
      activeTrip: null,
      error: null,
      successMessage: null,
      isLoading: false
    });
  }
}));

export default useSimpleTripStore;