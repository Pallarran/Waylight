import { useState, useEffect } from 'react';
import { Plus, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useTripStore } from '../stores';
import CreateTripModal from '../components/trip/CreateTripModal';
import TripCard from '../components/trip/TripCard';
import TripDayPlanner from '../components/trip/TripDayPlanner';

export default function TripBuilderWorking() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { trips, activeTrip, isLoading, error, loadTrips, clearError, createNewTrip, setActiveTrip } = useTripStore();

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleCreateTrip = () => {
    setShowCreateModal(true);
  };

  const handleCloseError = () => {
    clearError();
  };

  const handleQuickCreate = async () => {
    try {
      await createNewTrip('My Disney Trip', '2024-12-01', '2024-12-07');
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };


  return (
    <div className="container-waylight section-padding">
      {!activeTrip && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ink mb-4">Trip Builder</h1>
              <p className="text-ink-light">Create and manage your Walt Disney World vacation plans.</p>
            </div>
            <button
              onClick={handleCreateTrip}
              className="btn-primary"
              disabled={isLoading}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Trip
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={handleCloseError}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && trips.length === 0 ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-sea animate-spin mx-auto mb-4" />
          <p className="text-ink-light">Loading your trips...</p>
        </div>
      ) : trips.length === 0 ? (
        // Empty state
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-sea/10 rounded-xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-sea" />
          </div>
          <h2 className="text-2xl font-semibold text-ink mb-4">Start Your Disney Adventure</h2>
          <p className="text-ink-light mb-8 max-w-md mx-auto">
            Create your first trip to Walt Disney World and begin planning the perfect magical vacation.
          </p>
          <div className="space-x-4">
            <button
              onClick={handleCreateTrip}
              className="btn-primary btn-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Trip
            </button>
            <button
              onClick={handleQuickCreate}
              className="btn-secondary btn-lg"
            >
              Quick Test Trip
            </button>
          </div>
        </div>
      ) : (
        activeTrip ? (
          /* Active Trip Planner - Full Screen */
          <TripDayPlanner 
            trip={activeTrip as any} // eslint-disable-line @typescript-eslint/no-explicit-any 
            onBackToTrips={() => setActiveTrip('')}
          />
        ) : (
          /* Trip List View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-ink">Your Trips ({trips.length})</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                const tripId = trip.id;
                return (
                  <TripCard
                    key={tripId}
                    trip={trip}
                    isActive={(activeTrip as any)?.id === tripId} // eslint-disable-line @typescript-eslint/no-explicit-any
                  />
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Create Trip Modal */}
      <CreateTripModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}