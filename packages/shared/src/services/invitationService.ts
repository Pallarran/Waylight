import { supabase } from './supabase';
import { authService } from './auth';
import type {
  TripInvitation,
  TripCollaborator,
  InvitationRequest,
  PermissionLevel,
  InvitationStatus
} from '../types';

export class InvitationService {
  private static instance: InvitationService;

  static getInstance(): InvitationService {
    if (!InvitationService.instance) {
      InvitationService.instance = new InvitationService();
    }
    return InvitationService.instance;
  }

  async sendInvitation(request: InvitationRequest): Promise<TripInvitation> {
    const currentUser = authService.getState().user;
    if (!currentUser) {
      throw new Error('User must be authenticated to send invitations');
    }

    // Check if user has permission to invite (owner or admin)
    const hasPermission = await this.checkInvitePermission(request.tripId, currentUser.id);
    if (!hasPermission) {
      throw new Error('You do not have permission to invite collaborators to this trip');
    }

    // Check if email is already invited or collaborating
    const existingInvitation = await this.getExistingInvitation(request.tripId, request.email);
    if (existingInvitation && existingInvitation.status === 'pending') {
      throw new Error('An invitation has already been sent to this email address');
    }

    const existingCollaborator = await this.getExistingCollaborator(request.tripId, request.email);
    if (existingCollaborator) {
      throw new Error('This person is already collaborating on this trip');
    }

    // Generate invitation token and expiry
    const invitationToken = this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (request.expiresInDays || 7));

    // Create invitation in database
    const { data, error } = await supabase
      .from('trip_invitations')
      .insert({
        trip_id: request.tripId,
        invited_email: request.email.toLowerCase(),
        invited_by: currentUser.id,
        permission_level: request.permissionLevel,
        invitation_token: invitationToken,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        message: request.message || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invitation: ${error.message}`);
    }

    // Send email invitation (you would integrate with your email service here)
    await this.sendInvitationEmail(data, currentUser);

    // Log activity
    await this.logTripActivity(
      request.tripId,
      currentUser.id,
      'shared',
      `Invited ${request.email} to collaborate on the trip`,
      { invitedEmail: request.email, permissionLevel: request.permissionLevel }
    );

    return this.formatInvitation(data);
  }

  async acceptInvitation(token: string): Promise<TripCollaborator> {
    const currentUser = authService.getState().user;
    if (!currentUser) {
      throw new Error('User must be authenticated to accept invitations');
    }

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      await this.updateInvitationStatus(invitation.id, 'expired');
      throw new Error('This invitation has expired');
    }

    // Check if invited email matches current user
    if (invitation.invited_email.toLowerCase() !== currentUser.email?.toLowerCase()) {
      throw new Error('This invitation was sent to a different email address');
    }

    // Check if user is already a collaborator
    const existingCollaborator = await this.getExistingCollaboratorByUserId(invitation.trip_id, currentUser.id);
    if (existingCollaborator) {
      throw new Error('You are already a collaborator on this trip');
    }

    // Create collaborator record
    const { data: collaborator, error: collabError } = await supabase
      .from('trip_collaborators')
      .insert({
        trip_id: invitation.trip_id,
        user_id: currentUser.id,
        permission_level: invitation.permission_level,
        invited_by: invitation.invited_by,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (collabError) {
      throw new Error(`Failed to add collaborator: ${collabError.message}`);
    }

    // Update invitation status
    await this.updateInvitationStatus(invitation.id, 'accepted');

    // Mark trip as shared
    await this.markTripAsShared(invitation.trip_id);

    // Log activity
    await this.logTripActivity(
      invitation.trip_id,
      currentUser.id,
      'joined',
      `${currentUser.email} joined the trip as a collaborator`,
      { permissionLevel: invitation.permission_level }
    );

    return this.formatCollaborator(collaborator);
  }

  async declineInvitation(token: string): Promise<void> {
    const { data: invitation, error } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (error || !invitation) {
      throw new Error('Invalid invitation');
    }

    await this.updateInvitationStatus(invitation.id, 'declined');

    // Log activity
    await this.logTripActivity(
      invitation.trip_id,
      invitation.invited_by,
      'updated',
      `Invitation to ${invitation.invited_email} was declined`,
      { invitedEmail: invitation.invited_email }
    );
  }

  async removeCollaborator(tripId: string, collaboratorId: string): Promise<void> {
    const currentUser = authService.getState().user;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Check if user has permission to remove collaborators
    const hasPermission = await this.checkRemovePermission(tripId, currentUser.id, collaboratorId);
    if (!hasPermission) {
      throw new Error('You do not have permission to remove this collaborator');
    }

    // Get collaborator details for logging
    const { data: collaborator } = await supabase
      .from('trip_collaborators')
      .select('*, profiles(email)')
      .eq('id', collaboratorId)
      .single();

    // Remove collaborator
    const { error } = await supabase
      .from('trip_collaborators')
      .delete()
      .eq('id', collaboratorId)
      .eq('trip_id', tripId);

    if (error) {
      throw new Error(`Failed to remove collaborator: ${error.message}`);
    }

    // Log activity
    if (collaborator) {
      await this.logTripActivity(
        tripId,
        currentUser.id,
        'left',
        `${collaborator.profiles?.email || 'User'} was removed from the trip`,
        { removedBy: currentUser.id }
      );
    }
  }

  async updateCollaboratorPermission(tripId: string, collaboratorId: string, newPermission: PermissionLevel): Promise<void> {
    const currentUser = authService.getState().user;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    // Check if user has admin permission
    const hasPermission = await this.checkAdminPermission(tripId, currentUser.id);
    if (!hasPermission) {
      throw new Error('You do not have permission to change collaborator permissions');
    }

    const { error } = await supabase
      .from('trip_collaborators')
      .update({
        permission_level: newPermission,
        updated_at: new Date().toISOString()
      })
      .eq('id', collaboratorId)
      .eq('trip_id', tripId);

    if (error) {
      throw new Error(`Failed to update permissions: ${error.message}`);
    }

    // Log activity
    await this.logTripActivity(
      tripId,
      currentUser.id,
      'updated',
      `Updated collaborator permissions to ${newPermission}`,
      { collaboratorId, newPermission }
    );
  }

  async getTripCollaborators(tripId: string): Promise<TripCollaborator[]> {
    const { data, error } = await supabase
      .from('trip_collaborators')
      .select('*')
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch collaborators: ${error.message}`);
    }

