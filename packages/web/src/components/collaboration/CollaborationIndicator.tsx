import React, { useState, useEffect } from 'react';
import { Users, Activity, Clock, User } from 'lucide-react';
import {
  CollaborationContext,
  collaborationService
} from '@waylight/shared';

interface CollaborationIndicatorProps {
  tripId: string;
  className?: string;
  showActivityFeed?: boolean;
}

const CollaborationIndicator: React.FC<CollaborationIndicatorProps> = ({
  tripId,
  className = '',
  showActivityFeed = false
}) => {
  const [context, setContext] = useState<CollaborationContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [realtimeUpdates, setRealtimeUpdates] = useState<string[]>([]);

  useEffect(() => {
    // Temporarily disabled due to RLS/schema issues
    console.log('CollaborationIndicator temporarily disabled');
    setIsLoading(false);
    return;

    loadCollaborationContext();
    setupRealtimeSubscription();

    return () => {
      // Cleanup realtime subscription
    };
  }, [tripId]);

  const loadCollaborationContext = async () => {
    try {
      setIsLoading(true);
      const contextData = await collaborationService.getCollaborationContext(tripId);
      setContext(contextData);
    } catch (error) {
      console.error('Failed to load collaboration context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    try {
      const unsubscribe = await collaborationService.subscribeToTripChanges(
        tripId,
        (changes) => {
          // Handle trip updates
          setRealtimeUpdates(prev => [
            `Trip updated by ${changes.last_modified_by || 'someone'}`,
            ...prev.slice(0, 4)
          ]);
          // Reload context to get fresh data
          loadCollaborationContext();
        },
        (collaborator) => {
          // Handle new collaborator
          setRealtimeUpdates(prev => [
            `${collaborator.userFullName || collaborator.userEmail} joined the trip`,
            ...prev.slice(0, 4)
          ]);
          loadCollaborationContext();
        },
        (collaboratorId) => {
          // Handle collaborator leaving
          setRealtimeUpdates(prev => [
            'A collaborator left the trip',
            ...prev.slice(0, 4)
          ]);
          loadCollaborationContext();
        }
      );

      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Failed to setup realtime subscription:', error);
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  const getPermissionBadgeColor = (permission: string): string => {
    switch (permission) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'edit': return 'bg-green-100 text-green-800';
      case 'view': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!context) {
    return null;
  }

  const { trip, collaborators, userPermission, activityLog } = context;
  const isShared = trip.isShared && collaborators.length > 0;

  if (!isShared) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <User className="w-4 h-4" />
        <span className="text-sm">Private trip</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="relative">
          <Users className="w-4 h-4 text-blue-600" />
          {realtimeUpdates.length > 0 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {collaborators.length + 1} {collaborators.length === 0 ? 'person' : 'people'}
        </span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPermissionBadgeColor(userPermission)}`}>
          {userPermission}
        </span>
      </div>

      {showDetails && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Collaboration Details</span>
            </h3>
          </div>

          {/* Collaborators */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">People on this trip</h4>
            <div className="space-y-2">
              {/* Trip Owner */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {trip.ownerId === context.currentUser.id ? 'You' : 'Trip Owner'}
                  </p>
                  <p className="text-xs text-gray-500">Owner</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  admin
                </span>
              </div>

              {/* Collaborators */}
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {collaborator.userId === context.currentUser.id
                        ? 'You'
                        : collaborator.userFullName || collaborator.userEmail}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined {formatTimeAgo(collaborator.joinedAt)}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPermissionBadgeColor(collaborator.permissionLevel)}`}>
                    {collaborator.permissionLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {showActivityFeed && activityLog.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Recent Activity</span>
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {activityLog.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-900">{activity.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{activity.userName || 'Someone'}</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Updates */}
          {realtimeUpdates.length > 0 && (
            <div className="p-4 bg-green-50 border-t border-gray-200">
              <h4 className="text-sm font-medium text-green-800 mb-2">Live Updates</h4>
              <div className="space-y-1">
                {realtimeUpdates.slice(0, 3).map((update, index) => (
                  <p key={index} className="text-xs text-green-700">
                    {update}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
            <button
              onClick={() => setShowDetails(false)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationIndicator;