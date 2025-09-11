import type { AttractionFeatures } from '@waylight/shared';

export interface WaypointIcon {
  emoji: string;
  label: string;
  description: string;
  tier: 1 | 2; // Tier 1 = essential, Tier 2 = enhanced
}

// Legacy attraction icons for DO items
export const ATTRACTION_ICONS: Record<keyof AttractionFeatures, WaypointIcon> = {
  // Tier 1: Core Icons (Essential Information)
  isDarkRide: {
    emoji: '🌑',
    label: 'Dark Ride',
    description: 'Attraction takes place in darkness or low-light conditions',
    tier: 1
  },
  getsWet: {
    emoji: '💦',
    label: 'Gets Wet',
    description: 'You may get splashed or soaked during this attraction',
    tier: 1
  },
  isScary: {
    emoji: '👻',
    label: 'Scary',
    description: 'May include scary themes, jump scares, or spooky elements',
    tier: 1
  },
  isInteractive: {
    emoji: '🎯',
    label: 'Interactive',
    description: 'Features interactive elements like shooting, steering, or participation',
    tier: 1
  },
  isSpinning: {
    emoji: '🌀',
    label: 'Spinning',
    description: 'Attraction involves spinning or rotating motion',
    tier: 1
  },
  isWaterRide: {
    emoji: '🛶',
    label: 'Water Ride',
    description: 'Boat ride or water-based attraction',
    tier: 1
  },
  hasPhotos: {
    emoji: '📸',
    label: 'Photos Available',
    description: 'On-ride photos or PhotoPass opportunities available',
    tier: 1
  },
  hasCharacters: {
    emoji: '🐭',
    label: 'Disney Characters',
    description: 'Features Disney character appearances, meet & greets, or character dining',
    tier: 1
  },

  // Tier 2: Enhanced Icons (Additional Detail)
  hasLightningLane: {
    emoji: '🎟️',
    label: 'LL Multi Pass',
    description: 'Lightning Lane Multi Pass (formerly Genie+) skip-the-line service available',
    tier: 2
  },
  isRainSafe: {
    emoji: '🌧️',
    label: 'Rain Safe',
    description: 'Continues operating in light rain or weather',
    tier: 2
  },
  hasAirConditioning: {
    emoji: '❄️',
    label: 'Air Conditioned',
    description: 'Climate controlled space - great for hot days',
    tier: 2
  },
  isLoud: {
    emoji: '🔊',
    label: 'Loud',
    description: 'High volume sounds, music, or effects',
    tier: 2
  },
  hasBigDrops: {
    emoji: '⛰️',
    label: 'Big Drops',
    description: 'Features significant drops or steep descents',
    tier: 2
  },
  hasLaunch: {
    emoji: '🏁',
    label: 'Launch/Speed',
    description: 'High-speed launch or fast-paced elements',
    tier: 2
  },
  hasStrobes: {
    emoji: '💡',
    label: 'Strobe Lights',
    description: 'Contains flashing lights that may trigger seizures',
    tier: 2
  },
  hasRiderSwitch: {
    emoji: '🔁',
    label: 'Rider Switch',
    description: 'Child swap service available for families',
    tier: 2
  },
  hasIndividualLL: {
    emoji: '🎫',
    label: 'LL Single Pass',
    description: 'Lightning Lane Single Pass (formerly Individual LL) premium service available',
    tier: 2
  }
};

// EAT-specific icons for restaurant features
export const EAT_ICONS: Record<string, WaypointIcon> = {
  // Service Types
  'mobile-order': {
    emoji: '📱',
    label: 'Mobile Order',
    description: 'Mobile ordering available to skip the line',
    tier: 1
  },
  'adr-required': {
    emoji: '📅',
    label: 'ADR Required',
    description: 'Advanced Dining Reservations required',
    tier: 1
  },
  
  // Seating & Atmosphere
  'indoor-seating': {
    emoji: '🏠',
    label: 'Indoor',
    description: 'Climate-controlled indoor seating',
    tier: 2
  },
  'outdoor-seating': {
    emoji: '🌤️',
    label: 'Outdoor',
    description: 'Open-air outdoor seating',
    tier: 2
  },
  'upstairs-dining': {
    emoji: '⬆️',
    label: 'Upstairs',
    description: 'Additional seating on upper level',
    tier: 2
  },
  'entertainment': {
    emoji: '🎭',
    label: 'Entertainment',
    description: 'Live entertainment or shows',
    tier: 1
  },
  'castle-views': {
    emoji: '🏰',
    label: 'Castle Views',
    description: 'Dining with Cinderella Castle views',
    tier: 1
  },
  
  // Special Features
  'toppings-bar': {
    emoji: '🥗',
    label: 'Toppings Bar',
    description: 'Self-service toppings and condiments',
    tier: 2
  },
  'themed': {
    emoji: '🎨',
    label: 'Themed',
    description: 'Immersive theming and decor',
    tier: 2
  },
  'character-dining': {
    emoji: '🐭',
    label: 'Character Dining',
    description: 'Disney character meet & greets',
    tier: 1
  },
  
  // Dietary & Accessibility
  'vegetarian': {
    emoji: '🥬',
    label: 'Vegetarian',
    description: 'Vegetarian options available',
    tier: 2
  },
  'vegan': {
    emoji: '🌱',
    label: 'Vegan',
    description: 'Vegan options available',
    tier: 2
  },
  'gluten-free': {
    emoji: '🌾',
    label: 'Gluten-Free',
    description: 'Gluten-free options available',
    tier: 2
  },
  'alcohol': {
    emoji: '🍷',
    label: 'Alcohol',
    description: 'Alcoholic beverages served',
    tier: 2
  }
};

