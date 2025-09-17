import type {
  ActivityRating,
  ActivityRatingSummary,
  DoItem,
  EatItem,
  ConsensusLevel,
  PreferenceType,
  Trip,
  TripDay
} from '../types';
import { PARKS, getParkById } from '../data/parks';
import { getAllDoItems, getAllEatItems, type TravelingPartyMember } from '@waylight/shared';
import { detectDayType } from '../utils/dayTypeUtils';

export interface ParkRatingSummary {
  parkId: string;
  parkName: string;
  parkIcon: string;
  totalAttractions: number;
  ratedAttractions: number;
  averageRating: number;
  mustDoCount: number;
  avoidCount: number;
  consensusScore: number; // 0-1, higher = more agreement
  conflictCount: number;
  topAttractions: AttractionInsight[];
  recommendedDays: number;
  priorityScore: number; // Overall priority ranking
}

export interface AttractionInsight {
  attractionId: string;
  attractionName: string;
  averageRating: number;
  mustDoCount: number;
  avoidCount: number;
  consensusLevel: ConsensusLevel;
  individualRatings: { memberName: string; rating: number; preferenceType: PreferenceType }[];
  hasConflicts: boolean;
  heightConcerns: number;
  intensityConcerns: number;
  efficiencyScore?: number;
  timeBudgetMinutes?: number;
  lightningLaneStrategy?: 'multipass' | 'singlepass' | 'standby';
}

export interface AttractionEfficiency {
  attractionId: string;
  attractionName: string;
  parkId: string;
  efficiencyScore: number;
  timeBudgetMinutes: number;
  baseDifficulty: number;
  crowdImpact: number;
  lightningLaneStrategy: 'multipass' | 'singlepass' | 'standby';
  userPriorityWeight: number;
  recommendedStrategy: string;
}

export interface ConflictAnalysis {
  attractionId: string;
  attractionName: string;
  parkId: string;
  parkName: string;
  conflictType: 'rating' | 'preference' | 'height' | 'intensity';
  conflictingMembers: { memberName: string; issue: string }[];
  suggestedResolution: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TripRecommendations {
  parkPriorityOrder: { parkId: string; parkName: string; reason: string }[];
  suggestedParkDays: { parkId: string; days: number; justification: string }[];
  mustDoByPark: { parkId: string; attractions: string[] }[];
  lightningLanePriorities: { parkId: string; attractions: string[] }[];
  ropDropTargets: { parkId: string; attractions: string[] }[];
  compromiseStrategies: string[];
}

export class ParkRatingAnalytics {
  /**
   * Calculate available park days based on trip structure and day types
   */
  static calculateAvailableParkDays(trip: Trip): number {
    if (!trip.days || trip.days.length === 0) {
      // Fallback: total days minus first (arrival) and last (departure)
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      // Calculate the number of days between dates (inclusive)
      const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return Math.max(1, totalDays - 2);
    }

    // Count park days using both explicit day types and auto-detection
    const parkDays = trip.days.filter((day, index) => {
      // Use explicit day type if set, otherwise use auto-detection
      const effectiveDayType = day.dayType || detectDayType(day, trip, index);
      return effectiveDayType === 'park-day' || effectiveDayType === 'park-hopper';
    }).length;

    return Math.max(1, parkDays);
  }

  /**
   * Generate attraction efficiency data for all parks
   */
  static generateAttractionEfficiencies(
    ratings: ActivityRating[],
    summaries: ActivityRatingSummary[],
    partyMembers: TravelingPartyMember[]
  ): Map<string, AttractionEfficiency[]> {
    const allAttractions = [...getAllDoItems(), ...getAllEatItems()];
    const efficiencyMap = new Map<string, AttractionEfficiency[]>();

    for (const park of PARKS) {
      const parkAttractions = allAttractions.filter(attraction => attraction.parkId === park.id);
      const attractionSummaries = summaries.filter(summary => {
        const attraction = allAttractions.find(a => a.id === summary.attractionId);
        return attraction?.parkId === park.id;
      });

      const parkEfficiencies = parkAttractions.map(attraction => {
        const attractionRatings = ratings.filter(r => r.attractionId === attraction.id);
        const attractionSummary = attractionSummaries.find(s => s.attractionId === attraction.id);
        return this.calculateAttractionEfficiency(attraction, attractionSummary, partyMembers, attractionRatings);
      });

      efficiencyMap.set(park.id, parkEfficiencies);
    }

    return efficiencyMap;
  }

