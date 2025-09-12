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

  const hasActiveFilters = filters.searchQuery || filters.types.length > 0 || 
                          filters.parkIds.length > 0 || filters.wheelchairAccessible ||
                          filters.adrRequired || filters.mobileOrderAvailable || filters.priceLevel;

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
            <button
              onClick={() => handleTypeToggle(AttractionType.RIDE)}
              className={`btn-secondary btn-sm ${
                filters.types.includes(AttractionType.RIDE) ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🎢 Rides
            </button>
            <button
              onClick={() => handleTypeToggle(AttractionType.SHOW)}
              className={`btn-secondary btn-sm ${
                filters.types.includes(AttractionType.SHOW) ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🎭 Shows
            </button>
            <button
              onClick={() => handleTypeToggle(AttractionType.MEET_GREET)}
              className={`btn-secondary btn-sm ${
                filters.types.includes(AttractionType.MEET_GREET) ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🎯 Meet & Greets
            </button>
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
            <button
              onClick={() => setFilters({ adrRequired: !filters.adrRequired })}
              className={`btn-secondary btn-sm ${
                filters.adrRequired ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              📅 ADR Required
            </button>
            <button
              onClick={() => setFilters({ priceLevel: filters.priceLevel === 1 ? undefined : 1 })}
              className={`btn-secondary btn-sm ${
                filters.priceLevel === 1 ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              💰 Budget-Friendly
            </button>
            <button
              onClick={() => setFilters({ mobileOrderAvailable: !filters.mobileOrderAvailable })}
              className={`btn-secondary btn-sm ${
                filters.mobileOrderAvailable ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              📱 Mobile Order
            </button>
          </>
        )}

        {/* STAY Category Quick Filters */}
        {activeCategory === WaypointCategory.STAY && (
          <>
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
            <button
              onClick={() => handleTypeToggle(AttractionType.HOTEL)}
              className={`btn-secondary btn-sm ${
                filters.types.includes(AttractionType.HOTEL) ? 'bg-sea/10 text-sea-dark' : ''
              }`}
            >
              🏨 Other Hotels
            </button>
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

            {/* DO Category Filters */}
            {(activeCategory === 'all' || activeCategory === WaypointCategory.DO) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ink border-b border-surface-dark/30 pb-2">
                  🎢 Things to Do
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* DO Types */}
                  <div>
                    <h4 className="font-medium text-ink mb-3">Types</h4>
                    <div className="space-y-2">
                      {[AttractionType.RIDE, AttractionType.SHOW, AttractionType.MEET_GREET, AttractionType.ATTRACTION, AttractionType.EXPERIENCE].map(type => (
                        <label key={type} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.types.includes(type)}
                            onChange={() => handleTypeToggle(type)}
                            className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                          />
                          <span className="text-sm text-ink capitalize">
                            {type.replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Intensity Level */}
                  <div>
                    <h4 className="font-medium text-ink mb-3">Intensity</h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="intensity"
                          value="all"
                          onChange={(e) => handleIntensityFilter(e.target.value)}
                          className="mr-2 text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">All Levels</span>
                      </label>
                      {Object.values(IntensityLevel).map(level => (
                        <label key={level} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="intensity"
                            value={level}
                            onChange={(e) => handleIntensityFilter(e.target.value)}
                            className="mr-2 text-sea focus:ring-sea/20"
                          />
                          <span className="text-sm text-ink capitalize">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Accessibility */}
                  <div>
                    <h4 className="font-medium text-ink mb-3">Accessibility</h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.wheelchairAccessible}
                          onChange={() => setFilters({ wheelchairAccessible: !filters.wheelchairAccessible })}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">♿ Wheelchair Accessible</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EAT Category Filters */}
            {(activeCategory === 'all' || activeCategory === WaypointCategory.EAT) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ink border-b border-surface-dark/30 pb-2">
                  🍽️ Places to Eat
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Service Types */}
                  <div>
                    <h4 className="font-medium text-ink mb-3">Service Type</h4>
                    <div className="space-y-2">
                      {['quick', 'table', 'snack', 'lounge'].map(serviceType => (
                        <label key={serviceType} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.serviceTypes?.includes(serviceType) || false}
                            onChange={() => handleServiceTypeToggle(serviceType)}
                            className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                          />
                          <span className="text-sm text-ink capitalize">
                            {serviceType === 'quick' ? 'Quick Service' :
                             serviceType === 'table' ? 'Table Service' :
                             serviceType}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Level */}
                  <div>
                    <h4 className="font-medium text-ink mb-3">Price Range</h4>
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map(level => (
                        <label key={level} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="priceLevel"
                            value={level}
                            checked={filters.priceLevel === level}
                            onChange={() => setFilters({ priceLevel: filters.priceLevel === level ? undefined : level })}
                            className="mr-2 text-sea focus:ring-sea/20"
                          />
                          <span className="text-sm text-ink">
                            {'$'.repeat(level)} {level === 1 ? 'Budget' : level === 2 ? 'Moderate' : level === 3 ? 'Expensive' : 'Luxury'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Special Options */}
                  <div>
                    <h4 className="font-medium text-ink mb-3">Special Options</h4>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.adrRequired || false}
                          onChange={() => setFilters({ adrRequired: !filters.adrRequired })}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">📅 ADR Required</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.mobileOrderAvailable || false}
                          onChange={() => setFilters({ mobileOrderAvailable: !filters.mobileOrderAvailable })}
                          className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                        />
                        <span className="text-sm text-ink">📱 Mobile Order Available</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAY Category Filters */}
            {(activeCategory === 'all' || activeCategory === WaypointCategory.STAY) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ink border-b border-surface-dark/30 pb-2">
                  🏨 Places to Stay
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Accommodation Types */}
                  <div>
                    <h4 className="font-medium text-ink mb-3">Types</h4>
                    <div className="space-y-2">
                      {[AttractionType.RESORT, AttractionType.UNIVERSAL_RESORT, AttractionType.HOTEL].map(type => (
                        <label key={type} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.types.includes(type)}
                            onChange={() => handleTypeToggle(type)}
                            className="mr-2 rounded border-surface-dark text-sea focus:ring-sea/20"
                          />
                          <span className="text-sm text-ink capitalize">
                            {type === AttractionType.RESORT ? 'Disney Resort' : 
                             type === AttractionType.UNIVERSAL_RESORT ? 'Universal Resort' :
                             'Other Hotel'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Resort Tier */}
                  <div>
                    <h4 className="font-medium text-ink mb-3">Resort Tier</h4>
                    <div className="space-y-2">
                      {['value', 'moderate', 'deluxe'].map(tier => (
                        <label key={tier} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="resortTier"
                            value={tier}
                            checked={filters.resortTier === tier}
                            onChange={() => handleResortTierToggle(tier)}
                            className="mr-2 text-sea focus:ring-sea/20"
                          />
                          <span className="text-sm text-ink capitalize">
                            {tier === 'deluxe' ? '💎 Deluxe' : tier === 'moderate' ? '🏛️ Moderate' : '💰 Value'}
                          </span>
                        </label>
                      ))}
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