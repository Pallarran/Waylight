import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Calendar, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { invitationService, authService } from '@waylight/shared';
import type { TripInvitation } from '@waylight/shared';

const InviteAcceptance: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<TripInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadInvitation();
    checkAuthState();
  }, [token]);

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
    if (!invitation || !user) return;

    try {
      setAccepting(true);
      await invitationService.acceptInvitation(invitation.id);

      // Show success message and redirect to the trip
      navigate(`/trip/${invitation.trip_id}`, {
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
    if (!invitation) return;

    try {
      await invitationService.declineInvitation(invitation.id);
      setError('Invitation declined');
    } catch (err) {
      console.error('Failed to decline invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to decline invitation');
    }
  };

  const handleSignIn = () => {
    // Redirect to sign in with return URL
    navigate('/auth/signin', {
      state: { returnTo: `/invite/${token}` }
    });
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

  const isExpired = new Date(invitation.expires_at) < new Date();

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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{invitation.trip?.name}</h2>
            <div className="flex items-center text-slate-600 mb-2">
              <Users className="w-4 h-4 mr-2" />
              <span>Invited by <strong>{invitation.inviter?.full_name || 'Trip organizer'}</strong></span>
            </div>

            {invitation.trip?.start_date && (
              <div className="flex items-center text-slate-600 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {new Date(invitation.trip.start_date).toLocaleDateString()} - {' '}
                  {invitation.trip.end_date ? new Date(invitation.trip.end_date).toLocaleDateString() : 'TBD'}
                </span>
              </div>
            )}

            <div className="flex items-center text-slate-600 mb-4">
              <MapPin className="w-4 h-4 mr-2" />
              <span>Permission Level: <strong className="capitalize">{invitation.permission_level}</strong></span>
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
              <p className="text-red-600 text-sm mt-1">
                Expired on {new Date(invitation.expires_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center text-amber-800">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-semibold">
                  Expires on {new Date(invitation.expires_at).toLocaleDateString()}
                </span>
              </div>
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
                className="bg-sea text-white px-8 py-3 rounded-lg font-semibold hover:bg-sea-dark transition-colors"
              >
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
                disabled={accepting}
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
                className="bg-slate-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>This invitation was sent by Waylight on behalf of {invitation.inviter?.full_name}</p>
            <p className="mt-1">
              If you didn't expect this invitation, you can safely ignore it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteAcceptance;