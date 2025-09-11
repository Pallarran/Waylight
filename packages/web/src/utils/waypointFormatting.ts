import { WaypointCategory } from '../types';

/**
 * Utility functions for formatting and styling waypoint information
 */

export const getIntensityColor = (intensity: string): string => {
  switch (intensity) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'moderate': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'extreme': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getTypeIcon = (type: string, category: WaypointCategory): string => {
  if (category === WaypointCategory.DO) {
    switch (type) {
      case 'ride': return '🎢';
      case 'show': return '🎭';
      case 'meet_greet': return '👋';
      case 'experience': return '✨';
      case 'walkthrough': return '🚶';
      case 'entertainment': return '🎪';
      case 'transportation': return '🚂';
      default: return '🎯';
    }
  } else if (category === WaypointCategory.EAT) {
    switch (type) {
      case 'quick_service': return '🍔';
      case 'table_service': return '🍽️';
      case 'snack': return '🍿';
      case 'lounge': return '🍸';
      case 'food_cart': return '🚚';
      default: return '🍽️';
    }
  } else if (category === WaypointCategory.STAY) {
    // For STAY, we show resort tier icons
    return '🏨'; // Default hotel icon, can be customized based on tier
  }
  return '🎯';
};

export const getPriceLevelDisplay = (priceLevel?: number): string => {
  if (!priceLevel) return '';
  return '$'.repeat(priceLevel);
};

export const getPriceLevelColor = (priceLevel?: number): string => {
  switch (priceLevel) {
    case 1: return 'bg-green-100 text-green-800';
    case 2: return 'bg-yellow-100 text-yellow-800';
    case 3: return 'bg-orange-100 text-orange-800';
    case 4: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getResortTierColor = (tier?: string): string => {
  switch (tier) {
    case 'deluxe':
    case 'deluxe-villa': return 'bg-purple-100 text-purple-800';
    case 'moderate': return 'bg-blue-100 text-blue-800';
    case 'value': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getResortTierIcon = (tier?: string): string => {
  switch (tier) {
    case 'deluxe': return '🏨';
    case 'deluxe-villa': return '🏡';
    case 'moderate': return '🏩';
    case 'value': return '🏨';
    default: return '🏨';
  }
};

export const formatServiceType = (serviceType?: string): string => {
  switch (serviceType) {
    case 'quick': return 'Quick Service';
    case 'table': return 'Table Service';
    case 'snack': return 'Snack Stand';
    case 'lounge': return 'Lounge';
    default: return serviceType || '';
  }
};

export const formatResortTier = (tier?: string): string => {
  if (!tier) return '';
  return tier.charAt(0).toUpperCase() + tier.slice(1).replace('-', ' ');
};

export const getTransportationColor = (transport: string): string => {
  switch (transport.toLowerCase()) {
    case 'monorail': return 'bg-purple-100 text-purple-800';
    case 'skyliner': return 'bg-blue-100 text-blue-800';
    case 'boat': return 'bg-cyan-100 text-cyan-800';
    case 'walking': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getTransportationIcon = (transport: string): string => {
  switch (transport.toLowerCase()) {
    case 'monorail': return '🚝';
    case 'skyliner': return '🚡';
    case 'boat': return '⛵';
    case 'bus': return '🚌';
    case 'walking': return '🚶';
    default: return '🚌';
  }
};

export const getCategoryColor = (category: WaypointCategory): string => {
  switch (category) {
    case WaypointCategory.DO: return 'border-l-blue-500';
    case WaypointCategory.EAT: return 'border-l-green-500';
    case WaypointCategory.STAY: return 'border-l-purple-500';
    default: return 'border-l-gray-500';
  }
};

export const getCategoryBackgroundColor = (category: WaypointCategory): string => {
  switch (category) {
    case WaypointCategory.DO: return 'bg-blue-50';
    case WaypointCategory.EAT: return 'bg-green-50';
    case WaypointCategory.STAY: return 'bg-purple-50';
    default: return 'bg-gray-50';
  }
};