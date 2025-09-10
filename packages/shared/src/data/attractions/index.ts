/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import type { Attraction } from '../../types';
import magicKingdomAttractions from './magic-kingdom.json';
import epcotAttractions from './epcot.json';
import hollywoodStudiosAttractions from './hollywood-studios.json';
import animalKingdomAttractions from './animal-kingdom.json';

const allAttractions: Attraction[] = [
  ...(magicKingdomAttractions as Attraction[]),
  ...(epcotAttractions as Attraction[]),
  ...(hollywoodStudiosAttractions as Attraction[]),
  ...(animalKingdomAttractions as Attraction[]),
];

export const getAttractions = (parkId?: string): Attraction[] => {
  if (parkId) {
    return allAttractions.filter(attraction => attraction.parkId === parkId);
  }
  return allAttractions;
};

export const getAttraction = (id: string): Attraction | undefined => {
  return allAttractions.find(attraction => attraction.id === id);
};

export const searchAttractions = (query: string, parkId?: string): Attraction[] => {
  const attractions = getAttractions(parkId);
  const searchTerm = query.toLowerCase();
  
  return attractions.filter(attraction => 
    attraction.name.toLowerCase().includes(searchTerm) ||
    attraction.description.toLowerCase().includes(searchTerm) ||
    attraction.location.toLowerCase().includes(searchTerm) ||
    attraction.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};

export const getAttractionsByType = (type: string, parkId?: string): Attraction[] => {
  const attractions = getAttractions(parkId);
  return attractions.filter(attraction => attraction.type === type);
};

export const getAttractionsByIntensity = (intensity: string, parkId?: string): Attraction[] => {
  const attractions = getAttractions(parkId);
  return attractions.filter(attraction => attraction.intensity === intensity);
};

export const getAttractionsByLocation = (location: string, parkId?: string): Attraction[] => {
  const attractions = getAttractions(parkId);
  return attractions.filter(attraction => 
    attraction.location.toLowerCase() === location.toLowerCase()
  );
};

export const getPopularAttractions = (parkId?: string, limit = 10): Attraction[] => {
  const attractions = getAttractions(parkId);
  // For now, sort by number of tips (more tips = more popular)
  // In the future, this could use actual popularity data
  return attractions
    .sort((a, b) => b.tips.length - a.tips.length)
    .slice(0, limit);
};

export const getFamilyFriendlyAttractions = (parkId?: string): Attraction[] => {
  const attractions = getAttractions(parkId);
  return attractions.filter(attraction => 
    attraction.intensity === 'low' && 
    (!attraction.heightRequirement || attraction.heightRequirement <= 35)
  );
};

export const getThrillRides = (parkId?: string): Attraction[] => {
  const attractions = getAttractions(parkId);
  return attractions.filter(attraction => 
    attraction.intensity === 'high' || attraction.intensity === 'extreme'
  );
};

export const getAccessibleAttractions = (parkId?: string): Attraction[] => {
  const attractions = getAttractions(parkId);
  return attractions.filter(attraction => 
    attraction.accessibility?.wheelchairAccessible === true
  );
};