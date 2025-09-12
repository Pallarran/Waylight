// DO Category Data - Attractions and Experiences

// Standardized DO Features Interface (22 Features in 3 Categories)
export interface DoFeatures {
  // Access & Services (6 Core Features)
  multiPass?: boolean;           // Skip regular lines with Multi Pass (formerly Genie+)
  singlePass?: boolean;          // Individual attraction purchase for popular rides
  singleRider?: boolean;         // Single rider line available for faster boarding
  riderSwitch?: boolean;         // Child swap service for families with small children
  mobileCheckin?: boolean;       // Mobile queue joining or virtual line
  photoPass?: boolean;           // Official Disney photography service available

  // Experience (13 Core Features)
  darkRide?: boolean;            // Takes place in darkened environment
  getsWet?: boolean;             // Guests may get splashed or soaked
  spinningMotion?: boolean;      // Ride vehicles spin or rotate
  loudSounds?: boolean;          // High volume audio or sound effects
  strobeEffects?: boolean;       // Flashing lights or strobe effects
  interactiveElements?: boolean; // Hands-on participation or guest interaction
  characterMeet?: boolean;       // Disney character appearances and meet opportunities
  livePerformance?: boolean;     // Live actors, musicians, or performers
  airConditioning?: boolean;     // Climate-controlled indoor environment
  outdoorExperience?: boolean;   // Takes place primarily outdoors
  scary?: boolean;               // May include scary themes, jump scares, or spooky elements
  bigDrops?: boolean;            // Features significant drops or steep descents
  launchSpeed?: boolean;         // High-speed launch or fast-paced elements

  // Important Notes (6 Safety & Accessibility Features)
  heightRequirement?: boolean;   // Minimum height restrictions apply
  motionSensitivity?: boolean;   // May cause motion sickness
  pregnancyAdvisory?: boolean;   // Not recommended during pregnancy
  wheelchairAccessible?: boolean; // Accessible without transfer required
  transferRequired?: boolean;    // Must transfer from mobility device
  rainSafe?: boolean;            // Weather-protected experience
}

export interface DoItem {
  id: string;
  parkId: string;
  name: string;
  description: string;
  location: string;
  type: 'ride' | 'show' | 'experience' | 'meet_greet' | 'walkthrough' | 'entertainment' | 'transportation';
  duration: number; // minutes
  heightRequirement?: number; // inches
  intensity: 'low' | 'moderate' | 'high' | 'extreme';
  accessibility?: {
    wheelchairAccessible: boolean;
    transferRequired?: boolean;
    serviceAnimalsAllowed?: boolean;
    signLanguageAvailable?: boolean;
  };
  tips: Array<{
    id: string;
    category: 'best_time' | 'strategy' | 'general';
    content: string;
    priority: number;
  }>;
  tags: string[];
  features?: DoFeatures;
  // Do-specific fields
  lightningLane?: boolean;
  singleRider?: boolean;
  photoService?: boolean;
  characters?: string[]; // for meet & greets
  showTimes?: string[]; // for shows and entertainment
}

// Import data from all parks and all categories - all files now exist for future-proofing
// Rides
import magicKingdomRidesData from './rides/magic-kingdom-rides.json';
import epcotRidesData from './rides/epcot-rides.json';
import hollywoodStudiosRidesData from './rides/hollywood-studios-rides.json';
import animalKingdomRidesData from './rides/animal-kingdom-rides.json';

// Shows
import magicKingdomShowsData from './shows/magic-kingdom-shows.json';
import epcotShowsData from './shows/epcot-shows.json';
import hollywoodStudiosShowsData from './shows/hollywood-studios-shows.json';
import animalKingdomShowsData from './shows/animal-kingdom-shows.json';

// Experiences
import magicKingdomExperiencesData from './experiences/magic-kingdom-experiences.json';
import epcotExperiencesData from './experiences/epcot-experiences.json';
import hollywoodStudiosExperiencesData from './experiences/hollywood-studios-experiences.json';
import animalKingdomExperiencesData from './experiences/animal-kingdom-experiences.json';

