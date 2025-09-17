import type { ActivityCategoryInfo } from '../types';

export const ACTIVITY_CATEGORIES: ActivityCategoryInfo[] = [
  {
    id: 'ride',
    name: 'Rides',
    icon: '🎢',
    color: 'text-red-400',
    description: 'Roller coasters, dark rides, and thrill attractions'
  },
  {
    id: 'show',
    name: 'Shows & Entertainment',
    icon: '🎭',
    color: 'text-purple-400',
    description: 'Stage shows, parades, fireworks, and entertainment'
  },
  {
    id: 'dining',
    name: 'Dining',
    icon: '🍽️',
    color: 'text-orange-400',
    description: 'Restaurants, quick service, snacks, and beverages'
  },
  {
    id: 'quick_service',
    name: 'Quick Service',
    icon: '🍽️',
    color: 'text-orange-400',
    description: 'Quick service restaurants and fast food'
  },
  {
    id: 'table_service',
    name: 'Table Service',
    icon: '🍽️',
    color: 'text-orange-400',
    description: 'Table service restaurants and fine dining'
  },
  {
    id: 'snack',
    name: 'Snacks',
    icon: '🍿',
    color: 'text-yellow-400',
    description: 'Snack stands and quick bites'
  },
  {
    id: 'meet_greet',
    name: 'Character Meet & Greets',
    icon: '🐭',
    color: 'text-yellow-400',
    description: 'Meet Disney characters and photo opportunities'
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: 'text-pink-400',
    description: 'Gift shops, merchandise, and souvenir hunting'
  },
  {
    id: 'attraction',
    name: 'Attractions & Experiences',
    icon: '🏰',
    color: 'text-blue-400',
    description: 'Interactive experiences, exhibits, and unique attractions'
  },
  {
    id: 'waterpark',
    name: 'Water Activities',
    icon: '🏊',
    color: 'text-cyan-400',
    description: 'Water rides, pools, splash areas, and water parks'
  },
  {
    id: 'travel',
    name: 'Travel & Transportation',
    icon: '🚗',
    color: 'text-gray-400',
    description: 'Transportation between parks, hotels, and locations'
  },
  {
    id: 'break',
    name: 'Rest & Breaks',
    icon: '😴',
    color: 'text-green-400',
    description: 'Rest periods, naps, and downtime'
  },
  {
    id: 'special_events',
    name: 'Special Events',
    icon: '🎉',
    color: 'text-indigo-400',
    description: 'Seasonal events, parties, and special experiences'
  },
  {
    id: 'tours',
    name: 'Tours & Experiences',
    icon: '🗺️',
    color: 'text-teal-400',
    description: 'Guided tours, behind-the-scenes experiences'
  }
];

export const getCategoryInfo = (categoryId: string): ActivityCategoryInfo | undefined => {
  return ACTIVITY_CATEGORIES.find(cat => cat.id === categoryId);
};

export const getCategoryIcon = (categoryId: string, itemName?: string): string => {
  const category = getCategoryInfo(categoryId);
  return category?.icon || '📝';
};

export const getCategoryColor = (categoryId: string): string => {
  const category = getCategoryInfo(categoryId);
  return category?.color || 'text-ink-light';
};