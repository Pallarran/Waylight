import { DayType, TripDay, Trip } from '../types';
import { getParkById } from '../data/parks';

export interface DayTypeInfo {
  type: DayType;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const DAY_TYPE_INFO: Record<DayType, DayTypeInfo> = {
  'park-day': {
    type: 'park-day',
    name: 'Park Day',
    icon: '🎢', // Default, will be replaced with park icon
    description: 'Full day at a Disney park',
    color: 'text-purple-500'
  },
  'park-hopper': {
    type: 'park-hopper',
    name: 'Park Hopper',
    icon: '🎢',
    description: 'Multiple parks in one day',
    color: 'text-rainbow'
  },
  'check-in': {
    type: 'check-in',
    name: 'Check-in Day',
    icon: '📅',
    description: 'Arrival and hotel check-in',
    color: 'text-green-500'
  },
  'check-out': {
    type: 'check-out',
    name: 'Check-out Day',
    icon: '✈️',
    description: 'Departure and final activities',
    color: 'text-blue-500'
  },
  'rest-day': {
    type: 'rest-day',
    name: 'Rest Day',
    icon: '🏖️',
    description: 'Relaxation and low-key activities',
    color: 'text-teal-500'
  },
  'disney-springs': {
    type: 'disney-springs',
    name: 'Disney Springs',
    icon: '🛍️',
    description: 'Shopping and dining district',
    color: 'text-orange-500'
  },
  'special-event': {
    type: 'special-event',
    name: 'Special Event',
    icon: '🎉',
    description: 'Parties, tours, or unique experiences',
    color: 'text-pink-500'
  }
};

/**
 * Auto-detect day type based on existing trip day data
 */
export function detectDayType(tripDay: TripDay, trip: Trip, dayIndex: number): DayType {
  // If already explicitly set, use it
  if (tripDay.dayType) {
    return tripDay.dayType;
  }

  // Calculate total days from trip duration, not from existing days array
  const startDate = new Date(trip.startDate + 'T00:00:00');
  const endDate = new Date(trip.endDate + 'T00:00:00');
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const isFirstDay = dayIndex === 0;
  const isLastDay = dayIndex === totalDays - 1;

  // Check-in day logic (first day)
  if (isFirstDay) {
    return 'check-in';
  }

  // Check-out day logic - more flexible detection
  // Check if it's the last day, or second-to-last day with departure indicators
  const isDepartureDay = isLastDay || 
    (dayIndex === totalDays - 2 && (
      tripDay.arrivalPlan?.departureTime ||
      tripDay.items?.some(item => 
        item.name.toLowerCase().includes('departure') ||
        item.name.toLowerCase().includes('flight') ||
        item.name.toLowerCase().includes('checkout') ||
        item.name.toLowerCase().includes('check out') ||
        item.name.toLowerCase().includes('airport') ||
        item.type === 'travel'
      )
    ));


  if (isDepartureDay) {
    return 'check-out';
  }

  // Park hopper logic (multiple parks referenced in items)
  if (tripDay.items && tripDay.items.length > 0) {
    const parkIds = new Set();
    if (tripDay.parkId) parkIds.add(tripDay.parkId);
    
    // Check if items reference multiple parks
    tripDay.items.forEach(item => {
      if (item.attractionId) {
        // Could check attraction data for parkId, but for now use explicit park references
        if (item.notes?.toLowerCase().includes('magic kingdom')) parkIds.add('magic-kingdom');
        if (item.notes?.toLowerCase().includes('epcot')) parkIds.add('epcot');
        if (item.notes?.toLowerCase().includes('hollywood')) parkIds.add('hollywood-studios');
        if (item.notes?.toLowerCase().includes('animal kingdom')) parkIds.add('animal-kingdom');
      }
    });
    
    if (parkIds.size > 1) {
      return 'park-hopper';
    }
  }

  // Disney Springs logic
  if (tripDay.items?.some(item => 
    item.name.toLowerCase().includes('disney springs') ||
    item.location?.toLowerCase().includes('disney springs') ||
    item.notes?.toLowerCase().includes('disney springs')
  )) {
    return 'disney-springs';
  }

  // Special event logic
  if (tripDay.items?.some(item => 
    item.type === 'special_events' ||
    item.name.toLowerCase().includes('party') ||
    item.name.toLowerCase().includes('tour') ||
    item.eventType
  )) {
    return 'special-event';
  }

  // Rest day logic (no park selected, few activities, relaxing items)
  if (!tripDay.parkId && (!tripDay.items || tripDay.items.length <= 3)) {
    const hasPoolOrSpa = tripDay.items?.some(item =>
      item.name.toLowerCase().includes('pool') ||
      item.name.toLowerCase().includes('spa') ||
      item.name.toLowerCase().includes('rest') ||
      item.name.toLowerCase().includes('relax')
    );
    
    if (hasPoolOrSpa || tripDay.items.length === 0) {
      return 'rest-day';
    }
  }

  // Default to park day if has a park selected
  if (tripDay.parkId) {
    return 'park-day';
  }

  // Final fallback - if first/last day, assume travel days
  if (isFirstDay) return 'check-in';
  if (isLastDay) return 'check-out';

  // Otherwise assume rest day
  return 'rest-day';
}

/**
 * Get the appropriate icon for a day based on its type and park
 */
export function getDayIcon(tripDay: TripDay, detectedType?: DayType): string {
  // Priority: manually set dayType > detected type > rest-day fallback
  const dayType = tripDay.dayType || detectedType || 'rest-day';
  
  // For park days, use the actual park icon
  if (dayType === 'park-day' && tripDay.parkId) {
    const park = getParkById(tripDay.parkId);
    return park?.icon || DAY_TYPE_INFO['park-day'].icon;
  }
  
  // Ensure we always return a valid icon
  return DAY_TYPE_INFO[dayType]?.icon || DAY_TYPE_INFO['rest-day'].icon;
}

/**
 * Get display information for a day type
 */
export function getDayTypeInfo(dayType: DayType): DayTypeInfo {
  return DAY_TYPE_INFO[dayType];
}

/**
 * Auto-classify all days in a trip
 */
export function classifyTripDays(trip: Trip): DayType[] {
  if (!trip.days) return [];
  
  return trip.days.map((day, index) => detectDayType(day, trip, index));
}

/**
 * Determine if a day type needs complex planning tools
 */
export function needsComplexPlanning(dayType: DayType): boolean {
  return dayType === 'park-day' || dayType === 'park-hopper';
}

/**
 * Get layout configuration for a day type
 */
export function getDayLayoutConfig(dayType: DayType) {
  switch (dayType) {
    case 'park-day':
    case 'park-hopper':
      return {
        layout: '3-column',
        leftWidth: 'lg:col-span-3',
        centerWidth: 'lg:col-span-6', 
        rightWidth: 'lg:col-span-3',
        showPlanningTools: true,
        showLightningLane: true
      };
      
    case 'check-in':
    case 'check-out':
    case 'disney-springs':
      return {
        layout: '2-column',
        leftWidth: 'lg:col-span-8',
        rightWidth: 'lg:col-span-4',
        showPlanningTools: false,
        showLightningLane: false
      };
      
    case 'rest-day':
    case 'special-event':
      return {
        layout: '1-column',
        centerWidth: 'lg:col-span-12 max-w-4xl mx-auto',
        showPlanningTools: false,
        showLightningLane: false
      };
      
    default:
      return {
        layout: '2-column',
        leftWidth: 'lg:col-span-8',
        rightWidth: 'lg:col-span-4',
        showPlanningTools: false,
        showLightningLane: false
      };
  }
}