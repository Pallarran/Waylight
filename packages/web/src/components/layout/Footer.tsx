import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-surface-dark/50 mt-auto">
      <div className="container-waylight py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-sea rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-lg font-semibold text-ink">Waylight</span>
          </div>

          <nav className="flex flex-wrap justify-center md:justify-end space-x-6 mb-4 md:mb-0">
            <Link to="/" className="text-sm text-ink-light hover:text-ink transition-colors">
              Home
            </Link>
            <Link to="/trip-builder" className="text-sm text-ink-light hover:text-ink transition-colors">
              Trip Builder
            </Link>
            <Link to="/attractions" className="text-sm text-ink-light hover:text-ink transition-colors">
              Attractions
            </Link>
            <Link to="/settings" className="text-sm text-ink-light hover:text-ink transition-colors">
              Settings
            </Link>
          </nav>

          <div className="text-center md:text-right">
            <p className="text-xs text-ink-light">
              © 2025 Waylight. Made with magic for Disney fans.
            </p>
            <p className="text-xs text-ink-light mt-1">
              Not affiliated with The Walt Disney Company.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}