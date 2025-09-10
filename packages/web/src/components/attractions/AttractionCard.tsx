import { useState } from 'react';
import { Clock, MapPin, Users, Star } from 'lucide-react';
import type { Attraction } from '../../types';
import AttractionDetailModal from './AttractionDetailModal';
import { getAttractionIcons } from '../../utils/attractionIcons';

interface AttractionCardProps {
  attraction: Attraction;
  showAddToTrip?: boolean;
  showTips?: boolean;
}

export default function AttractionCard({ attraction, showAddToTrip = true, showTips = true }: AttractionCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'extreme': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ride': return '🎢';
      case 'show': return '🎭';
      case 'meet_greet': return '👋';
      case 'dining': return '🍽️';
      case 'shopping': return '🛍️';
      default: return '🎯';
    }
  };




  const handleCardClick = () => {
    setShowDetailModal(true);
  };

  return (
    <>
      <div 
        className="card-hover p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-medium hover:-translate-y-0.5" 
        onClick={handleCardClick}
      >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1">
          <span className="text-2xl flex-shrink-0">{getTypeIcon(attraction.type)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-ink">{attraction.name}</h3>
            <div className="flex items-start space-x-2 text-xs text-ink-light">
              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span className="break-words line-clamp-2 flex-1 min-w-0">{attraction.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Closure Status */}
      {attraction.tags?.includes('temporarily-closed') && (
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
            🚧 Temporarily Closed
          </span>
        </div>
      )}

      <p className="text-ink-light text-sm mb-4 line-clamp-3">{attraction.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`badge ${getIntensityColor(attraction.intensity)}`}>
          {attraction.intensity}
        </span>
        <div className="flex items-center badge badge-secondary">
          <Clock className="w-3 h-3 mr-1" />
          {attraction.duration}min
        </div>
        {attraction.heightRequirement && (
          <div className="flex items-center badge badge-secondary">
            <Users className="w-3 h-3 mr-1" />
            {attraction.heightRequirement}"
          </div>
        )}
        {attraction.accessibility?.wheelchairAccessible && (
          <span className="badge bg-blue-100 text-blue-800">♿ Accessible</span>
        )}
      </div>

      {/* Attraction Feature Icons */}
      {attraction.features && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {/* All Icons - Prioritized Order */}
            {getAttractionIcons(attraction.features).map((icon, index) => (
              <span
                key={index}
                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                title={`${icon.label}: ${icon.description}`}
              >
                <span className="text-sm">{icon.emoji}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {showTips && attraction.tips.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center text-glow-dark mb-2">
            <Star className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Top Tip</span>
          </div>
          <p className="text-sm text-ink-light bg-glow/10 p-3 rounded-lg">
            {attraction.tips[0]?.content}
          </p>
        </div>
      )}



      </div>

      {/* Detail Modal */}
      <AttractionDetailModal
        attraction={attraction}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onAddToTrip={() => {
          setShowDetailModal(false);
          alert(`${attraction.name} add to trip functionality coming soon!`);
        }}
      />
    </>
  );
}