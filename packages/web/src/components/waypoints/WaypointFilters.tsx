import { useState } from 'react';
import { Search, X, Sliders } from 'lucide-react';
import { useWaypointStore } from '../../stores';
import { AttractionType, IntensityLevel, WaypointCategory } from '../../types';
import { getParks } from '@waylight/shared';

export default function WaypointFilters() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { filters, setFilters, resetFilters, activeCategory } = useWaypointStore();
  const parks = getParks();

  const handleSearchChange = (query: string) => {
    setFilters({ searchQuery: query });
  };

  const handleTypeToggle = (type: AttractionType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    setFilters({ types: newTypes });
  };

  const handleParkToggle = (parkId: string) => {
    const newParkIds = filters.parkIds.includes(parkId)
      ? filters.parkIds.filter(id => id !== parkId)
      : [...filters.parkIds, parkId];
    setFilters({ parkIds: newParkIds });
  };

  const handleIntensityFilter = (intensity: string) => {
    // TODO: Implement proper intensity filtering when store supports it
    const currentQuery = filters.searchQuery;
    const intensityTerms = ['low', 'moderate', 'high', 'extreme'];
    const cleanQuery = currentQuery.split(' ').filter(term => !intensityTerms.includes(term.toLowerCase())).join(' ');
    const newQuery = intensity === 'all' ? cleanQuery : `${cleanQuery} ${intensity}`.trim();
    setFilters({ searchQuery: newQuery });
  };

  const handleServiceTypeToggle = (serviceType: string) => {
    const newServiceTypes = filters.serviceTypes?.includes(serviceType)
      ? filters.serviceTypes.filter(t => t !== serviceType)
      : [...(filters.serviceTypes || []), serviceType];
    setFilters({ serviceTypes: newServiceTypes });
  };

  const handleResortTierToggle = (tier: string) => {
    setFilters({ resortTier: filters.resortTier === tier ? undefined : tier });
  };

  const handleDoFeatureToggle = (feature: string) => {
    const currentDoFeatures = filters.doFeatures || {};
    const newDoFeatures = {
      ...currentDoFeatures,
      [feature]: !currentDoFeatures[feature]
    };
    
    // Remove feature if it's false
    if (!newDoFeatures[feature]) {
      delete newDoFeatures[feature];
    }
    
    setFilters({ doFeatures: newDoFeatures });
  };

  const handleEatFeatureToggle = (feature: string) => {
    const currentEatFeatures = filters.eatFeatures || {};
    const newEatFeatures = {
      ...currentEatFeatures,
      [feature]: !currentEatFeatures[feature]
    };
    
    // Remove feature if it's false
    if (!newEatFeatures[feature]) {
      delete newEatFeatures[feature];
    }
    
    setFilters({ eatFeatures: newEatFeatures });
  };

  const handleStayFeatureToggle = (feature: string) => {
    const currentStayFeatures = filters.stayFeatures || {};
    const newStayFeatures = {
      ...currentStayFeatures,
      [feature]: !currentStayFeatures[feature]
    };
    
    // Remove feature if it's false
    if (!newStayFeatures[feature]) {
      delete newStayFeatures[feature];
    }
    
    setFilters({ stayFeatures: newStayFeatures });
  };

  const handleIntensityToggle = (intensity: string) => {
    setFilters({ intensity: filters.intensity === intensity ? undefined : intensity });
  };

  const hasActiveFilters = filters.searchQuery || filters.types.length > 0 || 
                          filters.parkIds.length > 0 || filters.wheelchairAccessible ||
                          filters.adrRequired || filters.mobileOrderAvailable || filters.priceLevel ||
                          filters.intensity || filters.resortTier ||
                          (filters.doFeatures && Object.keys(filters.doFeatures).length > 0) ||
                          (filters.eatFeatures && Object.keys(filters.eatFeatures).length > 0) ||
                          (filters.stayFeatures && Object.keys(filters.stayFeatures).length > 0);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-light" />
        <input
          type="text"
          placeholder={
            activeCategory === 'all' ? "Search waypoints..." :
            activeCategory === WaypointCategory.DO ? "Search things to do..." :
            activeCategory === WaypointCategory.EAT ? "Search places to eat..." :
            activeCategory === WaypointCategory.STAY ? "Search places to stay..." :
            "Search waypoints..."
          }
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="input pl-10 pr-4"
        />
        {filters.searchQuery && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-surface-dark/50"
          >
            <X className="w-4 h-4 text-ink-light" />
          </button>
        )}
      </div>

      {/* Quick Filters - Category Aware */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`btn-secondary btn-sm ${showAdvanced ? 'bg-sea/10 text-sea-dark' : ''}`}
        >
          <Sliders className="w-4 h-4 mr-1" />
          Filters
        </button>

        {/* All Categories Quick Filters */}
        {activeCategory === 'all' && (
          <>
            <button
              onClick={() => handleTypeToggle(AttractionType.RIDE)}
              className={`btn-secondary btn-sm ${
                filters.types.includes(AttractionType.RIDE) ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🎢 Rides & Shows
            </button>
            <button
              onClick={() => handleTypeToggle(AttractionType.QUICK_SERVICE)}
              className={`btn-secondary btn-sm ${
                filters.types.includes(AttractionType.QUICK_SERVICE) ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🍽️ Dining
            </button>
            <button
              onClick={() => handleTypeToggle(AttractionType.RESORT)}
              className={`btn-secondary btn-sm ${
                filters.types.includes(AttractionType.RESORT) ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🏰 Disney Resorts
            </button>
            <button
              onClick={() => handleTypeToggle(AttractionType.UNIVERSAL_RESORT)}
              className={`btn-secondary btn-sm ${
                filters.types.includes(AttractionType.UNIVERSAL_RESORT) ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🎬 Universal Resorts
            </button>
          </>
        )}

        {/* DO Category Quick Filters */}
        {activeCategory === WaypointCategory.DO && (
          <>
            {/* Lightning Lane Filters */}
            <button
              onClick={() => handleDoFeatureToggle('singlePass')}
              className={`btn-secondary btn-sm ${
                filters.doFeatures?.singlePass ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🎫 Single Pass
            </button>
            <button
              onClick={() => handleDoFeatureToggle('multiPass')}
              className={`btn-secondary btn-sm ${
                filters.doFeatures?.multiPass ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🎟️ Multi Pass
            </button>
            
            {/* Experience Features */}
            <button
              onClick={() => handleDoFeatureToggle('scary')}
              className={`btn-secondary btn-sm ${
                filters.doFeatures?.scary ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              👻 Scary
            </button>
            <button
              onClick={() => handleDoFeatureToggle('bigDrops')}
              className={`btn-secondary btn-sm ${
                filters.doFeatures?.bigDrops ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              ⛰️ Big Drops
            </button>
            <button
              onClick={() => handleDoFeatureToggle('launchSpeed')}
              className={`btn-secondary btn-sm ${
                filters.doFeatures?.launchSpeed ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🚀 Launch/Speed
            </button>
            
            {/* Intensity Filters */}
            <button
              onClick={() => handleIntensityToggle('low')}
              className={`btn-secondary btn-sm ${
                filters.intensity === 'low' ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              😌 Low Intensity
            </button>
            <button
              onClick={() => handleIntensityToggle('high')}
              className={`btn-secondary btn-sm ${
                filters.intensity === 'high' ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🤯 High Intensity
            </button>
            
            {/* Accessibility */}
            <button
              onClick={() => setFilters({ wheelchairAccessible: !filters.wheelchairAccessible })}
              className={`btn-secondary btn-sm ${
                filters.wheelchairAccessible ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              ♿ Accessible
            </button>
          </>
        )}

        {/* EAT Category Quick Filters */}
        {activeCategory === WaypointCategory.EAT && (
          <>
            {/* Service Types */}
            <button
              onClick={() => handleServiceTypeToggle('quick')}
              className={`btn-secondary btn-sm ${
                filters.serviceTypes?.includes('quick') ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🍔 Quick Service
            </button>
            <button
              onClick={() => handleServiceTypeToggle('table')}
              className={`btn-secondary btn-sm ${
                filters.serviceTypes?.includes('table') ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🍽️ Table Service
            </button>
            <button
              onClick={() => handleServiceTypeToggle('snack')}
              className={`btn-secondary btn-sm ${
                filters.serviceTypes?.includes('snack') ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🍿 Snacks
            </button>
            
            {/* Enhanced EAT Features */}
            <button
              onClick={() => handleEatFeatureToggle('characterDining')}
              className={`btn-secondary btn-sm ${
                filters.eatFeatures?.characterDining ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🐭 Character Dining
            </button>
            <button
              onClick={() => handleEatFeatureToggle('fineDining')}
              className={`btn-secondary btn-sm ${
                filters.eatFeatures?.fineDining ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              ⭐ Signature Dining
            </button>
            <button
              onClick={() => handleEatFeatureToggle('alcoholServed')}
              className={`btn-secondary btn-sm ${
                filters.eatFeatures?.alcoholServed ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🍷 Alcohol
            </button>
            
            {/* Service & Convenience */}
            <button
              onClick={() => setFilters({ adrRequired: !filters.adrRequired })}
              className={`btn-secondary btn-sm ${
                filters.adrRequired ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              📅 ADR Required
            </button>
            <button
              onClick={() => setFilters({ mobileOrderAvailable: !filters.mobileOrderAvailable })}
              className={`btn-secondary btn-sm ${
                filters.mobileOrderAvailable ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              📱 Mobile Order
            </button>
            
            {/* Price Levels */}
            <button
              onClick={() => setFilters({ priceLevel: filters.priceLevel === 1 ? undefined : 1 })}
              className={`btn-secondary btn-sm ${
                filters.priceLevel === 1 ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              💰 Budget-Friendly
            </button>
          </>
        )}

        {/* STAY Category Quick Filters */}
        {activeCategory === WaypointCategory.STAY && (
          <>
            {/* Resort Tiers */}
            <button
              onClick={() => handleResortTierToggle('deluxe')}
              className={`btn-secondary btn-sm ${
                filters.resortTier === 'deluxe' ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              💎 Deluxe
            </button>
            <button
              onClick={() => handleResortTierToggle('moderate')}
              className={`btn-secondary btn-sm ${
                filters.resortTier === 'moderate' ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🏛️ Moderate
            </button>
            <button
              onClick={() => handleResortTierToggle('value')}
              className={`btn-secondary btn-sm ${
                filters.resortTier === 'value' ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              💰 Value
            </button>
            
            {/* Transportation Features */}
            <button
              onClick={() => handleStayFeatureToggle('monorailAccess')}
              className={`btn-secondary btn-sm ${
                filters.stayFeatures?.monorailAccess ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🚝 Monorail
            </button>
            <button
              onClick={() => handleStayFeatureToggle('boatAccess')}
              className={`btn-secondary btn-sm ${
                filters.stayFeatures?.boatAccess ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              ⛵ Boat Access
            </button>
            <button
              onClick={() => handleStayFeatureToggle('walkingDistance')}
              className={`btn-secondary btn-sm ${
                filters.stayFeatures?.walkingDistance ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🚶 Walking Distance
            </button>
            
            {/* Recreation Features */}
            <button
              onClick={() => handleStayFeatureToggle('pools')}
              className={`btn-secondary btn-sm ${
                filters.stayFeatures?.pools ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🏊 Pool
            </button>
            <button
              onClick={() => handleStayFeatureToggle('spa')}
              className={`btn-secondary btn-sm ${
                filters.stayFeatures?.spa ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              💆 Spa
            </button>
            
            {/* Hotel Types */}
            <button
              onClick={() => handleTypeToggle(AttractionType.RESORT)}
              className={`btn-secondary btn-sm ${
                filters.types.includes(AttractionType.RESORT) ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🏰 Disney Resorts
            </button>
            <button
              onClick={() => handleTypeToggle(AttractionType.UNIVERSAL_RESORT)}
              className={`btn-secondary btn-sm ${
                filters.types.includes(AttractionType.UNIVERSAL_RESORT) ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🎬 Universal Resorts
            </button>
          </>
        )}

        {/* Park Filters - Show for DO and EAT categories only */}
        {parks.length > 1 && activeCategory !== WaypointCategory.STAY && (
          <>
            <button
              onClick={() => handleParkToggle('magic-kingdom')}
              className={`btn-secondary btn-sm ${
                filters.parkIds.includes('magic-kingdom') ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🏰 Magic Kingdom
            </button>
            
            <button
              onClick={() => handleParkToggle('epcot')}
              className={`btn-secondary btn-sm ${
                filters.parkIds.includes('epcot') ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🌐 EPCOT
            </button>
            
            <button
              onClick={() => handleParkToggle('hollywood-studios')}
              className={`btn-secondary btn-sm ${
                filters.parkIds.includes('hollywood-studios') ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🎬 Hollywood Studios
            </button>
            
            <button
              onClick={() => handleParkToggle('animal-kingdom')}
              className={`btn-secondary btn-sm ${
                filters.parkIds.includes('animal-kingdom') ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🦁 Animal Kingdom
            </button>
          </>
        )}

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="btn-ghost btn-sm text-ink-light hover:text-ink"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="card p-6 animate-in">
          <div className="space-y-8">
            
            {/* Parks - Show for DO and EAT categories only */}
            {activeCategory !== WaypointCategory.STAY && (
              <div>
                <h3 className="font-medium text-ink mb-3">Parks</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {parks.map(park => (
                    <label key={park.id} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.parkIds.includes(park.id)}
                        onChange={() => handleParkToggle(park.id)}
                        className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                      />
                      <span className="text-sm text-ink">
                        {park.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            
            {/* DO Category Feature Filters */}
            {(activeCategory === 'all' || activeCategory === WaypointCategory.DO) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ink border-b border-surface-dark/30 pb-2">
                  🎢 DO Features
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Skip Lines & Services */}
                  <div>
                    <h4 className="font-medium text-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Skip Lines & Services
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.multiPass || false}
                          onChange={() => handleDoFeatureToggle('multiPass')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🎟️ Multi Pass</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.singlePass || false}
                          onChange={() => handleDoFeatureToggle('singlePass')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🎫 Single Pass</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.singleRider || false}
                          onChange={() => handleDoFeatureToggle('singleRider')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">👤 Single Rider</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.riderSwitch || false}
                          onChange={() => handleDoFeatureToggle('riderSwitch')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">👨‍👩‍👧‍👦 Rider Switch</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.mobileCheckin || false}
                          onChange={() => handleDoFeatureToggle('mobileCheckin')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">📱 Mobile Check-in</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.photoPass || false}
                          onChange={() => handleDoFeatureToggle('photoPass')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">📸 PhotoPass</span>
                      </label>
                    </div>
                  </div>

                  {/* What to Expect */}
                  <div>
                    <h4 className="font-medium text-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      What to Expect
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.scary || false}
                          onChange={() => handleDoFeatureToggle('scary')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">👻 Scary</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.bigDrops || false}
                          onChange={() => handleDoFeatureToggle('bigDrops')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">⛰️ Big Drops</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.launchSpeed || false}
                          onChange={() => handleDoFeatureToggle('launchSpeed')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🚀 Launch/Speed</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.getsWet || false}
                          onChange={() => handleDoFeatureToggle('getsWet')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">💧 Gets Wet</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.spinningMotion || false}
                          onChange={() => handleDoFeatureToggle('spinningMotion')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🌀 Spinning Motion</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.darkRide || false}
                          onChange={() => handleDoFeatureToggle('darkRide')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🌑 Dark Ride</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.interactiveElements || false}
                          onChange={() => handleDoFeatureToggle('interactiveElements')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🎮 Interactive</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.characterMeet || false}
                          onChange={() => handleDoFeatureToggle('characterMeet')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🐭 Character Meet</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.livePerformance || false}
                          onChange={() => handleDoFeatureToggle('livePerformance')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🎭 Live Performance</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.airConditioning || false}
                          onChange={() => handleDoFeatureToggle('airConditioning')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">❄️ Air Conditioning</span>
                      </label>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div>
                    <h4 className="font-medium text-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Important Notes
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.heightRequirement || false}
                          onChange={() => handleDoFeatureToggle('heightRequirement')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">📏 Height Requirement</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.motionSensitivity || false}
                          onChange={() => handleDoFeatureToggle('motionSensitivity')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🤢 Motion Sensitivity</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.pregnancyAdvisory || false}
                          onChange={() => handleDoFeatureToggle('pregnancyAdvisory')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🤰 Pregnancy Advisory</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.wheelchairAccessible || false}
                          onChange={() => handleDoFeatureToggle('wheelchairAccessible')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">♿ Wheelchair Accessible</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.transferRequired || false}
                          onChange={() => handleDoFeatureToggle('transferRequired')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🚶 Transfer Required</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.doFeatures?.rainSafe || false}
                          onChange={() => handleDoFeatureToggle('rainSafe')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">☔ Rain Safe</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EAT Category Feature Filters */}
            {(activeCategory === 'all' || activeCategory === WaypointCategory.EAT) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ink border-b border-surface-dark/30 pb-2">
                  🍽️ EAT Features
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Service & Ordering */}
                  <div>
                    <h4 className="font-medium text-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Service & Ordering
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.mobileOrder || false}
                          onChange={() => handleEatFeatureToggle('mobileOrder')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">📱 Mobile Order</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.adrRequired || false}
                          onChange={() => handleEatFeatureToggle('adrRequired')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">📅 ADR Required</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.quickService || false}
                          onChange={() => handleEatFeatureToggle('quickService')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🍔 Quick Service</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.groupFriendly || false}
                          onChange={() => handleEatFeatureToggle('groupFriendly')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">👥 Group Friendly</span>
                      </label>
                    </div>
                  </div>

                  {/* Dining Experience */}
                  <div>
                    <h4 className="font-medium text-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Dining Experience
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.characterDining || false}
                          onChange={() => handleEatFeatureToggle('characterDining')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🐭 Character Dining</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.fineDining || false}
                          onChange={() => handleEatFeatureToggle('fineDining')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">💎 Fine Dining</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.scenicViews || false}
                          onChange={() => handleEatFeatureToggle('scenicViews')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🏰 Scenic Views</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.liveEntertainment || false}
                          onChange={() => handleEatFeatureToggle('liveEntertainment')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🎭 Live Entertainment</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.buffet || false}
                          onChange={() => handleEatFeatureToggle('buffet')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🍛 Buffet</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.familyStyle || false}
                          onChange={() => handleEatFeatureToggle('familyStyle')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">👨‍👩‍👧‍👦 Family Style</span>
                      </label>
                    </div>
                  </div>

                  {/* Dietary & Accessibility */}
                  <div>
                    <h4 className="font-medium text-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Dietary & Accessibility
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.alcoholServed || false}
                          onChange={() => handleEatFeatureToggle('alcoholServed')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🍷 Alcohol Served</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.allergyFriendly || false}
                          onChange={() => handleEatFeatureToggle('allergyFriendly')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">⚕️ Allergy Friendly</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.healthyOptions || false}
                          onChange={() => handleEatFeatureToggle('healthyOptions')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🥗 Healthy Options</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.signatureDish || false}
                          onChange={() => handleEatFeatureToggle('signatureDish')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🍽️ Signature Dish</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eatFeatures?.seasonal || false}
                          onChange={() => handleEatFeatureToggle('seasonal')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🍂 Seasonal Menu</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAY Category Feature Filters */}
            {(activeCategory === 'all' || activeCategory === WaypointCategory.STAY) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ink border-b border-surface-dark/30 pb-2">
                  🏨 STAY Features
                </h3>
                
                <div className="grid md:grid-cols-4 gap-6">
                  {/* Transportation */}
                  <div>
                    <h4 className="font-medium text-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Transportation
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.monorailAccess || false}
                          onChange={() => handleStayFeatureToggle('monorailAccess')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🚝 Monorail</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.skylinerAccess || false}
                          onChange={() => handleStayFeatureToggle('skylinerAccess')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🚡 Skyliner</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.boatAccess || false}
                          onChange={() => handleStayFeatureToggle('boatAccess')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">⛵ Boat Transport</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.walkingDistance || false}
                          onChange={() => handleStayFeatureToggle('walkingDistance')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🚶 Walking Distance</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.earlyParkEntry || false}
                          onChange={() => handleStayFeatureToggle('earlyParkEntry')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🌅 Early Park Entry</span>
                      </label>
                    </div>
                  </div>

                  {/* Recreation */}
                  <div>
                    <h4 className="font-medium text-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Recreation
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.pools || false}
                          onChange={() => handleStayFeatureToggle('pools')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🏊 Pool</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.waterSlides || false}
                          onChange={() => handleStayFeatureToggle('waterSlides')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🌊 Water Features</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.spa || false}
                          onChange={() => handleStayFeatureToggle('spa')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">💆 Spa</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.fitness || false}
                          onChange={() => handleStayFeatureToggle('fitness')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">💪 Fitness Center</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.golf || false}
                          onChange={() => handleStayFeatureToggle('golf')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">⛳ Golf</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.beach || false}
                          onChange={() => handleStayFeatureToggle('beach')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🏖️ Beach</span>
                      </label>
                    </div>
                  </div>

                  {/* Dining & Services */}
                  <div>
                    <h4 className="font-medium text-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Dining & Services
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.dining || false}
                          onChange={() => handleStayFeatureToggle('dining')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🍽️ Dining</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.concierge || false}
                          onChange={() => handleStayFeatureToggle('concierge')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🔔 Concierge</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.businessCenter || false}
                          onChange={() => handleStayFeatureToggle('businessCenter')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">💼 Business Center</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.childcare || false}
                          onChange={() => handleStayFeatureToggle('childcare')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">👶 Kids Club</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.parking || false}
                          onChange={() => handleStayFeatureToggle('parking')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🅿️ Parking</span>
                      </label>
                    </div>
                  </div>

                  {/* Accommodations */}
                  <div>
                    <h4 className="font-medium text-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      Accommodations
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.suites || false}
                          onChange={() => handleStayFeatureToggle('suites')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🛏️ Suites</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.villas || false}
                          onChange={() => handleStayFeatureToggle('villas')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🏘️ Villas</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.dvc || false}
                          onChange={() => handleStayFeatureToggle('dvc')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🏡 Disney Vacation Club</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.themedRooms || false}
                          onChange={() => handleStayFeatureToggle('themedRooms')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">🎨 Themed Rooms</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.stayFeatures?.familyAccommodations || false}
                          onChange={() => handleStayFeatureToggle('familyAccommodations')}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">👨‍👩‍👧‍👦 Family Accommodations</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-surface-dark/50">
            <span className="text-sm text-ink-light">
              Use filters to find your perfect waypoints
            </span>
            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="btn-ghost btn-sm"
              >
                Reset
              </button>
              <button
                onClick={() => setShowAdvanced(false)}
                className="btn-primary btn-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}