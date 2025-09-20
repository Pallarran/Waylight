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
  private syncInterval: NodeJS.Timeout | null = null;

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
      // Fetch trips owned by user (use basic fields first, add collaboration fields if they exist)
      const ownedTripsResult = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (ownedTripsResult.error) {
        console.error('Error fetching owned trips:', ownedTripsResult.error);
        throw ownedTripsResult.error;
      }

      // Query shared trips that user collaborates on
      let sharedTripsResult: any = { data: [], error: null };
      try {
        sharedTripsResult = await supabase
          .from('trips')
          .select(`
            *,
            trip_collaborators!inner(permission_level)
          `)
          .eq('trip_collaborators.user_id', user.id);
      } catch (error) {
        console.log('Collaboration features not available (missing schema):', error);
        // Continue with empty shared trips if collaboration tables don't exist
      }

      // Combine owned and shared trips
      const ownedTrips = ownedTripsResult.data || [];
      const sharedTrips = (sharedTripsResult.data || [])
        .map((item: any) => item?.trips)
        .filter((trip: any) => trip !== null);

      const allRemoteTrips = [...ownedTrips, ...sharedTrips];

      // Get local trips
      const localTrips = await this.getLocalTrips();

      // Merge and resolve conflicts with collaboration awareness
      const mergedTrips = this.mergeTripsWithCollaboration(localTrips, allRemoteTrips, user.id);

      // Save merged trips locally and remotely
      await this.saveTripsWithCollaboration(mergedTrips, user.id);

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
  private conflictCallback?: (conflictedTrips: Trip[]) => Promise<void>;

  setLocalDataCallbacks(
    getLocalTrips: () => Promise<Trip[]>,
    saveLocalTrips: (trips: Trip[]) => Promise<void>
  ) {
    this.getLocalTripsCallback = getLocalTrips;
    this.saveLocalTripsCallback = saveLocalTrips;
  }

  setConflictCallback(conflictHandler: (conflictedTrips: Trip[]) => Promise<void>) {
    this.conflictCallback = conflictHandler;
  }

  startPeriodicSync(intervalMinutes: number = 5): void {
    this.stopPeriodicSync(); // Clear any existing interval
    
    this.syncInterval = setInterval(() => {
      const authState = authService.getState();
      if (authState.user && !authState.loading && this.syncStatus.online && !this.syncStatus.syncing) {
        this.syncTrips().catch(console.error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }


  private mergeTripsWithCollaboration(localTrips: Trip[], remoteTrips: any[], userId: string): Trip[] {
    const tripMap = new Map<string, Trip>();

    // Add local trips
    localTrips.forEach(trip => {
      tripMap.set(trip.id, trip);
    });

    // Merge remote trips with collaboration awareness
    remoteTrips.forEach(remoteTrip => {
      const localTrip = tripMap.get(remoteTrip.id);
      const isOwner = remoteTrip.user_id === userId;

      // For shared trips, always prefer server version if it's newer
      // For owned trips, use version numbers for conflict detection
      if (!localTrip || this.shouldUseRemoteVersion(localTrip, remoteTrip, isOwner)) {
        tripMap.set(remoteTrip.id, this.convertRemoteTripToLocal(remoteTrip));
      } else if (localTrip && this.hasVersionConflict(localTrip, remoteTrip)) {
        // Mark trip for conflict resolution
        const conflictedTrip = this.convertRemoteTripToLocal(remoteTrip);
        conflictedTrip.version = -1; // Special marker for conflicts
        tripMap.set(remoteTrip.id, conflictedTrip);
      }
    });

    return Array.from(tripMap.values());
  }

  private shouldUseRemoteVersion(localTrip: Trip, remoteTrip: any, isOwner: boolean): boolean {
    // For shared trips (not owner), always prefer remote
    if (!isOwner) {
      return new Date(remoteTrip.updated_at) > new Date(localTrip.updatedAt);
    }

    // For owned trips, use version numbers
    const localVersion = localTrip.version || 0;
    const remoteVersion = remoteTrip.version || 0;

    return remoteVersion > localVersion;
  }

  private hasVersionConflict(localTrip: Trip, remoteTrip: any): boolean {
    const localVersion = localTrip.version || 0;
    const remoteVersion = remoteTrip.version || 0;

    // Conflict if local version is higher than remote (user made changes that weren't synced)
    return localVersion > remoteVersion;
  }

  private convertRemoteTripToLocal(remoteTrip: any): Trip {
    return {
      id: remoteTrip.id,
      name: remoteTrip.name,
      startDate: remoteTrip.start_date,
      endDate: remoteTrip.end_date,
      notes: remoteTrip.notes || '',
      accommodation: remoteTrip.accommodation || undefined,
      travelingParty: remoteTrip.traveling_party || undefined,
      days: remoteTrip.days || [],
      createdAt: remoteTrip.created_at,
      updatedAt: remoteTrip.updated_at,
      ownerId: remoteTrip.user_id,
      isShared: remoteTrip.is_shared,
      lastModifiedBy: remoteTrip.last_modified_by,
      version: remoteTrip.version || 0
    };
  }


  private async saveTripsWithCollaboration(trips: Trip[], userId: string): Promise<void> {
    // Separate owned trips from shared trips
    const ownedTrips = trips.filter(trip => trip.ownerId === userId);
    // Note: sharedTrips are read-only for collaborators

    // Only save owned trips to Supabase (shared trips are read-only for collaborators)
    if (ownedTrips.length > 0) {
      const tripsForSupabase = ownedTrips.map(trip => ({
        id: trip.id,
        user_id: userId,
        name: trip.name,
        start_date: trip.startDate,
        end_date: trip.endDate,
        notes: trip.notes || null,
        accommodation: trip.accommodation || null,
        traveling_party: trip.travelingParty || null,
        days: trip.days,
        is_shared: trip.isShared || false,
        last_modified_by: trip.lastModifiedBy || null,
        version: trip.version || 0,
        created_at: trip.createdAt,
        updated_at: trip.updatedAt
      }));

      const { error } = await supabase
        .from('trips')
        .upsert(tripsForSupabase, { onConflict: 'id' });

      if (error) throw error;
    }

    // Save all trips (owned + shared) locally
    if (this.saveLocalTripsCallback) {
      await this.saveLocalTripsCallback(trips);
    }

    // Notify about conflicts if any trips have version -1
    const conflictedTrips = trips.filter(trip => trip.version === -1);
    if (conflictedTrips.length > 0 && this.conflictCallback) {
      await this.conflictCallback(conflictedTrips);
    }
  }

  async uploadTrip(trip: Trip): Promise<void> {
    const user = authService.getState().user;
    if (!user || !this.syncStatus.online) {
      // Queue for later sync if offline
      return;
    }

    // Build the trip object with basic fields first
    const tripData: any = {
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
    };

    // Add collaboration fields if they exist in the trip object
    if (trip.isShared !== undefined) tripData.is_shared = trip.isShared;
    if (trip.lastModifiedBy !== undefined) tripData.last_modified_by = trip.lastModifiedBy || user.id;
    if (trip.version !== undefined) tripData.version = (trip.version || 0) + 1;

    const { error } = await supabase
      .from('trips')
      .upsert(tripData, { onConflict: 'id' });

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