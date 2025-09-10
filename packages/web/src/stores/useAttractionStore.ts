import { create } from 'zustand';
import type { Attraction, AttractionType } from '../types';
import { getAttractions } from '../data/attractions'; // Now uses shared package data

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
  isLoading: boolean;
  
  // Data loading
  loadAttractions: () => void;
  loadAttractionsByPark: (parkId: string) => void;
  
  // Filtering
  setFilters: (filters: Partial<AttractionFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  searchForAttractions: (query: string) => void;
  
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
  isLoading: false,
  
  loadAttractions: () => {
    set({ isLoading: true });
    try {
      const allAttractions = getAttractions();
      set({ 
        attractions: allAttractions,
        isLoading: false 
      });
      get().applyFilters(); // Apply sorting
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
    
    // Sort alphabetically by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    set({ filteredAttractions: filtered });
  },
  
  searchForAttractions: (query) => {
    set((state) => ({
      filters: { ...state.filters, searchQuery: query }
    }));
    get().applyFilters();
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