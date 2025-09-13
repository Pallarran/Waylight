// Local type definitions to avoid shared package compilation issues

export interface Park {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  icon: string;
}
export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  days: TripDay[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArrivalPlan {
  departureTime?: string;
  transportMethod?: 'car' | 'monorail' | 'bus' | 'boat' | 'rideshare' | 'walk';
  securityTime?: string;
  tapInTime?: string;
  ropeDropTarget?: string;
}

export interface LightningLanePlan {
  multiPassSelections?: string[]; // attraction IDs
  refillStrategy?: string;
  singlePassTargets?: string[]; // attraction IDs
  notes?: string;
}

export interface FamilyPriority {
  id: string;
  name: string;
  priority: number; // 1-5, 1 being highest
  type: 'must-do' | 'nice-to-have';
  notes?: string;
}

export interface BackupPlan {
  rainPlan?: string;
  highWaitsPlan?: string;
  notes?: string;
}

export interface PhotoOpportunity {
  id: string;
  location: string;
  description: string;
  timing?: string;
}

export interface SafetyInfo {
  heightChecked?: boolean;
  idBracelets?: boolean;
  strollerTag?: string;
  sunscreenTimes?: string[];
  notes?: string;
}

export interface WeatherInfo {
  temperature?: string;
  conditions?: string;
  rainChance?: number;
}

export interface ParkHours {
  earlyEntry?: string;
  regularOpen?: string;
  regularClose?: string;
  extendedHours?: string;
}

export interface CheatSheetData {
  tripDay: TripDay;
  parkHours?: ParkHours;
  weather?: WeatherInfo;
  // Extracted data from itinerary
  diningReservations: ItineraryItem[];
  characterMeets: ItineraryItem[];
  shows: ItineraryItem[];
  ropeDropPlan: ItineraryItem[];
  // Generated content
  timelineEvents: {
    time: string;
    activity: string;
    type: 'arrival' | 'rope-drop' | 'dining' | 'show' | 'character' | 'break' | 'departure';
  }[];
}

export type DayType = 
  | 'park-day'
  | 'park-hopper'
  | 'check-in'
  | 'check-out'
  | 'rest-day'
  | 'disney-springs'
  | 'special-event';

export interface TripDay {
  id: string;
  date: string;
  dayType?: DayType;
  parkId?: string;
  notes?: string;
  items: ItineraryItem[];
  // Cheat sheet specific data
  arrivalPlan?: ArrivalPlan;
  lightningLanePlan?: LightningLanePlan;
  familyPriorities?: FamilyPriority[];
  backupPlan?: BackupPlan;
  photoOpportunities?: PhotoOpportunity[];
  safetyInfo?: SafetyInfo;
}

export type ActivityCategory = 
  | 'ride'
  | 'show'
  | 'dining'
  | 'meet_greet'
  | 'shopping'
  | 'attraction'
  | 'waterpark'
  | 'travel'
  | 'break'
  | 'special_events'
  | 'tours';

export interface ActivityCategoryInfo {
  id: ActivityCategory;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface ItineraryItem {
  id: string;
  type: ActivityCategory;
  name: string;
  startTime?: string;
  notes?: string;
  // Reference to actual attraction data
  attractionId?: string; // For rides, shows, dining, etc. that have data
  // Category-specific fields (for custom activities)
  location?: string; // For custom activities or override
  reservationNumber?: string; // For dining
  fastPassTime?: string; // For rides with Lightning Lane
  partySize?: number; // For dining
  characters?: string[]; // For character meets
  tourGuide?: string; // For tours
  eventType?: string; // For special events
  // Cheat sheet specific fields
  confirmationNumber?: string; // For dining reservations
  allergyNotes?: string; // For dining
  photoOpportunity?: boolean; // Mark as photo opportunity
  isRopeDropTarget?: boolean; // Mark as rope drop priority
  isMustDo?: boolean; // Mark as family priority
  priorityLevel?: number; // 1-5 priority ranking
}

export interface Attraction {
  id: string;
  parkId: string;
  name: string;
  description: string;
  duration: number;
  heightRequirement?: number;
  location: string;
  type: AttractionType;
  category: WaypointCategory;
  intensity: IntensityLevel;
  accessibility?: AccessibilityInfo;
  tips: Tip[];
  tags: string[];
  // Category-specific fields
  features?: string[]; // For all types
  // Eat-specific
  cuisineType?: string;
  serviceType?: 'quick' | 'table' | 'snack' | 'lounge';
  adrRequired?: boolean;
  mobileOrderAvailable?: boolean;
  priceLevel?: 1 | 2 | 3 | 4; // $ to $$$$
  // Stay-specific
  resortTier?: 'value' | 'moderate' | 'deluxe' | 'deluxe-villa' | 'other';
  transportation?: string[];
  distanceInfo?: {
    walkTime?: string;
    driveTime?: string;
    transitTime?: string;
  };
}

export enum WaypointCategory {
  DO = 'do',
  EAT = 'eat',
  STAY = 'stay',
}

export enum AttractionType {
  // Do category
  RIDE = 'ride',
  SHOW = 'show',
  MEET_GREET = 'meet_greet',
  ATTRACTION = 'attraction',
  PARADE = 'parade',
  EXPERIENCE = 'experience',
  SHOPPING = 'shopping',
  // Eat category  
  QUICK_SERVICE = 'quick_service',
  TABLE_SERVICE = 'table_service',
  SNACK = 'snack',
  LOUNGE = 'lounge',
  DINING = 'dining', // Legacy - will map to appropriate subcategory
  // Stay category
  RESORT = 'resort',
  UNIVERSAL_RESORT = 'universal_resort',
  HOTEL = 'hotel',
}

export enum IntensityLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EXTREME = 'extreme',
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  transferRequired?: boolean;
  serviceAnimalsAllowed?: boolean;
  signLanguageAvailable?: boolean;
}

export interface Tip {
  id: string;
  category: 'best_time' | 'strategy' | 'general';
  content: string;
  priority: number;
}

// New category-specific interfaces

export enum DoType {
  RIDE = 'ride',
  SHOW = 'show',
  EXPERIENCE = 'experience',
  MEET_GREET = 'meet_greet',
  WALKTHROUGH = 'walkthrough',
  ENTERTAINMENT = 'entertainment',
  TRANSPORTATION = 'transportation',
}

export interface DoItem {
  id: string;
  parkId: string;
  name: string;
  description: string;
  location: string;
  type: DoType;
  duration: number; // minutes
  heightRequirement?: number; // inches
  intensity: IntensityLevel;
  accessibility?: AccessibilityInfo;
  tips: Tip[];
  tags: string[];
  features?: string[];
  // Do-specific fields
  lightningLane?: boolean;
  singleRider?: boolean;
  photoService?: boolean;
  characters?: string[]; // for meet & greets
  showTimes?: string[]; // for shows and entertainment
}

export enum EatType {
  QUICK_SERVICE = 'quick_service',
  TABLE_SERVICE = 'table_service',
  SNACK = 'snack',
  LOUNGE = 'lounge',
  FOOD_CART = 'food_cart',
}

export enum ServiceType {
  QUICK = 'quick',
  TABLE = 'table',
  SNACK = 'snack',
  LOUNGE = 'lounge',
  CART = 'cart',
}

export enum PriceLevel {
  BUDGET = 1,      // $
  MODERATE = 2,    // $$
  EXPENSIVE = 3,   // $$$
  LUXURY = 4,      // $$$$
}

export interface EatItem {
  id: string;
  parkId?: string; // Optional since some restaurants are in resorts
  resortId?: string; // For resort dining
  name: string;
  description: string;
  location: string;
  type: EatType;
  serviceType: ServiceType;
  priceLevel: PriceLevel;
  tips: Tip[];
  tags: string[];
  features?: string[];
  // Eat-specific fields
  cuisineType: string;
  adrRequired: boolean;
  mobileOrderAvailable?: boolean;
  allergyFriendly?: string[]; // e.g., ['gluten-free', 'vegetarian', 'vegan']
  kidFriendly: boolean;
  alcoholServed?: boolean;
  operatingHours?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  reservationWindow?: number; // days in advance
}