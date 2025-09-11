import { supabase } from './supabase';
import { authService } from './auth';
import type { Trip } from '../types';

export interface SyncStatus {
  online: boolean;
  syncing: boolean;
  lastSync: Date | null;
  error: string | null;
}

export class SyncService {
  private static instance: SyncService;
  private syncStatus: SyncStatus = {
    online: navigator.onLine,
    syncing: false,
    lastSync: null,
    error: null
  };
  private listeners: ((status: SyncStatus) => void)[] = [];

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Auto-sync when user logs in
    authService.subscribe((authState) => {
      if (authState.user && !authState.loading && this.syncStatus.online) {
        this.syncTrips();
      }
    });
  }

  private handleOnline() {
    this.updateStatus({ online: true });
    // Auto-sync when coming back online
    const user = authService.getState().user;
    if (user) {
      this.syncTrips();
    }
  }

  private handleOffline() {
    this.updateStatus({ online: false, syncing: false });
  }

  private updateStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  getStatus(): SyncStatus {
    return this.syncStatus;
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async syncTrips(): Promise<void> {
    const user = authService.getState().user;
    if (!user || !this.syncStatus.online || this.syncStatus.syncing) {
      return; // Don't start a new sync if one is already in progress
    }

    this.updateStatus({ syncing: true, error: null });

    try {
      // Fetch remote trips
      const { data: remoteTrips, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get local trips (this will be implemented by the app)
      const localTrips = await this.getLocalTrips();

      // Merge and resolve conflicts
      const mergedTrips = this.mergeTrips(localTrips, remoteTrips || []);

      // Save merged trips locally and remotely
      await this.saveTrips(mergedTrips);

      this.updateStatus({
        syncing: false,
        lastSync: new Date(),
        error: null
      });

    } catch (error) {
      console.error('Sync error:', error);
      this.updateStatus({
        syncing: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      });
    }
  }

  private async getLocalTrips(): Promise<Trip[]> {
    // This will be implemented by the consuming app
    // The app should provide this via a callback or dependency injection
    if (this.getLocalTripsCallback) {
      return await this.getLocalTripsCallback();
    }
    return [];
  }

  private getLocalTripsCallback?: () => Promise<Trip[]>;
  private saveLocalTripsCallback?: (trips: Trip[]) => Promise<void>;

  setLocalDataCallbacks(
    getLocalTrips: () => Promise<Trip[]>,
    saveLocalTrips: (trips: Trip[]) => Promise<void>
  ) {
    this.getLocalTripsCallback = getLocalTrips;
    this.saveLocalTripsCallback = saveLocalTrips;
  }

  private mergeTrips(localTrips: Trip[], remoteTrips: any[]): Trip[] {
    const tripMap = new Map<string, Trip>();

    // Add local trips
    localTrips.forEach(trip => {
      tripMap.set(trip.id, trip);
    });

    // Merge remote trips (remote wins on conflicts based on updated_at)
    remoteTrips.forEach(remoteTrip => {
      const localTrip = tripMap.get(remoteTrip.id);
      
      if (!localTrip || new Date(remoteTrip.updated_at) > new Date(localTrip.updatedAt)) {
        // Convert remote trip to local format
        tripMap.set(remoteTrip.id, {
          id: remoteTrip.id,
          name: remoteTrip.name,
          startDate: remoteTrip.start_date,
          endDate: remoteTrip.end_date,
          notes: remoteTrip.notes || '',
          accommodation: remoteTrip.accommodation || undefined,
          travelingParty: remoteTrip.traveling_party || undefined,
          days: remoteTrip.days || [],
          createdAt: remoteTrip.created_at,
          updatedAt: remoteTrip.updated_at
        });
      }
    });

    return Array.from(tripMap.values());
  }

  private async saveTrips(trips: Trip[]): Promise<void> {
    const user = authService.getState().user;
    if (!user) return;

    // Save to Supabase
    const tripsForSupabase = trips.map(trip => ({
      id: trip.id,
      user_id: user.id,
      name: trip.name,
      start_date: trip.startDate,
      end_date: trip.endDate,
      notes: trip.notes || null,
      accommodation: trip.accommodation || null,
      traveling_party: trip.travelingParty || null,
      days: trip.days,
      created_at: trip.createdAt,
      updated_at: trip.updatedAt
    }));

    const { error } = await supabase
      .from('trips')
      .upsert(tripsForSupabase, { onConflict: 'id' });

    if (error) throw error;

    // Save locally using callback
    if (this.saveLocalTripsCallback) {
      await this.saveLocalTripsCallback(trips);
    }
  }

  async uploadTrip(trip: Trip): Promise<void> {
    const user = authService.getState().user;
    if (!user || !this.syncStatus.online) {
      // Queue for later sync if offline
      return;
    }

    const { error } = await supabase
      .from('trips')
      .upsert({
        id: trip.id,
        user_id: user.id,
        name: trip.name,
        start_date: trip.startDate,
        end_date: trip.endDate,
        notes: trip.notes || null,
        accommodation: trip.accommodation || null,
        traveling_party: trip.travelingParty || null,
        days: trip.days,
        created_at: trip.createdAt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;
  }

  async deleteTrip(tripId: string): Promise<void> {
    const user = authService.getState().user;
    if (!user || !this.syncStatus.online) {
      return;
    }

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .eq('user_id', user.id);

    if (error) throw error;
  }
}

export const syncService = SyncService.getInstance();