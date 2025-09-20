import { ParkMapping } from '../types/liveData';

// Park ID mappings between our system and external APIs
// Based on ThemeParks.wiki API destinations endpoint
export const PARK_MAPPINGS: ParkMapping[] = [
  // Disney World Parks
  {
    waypointParkId: 'magic-kingdom',
    themeParksWikiId: '1c84a229-8862-4648-9c71-378ddd2c7693', // Magic Kingdom
    queueTimesId: 'magic-kingdom',
    thrillDataId: 'magic-kingdom',
    displayName: 'Magic Kingdom'
  },
  {
    waypointParkId: 'epcot',
    themeParksWikiId: '47f90d2c-e191-4239-a466-5892ef59a88b', // EPCOT
    queueTimesId: 'epcot',
    thrillDataId: 'epcot',
    displayName: 'EPCOT'
  },
  {
    waypointParkId: 'hollywood-studios',
    themeParksWikiId: '288747d1-8b4f-4a64-867e-ea7c9b27bad8', // Hollywood Studios
    queueTimesId: 'hollywood-studios',
    thrillDataId: 'hollywood-studios',
    displayName: "Disney's Hollywood Studios"
  },
  {
    waypointParkId: 'animal-kingdom',
    themeParksWikiId: 'cae8aa89-c4b7-4bfd-a2a8-9adaaa4d0df7', // Animal Kingdom
    queueTimesId: 'animal-kingdom',
    thrillDataId: 'animal-kingdom',
    displayName: "Disney's Animal Kingdom"
  }
];

// Helper functions
export const getParkMapping = (waypointParkId: string): ParkMapping | undefined => {
  return PARK_MAPPINGS.find(mapping => mapping.waypointParkId === waypointParkId);
};

export const getThemeParksWikiId = (waypointParkId: string): string | undefined => {
  return getParkMapping(waypointParkId)?.themeParksWikiId;
};

export const getQueueTimesId = (waypointParkId: string): string | undefined => {
  return getParkMapping(waypointParkId)?.queueTimesId;
};

export const getThrillDataId = (waypointParkId: string): string | undefined => {
  return getParkMapping(waypointParkId)?.thrillDataId;
};

export const getWaypointParkId = (themeParksWikiId: string): string | undefined => {
  return PARK_MAPPINGS.find(mapping => mapping.themeParksWikiId === themeParksWikiId)?.waypointParkId;
};

// All supported park IDs for validation
export const SUPPORTED_PARK_IDS = PARK_MAPPINGS.map(mapping => mapping.waypointParkId);

// Check if a park ID is supported for live data
export const isParkSupported = (parkId: string): boolean => {
  return SUPPORTED_PARK_IDS.includes(parkId);
};