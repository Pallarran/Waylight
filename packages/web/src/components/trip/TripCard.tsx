import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { Calendar, Clock, MoreVertical, XCircle, Users, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTripStore } from '../../stores';
import TripSharingModal from '../collaboration/TripSharingModal';
import CollaborationIndicator from '../collaboration/CollaborationIndicator';

import type { Trip } from '../../types';

interface TripCardProps {
  trip: Trip;
  isActive?: boolean;
  onClick?: () => void;
}

export default function TripCard({ trip, isActive = false, onClick }: TripCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const { setActiveTrip, deleteTripById } = useTripStore();

  // Close menu when modal opens
  useEffect(() => {
    if (showSharingModal) {
      setShowMenu(false);
    }
  }, [showSharingModal]);

  const startDate = new Date(trip.startDate + 'T00:00:00');
  const endDate = new Date(trip.endDate + 'T00:00:00');
  const today = new Date();
  const duration = differenceInDays(endDate, startDate) + 1;

  const isUpcoming = isAfter(startDate, today);
  const isOngoing = !isBefore(endDate, today) && !isAfter(startDate, today);
  const isPast = isBefore(endDate, today);

  const getStatusBadge = () => {
    if (isOngoing) {
      return <span className="badge badge-primary">Ongoing</span>;
    }
    if (isUpcoming) {
      return <span className="badge badge-secondary">Upcoming</span>;
    }
    if (isPast) {
      return <span className="badge bg-ink/10 text-ink-light">Past</span>;
    }
    
    return <span className="badge badge-secondary">Unknown</span>;
  };

  const handleSetActive = () => {
    setActiveTrip(trip.id);
    onClick?.();
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      try {
        await deleteTripById(trip.id);
      } catch (error) {
        console.error('Failed to delete trip:', error);
      }
    }
    setShowMenu(false);
  };

  return (
    <div 
      className={`card-interactive p-6 relative transition-all duration-200 ease-out hover:shadow-medium hover:-translate-y-0.5 ${isActive ? 'ring-2 ring-sea/20 border-sea/20' : ''}`}
      onClick={handleSetActive}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-ink mb-2">{trip.name}</h3>
          {getStatusBadge()}
        </div>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-lg hover:bg-surface-dark/50 transition-all duration-150 ease-out hover:scale-105"
          >
            <MoreVertical className="w-4 h-4 text-ink-light" />
          </button>
          
          {showMenu && (
            <div
              className="absolute right-0 top-10 bg-white rounded-lg shadow-medium border border-surface-dark/50 py-2 z-20 min-w-[140px] animate-slide-down"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSetActive();
                  setShowMenu(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-surface-dark/50 transition-colors duration-150"
              >
                Set Active
              </button>
              <hr className="my-1 border-surface-dark/30" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-ink-light">
          <Calendar className="w-4 h-4 mr-3" />
          <span className="text-sm">
            {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
          </span>
        </div>

        <div className="flex items-center text-ink-light">
          <Clock className="w-4 h-4 mr-3" />
          <span className="text-sm">
            {duration} day{duration !== 1 ? 's' : ''}
          </span>
        </div>


        {/* Collaboration indicator */}
        <CollaborationIndicator
          tripId={trip.id}
          className="border-t border-surface-dark/50 pt-3 -mb-1"
        />
      </div>

      {trip.notes && (
        <div className="mt-4 pt-4 border-t border-surface-dark/50">
          <p className="text-sm text-ink-light line-clamp-2">{trip.notes}</p>
        </div>
      )}

      {isActive && (
        <div className="absolute top-4 left-4 animate-scale-in">
          <div className="w-3 h-3 bg-sea rounded-full animate-pulse-soft"></div>
        </div>
      )}

      {/* Trip Sharing Modal */}
      <TripSharingModal
        tripId={trip.id}
        tripName={trip.name}
        isOpen={showSharingModal}
        onClose={() => setShowSharingModal(false)}
        onSuccess={() => {
          // Optionally refresh trip data or show success message
          console.log('Trip shared successfully');
        }}
      />
    </div>
  );
}