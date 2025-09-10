import { useEffect, useState } from 'react';
import { Grid, List, Star, Info } from 'lucide-react';
import { useAttractionStore } from '../stores';
import useUserPreferencesStore from '../stores/useUserPreferencesStore';
import AttractionCard from '../components/attractions/AttractionCard';
import AttractionFilters from '../components/attractions/AttractionFilters';
import AttractionIconLegend from '../components/attractions/AttractionIconLegend';

export default function AttractionsWorking() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showIconLegend, setShowIconLegend] = useState(false);
  const { displaySettings } = useUserPreferencesStore();
  const { 
    filteredAttractions, 
    isLoading, 
    loadAttractions
  } = useAttractionStore();

  useEffect(() => {
    loadAttractions();
  }, [loadAttractions]);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink mb-4">Attractions</h1>
        <p className="text-ink-light">
          Discover and explore Walt Disney World attractions with insider tips and recommendations.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <AttractionFilters />
      </div>


      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-ink">
            All Attractions
            <span className="ml-2 text-ink-light text-base">
              ({filteredAttractions.length} found)
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

      {/* Attractions Grid/List */}
      {filteredAttractions.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid sm:grid-cols-2 lg:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredAttractions.map(attraction => (
            <AttractionCard 
              key={attraction.id} 
              attraction={attraction}
              showTips={displaySettings.showTips}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center animate-fade-in">
          <Star className="w-16 h-16 text-sea mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-ink mb-2">Your path awaits</h3>
          <p className="text-ink-light mb-6">
            We couldn't find attractions matching your search. Try adjusting your filters to discover new adventures.
          </p>
          <button 
            onClick={() => useAttractionStore.getState().resetFilters()}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Icon Legend Modal */}
      <AttractionIconLegend 
        isOpen={showIconLegend}
        onClose={() => setShowIconLegend(false)}
      />
    </div>
  );
}