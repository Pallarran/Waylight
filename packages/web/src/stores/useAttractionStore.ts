import { create } from 'zustand';
import type { Attraction, AttractionType } from '../types';
import { getAttractions } from '../data/attractions';

interface AttractionFilters {
  parkIds: string[];
  types: AttractionType[];
  minHeight: number | null;
  maxWaitTime: number | null;
  wheelchairAccessible: boolean;
  searchQuery: string;
}

interface AttractionState {
  attractions: Attraction[];
  filteredAttractions: Attraction[];
  filters: AttractionFilters;
  favorites: string[]; // attraction IDs
  isLoading: boolean;
  
  // Data loading
  loadAttractions: () => void;
  loadAttractionsByPark: (parkId: string) => void;
  
  // Filtering
  setFilters: (filters: Partial<AttractionFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  searchForAttractions: (query: string) => void;
  
  // Favorites
  toggleFavorite: (attractionId: string) => void;
  isFavorite: (attractionId: string) => boolean;
  getFavoriteAttractions: () => Attraction[];
  
  // Utility
  getAttractionById: (id: string) => Attraction | undefined;
  getAttractionsByType: (type: AttractionType) => Attraction[];
}

const defaultFilters: AttractionFilters = {
  parkIds: [],
  types: [],
  minHeight: null,
  maxWaitTime: null,
  wheelchairAccessible: false,
  searchQuery: '',
};

const useAttractionStore = create<AttractionState>((set, get) => ({
  attractions: [],
  filteredAttractions: [],
  filters: defaultFilters,
  favorites: [],
  isLoading: false,
  
  loadAttractions: () => {
    set({ isLoading: true });
    try {
      const allAttractions = getAttractions();
      set({ 
        attractions: allAttractions,
        filteredAttractions: allAttractions,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load attractions:', error);
      set({ isLoading: false });
    }
  },
  
  loadAttractionsByPark: (parkId) => {
    set({ isLoading: true });
    try {
      const parkAttractions = getAttractions(parkId);
      set({ 
        attractions: parkAttractions,
        filteredAttractions: parkAttractions,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load park attractions:', error);
      set({ isLoading: false });
    }
  },
  
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
    get().applyFilters();
  },
  
  resetFilters: () => {
    set({ filters: defaultFilters });
    get().applyFilters();
  },
  
  applyFilters: () => {
    const { attractions, filters } = get();
    
    let filtered = [...attractions];
    
    // Apply park filter
    if (filters.parkIds.length > 0) {
      filtered = filtered.filter(a => filters.parkIds.includes(a.parkId));
    }
    
    // Apply type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(a => filters.types.includes(a.type));
    }
    
    // Apply height restriction filter
    if (filters.minHeight !== null) {
      filtered = filtered.filter(a => {
        if (!a.heightRequirement) return true;
        return a.heightRequirement >= filters.minHeight!;
      });
    }
    
    // Apply wheelchair accessible filter
    if (filters.wheelchairAccessible) {
      filtered = filtered.filter(a => a.accessibility?.wheelchairAccessible === true);
    }
    
    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.location.toLowerCase().includes(query)
      );
    }
    
    set({ filteredAttractions: filtered });
  },
  
  searchForAttractions: (query) => {
    set((state) => ({
      filters: { ...state.filters, searchQuery: query }
    }));
    get().applyFilters();
  },
  
  toggleFavorite: (attractionId) => {
    set((state) => {
      const isFav = state.favorites.includes(attractionId);
      return {
        favorites: isFav
          ? state.favorites.filter(id => id !== attractionId)
          : [...state.favorites, attractionId]
      };
    });
  },
  
  isFavorite: (attractionId) => {
    return get().favorites.includes(attractionId);
  },
  
  getFavoriteAttractions: () => {
    const { attractions, favorites } = get();
    return attractions.filter(a => favorites.includes(a.id));
  },
  
  getAttractionById: (id) => {
    return get().attractions.find(a => a.id === id);
  },
  
  getAttractionsByType: (type) => {
    return get().attractions.filter(a => a.type === type);
  }
}));

export { useAttractionStore };
export default useAttractionStore;