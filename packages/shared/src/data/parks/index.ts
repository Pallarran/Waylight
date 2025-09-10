import type { Park } from '../../types';
import magicKingdomData from './magic-kingdom.json';
import epcotData from './epcot.json';
import hollywoodStudiosData from './hollywood-studios.json';
import animalKingdomData from './animal-kingdom.json';

export const parks: Park[] = [
  magicKingdomData as Park,
  epcotData as Park,
  hollywoodStudiosData as Park,
  animalKingdomData as Park,
];

export const getPark = (id: string): Park | undefined => {
  return parks.find(park => park.id === id);
};

export const getParks = (): Park[] => {
  return parks;
};