import { supabase } from './supabase';
import { authService } from './auth';
import { invitationService } from './invitationService';
import type {
  Trip,
  TripCollaborator,
  PermissionLevel,
  ConflictResolution,
  CollaborationContext,
  TripActivityLogEntry
} from '../types';

export class CollaborationService {
  private static instance: CollaborationService;
  private realtimeChannels: Map<string, any> = new Map();

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  async getCollaborationContext(tripId: string): Promise<CollaborationContext> {
    const currentUser = authService.getState().user;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Get trip data
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError || !tripData) {
      throw new Error('Trip not found');
    }

    // Get user's permission level
    const userPermission = await this.getUserPermission(tripId, currentUser.id);
    if (!userPermission) {
      throw new Error('You do not have access to this trip');
    }

    // Get collaborators
    const collaborators = await invitationService.getTripCollaborators(tripId);

    // Get pending invitations
    const pendingInvitations = await invitationService.getTripInvitations(tripId);

    // Get activity log
    const activityLog = await this.getTripActivityLog(tripId);

    // Format trip data
    const trip: Trip = {
      id: tripData.id,
      name: tripData.name,
      startDate: tripData.start_date,
      endDate: tripData.end_date,
      days: tripData.days || [],
      notes: tripData.notes || undefined,
      accommodation: tripData.accommodation,
      travelingParty: tripData.traveling_party,
      createdAt: tripData.created_at,
      updatedAt: tripData.updated_at,
      ownerId: tripData.user_id,
      isShared: tripData.is_shared,
      lastModifiedBy: tripData.last_modified_by,
      version: tripData.version,
      collaborators
    };

