import { useEffect, useState } from 'react';
import { Grid, List, Star, Info } from 'lucide-react';
import { useWaypointStore } from '../stores';
import { WaypointCategory } from '../types';
import useUserPreferencesStore from '../stores/useUserPreferencesStore';
import WaypointCard from '../components/waypoints/WaypointCard';
import WaypointFilters from '../components/waypoints/WaypointFilters';
import WaypointIconLegend from '../components/waypoints/WaypointIconLegend';

export default function WaypointsWorking() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showIconLegend, setShowIconLegend] = useState(false);
  const { displaySettings } = useUserPreferencesStore();
  const { 
    filteredWaypoints, 
    isLoading, 
    activeCategory,
    loadWaypoints,
    setActiveCategory
  } = useWaypointStore();

  useEffect(() => {
    loadWaypoints();
  }, [loadWaypoints]);

  if (isLoading) {
    return (
      <div className="container-waylight section-padding">
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse">Loading attractions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-waylight section-padding">
      <div className="mb-6">
        <p className="text-ink-light">
          Discover everything you can do, eat, and stay at Walt Disney World with insider tips and recommendations.
        </p>
      </div>

      {/* Category Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-sea text-white shadow-sm'
                : 'bg-surface text-ink-light hover:text-ink hover:bg-surface-dark/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveCategory(WaypointCategory.DO)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === WaypointCategory.DO
                ? 'bg-sea text-white shadow-sm'
                : 'bg-surface text-ink-light hover:text-ink hover:bg-surface-dark/50'
            }`}
          >
            🎢 Do
          </button>
          <button
            onClick={() => setActiveCategory(WaypointCategory.EAT)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === WaypointCategory.EAT
                ? 'bg-sea text-white shadow-sm'
                : 'bg-surface text-ink-light hover:text-ink hover:bg-surface-dark/50'
            }`}
          >
            🍽️ Eat
          </button>
          <button
            onClick={() => setActiveCategory(WaypointCategory.STAY)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === WaypointCategory.STAY
                ? 'bg-sea text-white shadow-sm'
                : 'bg-surface text-ink-light hover:text-ink hover:bg-surface-dark/50'
            }`}
          >
            🏨 Stay
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <WaypointFilters />
      </div>


      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-ink">
            {activeCategory === 'all' ? 'All Waypoints' : 
             activeCategory === WaypointCategory.DO ? 'Things to Do' :
             activeCategory === WaypointCategory.EAT ? 'Places to Eat' :
             activeCategory === WaypointCategory.STAY ? 'Places to Stay' : 'Waypoints'}
            <span className="ml-2 text-ink-light text-base">
              ({filteredWaypoints.length} found)
            </span>
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Icon Legend Button */}
          <button
            onClick={() => setShowIconLegend(true)}
            className="btn-ghost btn-sm flex items-center hover:bg-surface-dark/10"
            title="View icon meanings"
          >
            <Info className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Icon Guide</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-surface-dark rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${
                viewMode === 'grid' 
                  ? 'bg-sea text-white' 
                  : 'text-ink-light hover:text-ink hover:bg-surface-dark/50'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${
                viewMode === 'list' 
                  ? 'bg-sea text-white' 
                  : 'text-ink-light hover:text-ink hover:bg-surface-dark/50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Waypoints Grid/List */}
      {filteredWaypoints.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid sm:grid-cols-2 lg:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredWaypoints.map(waypoint => (
            <WaypointCard 
              key={waypoint.id} 
              attraction={waypoint}
              showTips={displaySettings.showTips}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center animate-fade-in">
          <Star className="w-16 h-16 text-sea mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-ink mb-2">Your path awaits</h3>
          <p className="text-ink-light mb-6">
            We couldn't find waypoints matching your search. Try adjusting your filters to discover new adventures.
          </p>
          <button 
            onClick={() => useWaypointStore.getState().resetFilters()}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Icon Legend Modal */}
      <WaypointIconLegend 
        isOpen={showIconLegend}
        onClose={() => setShowIconLegend(false)}
        activeCategory={activeCategory}
      />
    </div>
  );
}