    return (data || []).map(this.formatCollaborator);
  }

  async getTripInvitations(tripId: string): Promise<TripInvitation[]> {
    const { data, error } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }

    return (data || []).map(this.formatInvitation);
  }

  async getInvitationByToken(token: string): Promise<TripInvitation> {
    // First get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('invitation_token', token)
      .maybeSingle();

    if (inviteError) {
      throw new Error(`Failed to load invitation: ${inviteError.message}`);
    }

    if (!invitation) {
      throw new Error('Invitation not found or has already been responded to');
    }

    // Get trip details separately
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, name, start_date, end_date, user_id')
      .eq('id', invitation.trip_id)
      .maybeSingle();

    if (tripError) {
      console.warn('Could not load trip details:', tripError);
    }

    // Get inviter details separately (optional)
    const { data: inviter, error: inviterError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', invitation.invited_by)
      .maybeSingle();

    if (inviterError) {
      console.warn('Could not load inviter details:', inviterError);
    }

    // Format the response
    return {
      id: invitation.id,
      tripId: invitation.trip_id,
      tripName: trip?.name || 'Trip',
      invitedEmail: invitation.invited_email,
      invitedBy: invitation.invited_by,
      inviterName: inviter?.full_name || inviter?.email || 'Someone',
      permissionLevel: invitation.permission_level,
      invitationToken: invitation.invitation_token,
      status: invitation.status,
      expiresAt: invitation.expires_at,
      message: invitation.message,
      createdAt: invitation.created_at,
      updatedAt: invitation.updated_at
    };
  }

  async getUserInvitations(email: string): Promise<TripInvitation[]> {
    const { data, error } = await supabase
      .from('trip_invitations')
      .select(`
        *,
        profiles!trip_invitations_invited_by_fkey(full_name),
        trips!trip_invitations_trip_id_fkey(name)
      `)
      .eq('invited_email', email.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user invitations: ${error.message}`);
    }

    return (data || []).map(this.formatInvitation);
  }

  // Private helper methods
  private async checkInvitePermission(tripId: string, userId: string): Promise<boolean> {
    // Check if user is trip owner
    const { data: trip } = await supabase
      .from('trips')
      .select('user_id')
      .eq('id', tripId)
      .single();

    if (trip?.user_id === userId) return true;

    // Check if user is admin collaborator
    const { data: collaborator } = await supabase
      .from('trip_collaborators')
      .select('permission_level')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    return collaborator?.permission_level === 'admin';
  }

  private async checkRemovePermission(tripId: string, userId: string, collaboratorId: string): Promise<boolean> {
    // Users can always remove themselves
    const { data: collaborator } = await supabase
      .from('trip_collaborators')
      .select('user_id')
      .eq('id', collaboratorId)
      .single();

    if (collaborator?.user_id === userId) return true;

    // Otherwise, need admin permission
    return await this.checkAdminPermission(tripId, userId);
  }

  private async checkAdminPermission(tripId: string, userId: string): Promise<boolean> {
    // Check if user is trip owner
    const { data: trip } = await supabase
      .from('trips')
      .select('user_id')
      .eq('id', tripId)
      .single();

    if (trip?.user_id === userId) return true;

    // Check if user is admin collaborator
    const { data: collaborator } = await supabase
      .from('trip_collaborators')
      .select('permission_level')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    return collaborator?.permission_level === 'admin';
  }

  private async getExistingInvitation(tripId: string, email: string): Promise<any> {
    const { data, error } = await supabase
      .from('trip_invitations')
      .select('*')
      .eq('trip_id', tripId)
      .eq('invited_email', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 when no rows found

    // Ignore "no rows" errors, but throw on actual database errors
    if (error && error.code !== 'PGRST116') {
      console.error('Database error checking existing invitation:', error);
      throw error;
    }

    return data;
  }

  private async getExistingCollaborator(_tripId: string, _email: string): Promise<any> {
    // For now, just return null since we can't easily check email without profile joins
    // This will be improved when we have proper user profile system
    return null;
  }

  private async getExistingCollaboratorByUserId(tripId: string, userId: string): Promise<any> {
    const { data } = await supabase
      .from('trip_collaborators')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .single();

    return data;
  }

  private async updateInvitationStatus(invitationId: string, status: InvitationStatus): Promise<void> {
    await supabase
      .from('trip_invitations')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId);
  }

  private async markTripAsShared(tripId: string): Promise<void> {
    await supabase
      .from('trips')
      .update({
        is_shared: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tripId);
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

  private generateInvitationToken(): string {
    return `invite_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private async sendInvitationEmail(invitation: any, inviter: any): Promise<void> {
    console.log('🚀 Starting email send process for:', invitation.invited_email);
    const startTime = Date.now();

    try {
      // Get the current user session for authentication
      console.log('🔑 Getting user session...');
      const sessionStart = Date.now();
      const { data: { session } } = await supabase.auth.getSession();
      console.log(`✅ Session retrieved in ${Date.now() - sessionStart}ms`);

      if (!session) {
        throw new Error('No active session for sending email');
      }

      // Get trip details for email
      console.log('📋 Getting trip details...');
      const { data: trip } = await supabase
        .from('trips')
        .select('name')
        .eq('id', invitation.trip_id)
        .maybeSingle();

      // Prepare email data
      console.log('📋 Preparing email data...');
      const emailData = {
        invitationId: invitation.id,
        invitedEmail: invitation.invited_email,
        inviterName: inviter.fullName || inviter.email,
        tripName: trip?.name || `Trip (${invitation.trip_id.slice(0, 8)})`,
        invitationToken: invitation.invitation_token,
        permissionLevel: invitation.permission_level,
        message: invitation.message,
        expiresAt: invitation.expires_at
      };
      console.log('📧 Email data prepared:', {
        to: emailData.invitedEmail,
        tripName: emailData.tripName,
        permission: emailData.permissionLevel
      });

      // Call the Supabase Edge Function with timeout
      console.log('🌐 Calling Edge Function...');
      const edgeFunctionStart = Date.now();

      const { data, error } = await Promise.race([
        supabase.functions.invoke('send-invitation-simple', {
          body: emailData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
        )
      ]) as any;

      const edgeFunctionTime = Date.now() - edgeFunctionStart;
      console.log(`📤 Edge Function completed in ${edgeFunctionTime}ms`);

      if (error) {
        console.error('❌ Email sending failed:', error);
        throw new Error(`Failed to send invitation email: ${error.message}`);
      }

      const totalTime = Date.now() - startTime;
      console.log(`✅ Invitation email sent successfully in ${totalTime}ms:`, {
        emailId: data?.emailId,
        recipient: invitation.invited_email,
        timing: {
          session: `${Date.now() - sessionStart}ms`,
          edgeFunction: `${edgeFunctionTime}ms`,
          total: `${totalTime}ms`
        }
      });

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ Error in sendInvitationEmail after ${totalTime}ms:`, error);

      // Fallback: Log the invitation details for manual processing
      console.log('📧 Invitation email details (for manual sending):', {
        to: invitation.invited_email,
        from: inviter.email,
        subject: `You're invited to collaborate on "${invitation.trips?.name || 'a trip'}"`,
        invitationUrl: `${this.getAppUrl()}/invite/${invitation.invitation_token}`,
        message: invitation.message,
        permissionLevel: invitation.permission_level,
        expiresAt: invitation.expires_at
      });

      // IMPORTANT: Now we DO throw the error so users get feedback
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}. The invitation was created but email delivery failed.`);
    }
  }

  private getAppUrl(): string {
    // Try to get app URL from environment or fallback to current location
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }

    // For server-side or environments where window is not available
    return process.env.VITE_APP_URL ||
           process.env.APP_URL ||
           'https://waylight.app';
  }

  private formatCollaborator(data: any): TripCollaborator {
    return {
      id: data.id,
      tripId: data.trip_id,
      userId: data.user_id,
      userEmail: data.user_id, // We'll use user_id as placeholder for email
      userFullName: data.user_id, // We'll use user_id as placeholder for name
      permissionLevel: data.permission_level,
      invitedBy: data.invited_by,
      joinedAt: data.joined_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private formatInvitation(data: any): TripInvitation {
    return {
      id: data.id,
      tripId: data.trip_id,
      tripName: 'Trip', // Placeholder since we're not fetching trip details
      invitedEmail: data.invited_email,
      invitedBy: data.invited_by,
      inviterName: data.invited_by, // Use user ID as placeholder
      permissionLevel: data.permission_level,
      invitationToken: data.invitation_token,
      status: data.status,
      expiresAt: data.expires_at,
      message: data.message,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export const invitationService = InvitationService.getInstance();