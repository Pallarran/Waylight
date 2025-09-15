// Live Theme Park Data Types

export interface LiveParkData {
  parkId: string;
  status: 'operating' | 'closed' | 'limited';
  hours: {
    regular: { open: string; close: string };
    earlyEntry?: { open: string };
    extendedEvening?: { close: string };
  };
  crowdLevel?: number; // 1-10 scale from Queue-Times
  lastUpdated: string;
  attractions: LiveAttractionData[];
  entertainment: LiveEntertainmentData[];
}

export interface LiveAttractionData {
  id: string; // Maps to our DoItem.id
  waitTime: number; // minutes, -1 if unknown
  status: 'operating' | 'down' | 'delayed' | 'temporary_closure';
  lightningLane?: {
    available: boolean;
    returnTime?: string;
  };
  singleRider?: {
    available: boolean;
    waitTime?: number;
  };
  lastUpdated: string;
}

export interface LiveEntertainmentData {
  id: string; // Maps to our entertainment items
  showTimes: string[];
  status: 'operating' | 'cancelled' | 'delayed';
  nextShowTime?: string;
  lastUpdated: string;
}

export interface CrowdPrediction {
  date: string; // YYYY-MM-DD
  level: number; // 1-10 scale
  description: string; // "Very Low", "Moderate", "Very High"
  recommendation?: string;
}

export interface ParkCrowdData {
  parkId: string;
  predictions: CrowdPrediction[];
  lastUpdated: string;
}

// API Response Types for ThemeParks.wiki
export interface ThemeParksAPIEntity {
  id: string;
  name: string;
  entityType: string;
  parkId?: string;
}

export interface ThemeParksAPILiveData {
  id: string;
  name: string;
  entityType: string;
  lastUpdate: string;
  status: {
    status: string;
    lastUpdate: string;
  };
  queue?: {
    standBy?: {
      waitTime: number;
    };
    fastLane?: {
      available: boolean;
      returnTime?: {
        fastLane: string;
      };
    };
    singleRider?: {
      waitTime: number;
    };
  };
  showtimes?: Array<{
    startTime: string;
    endTime: string;
    type: string;
  }>;
  operatingHours?: Array<{
    date: string;
    type: string;
    startTime: string;
    endTime: string;
  }>;
}

// Configuration Types
export interface LiveDataConfig {
  refreshIntervals: {
    waitTimes: number; // milliseconds
    parkHours: number;
    crowdPredictions: number;
    entertainment: number;
  };
  enabledFeatures: {
    waitTimes: boolean;
    parkHours: boolean;
    crowdPredictions: boolean;
    rideStatus: boolean;
    entertainment: boolean;
  };
  offlineMode: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

// Error Types
export interface LiveDataError {
  code: 'NETWORK_ERROR' | 'API_ERROR' | 'PARSE_ERROR' | 'RATE_LIMITED' | 'NOT_FOUND';
  message: string;
  details?: any;
  timestamp: string;
}

// Park Mapping - maps our internal park IDs to external API IDs
export interface ParkMapping {
  waypointParkId: string; // Our internal park ID
  themeParksWikiId: string; // ThemeParks.wiki entity ID
  queueTimesId?: string; // Queue-Times park ID
  displayName: string;
}

// Live data service interfaces
export interface LiveDataServiceInterface {
  // Park data
  getParkData(parkId: string): Promise<LiveParkData>;
  getMultipleParkData(parkIds: string[]): Promise<LiveParkData[]>;

  // Attraction data
  getAttractionWaitTimes(parkId: string): Promise<LiveAttractionData[]>;
  getAttractionStatus(attractionId: string): Promise<LiveAttractionData>;

  // Entertainment data
  getEntertainmentSchedule(parkId: string): Promise<LiveEntertainmentData[]>;

  // Crowd predictions
  getCrowdPredictions(parkId: string, days: number): Promise<ParkCrowdData>;

  // Cache management
  clearCache(type?: 'all' | 'wait_times' | 'park_hours' | 'crowds'): void;
  getCacheStats(): Record<string, { size: number; oldestEntry: string; newestEntry: string }>;
}