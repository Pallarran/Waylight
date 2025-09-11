import { X, Clock, MapPin, Users, Star, Plus } from 'lucide-react';
import type { Attraction } from '../../types';
import { WaypointCategory } from '../../types';
import { getWaypointIcons } from '../../utils/waypointIcons';
import { 
  getIntensityColor,
  getTypeIcon,
  getPriceLevelDisplay,
  getPriceLevelColor,
  getResortTierColor,
  formatServiceType,
  formatResortTier,
  getCategoryColor
} from '../../utils/waypointFormatting';

interface AttractionDetailModalProps {
  attraction: Attraction;
  isOpen: boolean;
  onClose: () => void;
  onAddToTrip: (attraction: Attraction) => void;
}

export default function WaypointDetailModal({ 
  attraction, 
  isOpen, 
  onClose,
  onAddToTrip 
}: AttractionDetailModalProps) {
  if (!isOpen) return null;

  // Category detection
  const isDoCategory = attraction.category === WaypointCategory.DO;
  const isEatCategory = attraction.category === WaypointCategory.EAT;
  const isStayCategory = attraction.category === WaypointCategory.STAY;

  // Get feature icons for this waypoint
  const featureIcons = (() => {
    if (isStayCategory) {
      const stayFeatures = attraction.features as any;
      const amenities = [];
      if (stayFeatures?.transportation?.monorail) amenities.push('Monorail');
      if (stayFeatures?.transportation?.skyliner) amenities.push('Skyliner');
      if (stayFeatures?.transportation?.boat) amenities.push('Boat');
      if (stayFeatures?.transportation?.bus) amenities.push('Bus');
      if (stayFeatures?.transportation?.walking) amenities.push('Walking');
      if (stayFeatures?.amenities?.spa) amenities.push('Spa');
      if (stayFeatures?.amenities?.multipleDining) amenities.push('Multiple Dining');
      if (stayFeatures?.amenities?.beach) amenities.push('Beach');
      if (stayFeatures?.amenities?.marina) amenities.push('Marina');
      if (stayFeatures?.amenities?.pool) amenities.push('Pool');
      if (stayFeatures?.amenities?.waterSlide) amenities.push('Water Slide');
      if (stayFeatures?.amenities?.lazyRiver) amenities.push('Lazy River');
      if (stayFeatures?.amenities?.fitnessCenter) amenities.push('Fitness Center');
      if (stayFeatures?.amenities?.golf) amenities.push('Golf');
      if (stayFeatures?.accommodations?.dvc) amenities.push('DVC');
      if (stayFeatures?.accommodations?.bungalows) amenities.push('Bungalows');
      if (stayFeatures?.accommodations?.suites) amenities.push('Suites');
      if (stayFeatures?.accommodations?.cabins) amenities.push('Cabins');
      if (stayFeatures?.accommodations?.villas) amenities.push('Villas');
      
      return getWaypointIcons({
        category: attraction.category,
        features: attraction.features,
        amenities: amenities
      });
    } else {
      return getWaypointIcons({
        category: attraction.category,
        features: attraction.features
      });
    }
  })();

  // Filter out redundant tags that are already shown as feature icons
  const getFilteredTags = (tags: string[], featureIcons: any[]) => {
    const iconLabels = featureIcons.map(icon => icon.label.toLowerCase());
    const redundantTags = ['dark', 'wet', 'scary', 'interactive', 'spinning', 'photos', 'characters', 'loud', 'strobes'];
    
    return tags.filter(tag => {
      const tagLower = tag.toLowerCase();
      return !redundantTags.includes(tagLower) && !iconLabels.some(label => label.includes(tagLower));
    });
  };

  const filteredTags = getFilteredTags(attraction.tags || [], featureIcons);


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
            <span className="text-3xl">{getTypeIcon(attraction.type, attraction.category)}</span>
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
            {/* DO category badges */}
            {isDoCategory && (
              <>
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
              </>
            )}

            {/* EAT category badges */}
            {isEatCategory && (
              <>
                {attraction.priceLevel && (
                  <span className={`badge ${getPriceLevelColor(attraction.priceLevel)}`}>
                    {getPriceLevelDisplay(attraction.priceLevel)}
                  </span>
                )}
                {attraction.serviceType && (
                  <span className="badge badge-secondary">
                    {formatServiceType(attraction.serviceType)}
                  </span>
                )}
                {attraction.adrRequired && (
                  <span className="badge bg-red-100 text-red-800">
                    ADR Required
                  </span>
                )}
              </>
            )}

            {/* STAY category badges */}
            {isStayCategory && attraction.resortTier && (
              <span className={`badge ${getResortTierColor(attraction.resortTier)}`}>
                {formatResortTier(attraction.resortTier)}
              </span>
            )}

            {/* Universal badges - only show accessibility for DO items where it varies */}
            {isDoCategory && attraction.accessibility?.wheelchairAccessible && (
              <span className="badge bg-blue-100 text-blue-800">♿ Accessible</span>
            )}
          </div>

          {/* Features Section with Icons */}
          {featureIcons.length > 0 && (
            <div>
              <h3 className="font-semibold text-ink mb-3">Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featureIcons.map((icon, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-surface/30 rounded-lg">
                    <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium text-ink text-sm">{icon.label}</div>
                      <div className="text-xs text-ink-light">{icon.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          {filteredTags.length > 0 && (
            <div>
              <h3 className="font-semibold text-ink mb-3">Additional Tags</h3>
              <div className="flex flex-wrap gap-2">
                {filteredTags.map(tag => (
                  <span key={tag} className="badge badge-secondary">
                    {tag.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Accessibility - only show for DO items where accessibility varies */}
          {isDoCategory && attraction.accessibility && (
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