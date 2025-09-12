import { create } from 'zustand';
import { AttractionType, WaypointCategory, type Attraction } from '../types';
import { getAllDoItems, getAllEatItems, allHotels, type HotelData } from '@waylight/shared';

interface WaypointFilters {
  parkIds: string[];
  types: AttractionType[];
  categories: WaypointCategory[];
  minHeight: number | null;
  maxWaitTime: number | null;
  wheelchairAccessible: boolean;
  searchQuery: string;
  // Category-specific filters
  serviceTypes: string[]; // For dining
  adrRequired?: boolean; // For dining
  mobileOrderAvailable?: boolean; // For dining
  priceLevel?: number; // For dining
  resortTier?: string; // For accommodations
  intensity?: string; // For DO attractions
  
  // Feature-based filters
  doFeatures?: {
    // Access & Services
    multiPass?: boolean;
    singlePass?: boolean;
    singleRider?: boolean;
    riderSwitch?: boolean;
    mobileCheckin?: boolean;
    photoPass?: boolean;
    // Experience
    darkRide?: boolean;
    getsWet?: boolean;
    spinningMotion?: boolean;
    loudSounds?: boolean;
    strobeEffects?: boolean;
    interactiveElements?: boolean;
    characterMeet?: boolean;
    livePerformance?: boolean;
    airConditioning?: boolean;
    outdoorExperience?: boolean;
    scary?: boolean;
    bigDrops?: boolean;
    launchSpeed?: boolean;
    // Important Notes
    heightRequirement?: boolean;
    motionSensitivity?: boolean;
    pregnancyAdvisory?: boolean;
    transferRequired?: boolean;
    rainSafe?: boolean;
  };
  
  eatFeatures?: {
    // Service & Convenience
    adrRequired?: boolean;
    mobileOrder?: boolean;
    alcoholServed?: boolean;
    allergyFriendly?: boolean;
    groupFriendly?: boolean;
    quickService?: boolean;
    // Dining Experience
    characterDining?: boolean;
    fineDining?: boolean;
    buffet?: boolean;
    familyStyle?: boolean;
    sharable?: boolean;
    liveEntertainment?: boolean;
    scenicViews?: boolean;
    uniqueExperience?: boolean;
    seasonal?: boolean;
    signatureDish?: boolean;
    chefSpecial?: boolean;
    healthyOptions?: boolean;
    // Special Features
    michelinStar?: boolean;
    rooftop?: boolean;
    waterfront?: boolean;
    resort?: boolean;
    park?: boolean;
    disneysprings?: boolean;
    boardwalk?: boolean;
    monorailAccessible?: boolean;
  };
  
  stayFeatures?: {
    // Transportation
    monorailAccess?: boolean;
    boatAccess?: boolean;
    busAccess?: boolean;
    walkingDistance?: boolean;
    skylinerAccess?: boolean;
    carRequired?: boolean;
    complimentaryTransport?: boolean;
    earlyParkEntry?: boolean;
    // Recreation
    pools?: boolean;
    waterSlides?: boolean;
    hotTub?: boolean;
    spa?: boolean;
    fitness?: boolean;
    golf?: boolean;
    tennis?: boolean;
    beach?: boolean;
    marina?: boolean;
    bikeRental?: boolean;
    joggingTrail?: boolean;
    playground?: boolean;
    // Dining & Services
    dining?: boolean;
    quickService?: boolean;
    tableService?: boolean;
    roomService?: boolean;
    concierge?: boolean;
    businessCenter?: boolean;
    childcare?: boolean;
    laundry?: boolean;
    parking?: boolean;
    wifi?: boolean;
    // Accommodations
    suites?: boolean;
    villas?: boolean;
    dvc?: boolean;
    themedRooms?: boolean;
    familyAccommodations?: boolean;
  };
}

interface WaypointState {
  waypoints: Attraction[];
  filteredWaypoints: Attraction[];
  filters: WaypointFilters;
  isLoading: boolean;
  activeCategory: WaypointCategory | 'all';
  
  // Data loading
  loadWaypoints: () => void;
  loadWaypointsByPark: (parkId: string) => void;
  
  // Category management
  setActiveCategory: (category: WaypointCategory | 'all') => void;
  
  // Filtering
  setFilters: (filters: Partial<WaypointFilters>) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  searchForWaypoints: (query: string) => void;
  
  // Utility
  getWaypointById: (id: string) => Attraction | undefined;
  getWaypointsByType: (type: AttractionType) => Attraction[];
  getWaypointsByCategory: (category: WaypointCategory) => Attraction[];
}

// Helper function to get category from attraction type
const getCategoryFromType = (type: AttractionType): WaypointCategory => {
  switch (type) {
    case AttractionType.QUICK_SERVICE:
    case AttractionType.TABLE_SERVICE:
    case AttractionType.SNACK:
    case AttractionType.LOUNGE:
    case AttractionType.DINING:
      return WaypointCategory.EAT;
    case AttractionType.RESORT:
    case AttractionType.UNIVERSAL_RESORT:
    case AttractionType.HOTEL:
      return WaypointCategory.STAY;
    default:
      return WaypointCategory.DO;
  }
};

