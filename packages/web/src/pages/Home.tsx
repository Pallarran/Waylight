import { Link } from 'react-router-dom';
import WaylightLogo from '../assets/waylight-logo.png';

export default function Home() {
  return (
    <div className="container-waylight pt-4 pb-8 md:pt-6 md:pb-12 lg:pt-8 lg:pb-16">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <img 
            src={WaylightLogo} 
            alt="Waylight" 
            className="w-24 h-24 rounded-2xl shadow-medium"
          />
        </div>
        <h1 className="text-4xl font-bold text-ink mb-6">
          Welcome to <span className="gradient-sea bg-clip-text text-transparent">Waylight</span>
        </h1>
        <p className="text-lg text-ink-light mb-8 max-w-2xl mx-auto text-balance">
          Your magical Walt Disney World planning companion. Create personalized itineraries, 
          discover attractions, and make the most of your theme park adventure.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/trip-builder" className="btn-primary btn-lg">
            Start Planning Your Trip
          </Link>
          <Link to="/attractions" className="btn-secondary btn-lg">
            Browse Attractions
          </Link>
        </div>
        
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-ink text-center mb-12">Key Features</h2>
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