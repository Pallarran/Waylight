import type { Attraction, AttractionType, IntensityLevel } from '../types';

export const sampleAttractions: Attraction[] = [
  {
    id: 'space-mountain',
    parkId: 'magic-kingdom',
    name: 'Space Mountain',
    description: 'An indoor roller coaster in complete darkness with space-themed music and effects.',
    duration: 3,
    heightRequirement: 44,
    location: 'Tomorrowland',
    type: 'ride' as AttractionType,
    intensity: 'high' as IntensityLevel,
    accessibility: {
      wheelchairAccessible: false,
      transferRequired: true,
      serviceAnimalsAllowed: false,
    },
    tips: [
      {
        id: 'tip-1',
        category: 'best_time',
        content: 'Visit during the first hour of park opening or late evening for shorter wait times.',
        priority: 1,
      },
      {
        id: 'tip-2',
        category: 'strategy',
        content: 'Use Lightning Lane if available - this attraction often has the longest wait times.',
        priority: 2,
      },
    ],
    tags: ['thrill', 'indoor', 'dark', 'space', 'roller-coaster'],
  },
  {
    id: 'haunted-mansion',
    parkId: 'magic-kingdom',
    name: 'Haunted Mansion',
    description: 'A ghost-filled tour through a spooky mansion with 999 happy haunts.',
    duration: 8,
    location: 'Liberty Square',
    type: 'ride' as AttractionType,
    intensity: 'low' as IntensityLevel,
    accessibility: {
      wheelchairAccessible: true,
    },
    tips: [
      {
        id: 'tip-3',
        category: 'general',
        content: 'Look for hidden details in the portraits and decorations throughout the ride.',
        priority: 1,
      },
      {
        id: 'tip-4',
        category: 'best_time',
        content: 'Evening rides have a more atmospheric feel, especially during Halloween season.',
        priority: 2,
      },
    ],
    tags: ['family-friendly', 'spooky', 'classic', 'indoor', 'dark-ride'],
  },
  {
    id: 'pirates-caribbean',
    parkId: 'magic-kingdom',
    name: 'Pirates of the Caribbean',
    description: 'A boat ride through pirate-infested waters with animatronic pirates and treasure.',
    duration: 9,
    location: 'Adventureland',
    type: 'ride' as AttractionType,
    intensity: 'low' as IntensityLevel,
    accessibility: {
      wheelchairAccessible: true,
    },
    tips: [
      {
        id: 'tip-5',
        category: 'strategy',
        content: 'Sit on the right side of the boat for the best views of the auction scene.',
        priority: 1,
      },
    ],
    tags: ['family-friendly', 'boat-ride', 'pirates', 'classic', 'animatronics'],
  },
  {
    id: 'big-thunder-mountain',
    parkId: 'magic-kingdom',
    name: 'Big Thunder Mountain Railroad',
    description: 'A wild ride through a mining town on a runaway mine train.',
    duration: 4,
    heightRequirement: 40,
    location: 'Frontierland',
    type: 'ride' as AttractionType,
    intensity: 'moderate' as IntensityLevel,
    accessibility: {
      wheelchairAccessible: false,
      transferRequired: true,
    },
    tips: [
      {
        id: 'tip-6',
        category: 'best_time',
        content: 'Night rides offer beautiful views of the park and cooler temperatures.',
        priority: 1,
      },
    ],
    tags: ['moderate-thrill', 'mine-train', 'outdoor', 'scenic', 'family-coaster'],
  },
  {
    id: 'its-small-world',
    parkId: 'magic-kingdom',
    name: "It's a Small World",
    description: 'A gentle boat ride celebrating the children and cultures of the world.',
    duration: 11,
    location: 'Fantasyland',
    type: 'ride' as AttractionType,
    intensity: 'low' as IntensityLevel,
    accessibility: {
      wheelchairAccessible: true,
    },
    tips: [
      {
        id: 'tip-7',
        category: 'general',
        content: 'Great for all ages and a perfect break from the heat with air conditioning.',
        priority: 1,
      },
    ],
    tags: ['family-friendly', 'boat-ride', 'indoor', 'classic', 'air-conditioned'],
  },
  {
    id: 'splash-mountain',
    parkId: 'magic-kingdom',
    name: 'Splash Mountain',
    description: 'A log flume ride with a thrilling 50-foot drop and soaking finale.',
    duration: 10,
    heightRequirement: 40,
    location: 'Frontierland',
    type: 'ride' as AttractionType,
    intensity: 'moderate' as IntensityLevel,
    accessibility: {
      wheelchairAccessible: false,
      transferRequired: true,
    },
    tips: [
      {
        id: 'tip-8',
        category: 'strategy',
        content: 'Sit in the front for the best views, but expect to get wetter.',
        priority: 1,
      },
      {
        id: 'tip-9',
        category: 'general',
        content: 'Bring a poncho or plan to get soaked, especially in the front seats.',
        priority: 2,
      },
    ],
    tags: ['moderate-thrill', 'water-ride', 'log-flume', 'outdoor', 'gets-you-wet'],
  },
];

export const getAttractions = (parkId?: string): Attraction[] => {
  if (parkId) {
    return sampleAttractions.filter(attraction => attraction.parkId === parkId);
  }
  return sampleAttractions;
};

export const getAttraction = (id: string): Attraction | undefined => {
  return sampleAttractions.find(attraction => attraction.id === id);
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