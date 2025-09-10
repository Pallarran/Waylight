import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTrip,
  updateTrip,
  addDayToTrip,
  updateTripDay,
  addItemToDay,
  removeItemFromDay,
  reorderDayItems,
  toggleItemCompleted,
  getTripStats,
  duplicateTrip,
} from '../trip';
import type { Trip } from '../../types';

describe('Trip Utilities', () => {
  describe('createTrip', () => {
    it('should create a valid trip with correct structure', () => {
      const trip = createTrip('Disney World 2024', '2024-01-15', '2024-01-17');
      
      expect(trip).toBeDefined();
      expect(trip.name).toBe('Disney World 2024');
      expect(trip.startDate).toBe('2024-01-15');
      expect(trip.endDate).toBe('2024-01-17');
      expect(trip.days).toHaveLength(3); // 15th, 16th, 17th
      expect(trip.id).toMatch(/^trip_/);
      expect(trip.createdAt).toBeDefined();
      expect(trip.updatedAt).toBeDefined();
    });

    it('should create days in correct chronological order', () => {
      const trip = createTrip('Test Trip', '2024-01-15', '2024-01-17');
      
      expect(trip.days[0].date).toBe('2024-01-15');
      expect(trip.days[1].date).toBe('2024-01-16');
      expect(trip.days[2].date).toBe('2024-01-17');
    });

    it('should initialize days with empty items', () => {
      const trip = createTrip('Test Trip', '2024-01-15', '2024-01-16');
      
      trip.days.forEach(day => {
        expect(day.items).toEqual([]);
        expect(day.parkId).toBe('');
        expect(day.id).toMatch(/^day_/);
      });
    });
  });

  describe('updateTrip', () => {
    let mockTrip: Trip;

    beforeEach(() => {
      mockTrip = createTrip('Original', '2024-01-15', '2024-01-16');
    });

    it('should update trip properties', () => {
      // Add a small delay to ensure different timestamps
      const updated = updateTrip(mockTrip, { name: 'Updated Name' });
      
      expect(updated.name).toBe('Updated Name');
      expect(updated.id).toBe(mockTrip.id);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(mockTrip.updatedAt).getTime());
    });

    it('should preserve unchanged properties', () => {
      const updated = updateTrip(mockTrip, { notes: 'New notes' });
      
      expect(updated.name).toBe(mockTrip.name);
      expect(updated.startDate).toBe(mockTrip.startDate);
      expect(updated.endDate).toBe(mockTrip.endDate);
      expect(updated.notes).toBe('New notes');
    });
  });

  describe('addDayToTrip', () => {
    let mockTrip: Trip;

    beforeEach(() => {
      mockTrip = createTrip('Test', '2024-01-15', '2024-01-16');
    });

    it('should add a new day and maintain chronological order', () => {
      const updated = addDayToTrip(mockTrip, '2024-01-14', 'park123');
      
      expect(updated.days).toHaveLength(3);
      expect(updated.days[0].date).toBe('2024-01-14');
      expect(updated.days[0].parkId).toBe('park123');
      expect(updated.days[1].date).toBe('2024-01-15');
      expect(updated.days[2].date).toBe('2024-01-16');
    });

    it('should add day without parkId when not provided', () => {
      const updated = addDayToTrip(mockTrip, '2024-01-17');
      
      expect(updated.days).toHaveLength(3);
      expect(updated.days[2].date).toBe('2024-01-17');
      expect(updated.days[2].parkId).toBe('');
    });
  });

  describe('updateTripDay', () => {
    let mockTrip: Trip;

    beforeEach(() => {
      mockTrip = createTrip('Test', '2024-01-15', '2024-01-16');
    });

    it('should update specific day properties', () => {
      const dayId = mockTrip.days[0].id;
      const updated = updateTripDay(mockTrip, dayId, { 
        parkId: 'magic-kingdom',
        notes: 'Early park opening' 
      });
      
      expect(updated.days[0].parkId).toBe('magic-kingdom');
      expect(updated.days[0].notes).toBe('Early park opening');
      expect(updated.days[1]).toEqual(mockTrip.days[1]); // Other days unchanged
    });

    it('should not modify trip if day not found', () => {
      const updated = updateTripDay(mockTrip, 'nonexistent', { parkId: 'test' });
      
      expect(updated.days).toEqual(mockTrip.days);
    });
  });

  describe('addItemToDay', () => {
    let mockTrip: Trip;

    beforeEach(() => {
      mockTrip = createTrip('Test', '2024-01-15', '2024-01-16');
    });

    it('should add item to correct day', () => {
      const dayId = mockTrip.days[0].id;
      const updated = addItemToDay(mockTrip, dayId, 'attraction123');
      
      expect(updated.days[0].items).toHaveLength(1);
      expect(updated.days[0].items[0].attractionId).toBe('attraction123');
      expect(updated.days[0].items[0].order).toBe(1);
      expect(updated.days[0].items[0].completed).toBe(false);
      expect(updated.days[0].items[0].id).toMatch(/^item_/);
    });

    it('should add item with optional properties', () => {
      const dayId = mockTrip.days[0].id;
      const updated = addItemToDay(mockTrip, dayId, 'attraction123', {
        timeSlot: '10:00',
        duration: 45,
        notes: 'FastPass+'
      });
      
      const item = updated.days[0].items[0];
      expect(item.timeSlot).toBe('10:00');
      expect(item.duration).toBe(45);
      expect(item.notes).toBe('FastPass+');
    });

    it('should increment order for multiple items', () => {
      const dayId = mockTrip.days[0].id;
      let updated = addItemToDay(mockTrip, dayId, 'attraction1');
      updated = addItemToDay(updated, dayId, 'attraction2');
      updated = addItemToDay(updated, dayId, 'attraction3');
      
      expect(updated.days[0].items).toHaveLength(3);
      expect(updated.days[0].items[0].order).toBe(1);
      expect(updated.days[0].items[1].order).toBe(2);
      expect(updated.days[0].items[2].order).toBe(3);
    });

    it('should throw error for invalid day ID', () => {
      expect(() => addItemToDay(mockTrip, 'invalid', 'attraction123')).toThrow('Day with id invalid not found');
    });
  });

  describe('removeItemFromDay', () => {
    let mockTrip: Trip;

    beforeEach(() => {
      mockTrip = createTrip('Test', '2024-01-15', '2024-01-16');
      const dayId = mockTrip.days[0].id;
      mockTrip = addItemToDay(mockTrip, dayId, 'attraction1');
      mockTrip = addItemToDay(mockTrip, dayId, 'attraction2');
      mockTrip = addItemToDay(mockTrip, dayId, 'attraction3');
    });

    it('should remove item and reorder remaining items', () => {
      const dayId = mockTrip.days[0].id;
      const itemId = mockTrip.days[0].items[1].id; // Remove middle item
      const updated = removeItemFromDay(mockTrip, dayId, itemId);
      
      expect(updated.days[0].items).toHaveLength(2);
      expect(updated.days[0].items[0].attractionId).toBe('attraction1');
      expect(updated.days[0].items[0].order).toBe(1);
      expect(updated.days[0].items[1].attractionId).toBe('attraction3');
      expect(updated.days[0].items[1].order).toBe(2);
    });

    it('should throw error for invalid day ID', () => {
      expect(() => removeItemFromDay(mockTrip, 'invalid', 'item123')).toThrow('Day with id invalid not found');
    });
  });

  describe('reorderDayItems', () => {
    let mockTrip: Trip;
    let dayId: string;
    let itemIds: string[];

    beforeEach(() => {
      mockTrip = createTrip('Test', '2024-01-15', '2024-01-16');
      dayId = mockTrip.days[0].id;
      mockTrip = addItemToDay(mockTrip, dayId, 'attraction1');
      mockTrip = addItemToDay(mockTrip, dayId, 'attraction2');
      mockTrip = addItemToDay(mockTrip, dayId, 'attraction3');
      itemIds = mockTrip.days[0].items.map(item => item.id);
    });

    it('should reorder items correctly', () => {
      const newOrder = [itemIds[2], itemIds[0], itemIds[1]]; // 3, 1, 2
      const updated = reorderDayItems(mockTrip, dayId, newOrder);
      
      expect(updated.days[0].items).toHaveLength(3);
      expect(updated.days[0].items[0].attractionId).toBe('attraction3');
      expect(updated.days[0].items[0].order).toBe(1);
      expect(updated.days[0].items[1].attractionId).toBe('attraction1');
      expect(updated.days[0].items[1].order).toBe(2);
      expect(updated.days[0].items[2].attractionId).toBe('attraction2');
      expect(updated.days[0].items[2].order).toBe(3);
    });

    it('should handle partial reorder gracefully', () => {
      const partialOrder = [itemIds[1], itemIds[0]]; // Missing one item
      const updated = reorderDayItems(mockTrip, dayId, partialOrder);
      
      expect(updated.days[0].items).toHaveLength(2);
      expect(updated.days[0].items[0].attractionId).toBe('attraction2');
      expect(updated.days[0].items[1].attractionId).toBe('attraction1');
    });
  });

  describe('toggleItemCompleted', () => {
    let mockTrip: Trip;
    let dayId: string;
    let itemId: string;

    beforeEach(() => {
      mockTrip = createTrip('Test', '2024-01-15', '2024-01-16');
      dayId = mockTrip.days[0].id;
      mockTrip = addItemToDay(mockTrip, dayId, 'attraction1');
      itemId = mockTrip.days[0].items[0].id;
    });

    it('should toggle item from incomplete to complete', () => {
      const updated = toggleItemCompleted(mockTrip, dayId, itemId);
      
      expect(updated.days[0].items[0].completed).toBe(true);
    });

    it('should toggle item from complete to incomplete', () => {
      let updated = toggleItemCompleted(mockTrip, dayId, itemId);
      updated = toggleItemCompleted(updated, dayId, itemId);
      
      expect(updated.days[0].items[0].completed).toBe(false);
    });
  });

  describe('getTripStats', () => {
    let mockTrip: Trip;

    beforeEach(() => {
      mockTrip = createTrip('Test', '2024-01-15', '2024-01-17'); // 3 days
      const day1Id = mockTrip.days[0].id;
      const day2Id = mockTrip.days[1].id;
      
      // Day 1: 2 items, 1 completed, with park
      mockTrip = updateTripDay(mockTrip, day1Id, { parkId: 'magic-kingdom' });
      mockTrip = addItemToDay(mockTrip, day1Id, 'attraction1');
      mockTrip = addItemToDay(mockTrip, day1Id, 'attraction2');
      mockTrip = toggleItemCompleted(mockTrip, day1Id, mockTrip.days[0].items[0].id);
      
      // Day 2: 1 item, not completed, with park
      mockTrip = updateTripDay(mockTrip, day2Id, { parkId: 'epcot' });
      mockTrip = addItemToDay(mockTrip, day2Id, 'attraction3');
      
      // Day 3: no items, no park
    });

    it('should calculate correct statistics', () => {
      const stats = getTripStats(mockTrip);
      
      expect(stats.totalDays).toBe(3);
      expect(stats.totalItems).toBe(3);
      expect(stats.completedItems).toBe(1);
      expect(stats.completionPercentage).toBe(33); // 1/3 = 0.33 = 33%
      expect(stats.daysWithPlans).toBe(2); // Day 1 and 2 have items
      expect(stats.daysWithParks).toBe(2); // Day 1 and 2 have parks
      expect(stats.averageItemsPerDay).toBe(1); // 3 items / 3 days = 1
    });

    it('should handle empty trip correctly', () => {
      const emptyTrip = createTrip('Empty', '2024-01-15', '2024-01-15');
      const stats = getTripStats(emptyTrip);
      
      expect(stats.totalDays).toBe(1);
      expect(stats.totalItems).toBe(0);
      expect(stats.completedItems).toBe(0);
      expect(stats.completionPercentage).toBe(0);
      expect(stats.daysWithPlans).toBe(0);
      expect(stats.daysWithParks).toBe(0);
      expect(stats.averageItemsPerDay).toBe(0);
    });
  });

  describe('duplicateTrip', () => {
    let mockTrip: Trip;

    beforeEach(() => {
      mockTrip = createTrip('Original Trip', '2024-01-15', '2024-01-16');
      const dayId = mockTrip.days[0].id;
      mockTrip = updateTripDay(mockTrip, dayId, { parkId: 'magic-kingdom' });
      mockTrip = addItemToDay(mockTrip, dayId, 'attraction1');
      mockTrip = toggleItemCompleted(mockTrip, dayId, mockTrip.days[0].items[0].id);
      mockTrip.notes = 'Original notes';
    });

    it('should create new trip with different IDs', () => {
      const duplicate = duplicateTrip(mockTrip, 'Duplicate Trip');
      
      expect(duplicate.id).not.toBe(mockTrip.id);
      expect(duplicate.name).toBe('Duplicate Trip');
      expect(duplicate.startDate).toBe(mockTrip.startDate);
      expect(duplicate.endDate).toBe(mockTrip.endDate);
      expect(duplicate.notes).toBe(mockTrip.notes);
    });

    it('should duplicate days with new IDs', () => {
      const duplicate = duplicateTrip(mockTrip, 'Duplicate Trip');
      
      expect(duplicate.days).toHaveLength(mockTrip.days.length);
      duplicate.days.forEach((day, index) => {
        expect(day.id).not.toBe(mockTrip.days[index].id);
        expect(day.date).toBe(mockTrip.days[index].date);
        expect(day.parkId).toBe(mockTrip.days[index].parkId);
      });
    });

    it('should reset completion status on duplicated items', () => {
      const duplicate = duplicateTrip(mockTrip, 'Duplicate Trip');
      
      expect(duplicate.days[0].items).toHaveLength(1);
      expect(duplicate.days[0].items[0].id).not.toBe(mockTrip.days[0].items[0].id);
      expect(duplicate.days[0].items[0].attractionId).toBe('attraction1');
      expect(duplicate.days[0].items[0].completed).toBe(false); // Reset to false
    });

    it('should have new creation timestamps', () => {
      const duplicate = duplicateTrip(mockTrip, 'Duplicate Trip');
      
      expect(duplicate.createdAt).not.toBe(mockTrip.createdAt);
      expect(duplicate.updatedAt).not.toBe(mockTrip.updatedAt);
    });
  });
});