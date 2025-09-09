import type { Park } from '../types';

export const PARKS: Park[] = [
  {
    id: 'magic-kingdom',
    name: 'Magic Kingdom',
    abbreviation: 'MK',
    description: 'The most magical place on Earth with classic Disney attractions',
    icon: '🏰'
  },
  {
    id: 'epcot',
    name: 'EPCOT',
    abbreviation: 'EP',
    description: 'Discover innovation and world cultures',
    icon: '🌍'
  },
  {
    id: 'hollywood-studios',
    name: "Disney's Hollywood Studios",
    abbreviation: 'HS',
    description: 'Lights, camera, action! Movie magic comes to life',
    icon: '🎬'
  },
  {
    id: 'animal-kingdom',
    name: "Disney's Animal Kingdom",
    abbreviation: 'AK',
    description: 'A wild adventure awaits in this animal-themed park',
    icon: '🦁'
  }
];

export const getParkById = (parkId: string): Park | undefined => {
  return PARKS.find(park => park.id === parkId);
};

export const getParkName = (parkId: string): string => {
  const park = getParkById(parkId);
  return park ? park.name : 'No park selected';
};