// STAY-specific icons for hotel amenities
export const STAY_ICONS: Record<string, WaypointIcon> = {
  // Transportation
  'Monorail': {
    emoji: '🚝',
    label: 'Monorail',
    description: 'Direct monorail access to parks',
    tier: 1
  },
  'Skyliner': {
    emoji: '🚡',
    label: 'Disney Skyliner',
    description: 'Aerial gondola transportation',
    tier: 1
  },
  'Boat': {
    emoji: '⛵',
    label: 'Boat Transport',
    description: 'Water transportation to parks',
    tier: 1
  },
  'Bus': {
    emoji: '🚌',
    label: 'Bus Transport',
    description: 'Disney bus transportation',
    tier: 2
  },
  'Walking': {
    emoji: '🚶',
    label: 'Walking Distance',
    description: 'Walking distance to park',
    tier: 1
  },
  
  // Resort Features
  'Beach': {
    emoji: '🏖️',
    label: 'Beach',
    description: 'Private beach access',
    tier: 1
  },
  'Marina': {
    emoji: '⚓',
    label: 'Marina',
    description: 'Marina with watercraft rentals',
    tier: 2
  },
  'Spa': {
    emoji: '💆',
    label: 'Spa',
    description: 'Full-service spa',
    tier: 2
  },
  'Golf': {
    emoji: '⛳',
    label: 'Golf',
    description: 'Golf course access',
    tier: 2
  },
  'Multiple Dining': {
    emoji: '🍽️',
    label: 'Multiple Dining',
    description: 'Multiple restaurants on-site',
    tier: 1
  },
  'Pool': {
    emoji: '🏊',
    label: 'Pool',
    description: 'Swimming pool facilities',
    tier: 1
  },
  'Water Slide': {
    emoji: '🌊',
    label: 'Water Slide',
    description: 'Pool with water slides',
    tier: 1
  },
  'Lazy River': {
    emoji: '🏞️',
    label: 'Lazy River',
    description: 'Lazy river pool feature',
    tier: 1
  },
  'Fitness Center': {
    emoji: '💪',
    label: 'Fitness Center',
    description: 'Gym and fitness facilities',
    tier: 2
  },
  'Business Center': {
    emoji: '💼',
    label: 'Business Center',
    description: 'Business services available',
    tier: 2
  },
  
  // Special Accommodations
  'DVC': {
    emoji: '🏡',
    label: 'Disney Vacation Club',
    description: 'DVC villa accommodations',
    tier: 2
  },
  'Bungalows': {
    emoji: '🏨',
    label: 'Bungalows',
    description: 'Overwater or private bungalows',
    tier: 1
  },
  'Cabins': {
    emoji: '🏘️',
    label: 'Cabins',
    description: 'Cabin-style accommodations',
    tier: 1
  },
  'Villas': {
    emoji: '🏘️',
    label: 'Villas',
    description: 'Villa accommodations',
    tier: 2
  },
  'Suites': {
    emoji: '🛏️',
    label: 'Suites',
    description: 'Suite accommodations available',
    tier: 2
  },
  'Island Tower': {
    emoji: '🗼',
    label: 'Island Tower',
    description: 'New Island Tower accommodations',
    tier: 2
  },
  'Campgrounds': {
    emoji: '🏕️',
    label: 'Campgrounds',
    description: 'RV and camping sites',
    tier: 1
  }
};

/**
 * Get active icons for an attraction based on its features
 */
