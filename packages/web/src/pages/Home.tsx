import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTripStore } from '../stores';
import { authService } from '@waylight/shared';
import WaylightLogo from '../assets/waylight-logo.png';

export default function Home() {
  const { trips, activeTrip, loadTrips, setActiveTrip } = useTripStore();
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getState().user);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  useEffect(() => {
    // Subscribe to auth changes and reload trips when user logs in
    const unsubscribe = authService.subscribe((authState) => {
      setUser(authState.user);

      // When user logs in, reload trips to show Continue Planning button
      if (authState.user && !authState.loading) {
        loadTrips();
      }
    });

    return unsubscribe;
  }, [loadTrips]);

  const getTargetTrip = () => {
    if (activeTrip) {
      return activeTrip;
    } else if (trips.length > 0) {
      // Return the most recently updated trip
      return trips.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
    }
    return null;
  };

  const handleContinuePlanning = () => {
    const targetTrip = getTargetTrip();
    if (targetTrip) {
      setActiveTrip(targetTrip.id);
    }
    navigate('/trip-builder', { state: { fromContinuePlanning: true } });
  };

  const handleStartNewTrip = () => {
    // Clear active trip and navigate to trip builder with create modal
    setActiveTrip(null);
    navigate('/trip-builder', { state: { openCreateModal: true } });
  };

  return (
    <div className="container-waylight pt-3 pb-6 md:pt-4 md:pb-8 lg:pt-6 lg:pb-12">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <img 
            src={WaylightLogo} 
            alt="Waylight" 
            className="w-24 h-24 rounded-2xl shadow-medium"
          />
        </div>
        <h1 className="text-4xl font-bold text-ink mb-5">
          Welcome to <span className="gradient-sea bg-clip-text text-transparent">Waylight</span>
        </h1>
        <p className="text-lg text-ink-light mb-6 max-w-2xl mx-auto text-balance">
          Your magical Walt Disney World planning companion. Create personalized itineraries, 
          discover attractions, and make the most of your theme park adventure.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {trips.length === 0 ? (
            <Link to="/trip-builder" className="btn-primary btn-lg">
              Start Planning Your Trip
            </Link>
          ) : (
            <>
              <button onClick={handleStartNewTrip} className="btn-secondary btn-lg">
                Start Planning a New Trip
              </button>
              <button onClick={handleContinuePlanning} className="btn-primary btn-lg flex flex-col items-center">
                <span>Continue Planning</span>
                {getTargetTrip() && (
                  <span className="text-sm opacity-75 font-normal mt-1">
                    {getTargetTrip()?.name}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-ink text-center mb-8">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-sea/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-sea" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">Smart Planning</h3>
            <p className="text-ink-light">Create detailed day-by-day itineraries with personalized recommendations.</p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-glow/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-glow-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">Offline Ready</h3>
            <p className="text-ink-light">Access your plans anywhere in the parks, even without internet connection.</p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-sea/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-sea" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">Personalized</h3>
            <p className="text-ink-light">Tailored recommendations based on your preferences and interests.</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}