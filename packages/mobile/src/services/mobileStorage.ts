import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, TripDay, ItineraryItem } from '@waylight/shared';

interface StorageData {
  trips: Trip[];
  activeTrip: Trip | null;
}

const STORAGE_KEYS = {
  TRIPS: 'waylight_trips',
  ACTIVE_TRIP: 'waylight_active_trip',
} as const;

export class MobileStorageService {
  private static instance: MobileStorageService;
  
  static getInstance(): MobileStorageService {
    if (!MobileStorageService.instance) {
      MobileStorageService.instance = new MobileStorageService();
    }
    return MobileStorageService.instance;
  }

  // Trip CRUD operations
  async getAllTrips(): Promise<Trip[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRIPS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading trips:', error);
      return [];
    }
  }

  async saveTrips(trips: Trip[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
    } catch (error) {
      console.error('Error saving trips:', error);
      throw new Error('Failed to save trips');
    }
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    const trips = await this.getAllTrips();
    return trips.find(trip => trip.id === tripId) || null;
  }

  async saveTrip(trip: Trip): Promise<void> {
    try {
      const trips = await this.getAllTrips();
      const existingIndex = trips.findIndex(t => t.id === trip.id);
      
      if (existingIndex >= 0) {
        trips[existingIndex] = trip;
      } else {
        trips.push(trip);
      }
      
      await this.saveTrips(trips);
    } catch (error) {
      console.error('Error saving trip:', error);
      throw new Error('Failed to save trip to storage');
    }
  }

  async deleteTrip(tripId: string): Promise<void> {
    const trips = await this.getAllTrips();
    const filteredTrips = trips.filter(trip => trip.id !== tripId);
    await this.saveTrips(filteredTrips);
  }

  // Active trip management
  async getActiveTrip(): Promise<Trip | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_TRIP);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading active trip:', error);
      return null;
    }
  }

  async setActiveTrip(trip: Trip | null): Promise<void> {
    try {
      if (trip) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_TRIP, JSON.stringify(trip));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_TRIP);
      }
    } catch (error) {
      console.error('Error setting active trip:', error);
      throw new Error('Failed to set active trip');
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.TRIPS, STORAGE_KEYS.ACTIVE_TRIP]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
    }
  }

  async exportData(): Promise<StorageData> {
    return {
      trips: await this.getAllTrips(),
      activeTrip: await this.getActiveTrip(),
    };
  }

  async importData(data: StorageData): Promise<void> {
    await this.saveTrips(data.trips);
    await this.setActiveTrip(data.activeTrip);
  }
}