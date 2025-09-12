import { useState } from 'react';
import { Clock, MapPin, Users, Star, DollarSign, Utensils } from 'lucide-react';
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

      {/* Feature Icons */}
      <div className="mb-4">
        {isStayCategory ? (
          <div className="space-y-2">
            {/* Transportation */}
            {attraction.features?.transportation && Object.values(attraction.features.transportation).some(Boolean) && (
              <div className="flex items-center flex-wrap gap-1">
                <span className="text-xs font-medium text-ink mr-2">Transportation:</span>
                {Object.entries(attraction.features.transportation).map(([key, value]) => {
                  if (!value) return null;
                  const icons = getWaypointIcons({
                    category: attraction.category,
                    features: attraction.features,
                    tier: 1
                  });
                  const labelMap: Record<string, string> = {
                    'monorail': 'Monorail',
                    'skyliner': 'Skyliner', 
                    'boat': 'Boat Transport',
                    'bus': 'Bus Transport',
                    'walking': 'Walking Distance'
                  };
                  const label = labelMap[key] || key;
                  const icon = icons.find(icon => icon.label === label);
                  return icon ? (
                    <span
                      key={key}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                      title={`${icon.label}: ${icon.description}`}
                    >
                      <span className="text-sm">{icon.emoji}</span>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* Amenities */}
            {attraction.features?.amenities && Object.values(attraction.features.amenities).some(Boolean) && (
              <div className="flex items-center flex-wrap gap-1">
                <span className="text-xs font-medium text-ink mr-2">Amenities:</span>
                {Object.entries(attraction.features.amenities).map(([key, value]) => {
                  if (!value) return null;
                  const icons = getWaypointIcons({
                    category: attraction.category,
                    features: attraction.features,
                    tier: 1
                  });
                  const labelMap: Record<string, string> = {
                    'pool': 'Pool',
                    'waterFeatures': 'Water Features',
                    'spa': 'Spa',
                    'fitnessCenter': 'Fitness Center',
                    'golf': 'Golf',
                    'beach': 'Beach',
                    'marina': 'Marina',
                    'dining': 'Dining',
                    'quickService': 'Quick Service',
                    'entertainment': 'Entertainment',
                    'concierge': 'Concierge',
                    'businessCenter': 'Business Center',
                    'childcare': 'Kids Club',
                    'parking': 'Parking',
                    'wifi': 'WiFi'
                  };
                  const label = labelMap[key] || key;
                  const icon = icons.find(icon => icon.label === label);
                  return icon ? (
                    <span
                      key={key}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                      title={`${icon.label}: ${icon.description}`}
                    >
                      <span className="text-sm">{icon.emoji}</span>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* Accommodations */}
            {attraction.features?.accommodations && Object.values(attraction.features.accommodations).some(Boolean) && (
              <div className="flex items-center flex-wrap gap-1">
                <span className="text-xs font-medium text-ink mr-2">Accommodations:</span>
                {Object.entries(attraction.features.accommodations).map(([key, value]) => {
                  if (!value) return null;
                  const icons = getWaypointIcons({
                    category: attraction.category,
                    features: attraction.features,
                    tier: 1
                  });
                  const labelMap: Record<string, string> = {
                    'suites': 'Suites',
                    'villas': 'Villas',
                    'dvc': 'Disney Vacation Club',
                    'themedRooms': 'Themed Rooms',
                    'familyAccommodations': 'Family Accommodations'
                  };
                  const label = labelMap[key] || key;
                  const icon = icons.find(icon => icon.label === label);
                  return icon ? (
                    <span
                      key={key}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                      title={`${icon.label}: ${icon.description}`}
                    >
                      <span className="text-sm">{icon.emoji}</span>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        ) : isEatCategory ? (
          <div className="space-y-2">
            {/* Service & Ordering Features */}
            {attraction.features && (() => {
              const serviceOrderingFeatures = ['mobileOrder', 'adrRequired', 'walkupAvailable', 'counterService', 'tableService', 'reservationsRecommended'];
              const hasServiceFeatures = serviceOrderingFeatures.some(key => attraction.features?.[key]);
              
              const icons = getWaypointIcons({
                category: attraction.category,
                features: attraction.features
              });
              
              return hasServiceFeatures ? (
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-xs font-medium text-ink mr-2">Service:</span>
                  {serviceOrderingFeatures.map(key => {
                    if (!attraction.features?.[key]) return null;
                    const labelMap: Record<string, string> = {
                      'mobileOrder': 'Mobile Order',
                      'adrRequired': 'ADR Required', 
                      'walkupAvailable': 'Walk-up Available',
                      'counterService': 'Counter Service',
                      'tableService': 'Table Service',
                      'reservationsRecommended': 'Reservations Recommended'
                    };
                    const label = labelMap[key];
                    const icon = icons.find(icon => icon.label === label);
                    return icon ? (
                      <span
                        key={key}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                        title={`${icon.label}: ${icon.description}`}
                      >
                        <span className="text-sm">{icon.emoji}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null;
            })()}

            {/* Dining Experience */}
            {attraction.features && (() => {
              const diningFeatures = ['characterDining', 'entertainment', 'views', 'themedAtmosphere', 'outdoorSeating', 'barLounge', 'familyStyle', 'fineDining'];
              const hasDiningFeatures = diningFeatures.some(key => attraction.features?.[key]);
              
              const icons = getWaypointIcons({
                category: attraction.category,
                features: attraction.features
              });
              
              return hasDiningFeatures ? (
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-xs font-medium text-ink mr-2">Experience:</span>
                  {diningFeatures.map(key => {
                    if (!attraction.features?.[key]) return null;
                    const labelMap: Record<string, string> = {
                      'characterDining': 'Character Dining',
                      'entertainment': 'Entertainment',
                      'views': 'Scenic Views',
                      'themedAtmosphere': 'Themed Atmosphere',
                      'outdoorSeating': 'Outdoor Seating',
                      'barLounge': 'Bar/Lounge',
                      'familyStyle': 'Family Style',
                      'fineDining': 'Fine Dining'
                    };
                    const label = labelMap[key];
                    const icon = icons.find(icon => icon.label === label);
                    return icon ? (
                      <span
                        key={key}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                        title={`${icon.label}: ${icon.description}`}
                      >
                        <span className="text-sm">{icon.emoji}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null;
            })()}

            {/* Dietary & Accessibility */}
            {attraction.features && (() => {
              const dietaryFeatures = ['vegetarianOptions', 'veganOptions', 'glutenFreeOptions', 'alcoholServed', 'kidFriendly', 'allergyFriendly', 'healthyOptions', 'largePortions'];
              const hasDietaryFeatures = dietaryFeatures.some(key => attraction.features?.[key]);
              
              const icons = getWaypointIcons({
                category: attraction.category,
                features: attraction.features
              });
              
              return hasDietaryFeatures ? (
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-xs font-medium text-ink mr-2">Dietary:</span>
                  {dietaryFeatures.map(key => {
                    if (!attraction.features?.[key]) return null;
                    const labelMap: Record<string, string> = {
                      'vegetarianOptions': 'Vegetarian Options',
                      'veganOptions': 'Vegan Options',
                      'glutenFreeOptions': 'Gluten-Free Options',
                      'alcoholServed': 'Alcohol Served',
                      'kidFriendly': 'Kid Friendly',
                      'allergyFriendly': 'Allergy Friendly',
                      'healthyOptions': 'Healthy Options',
                      'largePortions': 'Large Portions'
                    };
                    const label = labelMap[key];
                    const icon = icons.find(icon => icon.label === label);
                    return icon ? (
                      <span
                        key={key}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                        title={`${icon.label}: ${icon.description}`}
                      >
                        <span className="text-sm">{icon.emoji}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null;
            })()}
          </div>
        ) : isDoCategory ? (
          <div className="space-y-2">
            {/* Access & Services */}
            {attraction.features && (() => {
              const skipLinesFeatures = ['multiPass', 'singlePass', 'singleRider', 'riderSwitch', 'mobileCheckin', 'photoPass'];
              const hasSkipLinesFeatures = skipLinesFeatures.some(key => attraction.features?.[key]);
              
              const icons = getWaypointIcons({
                category: attraction.category,
                features: attraction.features
              });
              
              return hasSkipLinesFeatures ? (
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-xs font-medium text-ink mr-2">Access:</span>
                  {skipLinesFeatures.map(key => {
                    if (!attraction.features?.[key]) return null;
                    const labelMap: Record<string, string> = {
                      'multiPass': 'Multi Pass',
                      'singlePass': 'Single Pass',
                      'singleRider': 'Single Rider',
                      'riderSwitch': 'Rider Switch',
                      'mobileCheckin': 'Mobile Check-in',
                      'photoPass': 'PhotoPass'
                    };
                    const label = labelMap[key];
                    const icon = icons.find(icon => icon.label === label);
                    return icon ? (
                      <span
                        key={key}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                        title={`${icon.label}: ${icon.description}`}
                      >
                        <span className="text-sm">{icon.emoji}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null;
            })()}

            {/* Experience */}
            {attraction.features && (() => {
              const whatToExpectFeatures = ['darkRide', 'getsWet', 'spinningMotion', 'loudSounds', 'strobeEffects', 'interactiveElements', 'characterMeet', 'livePerformance', 'airConditioning', 'outdoorExperience', 'scary', 'bigDrops', 'launchSpeed'];
              const hasWhatToExpectFeatures = whatToExpectFeatures.some(key => attraction.features?.[key]);
              
              const icons = getWaypointIcons({
                category: attraction.category,
                features: attraction.features
              });
              
              return hasWhatToExpectFeatures ? (
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-xs font-medium text-ink mr-2">Experience:</span>
                  {whatToExpectFeatures.map(key => {
                    if (!attraction.features?.[key]) return null;
                    const labelMap: Record<string, string> = {
                      'darkRide': 'Dark Ride',
                      'getsWet': 'Gets Wet',
                      'spinningMotion': 'Spinning Motion',
                      'loudSounds': 'Loud Sounds',
                      'strobeEffects': 'Strobe Effects',
                      'interactiveElements': 'Interactive Elements',
                      'characterMeet': 'Character Meet',
                      'livePerformance': 'Live Performance',
                      'airConditioning': 'Air Conditioning',
                      'outdoorExperience': 'Outdoor Experience',
                      'scary': 'Scary',
                      'bigDrops': 'Big Drops',
                      'launchSpeed': 'Launch/Speed'
                    };
                    const label = labelMap[key];
                    const icon = icons.find(icon => icon.label === label);
                    return icon ? (
                      <span
                        key={key}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                        title={`${icon.label}: ${icon.description}`}
                      >
                        <span className="text-sm">{icon.emoji}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null;
            })()}

            {/* Important Notes */}
            {attraction.features && (() => {
              const importantNotesFeatures = ['heightRequirement', 'motionSensitivity', 'pregnancyAdvisory', 'wheelchairAccessible', 'transferRequired', 'rainSafe'];
              const hasImportantNotesFeatures = importantNotesFeatures.some(key => attraction.features?.[key]);
              
              const icons = getWaypointIcons({
                category: attraction.category,
                features: attraction.features
              });
              
              return hasImportantNotesFeatures ? (
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-xs font-medium text-ink mr-2">Notes:</span>
                  {importantNotesFeatures.map(key => {
                    if (!attraction.features?.[key]) return null;
                    const labelMap: Record<string, string> = {
                      'heightRequirement': 'Height Requirement',
                      'motionSensitivity': 'Motion Sensitivity',
                      'pregnancyAdvisory': 'Pregnancy Advisory',
                      'wheelchairAccessible': 'Wheelchair Accessible',
                      'transferRequired': 'Transfer Required',
                      'rainSafe': 'Rain Safe'
                    };
                    const label = labelMap[key];
                    const icon = icons.find(icon => icon.label === label);
                    return icon ? (
                      <span
                        key={key}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                        title={`${icon.label}: ${icon.description}`}
                      >
                        <span className="text-sm">{icon.emoji}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null;
            })()}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {getWaypointIcons({
              category: attraction.category,
              features: attraction.features
            }).filter(icon => icon && icon.label).map((icon, index) => (
              <span
                key={index}
                className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface border border-surface-dark/20 hover:bg-surface-dark/30 transition-colors cursor-help"
                title={`${icon.label}: ${icon.description}`}
              >
                <span className="text-sm">{icon.emoji}</span>
              </span>
            ))}
          </div>
        )}
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