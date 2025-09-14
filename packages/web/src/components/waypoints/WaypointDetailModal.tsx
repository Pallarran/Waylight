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

  // Get feature icons for this waypoint (all tiers for complete feature display)
  const featureIcons = getWaypointIcons({
    category: attraction.category,
    features: attraction.features
    // No tier restriction to show all available features
  });



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
              </>
            )}

            {/* STAY category badges */}
            {isStayCategory && attraction.resortTier && (
              <span className={`badge ${getResortTierColor(attraction.resortTier)}`}>
                {formatResortTier(attraction.resortTier)}
              </span>
            )}

          </div>

          {/* Features Section with Icons */}
          {isStayCategory && attraction.features ? (
            <div>
              <h3 className="font-semibold text-ink mb-3">Features</h3>
              <div className="space-y-4">
                {/* Transportation */}
                {attraction.features.transportation && Object.values(attraction.features.transportation).some(Boolean) && (
                  <div>
                    <h4 className="font-medium text-ink text-sm mb-2">Transportation</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(attraction.features.transportation).map(([key, value]) => {
                        if (!value) return null;
                        const labelMap: Record<string, string> = {
                          'monorail': 'Monorail',
                          'skyliner': 'Skyliner', 
                          'boat': 'Boat Transport',
                          'bus': 'Bus Transport',
                          'walking': 'Walking Distance'
                        };
                        const label = labelMap[key] || key;
                        const icon = featureIcons.find(icon => icon.label === label);
                        return icon ? (
                          <div key={key} className="flex items-center space-x-3 p-3 bg-surface/30 rounded-lg">
                            <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink text-sm">{icon.label}</div>
                              <div className="text-xs text-ink-light">{icon.description}</div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Amenities - Granular Details */}
                {attraction.features.amenities && (
                  <>
                    {/* Pool & Water Activities */}
                    {(attraction.features.amenities.pool || attraction.features.amenities.recreation?.beach) && (
                      <div>
                        <h4 className="font-medium text-ink text-sm mb-2 flex items-center">
                          <span className="text-lg mr-2">🏊</span>
                          Pool & Water Activities
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(() => {
                            const poolDetails = [];
                            const amenities = attraction.features.amenities;

                            // Pool features
                            if (amenities.pool) {
                              if (amenities.pool.basic) poolDetails.push('Swimming pool available');
                              if (amenities.pool.kiddie_pool) poolDetails.push('Children\'s pool area');
                              if (amenities.pool.hot_tub) poolDetails.push('Hot tub/spa available');
                              if (amenities.pool.water_slides) poolDetails.push('Water slides');
                              if (amenities.pool.lazy_river) poolDetails.push('Lazy river');
                              if (amenities.pool.zero_entry) poolDetails.push('Zero-entry pool');
                              if (amenities.pool.pool_bar) poolDetails.push('Pool bar service');
                            }

                            // Recreation features
                            if (amenities.recreation?.beach) poolDetails.push('Beach access');
                            if (amenities.recreation?.marina) poolDetails.push('Marina activities');

                            return poolDetails.map((detail, index) => (
                              <div key={index} className="text-xs text-ink-light bg-blue-50/30 rounded-md px-2 py-1">
                                • {detail}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Wellness & Spa */}
                    {attraction.features.amenities.spa && (
                      <div>
                        <h4 className="font-medium text-ink text-sm mb-2 flex items-center">
                          <span className="text-lg mr-2">💆</span>
                          Wellness & Spa
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(() => {
                            const spaDetails = [];
                            const spa = attraction.features.amenities.spa;

                            if (spa.full_service) spaDetails.push('Full-service spa');
                            if (spa.couples_treatments) spaDetails.push('Couples treatments');
                            if (spa.fitness_center) spaDetails.push('Fitness center');
                            if (spa.sauna) spaDetails.push('Sauna available');
                            if (spa.steam_room) spaDetails.push('Steam room available');

                            return spaDetails.map((detail, index) => (
                              <div key={index} className="text-xs text-ink-light bg-purple-50/30 rounded-md px-2 py-1">
                                • {detail}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Dining Options */}
                    {attraction.features.amenities.dining && (
                      <div>
                        <h4 className="font-medium text-ink text-sm mb-2 flex items-center">
                          <span className="text-lg mr-2">🍽️</span>
                          Dining Options
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(() => {
                            const diningDetails = [];
                            const dining = attraction.features.amenities.dining;

                            if (dining.table_service) diningDetails.push('Table service restaurant');
                            if (dining.signature_dining) diningDetails.push('Signature dining');
                            if (dining.character_dining) diningDetails.push('Character dining');
                            if (dining.quick_service) diningDetails.push('Quick service options');
                            if (dining.pool_bar) diningDetails.push('Pool bar');
                            if (dining.room_service) diningDetails.push('Room service available');

                            return diningDetails.map((detail, index) => (
                              <div key={index} className="text-xs text-ink-light bg-orange-50/30 rounded-md px-2 py-1">
                                • {detail}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Recreation & Activities */}
                    {(attraction.features.amenities.recreation || attraction.features.amenities.entertainment) && (
                      <div>
                        <h4 className="font-medium text-ink text-sm mb-2 flex items-center">
                          <span className="text-lg mr-2">🎾</span>
                          Recreation & Activities
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(() => {
                            const recDetails = [];
                            const rec = attraction.features.amenities.recreation;
                            const ent = attraction.features.amenities.entertainment;

                            // Recreation activities
                            if (rec) {
                              if (rec.golf) recDetails.push('Golf course access');
                              if (rec.boat_rentals) recDetails.push('Boat rentals available');
                              if (rec.bike_rentals) recDetails.push('Bike rentals available');
                              if (rec.fishing) recDetails.push('Fishing available');
                              if (rec.walking_trails) recDetails.push('Walking trails');
                            }

                            // Entertainment activities
                            if (ent) {
                              if (ent.live_music) recDetails.push('Live music');
                              if (ent.character_meet_greets) recDetails.push('Character meet & greets');
                              if (ent.movies_under_stars) recDetails.push('Movies under the stars');
                              if (ent.campfire) recDetails.push('Campfire activities');
                            }

                            return recDetails.map((detail, index) => (
                              <div key={index} className="text-xs text-ink-light bg-green-50/30 rounded-md px-2 py-1">
                                • {detail}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Guest Services */}
                    {attraction.features.amenities.services && (
                      <div>
                        <h4 className="font-medium text-ink text-sm mb-2 flex items-center">
                          <span className="text-lg mr-2">🏨</span>
                          Guest Services
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(() => {
                            const serviceDetails = [];
                            const services = attraction.features.amenities.services;

                            if (services.concierge) serviceDetails.push('Concierge services');
                            if (services.business_center) serviceDetails.push('Business center');
                            if (services.childcare) serviceDetails.push('Kids Club/childcare');
                            if (services.laundry) serviceDetails.push('Laundry services');
                            if (services.car_service) serviceDetails.push('Car service available');

                            return serviceDetails.map((detail, index) => (
                              <div key={index} className="text-xs text-ink-light bg-gray-50/30 rounded-md px-2 py-1">
                                • {detail}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Accommodations */}
                {attraction.features.accommodations && Object.values(attraction.features.accommodations).some(Boolean) && (
                  <div>
                    <h4 className="font-medium text-ink text-sm mb-2">Accommodations</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(attraction.features.accommodations).map(([key, value]) => {
                        if (!value) return null;
                        const labelMap: Record<string, string> = {
                          'suites': 'Suites',
                          'villas': 'Villas',
                          'dvc': 'Disney Vacation Club',
                          'themedRooms': 'Themed Rooms',
                          'familyAccommodations': 'Family Accommodations'
                        };
                        const label = labelMap[key] || key;
                        const icon = featureIcons.find(icon => icon.label === label);
                        return icon ? (
                          <div key={key} className="flex items-center space-x-3 p-3 bg-surface/30 rounded-lg">
                            <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink text-sm">{icon.label}</div>
                              <div className="text-xs text-ink-light">{icon.description}</div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : isEatCategory && attraction.features ? (
            /* Features Section with Icons for EAT items - Organized Categories */
            <div>
              <h3 className="font-semibold text-ink mb-3">Features</h3>
              <div className="space-y-4">
                {/* Service & Ordering */}
                {attraction.features && Object.entries(attraction.features).some(([key, value]) => 
                  ['mobileOrder', 'adrRequired', 'walkupAvailable', 'counterService', 'tableService', 'reservationsRecommended'].includes(key) && value
                ) && (
                  <div>
                    <h4 className="font-medium text-ink text-sm mb-2">Service & Ordering</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(attraction.features).map(([key, value]) => {
                        if (!value || !['mobileOrder', 'adrRequired', 'walkupAvailable', 'counterService', 'tableService', 'reservationsRecommended'].includes(key)) return null;
                        const labelMap: Record<string, string> = {
                          'mobileOrder': 'Mobile Order',
                          'adrRequired': 'ADR Required',
                          'walkupAvailable': 'Walk-up Available',
                          'counterService': 'Counter Service',
                          'tableService': 'Table Service',
                          'reservationsRecommended': 'Reservations Recommended'
                        };
                        const label = labelMap[key] || key;
                        const icon = featureIcons.find(icon => icon.label === label);
                        return icon ? (
                          <div key={key} className="flex items-center space-x-3 p-3 bg-surface/30 rounded-lg">
                            <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink text-sm">{icon.label}</div>
                              <div className="text-xs text-ink-light">{icon.description}</div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Dining Experience */}
                {attraction.features && Object.entries(attraction.features).some(([key, value]) => 
                  ['characterDining', 'entertainment', 'views', 'themedAtmosphere', 'outdoorSeating', 'barLounge', 'familyStyle', 'fineDining'].includes(key) && value
                ) && (
                  <div>
                    <h4 className="font-medium text-ink text-sm mb-2">Dining Experience</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(attraction.features).map(([key, value]) => {
                        if (!value || !['characterDining', 'entertainment', 'views', 'themedAtmosphere', 'outdoorSeating', 'barLounge', 'familyStyle', 'fineDining'].includes(key)) return null;
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
                        const label = labelMap[key] || key;
                        const icon = featureIcons.find(icon => icon.label === label);
                        return icon ? (
                          <div key={key} className="flex items-center space-x-3 p-3 bg-surface/30 rounded-lg">
                            <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink text-sm">{icon.label}</div>
                              <div className="text-xs text-ink-light">{icon.description}</div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Dietary & Accessibility */}
                {attraction.features && Object.entries(attraction.features).some(([key, value]) => 
                  ['vegetarianOptions', 'veganOptions', 'glutenFreeOptions', 'alcoholServed', 'kidFriendly', 'allergyFriendly', 'healthyOptions', 'largePortions'].includes(key) && value
                ) && (
                  <div>
                    <h4 className="font-medium text-ink text-sm mb-2">Dietary & Accessibility</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(attraction.features).map(([key, value]) => {
                        if (!value || !['vegetarianOptions', 'veganOptions', 'glutenFreeOptions', 'alcoholServed', 'kidFriendly', 'allergyFriendly', 'healthyOptions', 'largePortions'].includes(key)) return null;
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
                        const label = labelMap[key] || key;
                        const icon = featureIcons.find(icon => icon.label === label);
                        return icon ? (
                          <div key={key} className="flex items-center space-x-3 p-3 bg-surface/30 rounded-lg">
                            <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink text-sm">{icon.label}</div>
                              <div className="text-xs text-ink-light">{icon.description}</div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : isDoCategory && attraction.features ? (
            /* Features Section with Icons for DO items - Organized Categories */
            <div>
              <h3 className="font-semibold text-ink mb-3">Features</h3>
              <div className="space-y-4">
                {/* Access & Services */}
                {attraction.features && Object.entries(attraction.features).some(([key, value]) => 
                  ['multiPass', 'singlePass', 'singleRider', 'riderSwitch', 'mobileCheckin', 'photoPass'].includes(key) && value
                ) && (
                  <div>
                    <h4 className="font-medium text-ink text-sm mb-2">Access & Services</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(attraction.features).map(([key, value]) => {
                        if (!value || !['multiPass', 'singlePass', 'singleRider', 'riderSwitch', 'mobileCheckin', 'photoPass'].includes(key)) return null;
                        const labelMap: Record<string, string> = {
                          'multiPass': 'Multi Pass',
                          'singlePass': 'Single Pass',
                          'singleRider': 'Single Rider',
                          'riderSwitch': 'Rider Switch',
                          'mobileCheckin': 'Mobile Check-in',
                          'photoPass': 'PhotoPass'
                        };
                        const label = labelMap[key] || key;
                        const icon = featureIcons.find(icon => icon.label === label);
                        return icon ? (
                          <div key={key} className="flex items-center space-x-3 p-3 bg-surface/30 rounded-lg">
                            <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink text-sm">{icon.label}</div>
                              <div className="text-xs text-ink-light">{icon.description}</div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {attraction.features && Object.entries(attraction.features).some(([key, value]) => 
                  ['darkRide', 'getsWet', 'spinningMotion', 'loudSounds', 'strobeEffects', 'interactiveElements', 'characterMeet', 'livePerformance', 'airConditioning', 'outdoorExperience', 'scary', 'bigDrops', 'launchSpeed'].includes(key) && value
                ) && (
                  <div>
                    <h4 className="font-medium text-ink text-sm mb-2">Experience</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(attraction.features).map(([key, value]) => {
                        if (!value || !['darkRide', 'getsWet', 'spinningMotion', 'loudSounds', 'strobeEffects', 'interactiveElements', 'characterMeet', 'livePerformance', 'airConditioning', 'outdoorExperience', 'scary', 'bigDrops', 'launchSpeed'].includes(key)) return null;
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
                        const label = labelMap[key] || key;
                        const icon = featureIcons.find(icon => icon.label === label);
                        return icon ? (
                          <div key={key} className="flex items-center space-x-3 p-3 bg-surface/30 rounded-lg">
                            <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink text-sm">{icon.label}</div>
                              <div className="text-xs text-ink-light">{icon.description}</div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Important Notes */}
                {attraction.features && Object.entries(attraction.features).some(([key, value]) => 
                  ['heightRequirement', 'motionSensitivity', 'pregnancyAdvisory', 'wheelchairAccessible', 'transferRequired', 'rainSafe'].includes(key) && value
                ) && (
                  <div>
                    <h4 className="font-medium text-ink text-sm mb-2">Important Notes</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(attraction.features).map(([key, value]) => {
                        if (!value || !['heightRequirement', 'motionSensitivity', 'pregnancyAdvisory', 'wheelchairAccessible', 'transferRequired', 'rainSafe'].includes(key)) return null;
                        const labelMap: Record<string, string> = {
                          'heightRequirement': 'Height Requirement',
                          'motionSensitivity': 'Motion Sensitivity',
                          'pregnancyAdvisory': 'Pregnancy Advisory',
                          'wheelchairAccessible': 'Wheelchair Accessible',
                          'transferRequired': 'Transfer Required',
                          'rainSafe': 'Rain Safe'
                        };
                        const label = labelMap[key] || key;
                        const icon = featureIcons.find(icon => icon.label === label);
                        return icon ? (
                          <div key={key} className="flex items-center space-x-3 p-3 bg-surface/30 rounded-lg">
                            <span className="text-2xl flex-shrink-0">{icon.emoji}</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink text-sm">{icon.label}</div>
                              <div className="text-xs text-ink-light">{icon.description}</div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Features Section with Icons for other categories */
            featureIcons.length > 0 && (
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
            )
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