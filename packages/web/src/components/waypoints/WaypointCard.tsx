import { useState } from 'react';
import { Clock, MapPin, Users, Star, DollarSign, CalendarCheck, Utensils } from 'lucide-react';
import type { Attraction } from '../../types';
import { WaypointCategory } from '../../types';
import WaypointDetailModal from './WaypointDetailModal';
import { getWaypointIcons } from '../../utils/waypointIcons';
import { 
  getIntensityColor,
  getTypeIcon,
  getPriceLevelDisplay,
  getPriceLevelColor,
  getResortTierColor,
  formatServiceType,
  formatResortTier,
  getTransportationColor,
  getTransportationIcon,
  getCategoryColor,
  getCategoryBackgroundColor
} from '../../utils/waypointFormatting';

interface AttractionCardProps {
  attraction: Attraction;
  showAddToTrip?: boolean;
  showTips?: boolean;
}

export default function WaypointCard({ attraction, showAddToTrip: _showAddToTrip = true, showTips = true }: AttractionCardProps) {
  // Suppress unused variable warning for future implementation
  void _showAddToTrip;
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Category detection logic
  const isDoCategory = attraction.category === WaypointCategory.DO;
  const isEatCategory = attraction.category === WaypointCategory.EAT;
  const isStayCategory = attraction.category === WaypointCategory.STAY;

  const handleCardClick = () => {
    setShowDetailModal(true);
  };

  return (
    <>
      <div 
        className={`card-hover p-6 cursor-pointer transition-all duration-200 ease-out hover:shadow-medium hover:-translate-y-0.5 border-l-4 ${getCategoryColor(attraction.category)} ${getCategoryBackgroundColor(attraction.category)}`}
        onClick={handleCardClick}
      >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1">
          <span className="text-2xl flex-shrink-0">{getTypeIcon(attraction.type, attraction.category)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-ink">{attraction.name}</h3>
            <div className="flex items-start space-x-2 text-xs text-ink-light">
              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span className="break-words line-clamp-2 flex-1 min-w-0">{attraction.location}</span>
            </div>
            {/* Category-specific subtitle info */}
            {isEatCategory && attraction.cuisineType && (
              <div className="flex items-center space-x-1 text-xs text-ink-light mt-1">
                <Utensils className="w-3 h-3" />
                <span>{attraction.cuisineType}</span>
              </div>
            )}
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
              <div className="flex items-center badge bg-red-100 text-red-800">
                <CalendarCheck className="w-3 h-3 mr-1" />
                ADR Required
              </div>
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

      {/* Category-specific Feature Icons */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {(() => {
            if (isStayCategory) {
              // STAY items need amenities extracted from structured features  
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
              // DO and EAT items can pass features directly
              return getWaypointIcons({
                category: attraction.category,
                features: attraction.features
              });
            }
          })().map((icon, index) => (
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

      {/* EAT-specific information section */}
      {isEatCategory && (
        <div className="mb-4 space-y-2">
          {/* Operating Hours */}
          {attraction.operatingHours && (
            <div className="bg-surface/50 p-3 rounded-lg">
              <div className="text-xs font-medium text-ink mb-1">Hours</div>
              <div className="text-xs text-ink-light space-y-1">
                {attraction.operatingHours.breakfast && (
                  <div>Breakfast: {attraction.operatingHours.breakfast}</div>
                )}
                {attraction.operatingHours.lunch && (
                  <div>Lunch: {attraction.operatingHours.lunch}</div>
                )}
                {attraction.operatingHours.dinner && (
                  <div>Dinner: {attraction.operatingHours.dinner}</div>
                )}
              </div>
            </div>
          )}

          {/* Additional EAT features */}
          <div className="flex flex-wrap gap-2">
            {(attraction.features as any)?.mobileOrder && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                📱 Mobile Order
              </span>
            )}
            {(attraction.features as any)?.characterDining && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-800">
                🐭 Character Dining
              </span>
            )}
            {(attraction.features as any)?.entertainment && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                🎭 Entertainment
              </span>
            )}
          </div>
        </div>
      )}

      {/* STAY-specific information section */}
      {isStayCategory && (
        <div className="mb-4 space-y-3">
          {/* Transportation Options */}
          {attraction.transportation && attraction.transportation.length > 0 && (
            <div className="bg-surface/50 p-3 rounded-lg">
              <div className="text-xs font-medium text-ink mb-2">Transportation</div>
              <div className="flex flex-wrap gap-1">
                {attraction.transportation.map((transport, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${getTransportationColor(transport)}`}
                  >
                    <span className="mr-1">{getTransportationIcon(transport)}</span>
                    {transport}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Distance/Time Information */}
          {attraction.distanceInfo && (
            <div className="bg-surface/50 p-3 rounded-lg">
              <div className="text-xs font-medium text-ink mb-2">Travel Times</div>
              <div className="text-xs text-ink-light space-y-1">
                {attraction.distanceInfo.walkTime && (
                  <div className="flex items-center">
                    <span className="mr-2">🚶</span>
                    Walk: {attraction.distanceInfo.walkTime}
                  </div>
                )}
                {attraction.distanceInfo.driveTime && (
                  <div className="flex items-center">
                    <span className="mr-2">🚗</span>
                    Drive: {attraction.distanceInfo.driveTime}
                  </div>
                )}
                {attraction.distanceInfo.transitTime && (
                  <div className="flex items-center">
                    <span className="mr-2">🚌</span>
                    Transit: {attraction.distanceInfo.transitTime}
                  </div>
                )}
              </div>
            </div>
          )}
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
      <WaypointDetailModal
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