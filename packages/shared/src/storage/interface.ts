import type { Trip, Attraction, Park, Settings } from '../types';

export interface StorageAdapter {
  // Trips
  getTrips(): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | null>;
  saveTrip(trip: Trip): Promise<void>;
  deleteTrip(id: string): Promise<void>;
  
  // Parks
  getParks(): Promise<Park[]>;
  getPark(id: string): Promise<Park | null>;
  
  // Waypoints (DO/EAT items)
  getWaypoints(parkId?: string): Promise<Attraction[]>;
  getWaypoint(id: string): Promise<Attraction | null>;
  searchWaypoints(query: string, parkId?: string): Promise<Attraction[]>;
  
  // Settings
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  
  // Utility
  clear(): Promise<void>;
  export(): Promise<string>;
  import(data: string): Promise<void>;
}

export abstract class BaseStorageAdapter implements StorageAdapter {
  abstract getTrips(): Promise<Trip[]>;
  abstract getTrip(id: string): Promise<Trip | null>;
  abstract saveTrip(trip: Trip): Promise<void>;
  abstract deleteTrip(id: string): Promise<void>;
  
  abstract getParks(): Promise<Park[]>;
  abstract getPark(id: string): Promise<Park | null>;
  
  abstract getWaypoints(parkId?: string): Promise<Attraction[]>;
  abstract getWaypoint(id: string): Promise<Attraction | null>;
  
  abstract getSettings(): Promise<Settings>;
  abstract saveSettings(settings: Settings): Promise<void>;
  
  abstract clear(): Promise<void>;
  abstract export(): Promise<string>;
  abstract import(data: string): Promise<void>;
  
  async searchWaypoints(query: string, parkId?: string): Promise<Attraction[]> {
    const attractions = await this.getWaypoints(parkId);
    const searchTerm = query.toLowerCase();
    
    return attractions.filter(attraction => 
      attraction.name.toLowerCase().includes(searchTerm) ||
      attraction.description.toLowerCase().includes(searchTerm) ||
      attraction.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
}