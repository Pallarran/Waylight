import type { AttractionFeatures } from '@waylight/shared';

export interface AttractionIcon {
  emoji: string;
  label: string;
  description: string;
  tier: 1 | 2; // Tier 1 = essential, Tier 2 = enhanced
}

// Icon definitions with metadata
export const ATTRACTION_ICONS: Record<keyof AttractionFeatures, AttractionIcon> = {
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

/**
 * Get active icons for an attraction based on its features
 */
export function getAttractionIcons(features?: AttractionFeatures, tier?: 1 | 2): AttractionIcon[] {
  if (!features) return [];

  const activeIcons: AttractionIcon[] = [];
  const lightningLaneIcons: AttractionIcon[] = [];

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
 * Get tier 1 (essential) icons only
 */
export function getTier1Icons(features?: AttractionFeatures): AttractionIcon[] {
  return getAttractionIcons(features, 1);
}

/**
 * Get tier 2 (enhanced) icons only
 */
export function getTier2Icons(features?: AttractionFeatures): AttractionIcon[] {
  return getAttractionIcons(features, 2);
}

/**
 * Check if attraction has any tier 1 icons
 */
export function hasTier1Icons(features?: AttractionFeatures): boolean {
  return getTier1Icons(features).length > 0;
}

/**
 * Check if attraction has any tier 2 icons
 */
export function hasTier2Icons(features?: AttractionFeatures): boolean {
  return getTier2Icons(features).length > 0;
}