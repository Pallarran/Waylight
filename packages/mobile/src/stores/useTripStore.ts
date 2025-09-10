import { create } from 'zustand';
import type { Trip, TripDay, ItineraryItem } from '@waylight/shared';
import { createTrip } from '@waylight/shared';
import { MobileStorageService } from '../services/mobileStorage';

interface TripState {
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
  addDay: (tripId: string, date: string, parkId?: string) => Promise<TripDay>;
  updateDay: (tripId: string, dayId: string, updates: Partial<TripDay>) => Promise<void>;
  deleteDay: (tripId: string, dayId: string) => Promise<void>;
  
  // Item management
  addItem: (tripId: string, dayId: string, item: Omit<ItineraryItem, 'id'>) => Promise<ItineraryItem>;
  updateItem: (tripId: string, dayId: string, itemId: string, updates: Partial<ItineraryItem>) => Promise<void>;
  deleteItem: (tripId: string, dayId: string, itemId: string) => Promise<void>;
  reorderItems: (tripId: string, dayId: string, fromIndex: number, toIndex: number) => Promise<void>;
  
  // Utility
  clearError: () => void;
  exportTrip: (tripId: string) => Promise<string>;
}

export const useTripStore = create<TripState>((set, get) => {
  const storage = MobileStorageService.getInstance();

  return {
    trips: [],
    activeTrip: null,
    isLoading: false,
    error: null,

    loadTrips: async () => {
      try {
        set({ isLoading: true, error: null });
        
        const trips = await storage.getAllTrips();
        const activeTrip = await storage.getActiveTrip();
        
        set({ trips, activeTrip, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to load trips', isLoading: false });
      }
    },

    createNewTrip: async (name: string, startDate: string, endDate: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const newTrip = createTrip(name, startDate, endDate);
        await storage.saveTrip(newTrip);
        
        const trips = [...get().trips, newTrip];
        set({ trips, isLoading: false });
        
        return newTrip;
      } catch (error) {
        console.error('Error creating trip:', error);
        set({ error: 'Failed to create trip', isLoading: false });
        throw error;
      }
    },

    setActiveTrip: (tripId: string | null) => {
      const trip = tripId ? get().trips.find(t => t.id === tripId) || null : null;
      storage.setActiveTrip(trip);
      set({ activeTrip: trip });
    },

    deleteTripById: async (tripId: string) => {
      try {
        set({ isLoading: true, error: null });
        
        await storage.deleteTrip(tripId);
        
        const trips = get().trips.filter(t => t.id !== tripId);
        const activeTrip = get().activeTrip?.id === tripId ? null : get().activeTrip;
        
        set({ trips, activeTrip, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to delete trip', isLoading: false });
      }
    },

    updateTrip: async (tripId: string, updates: Partial<Trip>) => {
      try {
        set({ isLoading: true, error: null });
        
        const trip = await storage.getTripById(tripId);
        if (!trip) throw new Error('Trip not found');
        
        const updatedTrip = { ...trip, ...updates };
        await storage.saveTrip(updatedTrip);
        
        const trips = get().trips.map(t => t.id === tripId ? updatedTrip : t);
        const activeTrip = get().activeTrip?.id === tripId ? updatedTrip : get().activeTrip;
        
        set({ trips, activeTrip, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to update trip', isLoading: false });
      }
    },

    addDay: async (tripId: string, date: string, parkId: string = 'magic-kingdom') => {
      try {
        set({ isLoading: true, error: null });
        
        const trip = await storage.getTripById(tripId);
        if (!trip) throw new Error('Trip not found');
        
        const newDay: TripDay = {
          id: `day_${Date.now()}`,
          date: new Date(date),
          parkId,
          items: [],
          notes: ''
        };
        
        const updatedTrip = {
          ...trip,
          days: [...trip.days, newDay]
        };
        
        await storage.saveTrip(updatedTrip);
        
        const trips = get().trips.map(t => t.id === tripId ? updatedTrip : t);
        const activeTrip = get().activeTrip?.id === tripId ? updatedTrip : get().activeTrip;
        
        set({ trips, activeTrip, isLoading: false });
        return newDay;
      } catch (error) {
        set({ error: 'Failed to add day', isLoading: false });
        throw error;
      }
    },

    updateDay: async (tripId: string, dayId: string, updates: Partial<TripDay>) => {
      try {
        set({ isLoading: true, error: null });
        
        const trip = await storage.getTripById(tripId);
        if (!trip) throw new Error('Trip not found');
        
        const updatedTrip = {
          ...trip,
          days: trip.days.map(day => 
            day.id === dayId ? { ...day, ...updates } : day
          )
        };
        
        await storage.saveTrip(updatedTrip);
        
        const trips = get().trips.map(t => t.id === tripId ? updatedTrip : t);
        const activeTrip = get().activeTrip?.id === tripId ? updatedTrip : get().activeTrip;
        
        set({ trips, activeTrip, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to update day', isLoading: false });
      }
    },

    deleteDay: async (tripId: string, dayId: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const trip = await storage.getTripById(tripId);
        if (!trip) throw new Error('Trip not found');
        
        const updatedTrip = {
          ...trip,
          days: trip.days.filter(day => day.id !== dayId)
        };
        
        await storage.saveTrip(updatedTrip);
        
        const trips = get().trips.map(t => t.id === tripId ? updatedTrip : t);
        const activeTrip = get().activeTrip?.id === tripId ? updatedTrip : get().activeTrip;
        
        set({ trips, activeTrip, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to delete day', isLoading: false });
      }
    },

    addItem: async (tripId: string, dayId: string, item: Omit<ItineraryItem, 'id'>) => {
      try {
        set({ isLoading: true, error: null });
        
        const trip = await storage.getTripById(tripId);
        if (!trip) throw new Error('Trip not found');
        
        const newItem: ItineraryItem = {
          ...item,
          id: `item_${Date.now()}`,
        };
        
        const updatedTrip = {
          ...trip,
          days: trip.days.map(day => 
            day.id === dayId 
              ? { ...day, items: [...day.items, newItem] }
              : day
          )
        };
        
        await storage.saveTrip(updatedTrip);
        
        const trips = get().trips.map(t => t.id === tripId ? updatedTrip : t);
        const activeTrip = get().activeTrip?.id === tripId ? updatedTrip : get().activeTrip;
        
        set({ trips, activeTrip, isLoading: false });
        return newItem;
      } catch (error) {
        set({ error: 'Failed to add item', isLoading: false });
        throw error;
      }
    },

    updateItem: async (tripId: string, dayId: string, itemId: string, updates: Partial<ItineraryItem>) => {
      try {
        set({ isLoading: true, error: null });
        
        const trip = await storage.getTripById(tripId);
        if (!trip) throw new Error('Trip not found');
        
        const updatedTrip = {
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
        };
        
        await storage.saveTrip(updatedTrip);
        
        const trips = get().trips.map(t => t.id === tripId ? updatedTrip : t);
        const activeTrip = get().activeTrip?.id === tripId ? updatedTrip : get().activeTrip;
        
        set({ trips, activeTrip, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to update item', isLoading: false });
      }
    },

    deleteItem: async (tripId: string, dayId: string, itemId: string) => {
      try {
        set({ isLoading: true, error: null });
        
        const trip = await storage.getTripById(tripId);
        if (!trip) throw new Error('Trip not found');
        
        const updatedTrip = {
          ...trip,
          days: trip.days.map(day => 
            day.id === dayId 
              ? { ...day, items: day.items.filter(item => item.id !== itemId) }
              : day
          )
        };
        
        await storage.saveTrip(updatedTrip);
        
        const trips = get().trips.map(t => t.id === tripId ? updatedTrip : t);
        const activeTrip = get().activeTrip?.id === tripId ? updatedTrip : get().activeTrip;
        
        set({ trips, activeTrip, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to delete item', isLoading: false });
      }
    },

    reorderItems: async (tripId: string, dayId: string, fromIndex: number, toIndex: number) => {
      try {
        set({ isLoading: true, error: null });
        
        const trip = await storage.getTripById(tripId);
        if (!trip) throw new Error('Trip not found');
        
        const updatedTrip = {
          ...trip,
          days: trip.days.map(day => {
            if (day.id !== dayId) return day;
            
            const items = [...day.items];
            const [removed] = items.splice(fromIndex, 1);
            items.splice(toIndex, 0, removed);
            
            return { ...day, items };
          })
        };
        
        await storage.saveTrip(updatedTrip);
        
        const trips = get().trips.map(t => t.id === tripId ? updatedTrip : t);
        const activeTrip = get().activeTrip?.id === tripId ? updatedTrip : get().activeTrip;
        
        set({ trips, activeTrip, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to reorder items', isLoading: false });
      }
    },

    clearError: () => set({ error: null }),

    exportTrip: async (tripId: string) => {
      const trip = await storage.getTripById(tripId);
      if (!trip) throw new Error('Trip not found');
      return JSON.stringify(trip, null, 2);
    },
  };
});