import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, type UserPreferences, type FavoriteAttraction } from '../database';
import { createTrip, addItemToDay } from '@waylight/shared';
import type { Trip } from '../../types';

describe('Database Integration Tests', () => {
  beforeEach(async () => {
    // Clear all data before each test
    await db.trips.clear();
    await db.userPreferences.clear();
    await db.favoriteAttractions.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.trips.clear();
    await db.userPreferences.clear();
    await db.favoriteAttractions.clear();
  });

  describe('Trip Storage Operations', () => {
    it('should create and retrieve a trip', async () => {
      const trip = createTrip('Disney World 2024', '2024-06-15', '2024-06-17');
      
      // Store trip
      await db.trips.add(trip);
      
      // Retrieve trip
      const retrievedTrip = await db.trips.get(trip.id);
      
      expect(retrievedTrip).toBeDefined();
      expect(retrievedTrip?.name).toBe('Disney World 2024');
      expect(retrievedTrip?.startDate).toBe('2024-06-15');
      expect(retrievedTrip?.endDate).toBe('2024-06-17');
      expect(retrievedTrip?.days).toHaveLength(3);
    });

    it('should update an existing trip', async () => {
      const trip = createTrip('Original Name', '2024-06-15', '2024-06-17');
      await db.trips.add(trip);
      
      // Update trip
      const updatedTrip = {
        ...trip,
        name: 'Updated Name',
        notes: 'Added some notes',
        updatedAt: new Date().toISOString()
      };
      
      await db.trips.put(updatedTrip);
      
      // Retrieve and verify
      const retrievedTrip = await db.trips.get(trip.id);
      expect(retrievedTrip?.name).toBe('Updated Name');
      expect(retrievedTrip?.notes).toBe('Added some notes');
      expect(retrievedTrip?.updatedAt).not.toBe(trip.updatedAt);
    });

    it('should delete a trip', async () => {
      const trip = createTrip('Test Trip', '2024-06-15', '2024-06-17');
      await db.trips.add(trip);
      
      // Verify trip exists
      let retrievedTrip = await db.trips.get(trip.id);
      expect(retrievedTrip).toBeDefined();
      
      // Delete trip
      await db.trips.delete(trip.id);
      
      // Verify trip is deleted
      retrievedTrip = await db.trips.get(trip.id);
      expect(retrievedTrip).toBeUndefined();
    });

    it('should retrieve all trips', async () => {
      const trip1 = createTrip('Trip 1', '2024-06-15', '2024-06-17');
      const trip2 = createTrip('Trip 2', '2024-07-01', '2024-07-05');
      const trip3 = createTrip('Trip 3', '2024-08-10', '2024-08-12');
      
      await db.trips.bulkAdd([trip1, trip2, trip3]);
      
      const allTrips = await db.trips.toArray();
      expect(allTrips).toHaveLength(3);
      expect(allTrips.map(t => t.name)).toContain('Trip 1');
      expect(allTrips.map(t => t.name)).toContain('Trip 2');
      expect(allTrips.map(t => t.name)).toContain('Trip 3');
    });

    it('should query trips by date range', async () => {
      const trip1 = createTrip('Summer Trip', '2024-06-15', '2024-06-17');
      const trip2 = createTrip('Fall Trip', '2024-09-01', '2024-09-05');
      const trip3 = createTrip('Winter Trip', '2024-12-20', '2024-12-25');
      
      await db.trips.bulkAdd([trip1, trip2, trip3]);
      
      // Query trips starting in 2024
      const trips2024 = await db.trips
        .where('startDate')
        .between('2024-01-01', '2024-12-31')
        .toArray();
      
      expect(trips2024).toHaveLength(3);
      
      // Query trips starting in summer
      const summerTrips = await db.trips
        .where('startDate')
        .between('2024-06-01', '2024-08-31')
        .toArray();
      
      expect(summerTrips).toHaveLength(2);
      expect(summerTrips.map(t => t.name)).toContain('Summer Trip');
      expect(summerTrips.map(t => t.name)).toContain('Fall Trip');
    });

    it('should handle complex trip with items', async () => {
      let trip = createTrip('Complex Trip', '2024-06-15', '2024-06-16');
      const dayId = trip.days[0].id;
      
      // Add items to the trip
      trip = addItemToDay(trip, dayId, 'space-mountain', {
        timeSlot: '10:00',
        duration: 45,
        notes: 'FastPass recommended'
      });
      
      trip = addItemToDay(trip, dayId, 'haunted-mansion', {
        timeSlot: '14:30',
        duration: 30
      });
      
      await db.trips.add(trip);
      
      const retrievedTrip = await db.trips.get(trip.id);
      
      expect(retrievedTrip).toBeDefined();
      expect(retrievedTrip?.days[0].items).toHaveLength(2);
      expect(retrievedTrip?.days[0].items[0].attractionId).toBe('space-mountain');
      expect(retrievedTrip?.days[0].items[0].timeSlot).toBe('10:00');
      expect(retrievedTrip?.days[0].items[0].notes).toBe('FastPass recommended');
      expect(retrievedTrip?.days[0].items[1].attractionId).toBe('haunted-mansion');
    });
  });

  describe('User Preferences Storage', () => {
    it('should create and retrieve user preferences', async () => {
      const preferences: UserPreferences = {
        favoriteParkIds: ['magic-kingdom', 'epcot'],
        preferredParkingTime: 60,
        includeChildFriendly: true,
        includeThrill: false,
        includeShowsAndEntertainment: true,
        accessibilityNeeds: {
          wheelchairAccessible: false,
          signLanguageInterpreted: false,
          audioDescription: false
        },
        notificationSettings: {
          enableNotifications: true,
          reminderTime: '08:00',
          dayBeforeReminder: true
        },
        displaySettings: {
          compactView: false,
          showWaitTimes: true,
          showTips: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const id = await db.userPreferences.add(preferences);
      const retrieved = await db.userPreferences.get(id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.favoriteParkIds).toEqual(['magic-kingdom', 'epcot']);
      expect(retrieved?.includeChildFriendly).toBe(true);
      expect(retrieved?.includeThrill).toBe(false);
      expect(retrieved?.notificationSettings.enableNotifications).toBe(true);
    });

    it('should update user preferences', async () => {
      const preferences: UserPreferences = {
        favoriteParkIds: ['magic-kingdom'],
        preferredParkingTime: 60,
        includeChildFriendly: true,
        includeThrill: false,
        includeShowsAndEntertainment: true,
        accessibilityNeeds: {
          wheelchairAccessible: false,
          signLanguageInterpreted: false,
          audioDescription: false
        },
        notificationSettings: {
          enableNotifications: false,
          reminderTime: '08:00',
          dayBeforeReminder: false
        },
        displaySettings: {
          compactView: false,
          showWaitTimes: true,
          showTips: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const id = await db.userPreferences.add(preferences);
      
      // Update preferences
      const updatedPreferences = {
        ...preferences,
        id,
        favoriteParkIds: ['magic-kingdom', 'epcot', 'hollywood-studios'],
        includeThrill: true,
        notificationSettings: {
          ...preferences.notificationSettings,
          enableNotifications: true
        },
        updatedAt: new Date().toISOString()
      };
      
      await db.userPreferences.put(updatedPreferences);
      
      const retrieved = await db.userPreferences.get(id);
      expect(retrieved?.favoriteParkIds).toHaveLength(3);
      expect(retrieved?.includeThrill).toBe(true);
      expect(retrieved?.notificationSettings.enableNotifications).toBe(true);
    });
  });

  describe('Favorite Attractions Storage', () => {
    it('should add and retrieve favorite attractions', async () => {
      const favorite1: FavoriteAttraction = {
        attractionId: 'space-mountain',
        addedAt: new Date().toISOString()
      };
      
      const favorite2: FavoriteAttraction = {
        attractionId: 'haunted-mansion',
        addedAt: new Date().toISOString()
      };
      
      await db.favoriteAttractions.bulkAdd([favorite1, favorite2]);
      
      const favorites = await db.favoriteAttractions.toArray();
      expect(favorites).toHaveLength(2);
      expect(favorites.map(f => f.attractionId)).toContain('space-mountain');
      expect(favorites.map(f => f.attractionId)).toContain('haunted-mansion');
    });

    it('should remove favorite attractions', async () => {
      const favorite: FavoriteAttraction = {
        attractionId: 'space-mountain',
        addedAt: new Date().toISOString()
      };
      
      const id = await db.favoriteAttractions.add(favorite);
      
      // Verify it exists
      let retrieved = await db.favoriteAttractions.get(id);
      expect(retrieved).toBeDefined();
      
      // Remove it
      await db.favoriteAttractions.delete(id);
      
      // Verify it's gone
      retrieved = await db.favoriteAttractions.get(id);
      expect(retrieved).toBeUndefined();
    });

    it('should find favorites by attraction ID', async () => {
      const favorites: FavoriteAttraction[] = [
        { attractionId: 'space-mountain', addedAt: '2024-01-01T00:00:00.000Z' },
        { attractionId: 'haunted-mansion', addedAt: '2024-01-02T00:00:00.000Z' },
        { attractionId: 'pirates-caribbean', addedAt: '2024-01-03T00:00:00.000Z' }
      ];
      
      await db.favoriteAttractions.bulkAdd(favorites);
      
      // Find specific favorite
      const hauntedMansion = await db.favoriteAttractions
        .where('attractionId')
        .equals('haunted-mansion')
        .first();
      
      expect(hauntedMansion).toBeDefined();
      expect(hauntedMansion?.attractionId).toBe('haunted-mansion');
    });
  });

  describe('Database Transactions', () => {
    it('should handle transaction rollback on error', async () => {
      const trip = createTrip('Test Trip', '2024-06-15', '2024-06-17');
      
      try {
        await db.transaction('rw', db.trips, db.userPreferences, async () => {
          // Add trip successfully
          await db.trips.add(trip);
          
          // This should fail and rollback the transaction
          throw new Error('Simulated error');
        });
      } catch (error) {
        // Transaction should have rolled back
      }
      
      // Verify trip was not saved due to rollback
      const retrievedTrip = await db.trips.get(trip.id);
      expect(retrievedTrip).toBeUndefined();
    });

    it('should successfully complete transaction', async () => {
      const trip = createTrip('Test Trip', '2024-06-15', '2024-06-17');
      const favorite: FavoriteAttraction = {
        attractionId: 'space-mountain',
        addedAt: new Date().toISOString()
      };
      
      await db.transaction('rw', db.trips, db.favoriteAttractions, async () => {
        await db.trips.add(trip);
        await db.favoriteAttractions.add(favorite);
      });
      
      // Verify both were saved
      const retrievedTrip = await db.trips.get(trip.id);
      const favorites = await db.favoriteAttractions.toArray();
      
      expect(retrievedTrip).toBeDefined();
      expect(favorites).toHaveLength(1);
      expect(favorites[0].attractionId).toBe('space-mountain');
    });
  });

  describe('Database Performance', () => {
    it('should handle bulk operations efficiently', async () => {
      // Create 100 trips
      const trips: Trip[] = [];
      for (let i = 0; i < 100; i++) {
        trips.push(createTrip(`Trip ${i}`, `2024-06-${String(i % 28 + 1).padStart(2, '0')}`, `2024-06-${String((i % 28 + 1) + 1).padStart(2, '0')}`));
      }
      
      const startTime = Date.now();
      await db.trips.bulkAdd(trips);
      const endTime = Date.now();
      
      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Verify all trips were saved
      const savedTrips = await db.trips.toArray();
      expect(savedTrips).toHaveLength(100);
    });

    it('should handle complex queries efficiently', async () => {
      // Create trips with various dates
      const trips: Trip[] = [];
      for (let i = 0; i < 50; i++) {
        const month = (i % 12) + 1;
        trips.push(createTrip(`Trip ${i}`, `2024-${String(month).padStart(2, '0')}-15`, `2024-${String(month).padStart(2, '0')}-17`));
      }
      
      await db.trips.bulkAdd(trips);
      
      const startTime = Date.now();
      
      // Complex query: trips in summer months, sorted by start date
      const summerTrips = await db.trips
        .where('startDate')
        .between('2024-06-01', '2024-08-31')
        .sortBy('startDate');
      
      const endTime = Date.now();
      
      // Should complete quickly
      expect(endTime - startTime).toBeLessThan(100);
      expect(summerTrips.length).toBeGreaterThan(0);
      
      // Verify sorting
      for (let i = 1; i < summerTrips.length; i++) {
        expect(summerTrips[i].startDate >= summerTrips[i - 1].startDate).toBe(true);
      }
    });
  });
});