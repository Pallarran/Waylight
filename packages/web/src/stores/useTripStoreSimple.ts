import { create } from 'zustand';
import type { Trip, TripDay, ItineraryItem } from '../types';
import { DatabaseService } from '../services/database';
import { createTrip } from '../utils/trip';

interface SimpleTripState {
  trips: Trip[];
  activeTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  
  // Trip management
  loadTrips: () => Promise<void>;
  createNewTrip: (name: string, startDate: string, endDate: string) => Promise<Trip>;
  setActiveTrip: (tripId: string | null) => void;
  deleteTripById: (tripId: string) => Promise<void>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  
  // Day management
  addDay: (tripId: string, date: string) => Promise<TripDay>;
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
}

const useSimpleTripStore = create<SimpleTripState>((set, get) => ({
  trips: [],
  activeTrip: null,
  isLoading: false,
  error: null,
  
  loadTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const trips = await DatabaseService.getTrips();
      set({ trips, isLoading: false });
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
        isLoading: false
      }));
      
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
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete trip' });
    }
  },

  updateTrip: async (tripId, updates) => {
    set({ error: null });
    try {
      await DatabaseService.updateTrip(tripId, updates);
      set((state) => ({
        trips: state.trips.map(trip => 
          trip.id === tripId ? { ...trip, ...updates } : trip
        ),
        activeTrip: state.activeTrip?.id === tripId 
          ? { ...state.activeTrip, ...updates } 
          : state.activeTrip
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update trip' });
    }
  },

  // Day management methods
  addDay: async (tripId, date) => {
    set({ error: null });
    try {
      const newDay = await DatabaseService.addDay(tripId, date);
      set((state) => ({
        trips: state.trips.map(trip => 
          trip.id === tripId 
            ? { ...trip, days: [...trip.days, newDay] }
            : trip
        ),
        activeTrip: state.activeTrip?.id === tripId
          ? { ...state.activeTrip, days: [...state.activeTrip.days, newDay] }
          : state.activeTrip
      }));
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
  }
}));

export default useSimpleTripStore;