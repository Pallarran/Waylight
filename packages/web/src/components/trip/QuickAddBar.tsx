import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, Clock } from 'lucide-react';
import { ACTIVITY_CATEGORIES, getCategoryIcon, getCategoryColor } from '../../data/activityCategories';
import { getAttractionsByType } from '../../data/attractions';
import type { ActivityCategory } from '../../types';

interface QuickAddBarProps {
  selectedParkId?: string;
  onAddActivity: (type: ActivityCategory, attractionId?: string, customName?: string) => void;
  onClose?: () => void;
}

interface SearchResult {
  type: 'attraction' | 'category';
  id: string;
  name: string;
  category: ActivityCategory;
  description?: string;
  duration?: number;
  location?: string;
}

export default function QuickAddBar({ selectedParkId, onAddActivity, onClose }: QuickAddBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get suggested attractions based on park and common preferences
  const getSuggestedAttractions = useCallback((): SearchResult[] => {
    if (!selectedParkId) return [];
    
    const suggestions: SearchResult[] = [];
    
    // Get popular attractions for the selected park
    const popularAttractions = [
      // Magic Kingdom suggestions
      ...(selectedParkId === 'magic-kingdom' ? [
        'space-mountain', 'seven-dwarfs-mine-train', 'pirates-of-the-caribbean', 
        'haunted-mansion', 'jungle-cruise', 'big-thunder-mountain'
      ] : []),
      // EPCOT suggestions  
      ...(selectedParkId === 'epcot' ? [
        'guardians-of-the-galaxy', 'test-track', 'frozen-ever-after',
        'spaceship-earth', 'soarin', 'living-with-the-land'
      ] : []),
      // Hollywood Studios suggestions
      ...(selectedParkId === 'hollywood-studios' ? [
        'rise-of-the-resistance', 'millennium-falcon', 'tower-of-terror',
        'rockin-rollercoaster', 'toy-story-midway-mania', 'indiana-jones'
      ] : []),
      // Animal Kingdom suggestions
      ...(selectedParkId === 'animal-kingdom' ? [
        'avatar-flight-of-passage', 'expedition-everest', 'kilimanjaro-safaris',
        'na-vi-river-journey', 'dinosaur', 'festival-of-the-lion-king'
      ] : [])
    ];

    // Convert attraction IDs to SearchResult objects
    ACTIVITY_CATEGORIES.forEach(category => {
      const attractions = getAttractionsByType(category.id, selectedParkId);
      attractions.forEach(attraction => {
        if (popularAttractions.includes(attraction.id)) {
          suggestions.push({
            type: 'attraction',
            id: attraction.id,
            name: attraction.name,
            category: category.id as ActivityCategory,
            description: attraction.location,
            duration: attraction.duration,
            location: attraction.location
          });
        }
      });
    });

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }, [selectedParkId]);

  // Build search results based on current input
  useEffect(() => {
    if (searchTerm.length < 1) {
      // Show suggested attractions and popular categories when no search term
      const suggested = getSuggestedAttractions();
      const popularCategories: SearchResult[] = [
        { type: 'category', id: 'ride', name: 'Add Ride', category: 'ride', description: 'Attractions and rides' },
        { type: 'category', id: 'dining', name: 'Add Dining', category: 'dining', description: 'Restaurants and snacks' },
        { type: 'category', id: 'show', name: 'Add Show', category: 'show', description: 'Entertainment and shows' },
        { type: 'category', id: 'meet_greet', name: 'Add Character Meet', category: 'meet_greet', description: 'Character meet & greets' }
      ];
      
      // Combine suggestions and categories
      const allResults = [...suggested, ...popularCategories];
      setResults(allResults);
      setSelectedIndex(0);
      return;
    }

    const searchResults: SearchResult[] = [];
    const searchLower = searchTerm.toLowerCase();

    // Search through attractions
    ACTIVITY_CATEGORIES.forEach(category => {
      const attractions = getAttractionsByType(category.id, selectedParkId);
      attractions.forEach(attraction => {
        if (attraction.name.toLowerCase().includes(searchLower) ||
            attraction.location.toLowerCase().includes(searchLower) ||
            attraction.description.toLowerCase().includes(searchLower)) {
          searchResults.push({
            type: 'attraction',
            id: attraction.id,
            name: attraction.name,
            category: category.id as ActivityCategory,
            description: attraction.location,
            duration: attraction.duration,
            location: attraction.location
          });
        }
      });
    });

    // Search through categories
    ACTIVITY_CATEGORIES.forEach(category => {
      if (category.name.toLowerCase().includes(searchLower) ||
          category.description.toLowerCase().includes(searchLower)) {
        searchResults.push({
          type: 'category',
          id: category.id,
          name: `Add ${category.name}`,
          category: category.id as ActivityCategory,
          description: category.description
        });
      }
    });

    // Sort results: attractions first, then categories, then by relevance
    searchResults.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'attraction' ? -1 : 1;
      }
      // Both same type, sort by how well they match
      const aMatch = a.name.toLowerCase().indexOf(searchLower);
      const bMatch = b.name.toLowerCase().indexOf(searchLower);
      return aMatch - bMatch;
    });

    setResults(searchResults.slice(0, 8)); // Limit to 8 results
    setSelectedIndex(0);
  }, [searchTerm, selectedParkId, getSuggestedAttractions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'attraction') {
      onAddActivity(result.category, result.id);
    } else {
      onAddActivity(result.category);
    }
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setIsOpen(false);
    onClose?.();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && isOpen) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-light" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-3 bg-surface border border-surface-dark rounded-lg text-ink placeholder-ink-light focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
          placeholder="Search attractions or add activity..."
        />
        {searchTerm && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-light hover:text-ink"
          >
            ×
          </button>
        )}
      </div>

      {/* Search Results */}
      {isOpen && results.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-surface border border-surface-dark rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
        >
          {searchTerm.length === 0 && (
            <>
              {/* Suggested Attractions Section */}
              {getSuggestedAttractions().length > 0 && (
                <div className="px-3 py-2 bg-surface-dark/20 border-b border-surface-dark/30">
                  <h5 className="text-xs font-medium text-ink-light">✨ Suggested for {selectedParkId ? selectedParkId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'this park'}</h5>
                </div>
              )}
              
              {results.filter(r => r.type === 'attraction').map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelectResult(result)}
                  className={`w-full p-3 text-left transition-colors border-b border-surface-dark/30 ${
                    index === selectedIndex 
                      ? 'bg-sea/10 text-sea' 
                      : 'hover:bg-surface-dark/30 text-ink'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                      index === selectedIndex ? 'bg-sea/20' : 'bg-surface-dark/50'
                    }`}>
                      <span className="text-sm">{getCategoryIcon(result.category)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium truncate">{result.name}</h4>
                        {result.duration && (
                          <div className="flex items-center text-xs text-ink-light">
                            <Clock className="w-3 h-3 mr-1" />
                            {result.duration}min
                          </div>
                        )}
                      </div>
                      {result.description && (
                        <p className="text-sm text-ink-light truncate">{result.description}</p>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(result.category).replace('text-', 'bg-')}`}></div>
                  </div>
                </button>
              ))}

              {/* Quick Add Categories Section */}
              {results.filter(r => r.type === 'category').length > 0 && (
                <div className="px-3 py-2 bg-surface-dark/20 border-b border-surface-dark/30">
                  <h5 className="text-xs font-medium text-ink-light">🚀 Quick Add</h5>
                </div>
              )}
              
              {results.filter(r => r.type === 'category').map((result, index) => {
                const adjustedIndex = index + results.filter(r => r.type === 'attraction').length;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelectResult(result)}
                    className={`w-full p-3 text-left transition-colors border-b border-surface-dark/30 last:border-b-0 ${
                      adjustedIndex === selectedIndex 
                        ? 'bg-sea/10 text-sea' 
                        : 'hover:bg-surface-dark/30 text-ink'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                        adjustedIndex === selectedIndex ? 'bg-sea/20' : 'bg-surface-dark/50'
                      }`}>
                        <Plus className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{result.name}</h4>
                        {result.description && (
                          <p className="text-sm text-ink-light truncate">{result.description}</p>
                        )}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(result.category).replace('text-', 'bg-')}`}></div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
          
          {/* Search Results */}
          {searchTerm.length > 0 && results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelectResult(result)}
              className={`w-full p-3 text-left transition-colors border-b border-surface-dark/30 last:border-b-0 ${
                index === selectedIndex 
                  ? 'bg-sea/10 text-sea' 
                  : 'hover:bg-surface-dark/30 text-ink'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                  index === selectedIndex ? 'bg-sea/20' : 'bg-surface-dark/50'
                }`}>
                  {result.type === 'attraction' ? (
                    <span className="text-sm">{getCategoryIcon(result.category)}</span>
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium truncate">{result.name}</h4>
                    {result.duration && (
                      <div className="flex items-center text-xs text-ink-light">
                        <Clock className="w-3 h-3 mr-1" />
                        {result.duration}min
                      </div>
                    )}
                  </div>
                  {result.description && (
                    <p className="text-sm text-ink-light truncate">{result.description}</p>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full ${getCategoryColor(result.category).replace('text-', 'bg-')}`}></div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleClose}
        />
      )}
    </div>
  );
}