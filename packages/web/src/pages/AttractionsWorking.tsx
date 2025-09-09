import { useEffect, useState } from 'react';
import { Star, Grid, List, Heart } from 'lucide-react';
import { useAttractionStore } from '../stores';
import AttractionCard from '../components/attractions/AttractionCard';
import AttractionFilters from '../components/attractions/AttractionFilters';

export default function AttractionsWorking() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showTips, setShowTips] = useState(true);
  const { 
    filteredAttractions, 
    isLoading, 
    loadAttractions,
    getFavoriteAttractions 
  } = useAttractionStore();

  useEffect(() => {
    loadAttractions();
  }, [loadAttractions]);

  const favoriteAttractions = getFavoriteAttractions();

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

      {/* Favorites Section */}
      {favoriteAttractions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Heart className="w-5 h-5 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold text-ink">Your Favorites</h2>
            <span className="ml-2 badge badge-secondary">{favoriteAttractions.length}</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {favoriteAttractions.slice(0, 3).map(attraction => (
              <AttractionCard 
                key={attraction.id} 
                attraction={attraction}
                showAddToTrip={false}
                showTips={showTips}
              />
            ))}
          </div>
        </div>
      )}

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
          {/* Tips Toggle */}
          <button
            onClick={() => setShowTips(!showTips)}
            className={`btn-ghost btn-sm flex items-center ${
              showTips ? 'text-glow-dark' : 'text-ink-light'
            }`}
          >
            <Star className={`w-4 h-4 mr-1 ${showTips ? 'fill-current' : ''}`} />
            Tips
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
            ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredAttractions.map(attraction => (
            <AttractionCard 
              key={attraction.id} 
              attraction={attraction}
              showTips={showTips}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Star className="w-16 h-16 text-ink-light mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-ink mb-2">No Attractions Found</h3>
          <p className="text-ink-light mb-6">
            Try adjusting your filters or search terms to find more attractions.
          </p>
          <button 
            onClick={() => useAttractionStore.getState().resetFilters()}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}