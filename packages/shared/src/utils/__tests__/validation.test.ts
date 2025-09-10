import { describe, it, expect } from 'vitest';
import {
  validateTrip,
  validateTripDay,
  validateItineraryItem,
  validateAttractionRequirements,
  validateTimeConflicts,
} from '../validation';
import { createTrip, addItemToDay, updateTripDay } from '../trip';
import type { Trip, TripDay, ItineraryItem, Attraction } from '../../types';
import { IntensityLevel } from '../../types';

describe('Validation Utilities', () => {
  describe('validateTrip', () => {
    it('should validate a correct trip', () => {
      const trip = createTrip('Disney World 2024', '2024-06-15', '2024-06-17');
      const result = validateTrip(trip);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject trip with empty name', () => {
      const trip = createTrip('', '2024-06-15', '2024-06-17');
      const result = validateTrip(trip);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trip name is required');
    });

    it('should reject trip with name too long', () => {
      const longName = 'a'.repeat(101);
      const trip = createTrip(longName, '2024-06-15', '2024-06-17');
      const result = validateTrip(trip);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trip name must be 100 characters or less');
    });

    it('should reject invalid date formats', () => {
      const trip = createTrip('Test Trip', 'invalid-date', '2024-06-17');
      const result = validateTrip(trip);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid start date');
    });

    it('should reject when end date is before start date', () => {
      const trip = createTrip('Test Trip', '2024-06-17', '2024-06-15');
      const result = validateTrip(trip);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });

    it('should warn about long trips', () => {
      const trip = createTrip('Long Trip', '2024-01-01', '2024-01-20'); // 20 days
      const result = validateTrip(trip);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Trips longer than 14 days may be difficult to manage');
    });

    it('should reject extremely long trips', () => {
      const trip = createTrip('Too Long', '2024-01-01', '2024-02-15'); // 45+ days
      const result = validateTrip(trip);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trip duration cannot exceed 30 days');
    });

    it('should detect duplicate dates', () => {
      const trip = createTrip('Test Trip', '2024-06-15', '2024-06-17');
      // Manually add a duplicate date
      trip.days.push({
        id: 'duplicate',
        date: '2024-06-15', // Duplicate
        parkId: '',
        items: []
      });
      
      const result = validateTrip(trip);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trip cannot have duplicate dates');
    });
  });

  describe('validateTripDay', () => {
    it('should validate a correct trip day', () => {
      const day: TripDay = {
        id: 'day_1',
        date: '2024-06-15',
        parkId: 'magic-kingdom',
        items: []
      };
      
      const result = validateTripDay(day);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject invalid date', () => {
      const day: TripDay = {
        id: 'day_1',
        date: 'invalid-date',
        parkId: 'magic-kingdom',
        items: []
      };
      
      const result = validateTripDay(day, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Day 1: Invalid date');
    });

    it('should warn when no park selected but items exist', () => {
      const day: TripDay = {
        id: 'day_1',
        date: '2024-06-15',
        parkId: '',
        items: [{
          id: 'item_1',
          attractionId: 'attraction_1',
          order: 1,
          completed: false
        }]
      };
      
      const result = validateTripDay(day, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Day 1: No park selected but attractions are planned');
    });

    it('should warn about too many attractions', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({
        id: `item_${i}`,
        attractionId: `attraction_${i}`,
        order: i + 1,
        completed: false
      }));
      
      const day: TripDay = {
        id: 'day_1',
        date: '2024-06-15',
        parkId: 'magic-kingdom',
        items
      };
      
      const result = validateTripDay(day, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Day 1: 25 attractions may be too many for one day');
    });

    it('should reject excessive attractions', () => {
      const items = Array.from({ length: 35 }, (_, i) => ({
        id: `item_${i}`,
        attractionId: `attraction_${i}`,
        order: i + 1,
        completed: false
      }));
      
      const day: TripDay = {
        id: 'day_1',
        date: '2024-06-15',
        parkId: 'magic-kingdom',
        items
      };
      
      const result = validateTripDay(day, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Day 1: Cannot have more than 30 attractions per day');
    });

    it('should detect inconsistent item order', () => {
      const day: TripDay = {
        id: 'day_1',
        date: '2024-06-15',
        parkId: 'magic-kingdom',
        items: [
          { id: 'item_1', attractionId: 'attraction_1', order: 1, completed: false },
          { id: 'item_2', attractionId: 'attraction_2', order: 3, completed: false }, // Should be 2
          { id: 'item_3', attractionId: 'attraction_3', order: 2, completed: false }, // Should be 3
        ]
      };
      
      const result = validateTripDay(day, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Day 1: Item order is inconsistent');
    });

    it('should warn about duplicate attractions', () => {
      const day: TripDay = {
        id: 'day_1',
        date: '2024-06-15',
        parkId: 'magic-kingdom',
        items: [
          { id: 'item_1', attractionId: 'attraction_1', order: 1, completed: false },
          { id: 'item_2', attractionId: 'attraction_1', order: 2, completed: false }, // Duplicate
        ]
      };
      
      const result = validateTripDay(day, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Day 1: Duplicate attractions found');
    });
  });

  describe('validateItineraryItem', () => {
    it('should validate a correct item', () => {
      const item: ItineraryItem = {
        id: 'item_1',
        attractionId: 'attraction_1',
        order: 1,
        timeSlot: '10:00',
        duration: 45,
        notes: 'Use FastPass+',
        completed: false
      };
      
      const result = validateItineraryItem(item);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject missing attraction ID', () => {
      const item: ItineraryItem = {
        id: 'item_1',
        attractionId: '',
        order: 1,
        completed: false
      };
      
      const result = validateItineraryItem(item, 1, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Day 1, Item 1: Attraction ID is required');
    });

    it('should reject invalid order', () => {
      const item: ItineraryItem = {
        id: 'item_1',
        attractionId: 'attraction_1',
        order: 0,
        completed: false
      };
      
      const result = validateItineraryItem(item, 1, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Day 1, Item 1: Order must be positive');
    });

    it('should reject invalid time format', () => {
      const item: ItineraryItem = {
        id: 'item_1',
        attractionId: 'attraction_1',
        order: 1,
        timeSlot: '25:00', // Invalid hour
        completed: false
      };
      
      const result = validateItineraryItem(item, 1, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Day 1, Item 1: Invalid time slot format (use HH:MM)');
    });

    it('should reject invalid duration', () => {
      const item: ItineraryItem = {
        id: 'item_1',
        attractionId: 'attraction_1',
        order: 1,
        duration: 0,
        completed: false
      };
      
      const result = validateItineraryItem(item, 1, 1);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Day 1, Item 1: Duration must be at least 1 minute');
    });

    it('should warn about excessive duration', () => {
      const item: ItineraryItem = {
        id: 'item_1',
        attractionId: 'attraction_1',
        order: 1,
        duration: 500, // Over 8 hours
        completed: false
      };
      
      const result = validateItineraryItem(item, 1, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Day 1, Item 1: Duration of 500 minutes seems very long');
    });

    it('should warn about very long notes', () => {
      const longNote = 'a'.repeat(501);
      const item: ItineraryItem = {
        id: 'item_1',
        attractionId: 'attraction_1',
        order: 1,
        notes: longNote,
        completed: false
      };
      
      const result = validateItineraryItem(item, 1, 1);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Day 1, Item 1: Note is very long (501 characters)');
    });
  });

  describe('validateAttractionRequirements', () => {
    const mockAttraction: Attraction = {
      id: 'test_attraction',
      parkId: 'magic-kingdom',
      name: 'Test Coaster',
      description: 'A thrilling ride',
      type: 'ride',
      duration: 5,
      location: 'Tomorrowland',
      heightRequirement: 44,
      intensity: IntensityLevel.HIGH,
      tips: []
    };

    it('should warn about height requirements with children', () => {
      const item: ItineraryItem = {
        id: 'item_1',
        attractionId: 'test_attraction',
        order: 1,
        completed: false
      };
      
      const guestAges = [8, 35, 32]; // Child + adults
      const result = validateAttractionRequirements(item, mockAttraction, guestAges);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Test Coaster has height requirement of 44" - check if all guests meet requirement');
    });

    it('should warn about extreme intensity with young guests', () => {
      const extremeAttraction: Attraction = {
        ...mockAttraction,
        intensity: IntensityLevel.EXTREME,
        heightRequirement: undefined
      };
      
      const item: ItineraryItem = {
        id: 'item_1',
        attractionId: 'test_attraction',
        order: 1,
        completed: false
      };
      
      const guestAges = [7, 35]; // Young child + adult
      const result = validateAttractionRequirements(item, extremeAttraction, guestAges);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Test Coaster is marked as extreme intensity - may not be suitable for young guests');
    });

    it('should pass with appropriate guests', () => {
      const item: ItineraryItem = {
        id: 'item_1',
        attractionId: 'test_attraction',
        order: 1,
        completed: false
      };
      
      const guestAges = [15, 35]; // Teen + adult
      const result = validateAttractionRequirements(item, mockAttraction, guestAges);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateTimeConflicts', () => {
    it('should detect overlapping time slots', () => {
      const day: TripDay = {
        id: 'day_1',
        date: '2024-06-15',
        parkId: 'magic-kingdom',
        items: [
          {
            id: 'item_1',
            attractionId: 'attraction_1',
            order: 1,
            timeSlot: '10:00',
            duration: 90, // Ends at 11:30
            completed: false
          },
          {
            id: 'item_2',
            attractionId: 'attraction_2',
            order: 2,
            timeSlot: '11:00', // Starts before first ends
            duration: 60,
            completed: false
          }
        ]
      };
      
      const result = validateTimeConflicts(day);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Time conflict: attraction_1 may overlap with attraction_2');
    });

    it('should pass with non-overlapping times', () => {
      const day: TripDay = {
        id: 'day_1',
        date: '2024-06-15',
        parkId: 'magic-kingdom',
        items: [
          {
            id: 'item_1',
            attractionId: 'attraction_1',
            order: 1,
            timeSlot: '10:00',
            duration: 60, // Ends at 11:00
            completed: false
          },
          {
            id: 'item_2',
            attractionId: 'attraction_2',
            order: 2,
            timeSlot: '11:30', // Starts after first ends
            duration: 60,
            completed: false
          }
        ]
      };
      
      const result = validateTimeConflicts(day);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle items without time slots', () => {
      const day: TripDay = {
        id: 'day_1',
        date: '2024-06-15',
        parkId: 'magic-kingdom',
        items: [
          {
            id: 'item_1',
            attractionId: 'attraction_1',
            order: 1,
            completed: false
          },
          {
            id: 'item_2',
            attractionId: 'attraction_2',
            order: 2,
            timeSlot: '11:00',
            completed: false
          }
        ]
      };
      
      const result = validateTimeConflicts(day);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });
});