// Helper function to convert DO items to waypoint format
const convertDoItemToWaypoint = (doItem: any): Attraction => {
  return {
    id: doItem.id,
    parkId: doItem.parkId,
    name: doItem.name,
    description: doItem.description,
    duration: doItem.duration,
    heightRequirement: doItem.heightRequirement,
    location: doItem.location,
    type: doItem.type as AttractionType,
    category: WaypointCategory.DO,
    intensity: doItem.intensity as any,
    accessibility: doItem.accessibility,
    tips: doItem.tips || [],
    tags: doItem.tags || [],
    features: doItem.features, // Use structured features directly
  };
};

// Helper function to convert EAT items to waypoint format
const convertEatItemToWaypoint = (eatItem: any): Attraction => {
  // Map EAT service types to AttractionType
  const getAttractionTypeFromEatType = (eatType: string, serviceType: string): AttractionType => {
    switch (serviceType) {
      case 'quick': return AttractionType.QUICK_SERVICE;
      case 'table': return AttractionType.TABLE_SERVICE;
      case 'snack': return AttractionType.SNACK;
      case 'lounge': return AttractionType.LOUNGE;
      default: return AttractionType.DINING;
    }
  };

  // Use structured EAT features directly
  const eatFeatures = eatItem.features;

  return {
    id: eatItem.id,
    parkId: eatItem.parkId || 'walt-disney-world',
    name: eatItem.name,
    description: eatItem.description,
    duration: 0, // Dining doesn't have duration like attractions
    location: eatItem.location,
    type: getAttractionTypeFromEatType(eatItem.type, eatItem.serviceType),
    category: WaypointCategory.EAT,
    intensity: 'low' as any, // Dining is low intensity
    accessibility: { wheelchairAccessible: true }, // Assume accessible
    tips: eatItem.tips || [],
    tags: eatItem.tags || [],
    features: eatFeatures,
    // EAT-specific fields
    cuisineType: eatItem.cuisineType,
    serviceType: eatItem.serviceType,
    adrRequired: eatItem.adrRequired,
    mobileOrderAvailable: eatItem.mobileOrderAvailable || eatItem.features?.mobileOrder || false,
    priceLevel: eatItem.priceLevel,
  };
};