export function getAttractionIcons(features?: AttractionFeatures, tier?: 1 | 2): WaypointIcon[] {
  if (!features) return [];

  const activeIcons: WaypointIcon[] = [];
  const lightningLaneIcons: WaypointIcon[] = [];

  // Check each feature flag and add corresponding icon
  (Object.keys(features) as Array<keyof AttractionFeatures>).forEach(key => {
    if (features[key] === true) {
      const icon = ATTRACTION_ICONS[key];
      if (!tier || icon.tier === tier) {
        // Prioritize Lightning Lane icons (both Multi Pass and Single Pass)
        if (key === 'hasLightningLane' || key === 'hasIndividualLL') {
          lightningLaneIcons.push(icon);
        } else {
          activeIcons.push(icon);
        }
      }
    }
  });

  // Sort Lightning Lane icons: Single Pass first, then Multi Pass
  const sortedLightningLaneIcons = lightningLaneIcons.sort((a, b) => {
    const aKey = Object.keys(ATTRACTION_ICONS).find(key => ATTRACTION_ICONS[key as keyof typeof ATTRACTION_ICONS] === a);
    const bKey = Object.keys(ATTRACTION_ICONS).find(key => ATTRACTION_ICONS[key as keyof typeof ATTRACTION_ICONS] === b);
    
    if (aKey === 'hasIndividualLL') return -1; // Single Pass first
    if (bKey === 'hasIndividualLL') return 1;  // Single Pass first
    return 0; // Maintain order for others
  });

  // Lightning Lane icons first, then other icons
  return [...sortedLightningLaneIcons, ...activeIcons];
}

/**
 * Get icons for EAT items based on their features and properties
 */
export function getEatIcons(
  features?: string[], 
  adrRequired?: boolean, 
  mobileOrderAvailable?: boolean,
  alcoholServed?: boolean,
  allergyFriendly?: string[],
  tier?: 1 | 2
): WaypointIcon[] {
  const activeIcons: WaypointIcon[] = [];

  // Add ADR required icon
  if (adrRequired) {
    const icon = EAT_ICONS['adr-required'];
    if (!tier || icon.tier === tier) {
      activeIcons.push(icon);
    }
  }

  // Add mobile order icon
  if (mobileOrderAvailable) {
    const icon = EAT_ICONS['mobile-order'];
    if (!tier || icon.tier === tier) {
      activeIcons.push(icon);
    }
  }

  // Add alcohol icon
  if (alcoholServed) {
    const icon = EAT_ICONS['alcohol'];
    if (!tier || icon.tier === tier) {
      activeIcons.push(icon);
    }
  }

  // Add feature-based icons
  if (features) {
    features.forEach(feature => {
      const icon = EAT_ICONS[feature];
      if (icon && (!tier || icon.tier === tier)) {
        activeIcons.push(icon);
      }
    });
  }

  // Add allergy-friendly icons
  if (allergyFriendly) {
    allergyFriendly.forEach(allergy => {
      const icon = EAT_ICONS[allergy];
      if (icon && (!tier || icon.tier === tier)) {
        activeIcons.push(icon);
      }
    });
  }

  return activeIcons;
}

/**
 * Get icons for STAY items based on their amenities
 */
export function getStayIcons(amenities?: string[], tier?: 1 | 2): WaypointIcon[] {
  if (!amenities) return [];

  const activeIcons: WaypointIcon[] = [];

  amenities.forEach(amenity => {
    const icon = STAY_ICONS[amenity];
    if (icon && (!tier || icon.tier === tier)) {
      activeIcons.push(icon);
    }
  });

  return activeIcons;
}

/**
 * Universal function to get icons for any waypoint type
 */