// Meet & Greets
import magicKingdomMeetGreetsData from './meet-greets/magic-kingdom-meet-greets.json';
import epcotMeetGreetsData from './meet-greets/epcot-meet-greets.json';
import hollywoodStudiosMeetGreetsData from './meet-greets/hollywood-studios-meet-greets.json';
import animalKingdomMeetGreetsData from './meet-greets/animal-kingdom-meet-greets.json';

// Entertainment
import magicKingdomEntertainmentData from './entertainment/magic-kingdom-entertainment.json';
import epcotEntertainmentData from './entertainment/epcot-entertainment.json';
import hollywoodStudiosEntertainmentData from './entertainment/hollywood-studios-entertainment.json';
import animalKingdomEntertainmentData from './entertainment/animal-kingdom-entertainment.json';

// Transportation
import magicKingdomTransportationData from './transportation/magic-kingdom-transportation.json';
import epcotTransportationData from './transportation/epcot-transportation.json';
import hollywoodStudiosTransportationData from './transportation/hollywood-studios-transportation.json';
import animalKingdomTransportationData from './transportation/animal-kingdom-transportation.json';

// Export by category type with both legacy data from rides files and future category-specific data
export const rides: DoItem[] = [
  // Legacy data from rides files (filtered by type)
  ...(magicKingdomRidesData as DoItem[]).filter(item => item.type === 'ride'),
  ...(epcotRidesData as DoItem[]).filter(item => item.type === 'ride'),
  ...(hollywoodStudiosRidesData as DoItem[]).filter(item => item.type === 'ride'),
  ...(animalKingdomRidesData as DoItem[]).filter(item => item.type === 'ride')
];

export const shows: DoItem[] = [
  // Category-specific data only (no legacy duplication)
  ...(magicKingdomShowsData as DoItem[]),
  ...(epcotShowsData as DoItem[]),
  ...(hollywoodStudiosShowsData as DoItem[]),
  ...(animalKingdomShowsData as DoItem[])
];

export const experiences: DoItem[] = [
  // Category-specific data only (no legacy duplication)
  ...(magicKingdomExperiencesData as DoItem[]),
  ...(epcotExperiencesData as DoItem[]),
  ...(hollywoodStudiosExperiencesData as DoItem[]),
  ...(animalKingdomExperiencesData as DoItem[])
];

export const meetGreets: DoItem[] = [
  // Category-specific data only (no legacy duplication)
  ...(magicKingdomMeetGreetsData as DoItem[]),
  ...(epcotMeetGreetsData as DoItem[]),
  ...(hollywoodStudiosMeetGreetsData as DoItem[]),
  ...(animalKingdomMeetGreetsData as DoItem[])
];

export const entertainment: DoItem[] = [
  // Category-specific data only (no legacy duplication)
  ...(magicKingdomEntertainmentData as DoItem[]),
  ...(epcotEntertainmentData as DoItem[]),
  ...(hollywoodStudiosEntertainmentData as DoItem[]),
  ...(animalKingdomEntertainmentData as DoItem[])
];

export const transportation: DoItem[] = [
  // Category-specific data only (no legacy duplication)
  ...(magicKingdomTransportationData as DoItem[]),
  ...(epcotTransportationData as DoItem[]),
  ...(hollywoodStudiosTransportationData as DoItem[]),
  ...(animalKingdomTransportationData as DoItem[])
];

export const getAllDoItems = (): DoItem[] => {
  // Include all categories - the system will filter appropriately
  return [...rides, ...shows, ...experiences, ...meetGreets, ...entertainment, ...transportation];
};

export const getDoItemsByPark = (parkId: string): DoItem[] => {
  return getAllDoItems().filter(item => item.parkId === parkId);
};

export const getDoItemsByType = (type: DoItem['type']): DoItem[] => {
  return getAllDoItems().filter(item => item.type === type);
};

export const getDoItemById = (id: string): DoItem | undefined => {
  return getAllDoItems().find(item => item.id === id);
};