  /**
   * Generate comprehensive park rating summaries
   */
  static generateParkSummaries(
    ratings: ActivityRating[],
    summaries: ActivityRatingSummary[],
    partyMembers: TravelingPartyMember[],
    trip: Trip
  ): ParkRatingSummary[] {
    const allAttractions = [...getAllDoItems(), ...getAllEatItems()];

    // Calculate available park days
    const availableParkDays = this.calculateAvailableParkDays(trip);

    // First pass: Calculate park requirements for all parks
    const parkRequirements = PARKS.map(park => {
      const parkAttractions = allAttractions.filter(attraction => attraction.parkId === park.id);
      const attractionSummaries = summaries.filter(summary => {
        const attraction = allAttractions.find(a => a.id === summary.attractionId);
        return attraction?.parkId === park.id;
      });

      // Calculate attraction efficiencies for this park
      const attractionEfficiencies = parkAttractions.map(attraction => {
        const attractionRatings = ratings.filter(r => r.attractionId === attraction.id);
        const attractionSummary = attractionSummaries.find(s => s.attractionId === attraction.id);
        return this.calculateAttractionEfficiency(attraction, attractionSummary, partyMembers, attractionRatings);
      });

      const requirement = this.calculateParkTimeRequirement(attractionEfficiencies);
      return {
        parkId: park.id,
        ...requirement
      };
    });

    // Distribute available days across parks optimally
    const dayAllocations = this.distributeParkDays(parkRequirements, availableParkDays);

    // Second pass: Generate park summaries with allocated days
    return PARKS.map(park => {
      const parkAttractions = allAttractions.filter(attraction => attraction.parkId === park.id);
      const parkSummaries = summaries.filter(summary => {
        const attraction = allAttractions.find(a => a.id === summary.attractionId);
        return attraction?.parkId === park.id;
      });

      const ratedCount = parkSummaries.length;
      const avgRating = ratedCount > 0
        ? parkSummaries.reduce((sum, s) => sum + (s.averageRating || 0), 0) / ratedCount
        : 0;

      const mustDoCount = parkSummaries.reduce((sum, s) => sum + s.mustDoCount, 0);
      const avoidCount = parkSummaries.reduce((sum, s) => sum + s.avoidCount, 0);
      const conflictCount = parkSummaries.filter(s => s.consensusLevel === 'conflict').length;

      // Calculate consensus score (higher = better agreement)
      const consensusScore = ratedCount > 0
        ? parkSummaries.reduce((sum, s) => {
            const consensusValue = {
              'high': 1.0,
              'medium': 0.7,
              'low': 0.4,
              'conflict': 0.0
            }[s.consensusLevel || 'medium'];
            return sum + consensusValue;
          }, 0) / ratedCount
        : 0;

      // Calculate attraction efficiencies for this park for comprehensive analysis
      const parkAttractionEfficiencies = parkAttractions.map(attraction => {
        const attractionRatings = ratings.filter(r => r.attractionId === attraction.id);
        const attractionSummary = parkSummaries.find(s => s.attractionId === attraction.id);
        return this.calculateAttractionEfficiency(attraction, attractionSummary, partyMembers, attractionRatings);
      });

      // Get comprehensive attractions list for this park with efficiency data
      const allParkAttractions = this.getComprehensiveAttractions(
        park.id,
        parkSummaries,
        ratings,
        partyMembers,
        allAttractions,
        parkAttractionEfficiencies
      );

      // Get the allocated days for this park
      const allocation = dayAllocations.find(a => a.parkId === park.id);
      const recommendedDays = allocation?.allocatedDays || 0;

      // Calculate overall priority score
      const priorityScore = this.calculateParkPriority(mustDoCount, avgRating, consensusScore, recommendedDays);

      return {
        parkId: park.id,
        parkName: park.name,
        parkIcon: park.icon,
        totalAttractions: parkAttractions.length,
        ratedAttractions: ratedCount,
        averageRating: avgRating,
        mustDoCount,
        avoidCount,
        consensusScore,
        conflictCount,
        topAttractions: allParkAttractions,
        recommendedDays,
        priorityScore
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Identify rating conflicts and generate resolution suggestions
   */
  static identifyConflicts(
    ratings: ActivityRating[],
    summaries: ActivityRatingSummary[],
    partyMembers: TravelingPartyMember[]
  ): ConflictAnalysis[] {
    const allAttractions = [...getAllDoItems(), ...getAllEatItems()];
    const conflicts: ConflictAnalysis[] = [];

    summaries.forEach(summary => {
      const attraction = allAttractions.find(a => a.id === summary.attractionId);
      if (!attraction) return;

      const park = getParkById(attraction.parkId);
      if (!park) return;

      const attractionRatings = ratings.filter(r => r.attractionId === summary.attractionId);

      // Check for rating conflicts (large spread in ratings)
      if (summary.consensusLevel === 'conflict') {
        const ratingSpread = this.calculateRatingSpread(attractionRatings);
        if (ratingSpread >= 3) {
          const conflictingMembers = attractionRatings.map(rating => {
            const member = partyMembers.find(m => m.id === rating.partyMemberId);
            return {
              memberName: member?.name || 'Unknown',
              issue: `Rated ${rating.rating}/5 (${rating.preferenceType || 'neutral'})`
            };
          });

          conflicts.push({
            attractionId: attraction.id,
            attractionName: attraction.name,
            parkId: attraction.parkId,
            parkName: park.name,
            conflictType: 'rating',
            conflictingMembers,
            suggestedResolution: this.generateRatingResolution(attractionRatings, attraction),
            severity: ratingSpread >= 4 ? 'high' : 'medium'
          });
        }
      }

      // Check for height restriction conflicts
      if (summary.heightRestrictedCount > 0 && summary.heightRestrictedCount < attractionRatings.length) {
        const heightConflicts = attractionRatings
          .filter(r => !r.heightRestrictionOk)
          .map(rating => {
            const member = partyMembers.find(m => m.id === rating.partyMemberId);
            return {
              memberName: member?.name || 'Unknown',
              issue: 'Height restriction concern'
            };
          });

        if (heightConflicts.length > 0) {
          conflicts.push({
            attractionId: attraction.id,
            attractionName: attraction.name,
            parkId: attraction.parkId,
            parkName: park.name,
            conflictType: 'height',
            conflictingMembers: heightConflicts,
            suggestedResolution: `Consider child swap options or alternative activities for affected family members`,
            severity: 'medium'
          });
        }
      }

      // Check for intensity conflicts
      if (summary.intensityConcernsCount > 0 && summary.intensityConcernsCount < attractionRatings.length) {
        const intensityConflicts = attractionRatings
          .filter(r => !r.intensityComfortable)
          .map(rating => {
            const member = partyMembers.find(m => m.id === rating.partyMemberId);
            return {
              memberName: member?.name || 'Unknown',
              issue: 'Intensity too high'
            };
          });

        if (intensityConflicts.length > 0) {
          conflicts.push({
            attractionId: attraction.id,
            attractionName: attraction.name,
            parkId: attraction.parkId,
            parkName: park.name,
            conflictType: 'intensity',
            conflictingMembers: intensityConflicts,
            suggestedResolution: `Consider milder alternatives or skip for sensitive family members`,
            severity: 'low'
          });
        }
      }
    });

    return conflicts.sort((a, b) => {
      const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Generate trip planning recommendations
   */
  static generateRecommendations(
    parkSummaries: ParkRatingSummary[],
    conflicts: ConflictAnalysis[],
    trip: Trip,
    attractionEfficiencies?: Map<string, AttractionEfficiency[]> // parkId -> attractions
  ): TripRecommendations {
    // Park priority order based on efficiency and allocated days
    const parkPriorityOrder = parkSummaries
      .filter(park => park.recommendedDays > 0)
      .sort((a, b) => b.recommendedDays - a.recommendedDays || b.mustDoCount - a.mustDoCount)
      .map(park => ({
        parkId: park.parkId,
        parkName: park.parkName,
        reason: `${park.recommendedDays} day${park.recommendedDays !== 1 ? 's' : ''} allocated - ${park.mustDoCount} must-do attractions`
      }));

    // Get suggested park days from the existing allocation (already computed in generateParkSummaries)
    const suggestedParkDays = parkSummaries.map(park => ({
      parkId: park.parkId,
      days: park.recommendedDays,
      justification: park.recommendedDays === 0
        ? 'No significant interest detected'
        : park.mustDoCount > 8
        ? `${park.recommendedDays} day${park.recommendedDays !== 1 ? 's' : ''} needed for ${park.mustDoCount} must-do attractions`
        : park.averageRating > 4
        ? `${park.recommendedDays} day${park.recommendedDays !== 1 ? 's' : ''} for high-rated experiences (${park.averageRating.toFixed(1)}★)`
        : `${park.recommendedDays} day${park.recommendedDays !== 1 ? 's' : ''} for efficient coverage`
    }));

    // Must-do attractions by park
    const mustDoByPark = parkSummaries.map(park => ({
      parkId: park.parkId,
      attractions: park.topAttractions
        .filter(a => a.mustDoCount > 0)
        .slice(0, 3)
        .map(a => a.attractionName)
    }));

    // Enhanced Lightning Lane priorities using efficiency data
    const lightningLanePriorities = parkSummaries.map(park => {
      const parkEfficiencies = attractionEfficiencies?.get(park.parkId) || [];

      if (parkEfficiencies.length > 0) {
        // Use efficiency data for better Lightning Lane recommendations
        const multiPassCandidates = parkEfficiencies
          .filter(eff => eff.lightningLaneStrategy === 'multipass' && eff.userPriorityWeight > 1.0)
          .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
          .slice(0, 5);

        const singlePassCandidates = parkEfficiencies
          .filter(eff => eff.lightningLaneStrategy === 'singlepass' && eff.userPriorityWeight > 1.3)
          .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
          .slice(0, 2);

        // Combine and prioritize
        const combined = [
          ...multiPassCandidates.map(eff => `${eff.attractionName} (MultiPass)`),
          ...singlePassCandidates.map(eff => `${eff.attractionName} (Single Pass - ${eff.recommendedStrategy})`)
        ];

        return {
          parkId: park.parkId,
          attractions: combined
        };
      } else {
        // Fallback to old logic if no efficiency data
        return {
          parkId: park.parkId,
          attractions: park.topAttractions
            .filter(a => a.mustDoCount > 0 && a.averageRating >= 4)
            .slice(0, 3)
            .map(a => a.attractionName)
        };
      }
    });

    // Rope drop targets (most popular must-dos)
    const ropDropTargets = parkSummaries.map(park => ({
      parkId: park.parkId,
      attractions: park.topAttractions
        .filter(a => a.mustDoCount >= 2)
        .slice(0, 2)
        .map(a => a.attractionName)
    }));

    // Compromise strategies for conflicts
    const compromiseStrategies = this.generateCompromiseStrategies(conflicts);

    return {
      parkPriorityOrder,
      suggestedParkDays,
      mustDoByPark,
      lightningLanePriorities,
      ropDropTargets,
      compromiseStrategies
    };
  }

  // Helper methods
  private static getTopAttractions(
    parkSummaries: ActivityRatingSummary[],
    ratings: ActivityRating[],
    partyMembers: TravelingPartyMember[],
    allAttractions: (DoItem | EatItem)[]
  ): AttractionInsight[] {
    return parkSummaries
      .map(summary => {
        const attraction = allAttractions.find(a => a.id === summary.attractionId);
        if (!attraction) return null;

        const attractionRatings = ratings.filter(r => r.attractionId === summary.attractionId);
        const individualRatings = attractionRatings.map(rating => {
          const member = partyMembers.find(m => m.id === rating.partyMemberId);
          return {
            memberName: member?.name || 'Unknown',
            rating: rating.rating,
            preferenceType: (rating.preferenceType || 'neutral') as PreferenceType
          };
        });

        return {
          attractionId: attraction.id,
          attractionName: attraction.name,
          averageRating: summary.averageRating || 0,
          mustDoCount: summary.mustDoCount,
          avoidCount: summary.avoidCount,
          consensusLevel: (summary.consensusLevel || 'medium') as ConsensusLevel,
          individualRatings,
          hasConflicts: summary.consensusLevel === 'conflict',
          heightConcerns: summary.heightRestrictedCount,
          intensityConcerns: summary.intensityConcernsCount
        };
      })
      .filter((item): item is AttractionInsight => item !== null)
      .sort((a, b) => {
        // Sort by must-do count first, then by average rating
        if (a.mustDoCount !== b.mustDoCount) {
          return b.mustDoCount - a.mustDoCount;
        }
        return b.averageRating - a.averageRating;
      });
  }

  /**
   * Get comprehensive attractions list with efficiency data and planning relevance
   */
  private static getComprehensiveAttractions(
    parkId: string,
    parkSummaries: ActivityRatingSummary[],
    ratings: ActivityRating[],
    partyMembers: TravelingPartyMember[],
    allAttractions: (DoItem | EatItem)[],
    attractionEfficiencies: AttractionEfficiency[]
  ): AttractionInsight[] {
    // Get all attractions for this park
    const parkAttractions = allAttractions.filter(attraction => attraction.parkId === parkId);

    return parkAttractions
      .map(attraction => {
        const summary = parkSummaries.find(s => s.attractionId === attraction.id);
        const efficiency = attractionEfficiencies.find(e => e.attractionId === attraction.id);

        // Get individual ratings
        const attractionRatings = ratings.filter(r => r.attractionId === attraction.id);
        const individualRatings = attractionRatings.map(rating => {
          const member = partyMembers.find(m => m.id === rating.partyMemberId);
          return {
            memberName: member?.name || 'Unknown',
            rating: rating.rating,
            preferenceType: (rating.preferenceType || 'neutral') as PreferenceType
          };
        });

        // Determine if this attraction should be included in planning
        const hasRatings = attractionRatings.length > 0;
        const hasLightningLane = 'lightningLane' in attraction ? attraction.lightningLane : false;
        const isPopular = hasLightningLane; // Lightning Lane attractions are typically popular
        const shouldInclude = hasRatings || isPopular;

        if (!shouldInclude) return null;

        return {
          attractionId: attraction.id,
          attractionName: attraction.name,
          averageRating: summary?.averageRating || 0,
          mustDoCount: summary?.mustDoCount || 0,
          avoidCount: summary?.avoidCount || 0,
          consensusLevel: (summary?.consensusLevel || 'medium') as ConsensusLevel,
          individualRatings,
          hasConflicts: summary?.consensusLevel === 'conflict',
          heightConcerns: summary?.heightRestrictedCount || 0,
          intensityConcerns: summary?.intensityConcernsCount || 0,
          efficiencyScore: efficiency?.efficiencyScore,
          timeBudgetMinutes: efficiency?.timeBudgetMinutes,
          lightningLaneStrategy: efficiency?.lightningLaneStrategy
        };
      })
      .filter((item): item is AttractionInsight => item !== null)
      .sort((a, b) => {
        // 1. Must-do attractions first (by must-do count)
        if (a.mustDoCount !== b.mustDoCount) {
          return b.mustDoCount - a.mustDoCount;
        }

        // 2. Sort by average rating (highest first)
        if (a.averageRating !== b.averageRating) {
          return b.averageRating - a.averageRating;
        }

        // 3. For same rating, sort by consensus level (high > medium > low > conflict)
        const consensusOrder = { 'high': 4, 'medium': 3, 'low': 2, 'conflict': 1 };
        const aConsensus = consensusOrder[a.consensusLevel] || 0;
        const bConsensus = consensusOrder[b.consensusLevel] || 0;

        return bConsensus - aConsensus;
      });
  }

  private static calculateAttractionEfficiency(
    attraction: DoItem | EatItem,
    summary: ActivityRatingSummary | undefined,
    partyMembers: TravelingPartyMember[],
    ratings: ActivityRating[]
  ): AttractionEfficiency {
    // Base difficulty factors
    const duration = 'duration' in attraction ? attraction.duration : 30; // Default 30 min for dining
    const hasLightningLane = 'lightningLane' in attraction ? attraction.lightningLane : false;

    // Check for Lightning Lane options in features object
    const features = 'features' in attraction ? attraction.features : null;
    const hasMultiPass = features?.multiPass || false;
    const hasSinglePass = features?.singlePass || false;

    // Lightning Lane strategy
    let lightningLaneStrategy: 'multipass' | 'singlepass' | 'standby' = 'standby';
    if (hasMultiPass) lightningLaneStrategy = 'multipass';
    else if (hasSinglePass) lightningLaneStrategy = 'singlepass';

    // Base difficulty (higher = more difficult/time consuming)
    let baseDifficulty = 1.0;

    // Factor in duration (longer rides = higher difficulty)
    baseDifficulty += Math.min(duration / 60, 2.0); // Cap at 2 hours

    // Factor in popularity (attractions without LL tend to have shorter waits)
    if (hasLightningLane) baseDifficulty += 0.5; // LL attractions are typically more popular

    // Factor in intensity for family considerations
    if ('intensity' in attraction) {
      const intensityMap = { low: 0, moderate: 0.2, high: 0.4, extreme: 0.6 };
      baseDifficulty += intensityMap[attraction.intensity] || 0;
    }

    // Crowd impact factor (simplified - in real implementation would use live data)
    let crowdImpact = 1.0;
    if (hasLightningLane) crowdImpact += 0.3; // Popular attractions have higher crowd impact
    if (hasSinglePass) crowdImpact += 0.5; // Single Pass attractions are very popular

    // User priority weight based on ratings and preferences
    let userPriorityWeight = 0.5; // Default neutral
    if (summary) {
      const avgRating = summary.averageRating || 0;
      const mustDoWeight = summary.mustDoCount / Math.max(partyMembers.length, 1);
      const avoidWeight = summary.avoidCount / Math.max(partyMembers.length, 1);

      // Higher ratings and must-do votes increase priority
      userPriorityWeight = (avgRating / 5.0) + mustDoWeight - avoidWeight;
      userPriorityWeight = Math.max(0.1, Math.min(2.0, userPriorityWeight)); // Clamp between 0.1 and 2.0
    }

    // Time budget calculation (minutes needed including wait)
    let timeBudgetMinutes = duration;

    // Adjust for Lightning Lane strategy
    if (lightningLaneStrategy === 'multipass') {
      timeBudgetMinutes = duration + 10; // Minimal wait with MultiPass
    } else if (lightningLaneStrategy === 'singlepass') {
      timeBudgetMinutes = duration + 15; // Short wait with Single Pass
    } else {
      // Estimate standby time based on crowd impact
      const estimatedWait = crowdImpact * 45; // Base 45min wait for popular attractions
      timeBudgetMinutes = duration + estimatedWait;
    }

    // Efficiency score: user priority per time investment, adjusted for difficulty
    const efficiencyScore = (userPriorityWeight * 100) / (timeBudgetMinutes * baseDifficulty * crowdImpact);

    // Recommended strategy
    let recommendedStrategy = 'Experience during standby';
    if (lightningLaneStrategy === 'multipass' && userPriorityWeight > 1.0) {
      recommendedStrategy = 'High priority - use MultiPass';
    } else if (lightningLaneStrategy === 'singlepass' && userPriorityWeight > 1.5) {
      recommendedStrategy = 'Consider Single Pass if budget allows';
    } else if (timeBudgetMinutes > 90) {
      recommendedStrategy = 'Visit during low crowd times';
    }

    return {
      attractionId: attraction.id,
      attractionName: attraction.name,
      parkId: attraction.parkId,
      efficiencyScore,
      timeBudgetMinutes,
      baseDifficulty,
      crowdImpact,
      lightningLaneStrategy,
      userPriorityWeight,
      recommendedStrategy
    };
  }

  private static calculateParkTimeRequirement(
    parkAttractions: AttractionEfficiency[]
  ): { minDays: number; priorityScore: number; efficiency: number } {
    // Filter for attractions that the party actually wants to do
    const priorityAttractions = parkAttractions.filter(a => a.userPriorityWeight > 0.7);

    if (priorityAttractions.length === 0) {
      return { minDays: 0, priorityScore: 0, efficiency: 0 };
    }

    // Calculate total time needed for priority attractions
    const totalTimeNeeded = priorityAttractions.reduce((sum, attr) => sum + attr.timeBudgetMinutes, 0);
    const avgEfficiency = priorityAttractions.reduce((sum, attr) => sum + attr.efficiencyScore, 0) / priorityAttractions.length;

    // Calculate priority score based on efficiency and must-do weight
    const priorityScore = priorityAttractions.reduce((sum, attr) => {
      return sum + (attr.userPriorityWeight * attr.efficiencyScore);
    }, 0);

    // Assume 8 hours effective park time per day (480 minutes)
    // Account for meals, breaks, travel time (reduce by 25%)
    const effectiveMinutesPerDay = 480 * 0.75;

    // Calculate minimum days needed
    const minDays = Math.max(1, Math.ceil(totalTimeNeeded / effectiveMinutesPerDay));

    return { minDays, priorityScore, efficiency: avgEfficiency };
  }

  private static distributeParkDays(
    parkRequirements: Array<{
      parkId: string;
      minDays: number;
      priorityScore: number;
      efficiency: number;
    }>,
    availableParkDays: number
  ): Array<{ parkId: string; allocatedDays: number; justification: string }> {
    // Filter out parks with no interest
    const interestedParks = parkRequirements.filter(park => park.priorityScore > 0);

    if (interestedParks.length === 0) {
      // No interested parks, return zero allocations
      return parkRequirements.map(park => ({
        parkId: park.parkId,
        allocatedDays: 0,
        justification: 'No significant interest detected'
      }));
    }

    // Step 1: Ensure we have at least 1 day per interested park
    const minimalDays = interestedParks.length; // 1 day per interested park

    if (minimalDays > availableParkDays) {
      // Not enough days even for 1 day per park - distribute fractionally
      const daysPerPark = availableParkDays / interestedParks.length;
      return parkRequirements.map(park => {
        const isInterested = interestedParks.find(p => p.parkId === park.parkId);
        if (!isInterested) {
          return {
            parkId: park.parkId,
            allocatedDays: 0,
            justification: 'No significant interest detected'
          };
        }
        return {
          parkId: park.parkId,
          allocatedDays: Math.max(0.5, Math.round(daysPerPark * 2) / 2), // Round to nearest 0.5
          justification: 'Limited time - consider park hopper'
        };
      });
    }

    // Step 2: Start with 1 day per interested park
    const allocations = parkRequirements.map(park => {
      const isInterested = interestedParks.find(p => p.parkId === park.parkId);
      return {
        parkId: park.parkId,
        allocatedDays: isInterested ? 1 : 0,
        baseRequirement: park.minDays,
        priorityScore: park.priorityScore,
        efficiency: park.efficiency,
        justification: isInterested ? '1 day baseline' : 'No significant interest detected'
      };
    });

    // Step 3: Distribute remaining days (availableParkDays - minimalDays)
    let remainingDays = availableParkDays - minimalDays;

    while (remainingDays > 0) {
      // Find the park that would benefit most from an additional day
      let bestPark = null;
      let bestBenefit = 0;

      for (const allocation of allocations) {
        if (allocation.priorityScore === 0) continue; // Skip parks with no interest

        // Calculate benefit of adding one more day
        // Higher benefit for parks that are under-allocated relative to their needs
        const underAllocationRatio = allocation.baseRequirement / Math.max(allocation.allocatedDays, 1);
        const benefit = allocation.priorityScore * allocation.efficiency * underAllocationRatio;

        if (benefit > bestBenefit) {
          bestBenefit = benefit;
          bestPark = allocation;
        }
      }

      if (bestPark) {
        bestPark.allocatedDays += 1;
        bestPark.justification = `${bestPark.allocatedDays} day${bestPark.allocatedDays !== 1 ? 's' : ''} optimized for priority attractions`;
        remainingDays -= 1;
      } else {
        break; // No more beneficial allocations
      }
    }

    return allocations.map(a => ({
      parkId: a.parkId,
      allocatedDays: a.allocatedDays,
      justification: a.justification
    }));
  }

  private static calculateParkPriority(
    mustDoCount: number,
    avgRating: number,
    consensusScore: number,
    recommendedDays: number
  ): number {
    return (mustDoCount * 0.4) + (avgRating * 0.3) + (consensusScore * 0.2) + (recommendedDays * 0.1);
  }

  private static calculateRatingSpread(ratings: ActivityRating[]): number {
    if (ratings.length === 0) return 0;
    const ratingValues = ratings.map(r => r.rating);
    return Math.max(...ratingValues) - Math.min(...ratingValues);
  }

  private static generateRatingResolution(ratings: ActivityRating[], attraction: DoItem | EatItem): string {
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    if (avgRating >= 3.5) {
      return `Try it - most of the group rates it well. Consider doing it early or late to minimize impact if some aren't interested.`;
    } else if (avgRating >= 2.5) {
      return `Optional activity - split up if needed. Those interested can do it while others explore nearby attractions.`;
    } else {
      return `Consider skipping - look for similar alternatives that might appeal to more family members.`;
    }
  }

  private static generateCompromiseStrategies(conflicts: ConflictAnalysis[]): string[] {
    const strategies = [];

    if (conflicts.some(c => c.conflictType === 'height')) {
      strategies.push("Use Disney's Child Swap service for height-restricted attractions");
      strategies.push("Plan companion activities nearby for those who can't ride (playgrounds, shops, character meets)");
    }

    if (conflicts.some(c => c.conflictType === 'intensity')) {
      strategies.push("Split the party: thrill-seekers do intense rides while others enjoy milder attractions");
      strategies.push("Use Single Rider lines for solo riders to experience attractions faster");
      strategies.push("Plan alternative activities for family members who prefer milder experiences");
    }

    if (conflicts.some(c => c.conflictType === 'rating')) {
      strategies.push("Party split strategy: Those interested experience the attraction while others explore nearby");
      strategies.push("Try disputed attractions during less busy times to minimize time investment");
      strategies.push("Use Single Rider lines to reduce wait times for controversial attractions");
      strategies.push("Designate 'choice time' where individuals can pursue personal must-dos");
    }

    if (conflicts.length > 5) {
      strategies.push("Focus morning energy on high-consensus attractions for group activities");
      strategies.push("Plan afternoon individual choice time where family members can split up");
      strategies.push("Use Mobile Order to stagger meal times and allow for flexible party splitting");
    }

    // General party management strategies
    const hasMultipleConflictTypes = new Set(conflicts.map(c => c.conflictType)).size > 1;
    if (hasMultipleConflictTypes) {
      strategies.push("Establish meeting points and times for party regrouping throughout the day");
      strategies.push("Use Disney's messaging features or family group chats to coordinate split activities");
      strategies.push("Plan 'together time' for shared experiences that everyone enjoys");
    }

    return strategies;
  }
}