import type { Trip, TripDay, ItineraryItem } from '../types';

export const createTrip = (name: string, startDate: string, endDate: string): Trip => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  return {
    id,
    name,
    startDate,
    endDate,
    days: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const updateTrip = (trip: Trip, updates: Partial<Trip>): Trip => {
  const updatedTrip = {
    ...trip,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // If trip dates changed, cleanup orphaned days
  if (updates.startDate || updates.endDate) {
    return cleanupOrphanedDays(updatedTrip);
  }

  return updatedTrip;
};

export const addDayToTrip = (trip: Trip, date: string): Trip => {
  const dayId = crypto.randomUUID();
  const newDay: TripDay = {
    id: dayId,
    date,
    items: [],
  };

  return {
    ...trip,
    days: [...trip.days, newDay],
    updatedAt: new Date().toISOString(),
  };
};

export const updateTripDay = (trip: Trip, dayId: string, updates: Partial<TripDay>): Trip => {
  return {
    ...trip,
    days: trip.days.map(day => 
      day.id === dayId ? { ...day, ...updates } : day
    ),
    updatedAt: new Date().toISOString(),
  };
};

export const deleteTripDay = (trip: Trip, dayId: string): Trip => {
  return {
    ...trip,
    days: trip.days.filter(day => day.id !== dayId),
    updatedAt: new Date().toISOString(),
  };
};

export const addItemToDay = (trip: Trip, dayId: string, item: Omit<ItineraryItem, 'id'>): Trip => {
  const itemId = crypto.randomUUID();
  const newItem: ItineraryItem = {
    ...item,
    id: itemId,
  };

  return {
    ...trip,
    days: trip.days.map(day =>
      day.id === dayId 
        ? { ...day, items: [...day.items, newItem] }
        : day
    ),
    updatedAt: new Date().toISOString(),
  };
};

export const updateItineraryItem = (
  trip: Trip, 
  dayId: string, 
  itemId: string, 
  updates: Partial<ItineraryItem>
): Trip => {
  return {
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
    ),
    updatedAt: new Date().toISOString(),
  };
};

export const removeItemFromDay = (trip: Trip, dayId: string, itemId: string): Trip => {
  return {
    ...trip,
    days: trip.days.map(day =>
      day.id === dayId
        ? { ...day, items: day.items.filter(item => item.id !== itemId) }
        : day
    ),
    updatedAt: new Date().toISOString(),
  };
};

export const reorderDayItems = (trip: Trip, dayId: string, itemIds: string[]): Trip => {
  return {
    ...trip,
    days: trip.days.map(day =>
      day.id === dayId
        ? {
            ...day,
            items: itemIds.map(id => day.items.find(item => item.id === id)!).filter(Boolean)
          }
        : day
    ),
    updatedAt: new Date().toISOString(),
  };
};

// Timezone-safe date range utilities

/**
 * Check if a day date falls within the trip's date range using timezone-safe comparison
 */
export const isDayInTripRange = (dayDate: string, trip: Trip): boolean => {
  // Use T00:00:00 pattern for consistent timezone handling (same as dayTypeUtils.ts)
  const tripStart = new Date(trip.startDate + 'T00:00:00');
  const tripEnd = new Date(trip.endDate + 'T00:00:00');
  const dayDateTime = new Date(dayDate + 'T00:00:00');

  return dayDateTime >= tripStart && dayDateTime <= tripEnd;
};

/**
 * Get only the trip days that fall within the actual trip date range
 */
export const getDaysInTripRange = (trip: Trip): TripDay[] => {
  return trip.days.filter(day => isDayInTripRange(day.date, trip));
};

/**
 * Count planned days - only days within trip range that have content or aren't 'unplanned'
 */
export const getPlannedDaysCount = (trip: Trip): number => {
  const daysInRange = getDaysInTripRange(trip);

  return daysInRange.filter(day => {
    // Count as planned if:
    // 1. Has a day type that's not 'unplanned'
    // 2. OR has items/content (even if no explicit day type)
    const hasNonUnplannedType = day.dayType && day.dayType !== 'unplanned';
    const hasContent = day.items && day.items.length > 0;

    return hasNonUnplannedType || hasContent;
  }).length;
};

/**
 * Remove days that are outside the trip's date range
 */
export const cleanupOrphanedDays = (trip: Trip): Trip => {
  const daysInRange = getDaysInTripRange(trip);

  // Only update if we're actually removing orphaned days
  if (daysInRange.length === trip.days.length) {
    return trip;
  }

  return {
    ...trip,
    days: daysInRange,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Migration utility: Clean up orphaned days for all trips
 * Returns array of trips that had orphaned days removed
 */
export const migrateTripsCleanupOrphanedDays = (trips: Trip[]): {
  cleanedTrips: Trip[],
  tripsCleaned: string[],
  totalDaysRemoved: number
} => {
  const cleanedTrips: Trip[] = [];
  const tripsCleaned: string[] = [];
  let totalDaysRemoved = 0;

  trips.forEach(trip => {
    const originalDayCount = trip.days.length;
    const cleanedTrip = cleanupOrphanedDays(trip);
    const newDayCount = cleanedTrip.days.length;

    if (newDayCount < originalDayCount) {
      tripsCleaned.push(trip.name);
      totalDaysRemoved += originalDayCount - newDayCount;
    }

    cleanedTrips.push(cleanedTrip);
  });

  return {
    cleanedTrips,
    tripsCleaned,
    totalDaysRemoved
  };
};