// Helper function to convert hotel data to waypoint format
const convertHotelToWaypoint = (hotel: HotelData): Attraction => {
  // Use structured STAY features directly
  const stayFeatures = hotel.features;

  // Clean up hotel names by removing brand prefixes for better readability
  const cleanName = hotel.name
    .replace(/^Disney's /, '')
    .replace(/^Universal's /, '')
    .replace(/^The Villas at Disney's /, 'The Villas at ');

  // Consolidate deluxe_villa into deluxe category for simpler classification
  const normalizedPriceLevel = hotel.priceLevel === 'deluxe_villa' ? 'deluxe' : hotel.priceLevel;

  return {
    id: `hotel-${hotel.id}`,
    parkId: 'walt-disney-world', // Generic for hotels
    name: cleanName,
    description: hotel.description || `${hotel.type} resort with ${hotel.rooms.length} room types`,
    duration: 0, // Hotels don't have duration
    location: hotel.address,
    type: hotel.type === 'disney' ? AttractionType.RESORT : 
          hotel.type === 'universal' ? AttractionType.UNIVERSAL_RESORT : 
          AttractionType.HOTEL,
    category: WaypointCategory.STAY,
    intensity: 'low' as any, // Hotels are low intensity
    accessibility: { wheelchairAccessible: true }, // Assume accessible
    tips: [],
    tags: [hotel.type, normalizedPriceLevel],
    features: stayFeatures,
    resortTier: normalizedPriceLevel as any,
    transportation: hotel.amenities?.filter(amenity => 
      ['Monorail', 'Bus', 'Boat', 'Walking'].some(transport => 
        amenity.toLowerCase().includes(transport.toLowerCase())
      )
    ),
  };
};

const defaultFilters: WaypointFilters = {
  parkIds: [],
  types: [],
  categories: [],
  minHeight: null,
  maxWaitTime: null,
  wheelchairAccessible: false,
  searchQuery: '',
  serviceTypes: [],
  doFeatures: {},
  eatFeatures: {},
  stayFeatures: {},
};

const useWaypointStore = create<WaypointState>((set, get) => ({
  waypoints: [],
  filteredWaypoints: [],
  filters: defaultFilters,
  isLoading: false,
  activeCategory: 'all',
  
  loadWaypoints: () => {
    set({ isLoading: true });
    try {
      // Load separated data sources
      const doItems = getAllDoItems();
      const eatItems = getAllEatItems();
      
      // Convert to waypoint format
      const doWaypoints = doItems.map(convertDoItemToWaypoint);
      const eatWaypoints = eatItems.map(convertEatItemToWaypoint);
      const hotelWaypoints = allHotels.map(convertHotelToWaypoint);
      
      // Combine all waypoints
      const allWaypoints = [...doWaypoints, ...eatWaypoints, ...hotelWaypoints];
      
      set({ 
        waypoints: allWaypoints,
        isLoading: false 
      });
      get().applyFilters(); // Apply sorting
    } catch (error) {
      console.error('Failed to load waypoints:', error);
      set({ isLoading: false });
    }
  },
  
  loadWaypointsByPark: (parkId) => {
    set({ isLoading: true });
    try {
      // Load separated data sources for specific park
      const doItems = getAllDoItems().filter(item => item.parkId === parkId);
      const eatItems = getAllEatItems().filter(item => item.parkId === parkId);
      
      // Convert to waypoint format
      const doWaypoints = doItems.map(convertDoItemToWaypoint);
      const eatWaypoints = eatItems.map(convertEatItemToWaypoint);
      
      const parkWaypoints = [...doWaypoints, ...eatWaypoints];
      
      set({ 
        waypoints: parkWaypoints,
        filteredWaypoints: parkWaypoints,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load park waypoints:', error);
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
  
  setActiveCategory: (category) => {
    set({ 
      activeCategory: category,
      filters: defaultFilters
    });
    get().applyFilters();
  },
  
  applyFilters: () => {
    const { waypoints, filters, activeCategory } = get();
    
    let filtered = [...waypoints];
    
    // Apply category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(w => w.category === activeCategory);
    }
    
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
    
    // Apply service types filter (for EAT category)
    if (filters.serviceTypes && filters.serviceTypes.length > 0) {
      filtered = filtered.filter(a => 
        a.serviceType && filters.serviceTypes!.includes(a.serviceType)
      );
    }
    
    // Apply ADR required filter (for EAT category)
    if (filters.adrRequired !== undefined) {
      filtered = filtered.filter(a => a.adrRequired === filters.adrRequired);
    }
    
    // Apply mobile order filter (for EAT category)
    if (filters.mobileOrderAvailable !== undefined) {
      filtered = filtered.filter(a => a.mobileOrderAvailable === filters.mobileOrderAvailable);
    }
    
    // Apply price level filter (for EAT category)
    if (filters.priceLevel !== undefined) {
      filtered = filtered.filter(a => a.priceLevel === filters.priceLevel);
    }
    
    // Apply resort tier filter (for STAY category)  
    if (filters.resortTier !== undefined) {
      filtered = filtered.filter(a => a.resortTier === filters.resortTier);
    }
    
    // Apply intensity filter (for DO category)
    if (filters.intensity !== undefined) {
      filtered = filtered.filter(a => a.intensity === filters.intensity);
    }
    
    // Apply DO feature filters
    if (filters.doFeatures && Object.keys(filters.doFeatures).length > 0) {
      filtered = filtered.filter(a => {
        if (a.category !== WaypointCategory.DO || !a.features) return true;
        
        return Object.entries(filters.doFeatures!).every(([feature, required]) => {
          if (required === undefined) return true;
          const featureValue = a.features?.[feature];
          return required ? featureValue === true : featureValue !== true;
        });
      });
    }
    
    // Apply EAT feature filters
    if (filters.eatFeatures && Object.keys(filters.eatFeatures).length > 0) {
      filtered = filtered.filter(a => {
        if (a.category !== WaypointCategory.EAT || !a.features) return true;
        
        return Object.entries(filters.eatFeatures!).every(([feature, required]) => {
          if (required === undefined) return true;
          const featureValue = a.features?.[feature];
          return required ? featureValue === true : featureValue !== true;
        });
      });
    }
    
    // Apply STAY feature filters  
    if (filters.stayFeatures && Object.keys(filters.stayFeatures).length > 0) {
      filtered = filtered.filter(a => {
        if (a.category !== WaypointCategory.STAY || !a.features) return true;
        
        return Object.entries(filters.stayFeatures!).every(([feature, required]) => {
          if (required === undefined) return true;
          // For STAY items, check both features and nested feature objects
          let featureValue;
          if (a.features?.[feature] !== undefined) {
            featureValue = a.features[feature];
          } else {
            // Check nested feature objects for STAY category
            const nestedCategories = ['transportation', 'recreation', 'amenities', 'accommodations'];
            for (const category of nestedCategories) {
              if (a.features?.[category]?.[feature] !== undefined) {
                featureValue = a.features[category][feature];
                break;
              }
            }
          }
          return required ? featureValue === true : featureValue !== true;
        });
      });
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
    
    set({ filteredWaypoints: filtered });
  },
  
  searchForWaypoints: (query) => {
    set((state) => ({
      filters: { ...state.filters, searchQuery: query }
    }));
    get().applyFilters();
  },
  
  getWaypointById: (id) => {
    return get().waypoints.find(w => w.id === id);
  },
  
  getWaypointsByType: (type) => {
    return get().waypoints.filter(w => w.type === type);
  },
  
  getWaypointsByCategory: (category) => {
    return get().waypoints.filter(w => w.category === category);
  }
}));

export { useWaypointStore };
export default useWaypointStore;