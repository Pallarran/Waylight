import { create } from 'zustand';
import { getAttractions } from '@waylight/shared';
import type { Attraction } from '@waylight/shared';

interface AttractionState {
  attractions: Attraction[];
  filteredAttractions: Attraction[];
  selectedAttraction: Attraction | null;
  searchQuery: string;
  selectedPark: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAttractions: () => void;
  searchAttractions: (query: string) => void;
  filterByPark: (parkId: string | null) => void;
  setSelectedAttraction: (attraction: Attraction | null) => void;
  clearSearch: () => void;
  getAttractionById: (id: string) => Attraction | undefined;
}

export const useAttractionStore = create<AttractionState>((set, get) => ({
  attractions: [],
  filteredAttractions: [],
  selectedAttraction: null,
  searchQuery: '',
  selectedPark: null,
  isLoading: false,
  error: null,

  loadAttractions: () => {
    try {
      set({ isLoading: true, error: null });
      
      // Load attractions from shared package
      const loadedAttractions = getAttractions();
      
      set({
        attractions: loadedAttractions,
        filteredAttractions: loadedAttractions,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading attractions:', error);
      set({ error: 'Failed to load attractions', isLoading: false });
    }
  },

  searchAttractions: (query: string) => {
    const { attractions, selectedPark } = get();
    
    set({ searchQuery: query });
    
    let filtered = attractions;
    
    // Apply park filter first if selected
    if (selectedPark) {
      filtered = filtered.filter(attraction => attraction.parkId === selectedPark);
    }
    
    // Apply search filter
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(attraction =>
        attraction.name.toLowerCase().includes(searchLower) ||
        attraction.description.toLowerCase().includes(searchLower) ||
        attraction.location.toLowerCase().includes(searchLower)
      );
    }
    
    set({ filteredAttractions: filtered });
  },

  filterByPark: (parkId: string | null) => {
    const { attractions, searchQuery } = get();
    
    set({ selectedPark: parkId });
    
    let filtered = attractions;
    
    // Apply park filter
    if (parkId) {
      filtered = filtered.filter(attraction => attraction.parkId === parkId);
    }
    
    // Re-apply search filter if there's a search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(attraction =>
        attraction.name.toLowerCase().includes(searchLower) ||
        attraction.description.toLowerCase().includes(searchLower) ||
        attraction.location.toLowerCase().includes(searchLower)
      );
    }
    
    set({ filteredAttractions: filtered });
  },

  setSelectedAttraction: (attraction: Attraction | null) => {
    set({ selectedAttraction: attraction });
  },

  clearSearch: () => {
    const { attractions, selectedPark } = get();
    
    let filtered = attractions;
    
    // Apply park filter if selected
    if (selectedPark) {
      filtered = filtered.filter(attraction => attraction.parkId === selectedPark);
    }
    
    set({ 
      searchQuery: '', 
      filteredAttractions: filtered 
    });
  },

  getAttractionById: (id: string) => {
    const { attractions } = get();
    return attractions.find(attraction => attraction.id === id);
  },
}));