import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, MapPin, Loader2, AlertCircle, Cloud } from 'lucide-react';
import { useTripStore } from '../stores';
import CreateTripModal from '../components/trip/CreateTripModal';
import TripCard from '../components/trip/TripCard';
import TripDayPlanner from '../components/trip/TripDayPlanner';
import SuccessFeedback from '../components/common/SuccessFeedback';

export default function TripBuilderWorking() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const location = useLocation();
  const { trips, activeTrip, isLoading, error, successMessage, isSyncing, loadTrips, clearError, clearSuccess, createNewTrip, setActiveTrip, initializeSync, syncTrips } = useTripStore();

  useEffect(() => {
    // Initialize sync before loading trips
    initializeSync();
    // Load trips with sync enabled on app start
    loadTrips();
  }, [loadTrips, initializeSync]);

  useEffect(() => {
    // Clear active trip except when continuing planning with an existing trip
    if (!location.state?.fromContinuePlanning) {
      setActiveTrip('');
    }
    // Clear navigation state after processing to prevent issues on refresh
    if (location.state && (location.state.fromContinuePlanning || location.state.openCreateModal)) {
      window.history.replaceState({}, document.title);
    }
  }, [location.pathname, location.state, setActiveTrip]);

  useEffect(() => {
    // Check if we should open create modal from navigation state
    if (location.state?.openCreateModal) {
      setShowCreateModal(true);
    }
  }, [location.state]);

  const handleCreateTrip = () => {
    setShowCreateModal(true);
  };

  const handleCloseError = () => {
    clearError();
  };

  const handleQuickCreate = async () => {
    try {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      
      const startDate = nextMonth.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const endDateObj = new Date(nextMonth);
      endDateObj.setDate(nextMonth.getDate() + 6);
      const endDate = endDateObj.toISOString().split('T')[0];
      
      await createNewTrip('My Disney Trip', startDate, endDate);
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };


  return (
    <div className="container-waylight section-padding">
      {!activeTrip && (
        <div className="mb-8">
          <div className="mb-4">
            <p className="text-ink-light">Create and manage your Walt Disney World vacation plans.</p>
          </div>
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-3">
              {/* Sync Status/Button */}
              <button
                onClick={() => syncTrips()}
                className={`flex items-center text-sm px-3 py-2 rounded-lg transition-colors ${
                  isSyncing 
                    ? 'text-sea bg-sea/10 cursor-not-allowed' 
                    : 'text-ink-light hover:text-sea hover:bg-sea/10'
                }`}
                disabled={isSyncing}
                title={isSyncing ? 'Syncing...' : 'Click to sync now'}
              >
                <Cloud className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-pulse' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync'}
              </button>
              
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
        <div className="card p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-sea/10 rounded-xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-sea" />
          </div>
          <h2 className="text-2xl font-semibold text-ink mb-4">Let's light the way</h2>
          <p className="text-ink-light mb-8 max-w-md mx-auto">
            Add your first park day and start planning your magical adventure.
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

      {/* Success Feedback */}
      <SuccessFeedback 
        show={!!successMessage}
        message={successMessage || undefined}
        onHide={clearSuccess}
        variant="sparkle"
      />
    </div>
  );
}