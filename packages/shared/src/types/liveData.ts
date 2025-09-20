// Live Theme Park Data Types

export interface LiveParkData {
  parkId: string;
  status: 'operating' | 'closed' | 'limited';
  hours: {
    regular: { open: string | null; close: string | null };
    earlyEntry?: { open: string };
    extendedEvening?: { close: string };
  };
  crowdLevel?: number; // 1-10 scale from Queue-Times
  lastUpdated: string;
  attractions: LiveAttractionData[];
  entertainment: LiveEntertainmentData[];
  dataSource?: string; // Source of the data (themeparks_api, unavailable, etc.)
  isEstimated?: boolean; // Whether this is estimated data
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

export interface LiveParkEventData {
  id: number;
  parkId: string;
  eventDate: string; // YYYY-MM-DD
  eventName: string;
  eventType: string;
  eventOpen: string | null; // HH:MM format
  eventClose: string | null; // HH:MM format
  description: string;
  dataSource?: string;
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

export interface ParkCrowdPrediction {
  parkId: string;
  predictionDate: string; // YYYY-MM-DD
  crowdLevel: number; // 1-10 scale
  description: string; // "Very Low", "Low", "Moderate", "High", "Very High"
  recommendation?: string;
  dataSource: string; // "queue_times_api", "estimated", etc.
  confidenceScore?: number; // 0.00-1.00 if available
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
  thrillDataId?: string; // Thrill Data URL slug
  displayName: string;
}

// Live data service interfaces
export interface LiveDataServiceInterface {
  // Park data
  getParkData(parkId: string): Promise<LiveParkData>;
  getParkDataForDate(parkId: string, date: string): Promise<LiveParkData>;
  getMultipleParkData(parkIds: string[]): Promise<LiveParkData[]>;

  // Attraction data
  getAttractionWaitTimes(parkId: string): Promise<LiveAttractionData[]>;
  getAttractionStatus(attractionId: string): Promise<LiveAttractionData>;

  // Entertainment data
  getEntertainmentSchedule(parkId: string): Promise<LiveEntertainmentData[]>;

  // Park events data
  getParkEventsForDate(parkId: string, date: string): Promise<LiveParkEventData[]>;

  // Crowd predictions
  getCrowdPredictions(parkId: string, days: number): Promise<ParkCrowdData>;

  // Cache management
  clearCache(type?: 'all' | 'wait_times' | 'park_hours' | 'crowds'): void;
  getCacheStats(): Record<string, { size: number; oldestEntry: string; newestEntry: string }>;
}