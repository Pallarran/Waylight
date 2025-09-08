import type { Park } from '../../types';
import magicKingdomData from './magic-kingdom.json';

export const parks: Park[] = [
  magicKingdomData as Park,
];

export const getPark = (id: string): Park | undefined => {
  return parks.find(park => park.id === id);
};

export const getParks = (): Park[] => {
  return parks;
};