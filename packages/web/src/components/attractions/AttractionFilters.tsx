import { useState } from 'react';
import { Search, X, Sliders } from 'lucide-react';
import { useAttractionStore } from '../../stores';
import { AttractionType, IntensityLevel } from '../../types';
import { getParks } from '@waylight/shared';

export default function AttractionFilters() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { filters, setFilters, resetFilters } = useAttractionStore();
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

  const handleIntensityChange = (intensity: string) => {
    // For simplicity, we'll filter by single intensity for now
    setFilters({ 
      // Note: This is a simplified approach - in a real app we'd have intensity in filters
      searchQuery: intensity === 'all' ? '' : intensity 
    });
  };

  const hasActiveFilters = filters.searchQuery || filters.types.length > 0 || 
                          filters.parkIds.length > 0 || filters.wheelchairAccessible;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-light" />
        <input
          type="text"
          placeholder="Search attractions..."
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

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`btn-secondary btn-sm ${showAdvanced ? 'bg-sea/10 text-sea-dark' : ''}`}
        >
          <Sliders className="w-4 h-4 mr-1" />
          Filters
        </button>

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
          onClick={() => handleTypeToggle(AttractionType.DINING)}
          className={`btn-secondary btn-sm ${
            filters.types.includes(AttractionType.DINING) ? 'bg-sea/10 text-sea-dark' : ''
          }`}
        >
          🍽️ Dining
        </button>

        {parks.length > 1 && (
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

        <button
          onClick={() => setFilters({ wheelchairAccessible: !filters.wheelchairAccessible })}
          className={`btn-secondary btn-sm ${
            filters.wheelchairAccessible ? 'bg-sea/10 text-sea-dark' : ''
          }`}
        >
          ♿ Accessible
        </button>

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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Parks */}
            <div>
              <h3 className="font-medium text-ink mb-3">Parks</h3>
              <div className="space-y-2">
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

            {/* Attraction Type */}
            <div>
              <h3 className="font-medium text-ink mb-3">Attraction Type</h3>
              <div className="space-y-2">
                {Object.values(AttractionType).map(type => (
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
              <h3 className="font-medium text-ink mb-3">Intensity</h3>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="intensity"
                    value="all"
                    onChange={(e) => handleIntensityChange(e.target.value)}
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
                      onChange={(e) => handleIntensityChange(e.target.value)}
                      className="mr-2 text-sea focus:ring-sea/20"
                    />
                    <span className="text-sm text-ink capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Height Requirements */}
            <div>
              <h3 className="font-medium text-ink mb-3">Height Requirement</h3>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="height"
                    value="none"
                    className="mr-2 text-sea focus:ring-sea/20"
                  />
                  <span className="text-sm text-ink">No Requirement</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="height"
                    value="under-40"
                    className="mr-2 text-sea focus:ring-sea/20"
                  />
                  <span className="text-sm text-ink">Under 40"</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="height"
                    value="40-plus"
                    className="mr-2 text-sea focus:ring-sea/20"
                  />
                  <span className="text-sm text-ink">40" or taller</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="height"
                    value="48-plus"
                    className="mr-2 text-sea focus:ring-sea/20"
                  />
                  <span className="text-sm text-ink">48" or taller</span>
                </label>
              </div>
            </div>

          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-surface-dark/50">
            <span className="text-sm text-ink-light">
              Use filters to find your perfect attractions
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