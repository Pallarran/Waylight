export interface Park {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  description?: string;
  openingTime?: string;
  closingTime?: string;
}

export interface Attraction {
  id: string;
  parkId: string;
  name: string;
  description: string;
  duration: number; // in minutes
  heightRequirement?: number; // in inches
  location: string;
  type: AttractionType;
  intensity: IntensityLevel;
  accessibility?: AccessibilityInfo;
  tips: Tip[];
  tags: string[];
  // Icon-based feature flags
  features?: AttractionFeatures;
}

export interface AttractionFeatures {
  // Tier 1: Core Icons
  isDarkRide?: boolean;           // 🌑 Dark rides
  getsWet?: boolean;              // 💦 Gets you wet
  isScary?: boolean;              // 👻 Scary/spooky
  isInteractive?: boolean;        // 🎯 Interactive elements
  isSpinning?: boolean;           // 🌀 Spinning motion
  isWaterRide?: boolean;          // 🛶 Water/boat ride
  hasPhotos?: boolean;            // 📸 Photo opportunities
  hasCharacters?: boolean;        // 🐭 Disney characters present
  
  // Tier 2: Enhanced Icons
  hasLightningLane?: boolean;     // 🎟️ Lightning Lane available
  isRainSafe?: boolean;           // 🌧️ Rain safe operations
  hasAirConditioning?: boolean;   // ❄️ Air conditioning
  isLoud?: boolean;               // 🔊 Loud attraction
  hasBigDrops?: boolean;          // ⛰️ Big drops
  hasLaunch?: boolean;            // 🏁 Launch/high speed
  hasStrobes?: boolean;           // 💡 Strobe lights
  hasRiderSwitch?: boolean;       // 🔁 Rider Switch available
  hasIndividualLL?: boolean;      // 💠 Individual Lightning Lane
}

export enum AttractionType {
  RIDE = 'ride',
  SHOW = 'show',
  MEET_GREET = 'meet_greet',
  ATTRACTION = 'attraction',
  DINING = 'dining',
  SHOPPING = 'shopping',
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
  content: string;
  category: TipCategory;
  priority: number; // 1-5, 5 being highest
}

export enum TipCategory {
  BEST_TIME = 'best_time',
  STRATEGY = 'strategy',
  ACCESSIBILITY = 'accessibility',
  PHOTO = 'photo',
  DINING = 'dining',
  GENERAL = 'general',
}

export interface Trip {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  days: TripDay[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripDay {
  id: string;
  date: string; // ISO date string
  parkId: string;
  items: ItineraryItem[];
  notes?: string;
}

export interface ItineraryItem {
  id: string;
  attractionId: string;
  order: number;
  timeSlot?: string; // Optional time like "9:00 AM"
  duration?: number; // Override duration in minutes
  notes?: string;
  completed: boolean;
}

export interface Settings {
  showTips: boolean;
  tipCategories: TipCategory[];
  viewMode: ViewMode;
  theme: Theme;
  notifications: NotificationSettings;
}

export enum ViewMode {
  LIST = 'list',
  CARD = 'card',
  CALENDAR = 'calendar',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime?: number; // minutes before
  dailyPlanReminder: boolean;
}

export interface ExportFormat {
  type: 'text' | 'json' | 'pdf';
  includeNotes: boolean;
  includeTips: boolean;
  includeMap: boolean;
}