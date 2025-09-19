import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TripInvitation,
  TripCollaborator,
  invitationService,
  authService
} from '@waylight/shared';
import { MapPin, Calendar, Users, CheckCircle, XCircle, Mail, Clock } from 'lucide-react';
import AuthModal from '../auth/AuthModal';

const InvitationAcceptancePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<TripInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [currentUser, setCurrentUser] = useState(authService.getState().user);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((authState) => {
      setCurrentUser(authState.user);

      // If user just logged in and modal is open, close it and try to accept invitation
      if (authState.user && showAuthModal) {
        setShowAuthModal(false);
        // Small delay to ensure state is updated
        setTimeout(() => {
          processInvitationAcceptance();
        }, 100);
      }
    });

    return unsubscribe;
  }, [showAuthModal]);

  useEffect(() => {
    if (token) {
      loadInvitationDetails();
    }
  }, [token]);

  const loadInvitationDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!token) {
        throw new Error('No invitation token provided');
      }

      // Use the real API call to get invitation by token
      const invitationData = await invitationService.getInvitationByToken(token);
      setInvitation(invitationData);

    } catch (error) {
      console.error('Failed to load invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load invitation details';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const processInvitationAcceptance = async () => {
    if (!currentUser || !token) return;

    try {
      setIsProcessing(true);
      setError(null);

      const collaborator: TripCollaborator = await invitationService.acceptInvitation(token);

      setSuccess('Invitation accepted successfully! Redirecting to trip...');

      // Redirect to the trip after a short delay
      setTimeout(() => {
        navigate(`/trip/${collaborator.tripId}`);
      }, 2000);

    } catch (error) {
      console.error('Failed to accept invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!currentUser) {
      // Show authentication modal instead of redirecting
      setShowAuthModal(true);
      return;
    }

    await processInvitationAcceptance();
  };

  const handleDeclineInvitation = async () => {
    if (!token) return;

    if (!confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      await invitationService.declineInvitation(token);

      setSuccess('Invitation declined.');

      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Failed to decline invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to decline invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPermissionDescription = (permission: string): string => {
    switch (permission) {
      case 'view':
        return 'You can view trip details but cannot make changes';
      case 'edit':
        return 'You can view and edit trip details';
      case 'admin':
        return 'You can view, edit, and manage trip collaborators';
      default:
        return 'Unknown permission level';
    }
  };

  const getPermissionColor = (permission: string): string => {
    switch (permission) {
      case 'view': return 'text-blue-600 bg-blue-100';
      case 'edit': return 'text-green-600 bg-green-100';
      case 'admin': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isExpired = invitation && new Date(invitation.expiresAt) < new Date();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Success!</h1>
            <p className="text-gray-600">{success}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-semibold">Trip Collaboration Invitation</h1>
                <p className="text-blue-100">You've been invited to join a trip!</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {isExpired && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <Clock className="w-5 h-5 inline mr-2" />
                This invitation has expired.
              </div>
            )}

            <div className="space-y-6">
              {/* Trip Details */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Trip Details</span>
                </h2>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{invitation?.tripName}</h3>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Trip planning collaboration</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invitation Details */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Invitation Details</span>
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">{invitation?.inviterName}</span> has invited you to collaborate on this trip.
                    </p>
                  </div>

                  {invitation?.message && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 italic">"{invitation.message}"</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Permission Level:</p>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPermissionColor(invitation?.permissionLevel || '')}`}>
                        {invitation?.permissionLevel}
                      </span>
                      <span className="text-sm text-gray-600">
                        {getPermissionDescription(invitation?.permissionLevel || '')}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>Invitation sent to: <span className="font-medium">{invitation?.invitedEmail}</span></p>
                    <p>Expires: <span className="font-medium">
                      {invitation ? new Date(invitation.expiresAt).toLocaleDateString() : ''}
                    </span></p>
                  </div>
                </div>
              </div>

              {/* Authentication Notice */}
              {!currentUser && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800">
                    You'll need to sign in or create an account to accept this invitation.
                  </p>
                </div>
              )}

              {/* Email Mismatch Warning */}
              {currentUser && invitation && currentUser.email !== invitation.invitedEmail && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800">
                    This invitation was sent to <span className="font-medium">{invitation.invitedEmail}</span>,
                    but you're signed in as <span className="font-medium">{currentUser.email}</span>.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleDeclineInvitation}
              disabled={isProcessing || isExpired}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Decline
            </button>

            <button
              onClick={handleAcceptInvitation}
              disabled={isProcessing || isExpired}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{isProcessing ? 'Processing...' : 'Accept Invitation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default InvitationAcceptancePage;