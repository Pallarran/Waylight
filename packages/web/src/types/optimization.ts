// Types for Smart Optimization Engine

export interface LightningLaneStrategy {
  shouldPurchaseGeneiePlus: boolean;
  reasoning: string[];
  costAnalysis: {
    geniePlusCost: number;
    individualLLCost: number;
    totalCost: number;
  };
  timeSavings: {
    estimatedMinutes: number;
    confidenceLevel: 'low' | 'medium' | 'high';
  };
  multiPassRecommendations: LightningLaneRecommendation[];
  individualLLRecommendations: LightningLaneRecommendation[];
}

export interface LightningLaneRecommendation {
  attractionId: string;
  attractionName: string;
  priority: number; // 1-10, 10 being highest
  reasoning: string[];
  estimatedSavings: number; // minutes
  groupRating: number; // from activity ratings
  sellsOutBy?: string; // time like "11:30 AM"
  cost?: number; // for Individual LL
}

export interface DayOptimization {
  originalPlan: ItineraryItem[];
  optimizedPlan: ItineraryItem[];
  improvements: OptimizationImprovement[];
  timeSavings: number; // minutes
  walkingSavings: number; // miles
  confidence: number; // 0-100%
}

export interface OptimizationImprovement {
  type: 'reorder' | 'add_attraction' | 'time_adjustment' | 'walking_optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  reasoning: string[];
  affectedAttractions: string[]; // attraction IDs
}

export interface NearbyRecommendation {
  attractionId: string;
  attractionName: string;
  walkingMinutes: number;
  groupRating: number;
  estimatedDuration: number;
  reasoning: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface AttractionProximity {
  attractionId: string;
  parkId: string;
  area: string; // "Tomorrowland", "Fantasyland", etc.
  nearbyAttractions: Array<{
    id: string;
    name: string;
    walkingMinutes: number;
    distance: number; // meters
    area: string;
  }>;
}

export interface TimeConstraint {
  startTime: string;
  endTime: string;
  type: 'adr' | 'lightning_lane' | 'user_fixed' | 'show_time';
  attractionId?: string;
  priority: number; // higher = more important to preserve
}

// Re-export from existing types for convenience
export type { ItineraryItem, TripDay, ActivityRatingSummary } from './index';