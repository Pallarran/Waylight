import { useState } from 'react';
import { Heart, Clock, MapPin, Users, Info, Star, Plus } from 'lucide-react';
import type { Attraction } from '../../types';
import { useAttractionStore } from '../../stores';
import AttractionDetailModal from './AttractionDetailModal';

interface AttractionCardProps {
  attraction: Attraction;
  showAddToTrip?: boolean;
  showTips?: boolean;
}

export default function AttractionCard({ attraction, showAddToTrip = true, showTips = true }: AttractionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { isFavorite, toggleFavorite } = useAttractionStore();
  
  const isAttractionFavorite = isFavorite(attraction.id);

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

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(attraction.id);
  };

  const handleAddToTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`${attraction.name} add to trip functionality coming soon!`);
  };


  const handleCardClick = () => {
    setShowDetailModal(true);
  };

  return (
    <>
      <div 
        className="card-hover p-6 cursor-pointer" 
        onClick={handleCardClick}
      >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getTypeIcon(attraction.type)}</span>
          <div>
            <h3 className="text-lg font-semibold text-ink">{attraction.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-ink-light">
              <MapPin className="w-4 h-4" />
              <span>{attraction.location}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleToggleFavorite}
          className={`p-2 rounded-lg transition-colors ${
            isAttractionFavorite 
              ? 'text-red-500 hover:bg-red-50' 
              : 'text-ink-light hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <Heart className={`w-5 h-5 ${isAttractionFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <p className="text-ink-light text-sm mb-4 line-clamp-2">{attraction.description}</p>

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

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="btn-ghost btn-sm"
        >
          <Info className="w-4 h-4 mr-1" />
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
        
        {showAddToTrip && (
          <button 
            onClick={handleAddToTrip}
            className="btn-primary btn-sm flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add to Trip
          </button>
        )}
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-surface-dark/50 animate-in">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-ink mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {attraction.tags.map(tag => (
                  <span key={tag} className="badge badge-secondary text-xs">
                    {tag.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
            
            {attraction.tips.length > 1 && (
              <div>
                <h4 className="font-medium text-ink mb-2">More Tips</h4>
                <div className="space-y-2">
                  {attraction.tips.slice(1).map(tip => (
                    <p key={tip.id} className="text-sm text-ink-light bg-surface rounded-lg p-3">
                      {tip.content}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {attraction.accessibility && (
              <div>
                <h4 className="font-medium text-ink mb-2">Accessibility</h4>
                <div className="text-sm text-ink-light space-y-1">
                  <div className="flex items-center">
                    <span className={attraction.accessibility.wheelchairAccessible ? 'text-green-600' : 'text-red-600'}>
                      {attraction.accessibility.wheelchairAccessible ? '✓' : '✗'}
                    </span>
                    <span className="ml-2">Wheelchair Accessible</span>
                  </div>
                  {attraction.accessibility.transferRequired && (
                    <div className="flex items-center text-yellow-600">
                      <span>⚠</span>
                      <span className="ml-2">Transfer Required</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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