// Compatibility layer - maps old attraction functions to new DO/EAT structure
import { getAllDoItems, getAllEatItems, type DoItem, type EatItem } from '@waylight/shared';

// Combined type for backward compatibility
type LegacyAttraction = DoItem | EatItem;

// Legacy function that combines DO and EAT items
export const getAttractions = (): LegacyAttraction[] => {
  return [...getAllDoItems(), ...getAllEatItems()];
};

// Legacy function to get a single attraction by ID
export const getAttraction = (id: string): LegacyAttraction | undefined => {
  const allItems = getAttractions();
  return allItems.find(item => item.id === id);
};

// Legacy search function
export const searchAttractions = (query: string): LegacyAttraction[] => {
  const allItems = getAttractions();
  const searchTerm = query.toLowerCase();
  return allItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm) ||
    item.description.toLowerCase().includes(searchTerm) ||
    item.location.toLowerCase().includes(searchTerm)
  );
};

// Legacy type filter
export const getAttractionsByType = (type: string): LegacyAttraction[] => {
  const allItems = getAttractions();
  return allItems.filter(item => item.type === type);
};

// Legacy intensity filter (DO items only)
export const getAttractionsByIntensity = (intensity: string): DoItem[] => {
  const doItems = getAllDoItems();
  return doItems.filter(item => item.intensity === intensity);
};

// Legacy location filter
export const getAttractionsByLocation = (location: string): LegacyAttraction[] => {
  const allItems = getAttractions();
  return allItems.filter(item => item.location.toLowerCase().includes(location.toLowerCase()));
};

// Legacy popular attractions (placeholder implementation)
export const getPopularAttractions = (): LegacyAttraction[] => {
  return getAttractions().slice(0, 20); // Return first 20 as "popular"
};

// Legacy family-friendly filter (DO items only)
export const getFamilyFriendlyAttractions = (): DoItem[] => {
  const doItems = getAllDoItems();
  return doItems.filter(item => 
    item.intensity === 'low' || item.intensity === 'moderate'
  );
};

// Legacy thrill rides filter (DO items only)
export const getThrillRides = (): DoItem[] => {
  const doItems = getAllDoItems();
  return doItems.filter(item => 
    item.intensity === 'high' || item.intensity === 'extreme'
  );
};

// Legacy accessible attractions filter
export const getAccessibleAttractions = (): LegacyAttraction[] => {
  const allItems = getAttractions();
  return allItems.filter(item => 
    ('accessibility' in item && item.accessibility?.wheelchairAccessible) ||
    ('kidFriendly' in item && item.kidFriendly)
  );
};