    return {
      currentUser: {
        id: currentUser.id,
        email: currentUser.email!,
        fullName: currentUser.fullName || undefined
      },
      trip,
      userPermission,
      canEdit: userPermission === 'edit' || userPermission === 'admin',
      canAdmin: userPermission === 'admin' || tripData.user_id === currentUser.id,
      collaborators,
      pendingInvitations,
      activityLog
    };
  }

  async updateTripWithConflictResolution(
    tripId: string,
    updates: Partial<Trip>,
    expectedVersion?: number
  ): Promise<{ trip: Trip; conflictResolution?: ConflictResolution }> {
    const currentUser = authService.getState().user;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Check permissions
    const userPermission = await this.getUserPermission(tripId, currentUser.id);
    if (!userPermission || userPermission === 'view') {
      throw new Error('You do not have permission to edit this trip');
    }

    // Get current trip data
    const { data: currentTrip, error: fetchError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (fetchError || !currentTrip) {
      throw new Error('Trip not found');
    }

    // Check for version conflicts
    if (expectedVersion !== undefined && currentTrip.version !== expectedVersion) {
      // Create conflict resolution object
      const conflictResolution: ConflictResolution = {
        tripId,
        conflictType: 'version_mismatch',
        serverVersion: currentTrip.version,
        localVersion: expectedVersion,
        conflictedFields: this.identifyConflictedFields(updates, currentTrip),
        suggestedResolution: this.suggestResolution(updates, currentTrip),
        serverData: {
          name: currentTrip.name,
          days: currentTrip.days,
          notes: currentTrip.notes,
          accommodation: currentTrip.accommodation,
          travelingParty: currentTrip.traveling_party
        },
        localData: updates
      };

      const trip = this.formatTripFromDatabase(currentTrip);
      return { trip, conflictResolution };
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
      last_modified_by: currentUser.id,
      version: (currentTrip.version || 0) + 1
    };

    // Add specific field updates
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.days !== undefined) updateData.days = updates.days;
    if (updates.accommodation !== undefined) updateData.accommodation = updates.accommodation;
    if (updates.travelingParty !== undefined) updateData.traveling_party = updates.travelingParty;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;

    // Update trip
    const { data: updatedTrip, error: updateError } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', tripId)
      .eq('version', currentTrip.version) // Optimistic locking
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        // No rows updated - version conflict
        return this.updateTripWithConflictResolution(tripId, updates, expectedVersion);
      }
      throw new Error(`Failed to update trip: ${updateError.message}`);
    }

    // Log activity
    await this.logTripActivity(
      tripId,
      currentUser.id,
      'updated',
      this.generateUpdateDescription(updates),
      { updatedFields: Object.keys(updates) }
    );

    // Broadcast changes to other collaborators
    await this.broadcastTripChanges(tripId, updates, currentUser.id);

    const trip = this.formatTripFromDatabase(updatedTrip);
    return { trip };
  }

  async resolveConflict(
    tripId: string,
    conflictResolution: ConflictResolution,
    resolution: 'accept_server' | 'accept_local' | 'manual_merge',
    mergedData?: Partial<Trip>
  ): Promise<Trip> {
    const currentUser = authService.getState().user;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    let finalData: Partial<Trip>;

    switch (resolution) {
      case 'accept_server':
        // No update needed, just return current server state
        const { data: serverTrip } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();
        return this.formatTripFromDatabase(serverTrip);

      case 'accept_local':
        finalData = conflictResolution.localData;
        break;

      case 'manual_merge':
        if (!mergedData) {
          throw new Error('Merged data is required for manual merge resolution');
        }
        finalData = mergedData;
        break;

      default:
        throw new Error('Invalid conflict resolution type');
    }

    // Apply the resolved changes
    const result = await this.updateTripWithConflictResolution(
      tripId,
      finalData,
      conflictResolution.serverVersion
    );

    if (result.conflictResolution) {
      throw new Error('Unable to resolve conflict - another update occurred during resolution');
    }

    // Log conflict resolution
    await this.logTripActivity(
      tripId,
      currentUser.id,
      'updated',
      `Resolved conflict using ${resolution} strategy`,
      { conflictType: conflictResolution.conflictType, resolution }
    );

    return result.trip;
  }

  async getUserPermission(tripId: string, userId: string): Promise<PermissionLevel | null> {
    // Check if user is trip owner
    const { data: trip } = await supabase
      .from('trips')
      .select('user_id')
      .eq('id', tripId)
      .single();

    if (trip?.user_id === userId) {
      return 'admin'; // Trip owner has admin permissions
    }

    // Check if user is a collaborator
    const { data: collaborator } = await supabase
      .from('trip_collaborators')
      .select('permission_level')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    return collaborator?.permission_level || null;
  }

  async subscribeToTripChanges(
    tripId: string,
    onUpdate: (changes: any) => void,
    onCollaboratorJoin: (collaborator: TripCollaborator) => void,
    onCollaboratorLeave: (collaboratorId: string) => void
  ): Promise<() => void> {
    const channelName = `trip:${tripId}`;

    // Unsubscribe from existing channel if it exists
    if (this.realtimeChannels.has(channelName)) {
      await supabase.removeChannel(this.realtimeChannels.get(channelName));
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`
        },
        (payload) => {
          onUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_collaborators',
          filter: `trip_id=eq.${tripId}`
        },
        async (payload) => {
          const collaborator = await this.formatCollaboratorFromPayload(payload.new);
          onCollaboratorJoin(collaborator);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'trip_collaborators',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          onCollaboratorLeave(payload.old.id);
        }
      )
      .subscribe();

    this.realtimeChannels.set(channelName, channel);

    // Return unsubscribe function
    return async () => {
      await supabase.removeChannel(channel);
      this.realtimeChannels.delete(channelName);
    };
  }

  async getTripActivityLog(tripId: string, limit: number = 50): Promise<TripActivityLogEntry[]> {
    const { data, error } = await supabase
      .from('trip_activity_log')
      .select(`
        *,
        profiles!trip_activity_log_user_id_fkey(full_name, email)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch activity log: ${error.message}`);
    }

    return (data || []).map(item => ({
      id: item.id,
      tripId: item.trip_id,
      userId: item.user_id,
      userName: item.profiles?.full_name || item.profiles?.email,
      actionType: item.action_type,
      description: item.description,
      metadata: item.metadata,
      createdAt: item.created_at
    }));
  }

  // Private helper methods
  private identifyConflictedFields(localData: Partial<Trip>, serverData: any): string[] {
    const conflicts: string[] = [];

    if (localData.name && localData.name !== serverData.name) conflicts.push('name');
    if (localData.notes && localData.notes !== serverData.notes) conflicts.push('notes');
    if (localData.days && JSON.stringify(localData.days) !== JSON.stringify(serverData.days)) {
      conflicts.push('days');
    }
    if (localData.accommodation && JSON.stringify(localData.accommodation) !== JSON.stringify(serverData.accommodation)) {
      conflicts.push('accommodation');
    }
    if (localData.travelingParty && JSON.stringify(localData.travelingParty) !== JSON.stringify(serverData.traveling_party)) {
      conflicts.push('travelingParty');
    }

    return conflicts;
  }

  private suggestResolution(localData: Partial<Trip>, serverData: any): 'accept_server' | 'accept_local' | 'manual_merge' {
    // Simple heuristic: if only one field conflicts, suggest accept_local
    // If multiple fields conflict, suggest manual_merge
    const conflicts = this.identifyConflictedFields(localData, serverData);

    if (conflicts.length === 0) return 'accept_server';
    if (conflicts.length === 1) return 'accept_local';
    return 'manual_merge';
  }

  private generateUpdateDescription(updates: Partial<Trip>): string {
    const descriptions: string[] = [];

    if (updates.name) descriptions.push('updated trip name');
    if (updates.notes) descriptions.push('updated trip notes');
    if (updates.days) descriptions.push('updated trip itinerary');
    if (updates.accommodation) descriptions.push('updated accommodation details');
    if (updates.travelingParty) descriptions.push('updated traveling party');
    if (updates.startDate || updates.endDate) descriptions.push('updated trip dates');

    return descriptions.length > 0
      ? descriptions.join(', ')
      : 'updated trip details';
  }

  private async broadcastTripChanges(tripId: string, changes: Partial<Trip>, _userId: string): Promise<void> {
    // This would broadcast changes to other connected clients
    // Implementation depends on your realtime setup
    console.log(`📡 Broadcasting changes for trip ${tripId}:`, changes);
  }

  private async logTripActivity(
    tripId: string,
    userId: string,
    actionType: string,
    description: string,
    metadata?: any
  ): Promise<void> {
    await supabase
      .from('trip_activity_log')
      .insert({
        trip_id: tripId,
        user_id: userId,
        action_type: actionType as any,
        description,
        metadata
      });
  }

  private formatTripFromDatabase(data: any): Trip {
    return {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      days: data.days || [],
      notes: data.notes,
      accommodation: data.accommodation,
      travelingParty: data.traveling_party,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      ownerId: data.user_id,
      isShared: data.is_shared,
      lastModifiedBy: data.last_modified_by,
      version: data.version
    };
  }

  private async formatCollaboratorFromPayload(data: any): Promise<TripCollaborator> {
    // Fetch user details
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', data.user_id)
      .single();

    return {
      id: data.id,
      tripId: data.trip_id,
      userId: data.user_id,
      userEmail: profile?.email,
      userFullName: profile?.full_name,
      permissionLevel: data.permission_level,
      invitedBy: data.invited_by,
      joinedAt: data.joined_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export const collaborationService = CollaborationService.getInstance();