export function getWaypointIcons(
  waypoint: {
    category?: string;
    features?: any;
    amenities?: string[];
    adrRequired?: boolean;
    mobileOrderAvailable?: boolean;
    alcoholServed?: boolean;
    allergyFriendly?: string[];
  },
  tier?: 1 | 2
): WaypointIcon[] {
  const category = waypoint.category?.toLowerCase();

  if (category === 'do' && waypoint.features) {
    // Handle both array and object formats for DO items
    if (Array.isArray(waypoint.features)) {
      // Convert old array format to structured format
      const structuredFeatures: Partial<AttractionFeatures> = {};
      waypoint.features.forEach((feature: string) => {
        // Map old string features to new boolean properties
        switch (feature) {
          case 'dark': structuredFeatures.isDarkRide = true; break;
          case 'wet': structuredFeatures.getsWet = true; break;
          case 'scary': structuredFeatures.isScary = true; break;
          case 'interactive': structuredFeatures.isInteractive = true; break;
          case 'spinning': structuredFeatures.isSpinning = true; break;
          case 'water': structuredFeatures.isWaterRide = true; break;
          case 'photos': structuredFeatures.hasPhotos = true; break;
          case 'characters': structuredFeatures.hasCharacters = true; break;
          case 'lightning-lane': structuredFeatures.hasLightningLane = true; break;
          case 'rain-safe': structuredFeatures.isRainSafe = true; break;
          case 'air-conditioning': structuredFeatures.hasAirConditioning = true; break;
          case 'loud': structuredFeatures.isLoud = true; break;
          case 'big-drops': structuredFeatures.hasBigDrops = true; break;
          case 'launch': structuredFeatures.hasLaunch = true; break;
          case 'strobes': structuredFeatures.hasStrobes = true; break;
        }
      });
      return getAttractionIcons(structuredFeatures as AttractionFeatures, tier);
    } else {
      // New structured format
      return getAttractionIcons(waypoint.features as AttractionFeatures, tier);
    }
  } else if (category === 'eat') {
    const eatFeatures = waypoint.features as any;
    if (!eatFeatures) return [];

    // Handle both array and object formats for EAT items
    if (Array.isArray(eatFeatures)) {
      // Old array format - use directly
      return getEatIcons(
        eatFeatures,
        waypoint.adrRequired,
        waypoint.mobileOrderAvailable,
        waypoint.alcoholServed,
        waypoint.allergyFriendly,
        tier
      );
    } else {
      // New structured format - extract feature flags
      const featuresArray: string[] = [];
      if (eatFeatures.indoorSeating) featuresArray.push('indoor-seating');
      if (eatFeatures.outdoorSeating) featuresArray.push('outdoor-seating');
      if (eatFeatures.upstairsDining) featuresArray.push('upstairs-dining');
      if (eatFeatures.entertainment) featuresArray.push('entertainment');
      if (eatFeatures.castleViews) featuresArray.push('castle-views');
      if (eatFeatures.toppingsBar) featuresArray.push('toppings-bar');
      if (eatFeatures.themed) featuresArray.push('themed');
      if (eatFeatures.characterDining) featuresArray.push('character-dining');
      
      // Extract dietary options
      const allergyOptions = [];
      if (eatFeatures.vegetarianOptions) allergyOptions.push('vegetarian');
      if (eatFeatures.veganOptions) allergyOptions.push('vegan');
      if (eatFeatures.glutenFreeOptions) allergyOptions.push('gluten-free');

      return getEatIcons(
        featuresArray,
        eatFeatures.adrRequired,
        eatFeatures.mobileOrder,
        eatFeatures.alcoholServed,
        allergyOptions.length > 0 ? allergyOptions : undefined,
        tier
      );
    }
  } else if (category === 'stay') {
    // STAY item - extract amenities from structured features
    return getStayIcons(waypoint.amenities, tier);
  }

  return [];
}

/**
 * Get tier 1 (essential) icons only - Legacy function for DO items
 */
export function getTier1Icons(features?: AttractionFeatures): WaypointIcon[] {
  return getAttractionIcons(features, 1);
}

/**
 * Get tier 2 (enhanced) icons only - Legacy function for DO items
 */
export function getTier2Icons(features?: AttractionFeatures): WaypointIcon[] {
  return getAttractionIcons(features, 2);
}

/**
 * Check if attraction has any tier 1 icons - Legacy function for DO items
 */
export function hasTier1Icons(features?: AttractionFeatures): boolean {
  return getTier1Icons(features).length > 0;
}

/**
 * Check if attraction has any tier 2 icons - Legacy function for DO items
 */
export function hasTier2Icons(features?: AttractionFeatures): boolean {
  return getTier2Icons(features).length > 0;
}

/**
 * Universal tier 1 icons for any waypoint type
 */
export function getWaypointTier1Icons(waypoint: {
  category?: string;
  features?: AttractionFeatures | string[];
  amenities?: string[];
  adrRequired?: boolean;
  mobileOrderAvailable?: boolean;
  alcoholServed?: boolean;
  allergyFriendly?: string[];
}): WaypointIcon[] {
  return getWaypointIcons(waypoint, 1);
}

/**
 * Universal tier 2 icons for any waypoint type
 */
export function getWaypointTier2Icons(waypoint: {
  category?: string;
  features?: AttractionFeatures | string[];
  amenities?: string[];
  adrRequired?: boolean;
  mobileOrderAvailable?: boolean;
  alcoholServed?: boolean;
  allergyFriendly?: string[];
}): WaypointIcon[] {
  return getWaypointIcons(waypoint, 2);
}