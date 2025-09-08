import type { Trip, TripDay, ItineraryItem, Attraction } from '../types';
import { IntensityLevel } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateTrip = (trip: Trip): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic trip validation
  if (!trip.name || trip.name.trim().length === 0) {
    errors.push('Trip name is required');
  }

  if (trip.name.length > 100) {
    errors.push('Trip name must be 100 characters or less');
  }

  // Date validation
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);

  if (isNaN(startDate.getTime())) {
    errors.push('Invalid start date');
  }

  if (isNaN(endDate.getTime())) {
    errors.push('Invalid end date');
  }

  if (startDate >= endDate) {
    errors.push('End date must be after start date');
  }

  // Trip duration validation
  const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDifference > 14) {
    warnings.push('Trips longer than 14 days may be difficult to manage');
  }

  if (daysDifference > 30) {
    errors.push('Trip duration cannot exceed 30 days');
  }

  // Days validation
  if (trip.days.length === 0) {
    errors.push('Trip must have at least one day');
  }

  // Validate each day
  trip.days.forEach((day, index) => {
    const dayValidation = validateTripDay(day, index + 1);
    errors.push(...dayValidation.errors);
    warnings.push(...dayValidation.warnings);
  });

  // Check for duplicate dates
  const dates = trip.days.map(day => day.date);
  const uniqueDates = new Set(dates);
  if (dates.length !== uniqueDates.size) {
    errors.push('Trip cannot have duplicate dates');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateTripDay = (day: TripDay, dayNumber?: number): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = dayNumber ? `Day ${dayNumber}: ` : '';

  // Date validation
  const dayDate = new Date(day.date);
  if (isNaN(dayDate.getTime())) {
    errors.push(`${prefix}Invalid date`);
  }

  // Park validation
  if (!day.parkId && day.items.length > 0) {
    warnings.push(`${prefix}No park selected but attractions are planned`);
  }

  // Items validation
  if (day.items.length > 20) {
    warnings.push(`${prefix}${day.items.length} attractions may be too many for one day`);
  }

  if (day.items.length > 30) {
    errors.push(`${prefix}Cannot have more than 30 attractions per day`);
  }

  // Validate each item
  day.items.forEach((item, index) => {
    const itemValidation = validateItineraryItem(item, index + 1, dayNumber);
    errors.push(...itemValidation.errors);
    warnings.push(...itemValidation.warnings);
  });

  // Check for duplicate attractions in same day
  const attractionIds = day.items.map(item => item.attractionId);
  const uniqueAttractions = new Set(attractionIds);
  if (attractionIds.length !== uniqueAttractions.size) {
    warnings.push(`${prefix}Duplicate attractions found`);
  }

  // Check order consistency
  const expectedOrders = day.items.map((_, index) => index + 1);
  const actualOrders = day.items.map(item => item.order).sort((a, b) => a - b);
  if (!arraysEqual(expectedOrders, actualOrders)) {
    errors.push(`${prefix}Item order is inconsistent`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateItineraryItem = (
  item: ItineraryItem, 
  itemNumber?: number, 
  dayNumber?: number
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = dayNumber && itemNumber ? `Day ${dayNumber}, Item ${itemNumber}: ` : '';

  // Basic validation
  if (!item.attractionId) {
    errors.push(`${prefix}Attraction ID is required`);
  }

  if (item.order < 1) {
    errors.push(`${prefix}Order must be positive`);
  }

  // Time slot validation
  if (item.timeSlot && !isValidTimeFormat(item.timeSlot)) {
    errors.push(`${prefix}Invalid time slot format (use HH:MM)`);
  }

  // Duration validation
  if (item.duration !== undefined) {
    if (item.duration < 1) {
      errors.push(`${prefix}Duration must be at least 1 minute`);
    }

    if (item.duration > 480) { // 8 hours
      warnings.push(`${prefix}Duration of ${item.duration} minutes seems very long`);
    }
  }

  // Notes validation
  if (item.notes && item.notes.length > 500) {
    warnings.push(`${prefix}Note is very long (${item.notes.length} characters)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateAttractionRequirements = (
  _item: ItineraryItem,
  attraction: Attraction,
  guestAges?: number[]
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Height requirement validation
  if (attraction.heightRequirement && guestAges) {
    // This is simplified - in reality you'd need height data, not just ages
    const hasChildren = guestAges.some(age => age < 12);
    if (hasChildren && attraction.heightRequirement > 40) {
      warnings.push(`${attraction.name} has height requirement of ${attraction.heightRequirement}" - check if all guests meet requirement`);
    }
  }

  // Intensity validation for young guests
  if (attraction.intensity === IntensityLevel.EXTREME && guestAges) {
    const hasYoungGuests = guestAges.some(age => age < 10);
    if (hasYoungGuests) {
      warnings.push(`${attraction.name} is marked as extreme intensity - may not be suitable for young guests`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateTimeConflicts = (day: TripDay): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const itemsWithTime = day.items
    .filter(item => item.timeSlot)
    .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

  for (let i = 0; i < itemsWithTime.length - 1; i++) {
    const current = itemsWithTime[i];
    const next = itemsWithTime[i + 1];

    if (current?.timeSlot && next?.timeSlot) {
      const currentEnd = addMinutesToTime(current.timeSlot, current.duration || 60);
      if (currentEnd > next.timeSlot) {
        warnings.push(`Time conflict: ${current.attractionId} may overlap with ${next.attractionId}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// Helper functions
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hoursStr, minsStr] = time.split(':');
  const hours = Number(hoursStr);
  const mins = Number(minsStr);
  
  if (isNaN(hours) || isNaN(mins)) {
    return time; // Return original if invalid
  }
  
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((val, index) => val === b[index]);
}