// EAT Category Data - Dining and Food Services

export interface EatFeatures {
  // Service & Ordering (6 Core Options)
  mobileOrder?: boolean;
  adrRequired?: boolean;
  walkupAvailable?: boolean;
  counterService?: boolean;
  tableService?: boolean;
  reservationsRecommended?: boolean;
  
  // Dining Experience (8 Enhanced Options)
  characterDining?: boolean;
  entertainment?: boolean;
  views?: boolean;
  themedAtmosphere?: boolean;
  outdoorSeating?: boolean;
  barLounge?: boolean;
  familyStyle?: boolean;
  fineDining?: boolean;
  
  // Dietary & Accessibility (6 Essential Options)
  vegetarianOptions?: boolean;
  veganOptions?: boolean;
  glutenFreeOptions?: boolean;
  alcoholServed?: boolean;
  kidFriendly?: boolean;
  allergyFriendly?: boolean;
  healthyOptions?: boolean;
  largePortions?: boolean;
}

export interface EatItem {
  id: string;
  parkId?: string; // Optional since some restaurants are in resorts
  resortId?: string; // For resort dining
  name: string;
  description: string;
  location: string;
  type: 'quick_service' | 'table_service' | 'snack' | 'lounge' | 'food_cart';
  serviceType: 'quick' | 'table' | 'snack' | 'lounge' | 'cart';
  priceLevel: 1 | 2 | 3 | 4; // $ to $$$$
  tips: Array<{
    id: string;
    category: 'best_time' | 'strategy' | 'general';
    content: string;
    priority: number;
  }>;
  tags: string[];
  features?: EatFeatures;
  // Eat-specific fields
  cuisineType: string;
  kidFriendly: boolean;
  operatingHours?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  reservationWindow?: number; // days in advance
}

// Import data from all parks - all files now exist for future-proofing
// Quick Service
import magicKingdomQuickServiceData from './quick-service/magic-kingdom-quick-service.json';
import epcotQuickServiceData from './quick-service/epcot-quick-service.json';
import hollywoodStudiosQuickServiceData from './quick-service/hollywood-studios-quick-service.json';
import animalKingdomQuickServiceData from './quick-service/animal-kingdom-quick-service.json';

// Table Service
import magicKingdomTableServiceData from './table-service/magic-kingdom-table-service.json';
import epcotTableServiceData from './table-service/epcot-table-service.json';
import hollywoodStudiosTableServiceData from './table-service/hollywood-studios-table-service.json';
import animalKingdomTableServiceData from './table-service/animal-kingdom-table-service.json';

// Snacks
import magicKingdomSnacksData from './snacks/magic-kingdom-snacks.json';
import epcotSnacksData from './snacks/epcot-snacks.json';
import hollywoodStudiosSnacksData from './snacks/hollywood-studios-snacks.json';
import animalKingdomSnacksData from './snacks/animal-kingdom-snacks.json';

// Lounges
import magicKingdomLoungesData from './lounges/magic-kingdom-lounges.json';
import epcotLoungesData from './lounges/epcot-lounges.json';
import hollywoodStudiosLoungesData from './lounges/hollywood-studios-lounges.json';
import animalKingdomLoungesData from './lounges/animal-kingdom-lounges.json';

// Cast imported data to proper types and combine all parks
export const quickServiceRestaurants: EatItem[] = [
  ...(magicKingdomQuickServiceData as EatItem[]),
  ...(epcotQuickServiceData as EatItem[]),
  ...(hollywoodStudiosQuickServiceData as EatItem[]),
  ...(animalKingdomQuickServiceData as EatItem[])
];

export const tableServiceRestaurants: EatItem[] = [
  ...(magicKingdomTableServiceData as EatItem[]),
  ...(epcotTableServiceData as EatItem[]),
  ...(hollywoodStudiosTableServiceData as EatItem[]),
  ...(animalKingdomTableServiceData as EatItem[])
];

export const snackStands: EatItem[] = [
  ...(magicKingdomSnacksData as EatItem[]),
  ...(epcotSnacksData as EatItem[]),
  ...(hollywoodStudiosSnacksData as EatItem[]),
  ...(animalKingdomSnacksData as EatItem[])
];

export const lounges: EatItem[] = [
  ...(magicKingdomLoungesData as EatItem[]),
  ...(epcotLoungesData as EatItem[]),
  ...(hollywoodStudiosLoungesData as EatItem[]),
  ...(animalKingdomLoungesData as EatItem[])
];

export const getAllEatItems = (): EatItem[] => {
  return [...quickServiceRestaurants, ...tableServiceRestaurants, ...snackStands, ...lounges];
};

export const getEatItemsByPark = (parkId: string): EatItem[] => {
  return getAllEatItems().filter(item => item.parkId === parkId);
};

export const getEatItemsByResort = (resortId: string): EatItem[] => {
  return getAllEatItems().filter(item => item.resortId === resortId);
};

export const getEatItemsByType = (type: EatItem['type']): EatItem[] => {
  return getAllEatItems().filter(item => item.type === type);
};

export const getEatItemsByCuisine = (cuisineType: string): EatItem[] => {
  return getAllEatItems().filter(item => item.cuisineType.toLowerCase().includes(cuisineType.toLowerCase()));
};

export const getEatItemsByPriceLevel = (priceLevel: 1 | 2 | 3 | 4): EatItem[] => {
  return getAllEatItems().filter(item => item.priceLevel === priceLevel);
};

export const getEatItemById = (id: string): EatItem | undefined => {
  return getAllEatItems().find(item => item.id === id);
};