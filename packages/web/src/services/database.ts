import Dexie, { Table } from 'dexie';
import type { Trip, TripDay, ItineraryItem } from '../types';

// Database interface for Dexie
export interface WaylightDB extends Dexie {
  trips: Table<Trip>;
  userPreferences: Table<UserPreferences>;
  favoriteAttractions: Table<FavoriteAttraction>;
}

export interface UserPreferences {
  id?: number;
  favoriteParkIds: string[];
  preferredParkingTime: number;
  includeChildFriendly: boolean;
  includeThrill: boolean;
  includeShowsAndEntertainment: boolean;
  accessibilityNeeds: {
    wheelchairAccessible: boolean;
    signLanguageInterpreted: boolean;
    audioDescription: boolean;
  };
  notificationSettings: {
    enableNotifications: boolean;
    reminderTime: string;
    dayBeforeReminder: boolean;
  };
  displaySettings: {
    compactView: boolean;
    showWaitTimes: boolean;
    showTips: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteAttraction {
  id?: number;
  attractionId: string;
  addedAt: string;
}

// Create database instance
export const db = new Dexie('WaylightDB') as WaylightDB;

// Define schemas
db.version(1).stores({
  trips: '&id, name, startDate, endDate, createdAt, updatedAt',
  userPreferences: '++id, createdAt, updatedAt',
  favoriteAttractions: '++id, attractionId, addedAt'
});

// Database helper functions
export class DatabaseService {
  // Trip operations
  static async createTrip(trip: Trip): Promise<Trip> {
    await db.trips.add(trip);
    return trip;
  }

  static async getTrips(): Promise<Trip[]> {
    return await db.trips.orderBy('createdAt').reverse().toArray();
  }

  static async getTrip(id: string): Promise<Trip | undefined> {
    return await db.trips.get(id);
  }

  static async updateTrip(id: string, changes: Partial<Trip>): Promise<void> {
    await db.trips.update(id, {
      ...changes,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteTrip(id: string): Promise<void> {
    await db.trips.delete(id);
  }

  // Day operations
  static async addDay(tripId: string, date: string): Promise<TripDay> {
    const trip = await db.trips.get(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const newDay: TripDay = {
      id: crypto.randomUUID(),
      date,
      items: []
    };

    const updatedTrip = {
      ...trip,
      days: [...trip.days, newDay],
      updatedAt: new Date().toISOString()
    };

    await db.trips.update(tripId, updatedTrip);
    return newDay;
  }

  static async updateDay(tripId: string, dayId: string, updates: Partial<TripDay>): Promise<void> {
    const trip = await db.trips.get(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const dayIndex = trip.days.findIndex(day => day.id === dayId);
    if (dayIndex === -1) {
      throw new Error('Day not found');
    }

    const updatedDays = [...trip.days];
    const currentDay = updatedDays[dayIndex];
    if (!currentDay) {
      throw new Error('Day not found in array');
    }
    updatedDays[dayIndex] = { ...currentDay, ...updates };

    await db.trips.update(tripId, {
      days: updatedDays,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteDay(tripId: string, dayId: string): Promise<void> {
    const trip = await db.trips.get(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const updatedDays = trip.days.filter(day => day.id !== dayId);

    await db.trips.update(tripId, {
      days: updatedDays,
      updatedAt: new Date().toISOString()
    });
  }

  // Item operations
  static async addItem(tripId: string, dayId: string, item: Omit<ItineraryItem, 'id'>): Promise<ItineraryItem> {
    const trip = await db.trips.get(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const dayIndex = trip.days.findIndex(day => day.id === dayId);
    if (dayIndex === -1) {
      throw new Error('Day not found');
    }

    const newItem: ItineraryItem = {
      ...item,
      id: crypto.randomUUID()
    };

    const updatedDays = [...trip.days];
    const currentDay = updatedDays[dayIndex];
    if (!currentDay) {
      throw new Error('Day not found in array');
    }
    updatedDays[dayIndex] = {
      ...currentDay,
      items: [...currentDay.items, newItem]
    };

    await db.trips.update(tripId, {
      days: updatedDays,
      updatedAt: new Date().toISOString()
    });

    return newItem;
  }

  static async updateItem(tripId: string, dayId: string, itemId: string, updates: Partial<ItineraryItem>): Promise<void> {
    const trip = await db.trips.get(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const dayIndex = trip.days.findIndex(day => day.id === dayId);
    if (dayIndex === -1) {
      throw new Error('Day not found');
    }

    const itemIndex = trip.days[dayIndex]!.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error('Item not found');
    }

    const updatedDays = [...trip.days];
    const currentDay = updatedDays[dayIndex];
    if (!currentDay) {
      throw new Error('Day not found in array');
    }
    const updatedItems = [...currentDay.items];
    const currentItem = updatedItems[itemIndex];
    if (!currentItem) {
      throw new Error('Item not found in array');
    }
    updatedItems[itemIndex] = { ...currentItem, ...updates };
    updatedDays[dayIndex] = { ...currentDay, items: updatedItems };

    await db.trips.update(tripId, {
      days: updatedDays,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteItem(tripId: string, dayId: string, itemId: string): Promise<void> {
    const trip = await db.trips.get(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const dayIndex = trip.days.findIndex(day => day.id === dayId);
    if (dayIndex === -1) {
      throw new Error('Day not found');
    }

    const updatedDays = [...trip.days];
    const currentDay = updatedDays[dayIndex];
    if (!currentDay) {
      throw new Error('Day not found in array');
    }
    updatedDays[dayIndex] = {
      ...currentDay,
      items: currentDay.items.filter(item => item.id !== itemId)
    };

    await db.trips.update(tripId, {
      days: updatedDays,
      updatedAt: new Date().toISOString()
    });
  }

  static async reorderItems(tripId: string, dayId: string, fromIndex: number, toIndex: number): Promise<void> {
    const trip = await db.trips.get(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const dayIndex = trip.days.findIndex(day => day.id === dayId);
    if (dayIndex === -1) {
      throw new Error('Day not found');
    }

    const updatedDays = [...trip.days];
    const currentDay = updatedDays[dayIndex];
    if (!currentDay) {
      throw new Error('Day not found in array');
    }
    const items = [...currentDay.items];
    const removed = items[fromIndex];
    if (!removed) {
      throw new Error('Item not found at index');
    }
    items.splice(fromIndex, 1);
    items.splice(toIndex, 0, removed);

    updatedDays[dayIndex] = { ...currentDay, items };

    await db.trips.update(tripId, {
      days: updatedDays,
      updatedAt: new Date().toISOString()
    });
  }

  // User preferences
  static async getUserPreferences(): Promise<UserPreferences | undefined> {
    const prefs = await db.userPreferences.orderBy('id').last();
    return prefs;
  }

  static async updateUserPreferences(preferences: Omit<UserPreferences, 'id'>): Promise<void> {
    const existing = await this.getUserPreferences();
    const now = new Date().toISOString();
    
    if (existing) {
      await db.userPreferences.update(existing.id!, {
        ...preferences,
        updatedAt: now
      });
    } else {
      await db.userPreferences.add({
        ...preferences,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  // Favorite attractions
  static async getFavoriteAttractions(): Promise<string[]> {
    const favorites = await db.favoriteAttractions.orderBy('addedAt').toArray();
    return favorites.map(f => f.attractionId);
  }

  static async addFavoriteAttraction(attractionId: string): Promise<void> {
    const existing = await db.favoriteAttractions.where('attractionId').equals(attractionId).first();
    if (!existing) {
      await db.favoriteAttractions.add({
        attractionId,
        addedAt: new Date().toISOString()
      });
    }
  }

  static async removeFavoriteAttraction(attractionId: string): Promise<void> {
    await db.favoriteAttractions.where('attractionId').equals(attractionId).delete();
  }

  static async isFavoriteAttraction(attractionId: string): Promise<boolean> {
    const favorite = await db.favoriteAttractions.where('attractionId').equals(attractionId).first();
    return !!favorite;
  }

  // Utility functions
  static async clearAllData(): Promise<void> {
    await Promise.all([
      db.trips.clear(),
      db.userPreferences.clear(),
      db.favoriteAttractions.clear()
    ]);
  }

  static async exportData(): Promise<{
    trips: Trip[];
    preferences: UserPreferences | undefined;
    favoriteAttractions: string[];
  }> {
    const [trips, preferences, favoriteAttractions] = await Promise.all([
      this.getTrips(),
      this.getUserPreferences(),
      this.getFavoriteAttractions()
    ]);

    return {
      trips,
      preferences,
      favoriteAttractions
    };
  }

  static async importData(data: {
    trips?: Trip[];
    preferences?: UserPreferences;
    favoriteAttractions?: string[];
  }): Promise<void> {
    // Clear existing data
    await this.clearAllData();

    // Import trips
    if (data.trips?.length) {
      await db.trips.bulkAdd(data.trips);
    }

    // Import preferences
    if (data.preferences) {
      const { id: _id, ...prefs } = data.preferences; // eslint-disable-line @typescript-eslint/no-unused-vars
      await this.updateUserPreferences(prefs);
    }

    // Import favorite attractions
    if (data.favoriteAttractions?.length) {
      const favorites = data.favoriteAttractions.map(attractionId => ({
        attractionId,
        addedAt: new Date().toISOString()
      }));
      await db.favoriteAttractions.bulkAdd(favorites);
    }
  }
}

// Initialize database
db.open().catch(err => {
  console.error('Failed to open database:', err);
});

export default db;