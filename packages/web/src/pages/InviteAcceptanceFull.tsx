import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Calendar, MapPin, Clock, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { authService, invitationService } from '@waylight/shared';
import type { TripInvitation } from '@waylight/shared';
import AuthModal from '../components/auth/AuthModal';

const InviteAcceptanceFull: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<TripInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    checkAuthState();
    loadInvitation();

    // Subscribe to auth changes to automatically process invitation when user signs in
    const unsubscribe = authService.subscribe((authState) => {
      setUser(authState.user);

      // If user just signed in and modal is open, close modal and process invitation
      if (authState.user && showAuthModal) {
        setShowAuthModal(false);
        // Small delay to ensure state is updated
        setTimeout(() => {
          handleAcceptInvitation();
        }, 100);
      }
    });

    return unsubscribe;
  }, [token, showAuthModal]);

  const checkAuthState = () => {
    const authState = authService.getState();
    setUser(authState.user);
  };

  const loadInvitation = async () => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const invitationData = await invitationService.getInvitationByToken(token);
      setInvitation(invitationData);
    } catch (err) {
      console.error('Failed to load invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token || !user || !invitation) return;

    // Check if user email matches invitation email
    if (user.email !== invitation.invitedEmail) {
      setError(`This invitation was sent to ${invitation.invitedEmail}, but you're signed in as ${user.email}. Please sign in with the correct account or contact the trip organizer.`);
      return;
    }

    try {
      setAccepting(true);
      await invitationService.acceptInvitation(token);

      // Navigate to the trip
      navigate(`/trip/${invitation.tripId}`, {
        replace: true,
        state: { message: 'Successfully joined the trip!' }
      });
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!token) return;

    try {
      await invitationService.declineInvitation(token);
      setError('Invitation declined');
    } catch (err) {
      console.error('Failed to decline invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to decline invitation');
    }
  };

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sea-50 to-mint-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sea mx-auto mb-4"></div>
          <p className="text-slate-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invitation Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-sea text-white px-6 py-2 rounded-lg hover:bg-sea-dark transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invitation Not Found</h1>
          <p className="text-slate-600 mb-6">This invitation may have expired or been removed.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-sea text-white px-6 py-2 rounded-lg hover:bg-sea-dark transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sea-50 to-mint-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sea to-mint text-white p-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">🎢 You're Invited!</h1>
          <p className="text-sea-100">Join a collaborative trip planning adventure</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Trip Information */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{invitation.tripName || 'Trip Invitation'}</h2>
            <div className="flex items-center text-slate-600 mb-2">
              <Users className="w-4 h-4 mr-2" />
              <span>Invited by <strong>{invitation.inviterName || 'Trip organizer'}</strong></span>
            </div>


            <div className="flex items-center text-slate-600 mb-4">
              <MapPin className="w-4 h-4 mr-2" />
              <span>Permission Level: <strong className="capitalize">{invitation.permissionLevel}</strong></span>
            </div>

            {invitation.message && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <p className="text-blue-800 italic">"{invitation.message}"</p>
              </div>
            )}
          </div>


          {/* Expiration Notice */}
          {isExpired ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center text-red-800">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-semibold">This invitation has expired</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center text-amber-800">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-semibold">
                  Expires on {new Date(invitation.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Email Mismatch Warning */}
          {user && invitation && user.email !== invitation.invitedEmail && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center text-orange-800">
                <XCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Email Mismatch</span>
              </div>
              <p className="text-orange-700 text-sm mt-1">
                This invitation was sent to <strong>{invitation.invitedEmail}</strong>, but you're signed in as <strong>{user.email}</strong>.
                Please sign in with the correct account or contact the trip organizer.
              </p>
            </div>
          )}

          {/* Actions */}
          {!user ? (
            <div className="text-center">
              <p className="text-slate-600 mb-6">
                You need to sign in to accept this invitation
              </p>
              <button
                onClick={handleSignIn}
                className="bg-sea text-white px-8 py-3 rounded-lg font-semibold hover:bg-sea-dark transition-colors flex items-center gap-2 mx-auto"
              >
                <LogIn className="w-5 h-5" />
                Sign In to Accept
              </button>
            </div>
          ) : isExpired ? (
            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="bg-slate-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-colors"
              >
                Go to Home
              </button>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleAcceptInvitation}
                disabled={accepting || (user && invitation && user.email !== invitation.invitedEmail)}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Accept Invitation
                  </>
                )}
              </button>

              <button
                onClick={handleDeclineInvitation}
                disabled={accepting}
                className="bg-slate-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Decline
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>This invitation was sent by Waylight on behalf of {invitation.inviterName || 'Trip organizer'}</p>
            <p className="mt-1">
              If you didn't expect this invitation, you can safely ignore it.
            </p>

          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="signin"
      />
    </div>
  );
};

export default InviteAcceptanceFull;