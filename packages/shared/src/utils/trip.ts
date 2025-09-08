import type { Trip, TripDay, ItineraryItem } from '../types';
import { getTripDates } from './date';

export const createTrip = (
  name: string,
  startDate: string,
  endDate: string
): Trip => {
  const tripDates = getTripDates(startDate, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
  
  const trip: Trip = {
    id: generateTripId(),
    name,
    startDate,
    endDate,
    days: tripDates.map((date) => ({
      id: generateDayId(),
      date,
      parkId: '', // To be set by user
      items: [],
      notes: undefined,
    })),
    notes: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return trip;
};

export const updateTrip = (trip: Trip, updates: Partial<Trip>): Trip => {
  return {
    ...trip,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
};

export const addDayToTrip = (trip: Trip, date: string, parkId?: string): Trip => {
  const newDay: TripDay = {
    id: generateDayId(),
    date,
    parkId: parkId || '',
    items: [],
  };

  const days = [...trip.days, newDay].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return updateTrip(trip, { days });
};

export const updateTripDay = (trip: Trip, dayId: string, updates: Partial<TripDay>): Trip => {
  const days = trip.days.map(day => 
    day.id === dayId 
      ? { ...day, ...updates }
      : day
  );

  return updateTrip(trip, { days });
};

export const addItemToDay = (
  trip: Trip, 
  dayId: string, 
  attractionId: string, 
  options?: Partial<ItineraryItem>
): Trip => {
  const day = trip.days.find(d => d.id === dayId);
  if (!day) {
    throw new Error(`Day with id ${dayId} not found`);
  }

  const newItem: ItineraryItem = {
    id: generateItemId(),
    attractionId,
    order: day.items.length + 1,
    timeSlot: options?.timeSlot,
    duration: options?.duration,
    notes: options?.notes,
    completed: false,
  };

  const updatedDay: TripDay = {
    ...day,
    items: [...day.items, newItem],
  };

  return updateTripDay(trip, dayId, updatedDay);
};

export const removeItemFromDay = (trip: Trip, dayId: string, itemId: string): Trip => {
  const day = trip.days.find(d => d.id === dayId);
  if (!day) {
    throw new Error(`Day with id ${dayId} not found`);
  }

  const items = day.items
    .filter(item => item.id !== itemId)
    .map((item, index) => ({ ...item, order: index + 1 })); // Reorder

  return updateTripDay(trip, dayId, { items });
};

export const reorderDayItems = (trip: Trip, dayId: string, newOrder: string[]): Trip => {
  const day = trip.days.find(d => d.id === dayId);
  if (!day) {
    throw new Error(`Day with id ${dayId} not found`);
  }

  const itemsMap = new Map(day.items.map(item => [item.id, item]));
  const reorderedItems = newOrder
    .map(itemId => itemsMap.get(itemId))
    .filter((item): item is ItineraryItem => item !== undefined)
    .map((item, index) => ({ ...item, order: index + 1 }));

  return updateTripDay(trip, dayId, { items: reorderedItems });
};

export const toggleItemCompleted = (trip: Trip, dayId: string, itemId: string): Trip => {
  const day = trip.days.find(d => d.id === dayId);
  if (!day) {
    throw new Error(`Day with id ${dayId} not found`);
  }

  const items = day.items.map(item =>
    item.id === itemId
      ? { ...item, completed: !item.completed }
      : item
  );

  return updateTripDay(trip, dayId, { items });
};

export const getTripStats = (trip: Trip) => {
  const totalDays = trip.days.length;
  const totalItems = trip.days.reduce((sum, day) => sum + day.items.length, 0);
  const completedItems = trip.days.reduce(
    (sum, day) => sum + day.items.filter(item => item.completed).length,
    0
  );
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  const daysWithPlans = trip.days.filter(day => day.items.length > 0).length;
  const daysWithParks = trip.days.filter(day => day.parkId).length;

  return {
    totalDays,
    totalItems,
    completedItems,
    completionPercentage,
    daysWithPlans,
    daysWithParks,
    averageItemsPerDay: totalDays > 0 ? Math.round(totalItems / totalDays) : 0,
  };
};

export const duplicateTrip = (trip: Trip, newName: string): Trip => {
  return {
    ...trip,
    id: generateTripId(),
    name: newName,
    days: trip.days.map(day => ({
      ...day,
      id: generateDayId(),
      items: day.items.map(item => ({
        ...item,
        id: generateItemId(),
        completed: false, // Reset completion status
      })),
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Helper functions for generating IDs
function generateTripId(): string {
  return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateDayId(): string {
  return `day_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}