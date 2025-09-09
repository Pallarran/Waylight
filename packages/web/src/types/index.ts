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

export interface TripDay {
  id: string;
  date: string;
  parkId?: string;
  notes?: string;
  items: ItineraryItem[];
}

export interface ItineraryItem {
  id: string;
  type: 'attraction' | 'dining' | 'break' | 'travel';
  name: string;
  startTime?: string;
  duration?: number;
  notes?: string;
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
  intensity: IntensityLevel;
  accessibility?: AccessibilityInfo;
  tips: Tip[];
  tags: string[];
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
  category: 'best_time' | 'strategy' | 'general';
  content: string;
  priority: number;
}