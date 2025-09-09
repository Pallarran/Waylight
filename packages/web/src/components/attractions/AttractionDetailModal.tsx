import { X, Clock, MapPin, Users, Star, Heart, Plus } from 'lucide-react';
import type { Attraction } from '../../types';
import { useAttractionStore } from '../../stores';

interface AttractionDetailModalProps {
  attraction: Attraction;
  isOpen: boolean;
  onClose: () => void;
  onAddToTrip: (attraction: Attraction) => void;
}

export default function AttractionDetailModal({ 
  attraction, 
  isOpen, 
  onClose,
  onAddToTrip 
}: AttractionDetailModalProps) {
  const { isFavorite, toggleFavorite } = useAttractionStore();
  
  if (!isOpen) return null;

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

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(attraction.id);
  };

  const handleAddToTrip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToTrip(attraction);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-surface-dark p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <span className="text-3xl">{getTypeIcon(attraction.type)}</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-ink">{attraction.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-ink-light">
                <MapPin className="w-4 h-4" />
                <span>{attraction.location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-lg transition-colors ${
                isAttractionFavorite 
                  ? 'text-red-500 hover:bg-red-50' 
                  : 'text-ink-light hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${isAttractionFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-ink-light hover:text-ink hover:bg-surface/50 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-ink mb-2">Description</h3>
            <p className="text-ink-light">{attraction.description}</p>
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-2">
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

          {/* Tips */}
          {attraction.tips.length > 0 && (
            <div>
              <h3 className="font-semibold text-ink mb-3 flex items-center">
                <Star className="w-4 h-4 mr-2 text-glow-dark" />
                Insider Tips
              </h3>
              <div className="space-y-3">
                {attraction.tips.map(tip => (
                  <div key={tip.id} className="bg-glow/10 p-4 rounded-lg border-l-4 border-glow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-glow-dark capitalize">
                        {tip.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-ink-light">Priority {tip.priority}</span>
                    </div>
                    <p className="text-sm text-ink-light">{tip.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {attraction.tags.length > 0 && (
            <div>
              <h3 className="font-semibold text-ink mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {attraction.tags.map(tag => (
                  <span key={tag} className="badge badge-secondary">
                    {tag.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Accessibility */}
          {attraction.accessibility && (
            <div>
              <h3 className="font-semibold text-ink mb-3">Accessibility Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className={attraction.accessibility.wheelchairAccessible ? 'text-green-600' : 'text-red-600'}>
                    {attraction.accessibility.wheelchairAccessible ? '✓' : '✗'}
                  </span>
                  <span className="ml-2 text-sm text-ink-light">Wheelchair Accessible</span>
                </div>
                {attraction.accessibility.transferRequired && (
                  <div className="flex items-center text-yellow-600">
                    <span>⚠</span>
                    <span className="ml-2 text-sm">Transfer Required</span>
                  </div>
                )}
                {attraction.accessibility.serviceAnimalsAllowed === false && (
                  <div className="flex items-center text-red-600">
                    <span>✗</span>
                    <span className="ml-2 text-sm">Service Animals Not Permitted</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-surface-dark p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="btn-ghost"
            >
              Close
            </button>
            <button
              onClick={handleAddToTrip}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}