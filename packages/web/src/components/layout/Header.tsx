import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import WaylightLogo from '../../assets/waylight-logo.png?w=32&h=32&format=webp';

export default function Header() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Trip Builder', href: '/trip-builder', current: location.pathname === '/trip-builder' },
    { name: 'Attractions', href: '/attractions', current: location.pathname === '/attractions' },
    { name: 'Settings', href: '/settings', current: location.pathname === '/settings' },
  ];

  return (
    <header className="bg-white border-b border-surface-dark/50 sticky top-0 z-50">
      <div className="container-waylight">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src={WaylightLogo} 
                alt="" 
                className="w-8 h-8 rounded-lg"
                loading="eager"
                decoding="sync"
                width="32"
                height="32"
                role="presentation"
              />
              <span className="text-xl font-bold text-ink">Waylight</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-sea/10 text-sea-dark'
                    : 'text-ink-light hover:text-ink hover:bg-surface-dark/50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-surface-dark/50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-ink" />
            ) : (
              <Menu className="w-5 h-5 text-ink" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-surface-dark/50 py-4">
            <nav className="flex flex-col space-y-2" aria-label="Mobile navigation">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-sea/10 text-sea-dark'
                      : 'text-ink-light hover:text-ink hover:bg-surface-dark/50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}