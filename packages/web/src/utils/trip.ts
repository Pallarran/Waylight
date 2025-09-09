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
  return {
    ...trip,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
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