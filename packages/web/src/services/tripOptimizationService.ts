import { Trip, TripDay, ActivityRatingSummary } from '@waylight/shared';
import { crowdPredictionRepository } from '@waylight/shared';
import { DayType } from '../types';
import { detectDayType } from '../utils/dayTypeUtils';

export interface OptimizationConstraint {
  dayId: string;
  parkId: string;
  isLocked: boolean;
  reason?: string;
  dayType?: DayType;
  canOptimize?: boolean; // Whether this day type can be optimized
}

export interface OptimizationResult {
  originalAssignment: ParkAssignment[];
  optimizedAssignment: ParkAssignment[];
  improvementScore: number;
  totalCrowdReduction: number;
  strategy: OptimizationStrategy;
  confidence: number;
  reasoning: string[];
}

export interface ParkAssignment {
  dayId: string;
  parkId: string;
  date: string;
  crowdLevel?: number;
  score?: number;
}

export type OptimizationStrategy = 'crowd_minimization' | 'must_do_priority' | 'group_consensus' | 'energy_management';

export interface OptimizationOptions {
  strategy: OptimizationStrategy;
  constraints: OptimizationConstraint[];
  weights?: {
    crowdLevel: number;
    mustDoCount: number;
    groupConsensus: number;
    energyManagement: number;
  };
}

/**
 * Service for optimizing trip park assignments using various strategies
 */
export class TripOptimizationService {

  /**
   * Main optimization function that orchestrates the optimization process
   */
  async optimizeTrip(
    trip: Trip,
    activityRatings: ActivityRatingSummary[],
    options: OptimizationOptions
  ): Promise<OptimizationResult> {

    // Validate trip dates and structure
    this.validateTripStructure(trip);

    // Get crowd predictions for all days and parks
    const crowdData = await this.getCrowdDataForTrip(trip);

    // Generate original assignment
    const originalAssignment = this.createAssignmentFromTrip(trip, crowdData);

    // Apply optimization strategy
    let optimizedAssignment: ParkAssignment[];
    let reasoning: string[] = [];

    switch (options.strategy) {
      case 'crowd_minimization':
        const crowdResult = await this.optimizeForCrowds(originalAssignment, options.constraints, crowdData);
        optimizedAssignment = crowdResult.assignment;
        reasoning = crowdResult.reasoning;
        break;

      case 'must_do_priority':
        const mustDoResult = await this.optimizeForMustDos(originalAssignment, activityRatings, crowdData, options.constraints);
        optimizedAssignment = mustDoResult.assignment;
        reasoning = mustDoResult.reasoning;
        break;

      case 'group_consensus':
        const consensusResult = await this.optimizeForGroupConsensus(originalAssignment, activityRatings, crowdData, options.constraints);
        optimizedAssignment = consensusResult.assignment;
        reasoning = consensusResult.reasoning;
        break;

      case 'energy_management':
        const energyResult = await this.optimizeForEnergy(originalAssignment, crowdData, options.constraints);
        optimizedAssignment = energyResult.assignment;
        reasoning = energyResult.reasoning;
        break;

      default:
        optimizedAssignment = originalAssignment;
        reasoning = ['No optimization strategy applied'];
    }

    // Calculate improvement metrics
    const improvementScore = this.calculateImprovementScore(originalAssignment, optimizedAssignment);
    const totalCrowdReduction = this.calculateCrowdReduction(originalAssignment, optimizedAssignment);
    const confidence = this.calculateConfidenceScore(optimizedAssignment, options);

    return {
      originalAssignment,
      optimizedAssignment,
      improvementScore,
      totalCrowdReduction,
      strategy: options.strategy,
      confidence,
      reasoning
    };
  }

  /**
   * Validate trip structure and dates, detect day types
   */
  private validateTripStructure(trip: Trip): void {
    if (!trip.days || trip.days.length === 0) {
      throw new Error('Trip must have at least one day');
    }

    console.log('Validating trip structure:', {
      startDate: trip.startDate,
      endDate: trip.endDate,
      days: trip.days.map(d => ({ date: d.date, parkId: d.parkId, dayType: d.dayType }))
    });

    // Ensure all dates are within trip range and are unique
    const seenDates = new Set<string>();

    // Filter days to only include those within the trip date range
    const validDays = trip.days.filter(day => {
      // Normalize date to YYYY-MM-DD format
      const normalizedDate = day.date.split('T')[0]; // Remove time part if present

      // Check if date is within trip range (inclusive)
      const isWithinRange = normalizedDate >= trip.startDate && normalizedDate <= trip.endDate;

      if (!isWithinRange) {
        console.warn(`Excluding day ${normalizedDate} - outside trip range ${trip.startDate} to ${trip.endDate}`);
        return false;
      }

      // Check for duplicate dates
      if (seenDates.has(normalizedDate)) {
        console.warn(`Excluding duplicate date: ${normalizedDate}`);
        return false;
      }

      seenDates.add(normalizedDate);

      // Update the day date to normalized format to prevent timezone issues
      day.date = normalizedDate;

      return true;
    });

    // Update trip days to only include valid ones
    trip.days = validDays;

    // Sort days by date to maintain chronological order
    trip.days.sort((a, b) => a.date.localeCompare(b.date));

    // Detect day types for each day if not already set
    trip.days.forEach((day, index) => {
      if (!day.dayType) {
        day.dayType = detectDayType(day, trip, index);
      }
    });

    console.log('After validation and day type detection:', {
      validDays: trip.days.length,
      days: trip.days.map(d => ({ date: d.date, parkId: d.parkId, dayType: d.dayType }))
    });

    if (trip.days.length === 0) {
      throw new Error('No valid days found within trip date range');
    }
  }

  /**
   * Get crowd predictions for all days in the trip
   */
  private async getCrowdDataForTrip(trip: Trip): Promise<Map<string, Map<string, number>>> {
    const crowdData = new Map<string, Map<string, number>>();

    // Always use all Disney World parks for optimization to provide full recommendations
    // Include any currently assigned parks plus all major Disney World parks
    const currentParkIds = [...new Set(trip.days.map(day => day.parkId))]
      .filter(parkId => parkId && parkId !== 'undefined' && !parkId.includes('No park'));

    const allDisneyParks = ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom'];
    const parkIds = [...new Set([...currentParkIds, ...allDisneyParks])];

    console.log('Getting crowd data for optimization:', {
      currentParks: currentParkIds,
      allParks: parkIds
    });

    console.log('Getting crowd data for parks:', parkIds);
    console.log('Trip days:', trip.days.map(d => ({ date: d.date, parkId: d.parkId })));

    for (const parkId of parkIds) {
      const parkCrowdData = new Map<string, number>();

      // Only fetch crowd data for each park's assigned dates
      const datesForThisPark = trip.days
        .filter(day => day.parkId === parkId)
        .map(day => day.date);

      for (const date of datesForThisPark) {
        try {
          console.log(`Fetching crowd data for ${parkId} on ${date}`);
          const prediction = await crowdPredictionRepository.getCrowdPredictionForDate(parkId, date);
          if (prediction) {
            parkCrowdData.set(date, prediction.crowdLevel);
            console.log(`Found crowd level ${prediction.crowdLevel} for ${parkId} on ${date}`);
          } else {
            console.log(`No crowd data found for ${parkId} on ${date}, using default`);
            // Default to moderate crowd level if no data
            parkCrowdData.set(date, 5);
          }
        } catch (error) {
          console.warn(`Failed to get crowd data for ${parkId} on ${date}:`, error);
          parkCrowdData.set(date, 5); // Default fallback
        }
      }

      // Also get crowd data for all dates (for optimization possibilities)
      for (const day of trip.days) {
        if (!parkCrowdData.has(day.date)) {
          try {
            const prediction = await crowdPredictionRepository.getCrowdPredictionForDate(parkId, day.date);
            if (prediction) {
              parkCrowdData.set(day.date, prediction.crowdLevel);
            } else {
              parkCrowdData.set(day.date, 5);
            }
          } catch (error) {
            console.warn(`Failed to get crowd data for ${parkId} on ${day.date}:`, error);
            parkCrowdData.set(day.date, 5);
          }
        }
      }

      crowdData.set(parkId, parkCrowdData);
    }

    return crowdData;
  }

  /**
   * Create assignment objects from current trip state
   */
  private createAssignmentFromTrip(trip: Trip, crowdData: Map<string, Map<string, number>>): ParkAssignment[] {
    return trip.days.map(day => {
      const crowdLevel = crowdData.get(day.parkId)?.get(day.date) || 5;
      return {
        dayId: day.id,
        parkId: day.parkId,
        date: day.date,
        crowdLevel,
        score: 10 - crowdLevel // Higher score for lower crowds
      };
    });
  }

  /**
   * Optimize for minimum crowd exposure
   */
  private async optimizeForCrowds(
    assignments: ParkAssignment[],
    constraints: OptimizationConstraint[],
    crowdData: Map<string, Map<string, number>>
  ): Promise<{ assignment: ParkAssignment[]; reasoning: string[] }> {

    const lockedAssignments = constraints.filter(c => c.isLocked);
    const flexibleAssignments = assignments.filter(a => {
      const constraint = constraints.find(c => c.dayId === a.dayId);
      // Exclude locked assignments AND check-in/out days regardless of lock status
      return !constraint?.isLocked &&
             constraint?.dayType !== 'check-in' &&
             constraint?.dayType !== 'check-out';
    });

    // Get all available parks from crowd data (not just assigned ones) and dates
    const availableParks = Array.from(crowdData.keys()).filter(parkId =>
      parkId && parkId !== 'undefined' && !parkId.includes('No park')
    );
    const availableDates = assignments.map(a => a.date);

    console.log('Available parks for optimization:', availableParks);
    console.log('Flexible assignments to optimize:', flexibleAssignments.length);

    // Create matrix of park-date combinations with crowd levels
    const parkDateMatrix: { parkId: string; date: string; crowdLevel: number; dayId: string }[] = [];

    for (const assignment of flexibleAssignments) {
      for (const parkId of availableParks) {
        const crowdLevel = crowdData.get(parkId)?.get(assignment.date) || 5;
        parkDateMatrix.push({
          parkId,
          date: assignment.date,
          crowdLevel,
          dayId: assignment.dayId
        });
      }
    }

    // Sort by crowd level (ascending) to prioritize low-crowd combinations
    parkDateMatrix.sort((a, b) => a.crowdLevel - b.crowdLevel);

    // Assign parks to dates using greedy algorithm to minimize total crowds
    const optimizedFlexible: ParkAssignment[] = [];
    const usedParks = new Set<string>();
    const usedDates = new Set<string>();

    // First, handle all non-flexible assignments (locked + check-in/out days)
    const nonFlexibleAssignments = assignments.filter(a => {
      const constraint = constraints.find(c => c.dayId === a.dayId);
      return constraint?.isLocked ||
             constraint?.dayType === 'check-in' ||
             constraint?.dayType === 'check-out';
    });

    for (const nonFlexible of nonFlexibleAssignments) {
      usedDates.add(nonFlexible.date);
      // Note: we don't mark parks as used since parks can be visited multiple times
    }

    // Assign flexible days using a balanced approach that considers both crowd levels and park diversity
    const remainingDates = flexibleAssignments
      .filter(assignment => !usedDates.has(assignment.date))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically

    const parkUsageCount = new Map<string, number>();

    for (const assignment of remainingDates) {
      // Get all available park options for this date, sorted by crowd level
      const parkOptionsForDate = availableParks
        .map(parkId => ({
          parkId,
          crowdLevel: crowdData.get(parkId)?.get(assignment.date) || 5,
          date: assignment.date,
          dayId: assignment.dayId,
          usageCount: parkUsageCount.get(parkId) || 0
        }))
        .filter(option => {
          // Check if this would conflict with a non-flexible assignment
          const hasConflict = nonFlexibleAssignments.some(nonFlexible =>
            nonFlexible.parkId === option.parkId && nonFlexible.date === option.date
          );
          return !hasConflict;
        })
        // Sort by: 1) usage count (ascending), 2) crowd level (ascending) for diversity + optimization
        .sort((a, b) => {
          if (a.usageCount !== b.usageCount) {
            return a.usageCount - b.usageCount; // Prefer less used parks
          }
          return a.crowdLevel - b.crowdLevel; // Then prefer lower crowds
        });

      // Select the best park considering both diversity and crowd levels
      if (parkOptionsForDate.length > 0) {
        const selectedPark = parkOptionsForDate[0];
        optimizedFlexible.push({
          dayId: selectedPark.dayId,
          parkId: selectedPark.parkId,
          date: selectedPark.date,
          crowdLevel: selectedPark.crowdLevel,
          score: 10 - selectedPark.crowdLevel
        });

        // Track park usage for diversity
        parkUsageCount.set(selectedPark.parkId, (parkUsageCount.get(selectedPark.parkId) || 0) + 1);
        usedDates.add(assignment.date);
      }
    }

    // Combine non-flexible and optimized assignments
    const finalAssignment = [...nonFlexibleAssignments, ...optimizedFlexible]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Ensure we have assignments for all days
    if (finalAssignment.length !== assignments.length) {
      console.warn('Optimization incomplete - some days may not have assignments');
    }

    const avgOriginalCrowd = assignments.reduce((sum, a) => sum + (a.crowdLevel || 5), 0) / assignments.length;
    const avgOptimizedCrowd = finalAssignment.reduce((sum, a) => sum + (a.crowdLevel || 5), 0) / finalAssignment.length;

    const reasoning = [
      `Analyzed ${flexibleAssignments.length} flexible days for crowd optimization`,
      `Kept ${lockedAssignments.length} locked park assignments unchanged`,
      `Reduced average crowd level from ${avgOriginalCrowd.toFixed(1)} to ${avgOptimizedCrowd.toFixed(1)}`,
      'Used balanced algorithm considering both crowd levels and park diversity',
      `Distributed recommendations across ${Array.from(new Set(optimizedFlexible.map(a => a.parkId))).length} different parks`
    ];

    return { assignment: finalAssignment, reasoning };
  }

  /**
   * Optimize for must-do attractions priority
   */
  private async optimizeForMustDos(
    assignments: ParkAssignment[],
    activityRatings: ActivityRatingSummary[],
    crowdData: Map<string, Map<string, number>>,
    constraints: OptimizationConstraint[]
  ): Promise<{ assignment: ParkAssignment[]; reasoning: string[] }> {

    // Calculate must-do score for each park
    const parkMustDoScores = new Map<string, number>();

    // Group ratings by park
    const ratingsByPark = new Map<string, ActivityRatingSummary[]>();
    for (const rating of activityRatings) {
      // Note: We'd need to map attraction IDs to park IDs here
      // For now, using a simplified approach
      const parkId = this.getAttractionspark(rating.attractionId);
      if (!ratingsByPark.has(parkId)) {
        ratingsByPark.set(parkId, []);
      }
      ratingsByPark.get(parkId)!.push(rating);
    }

    // Calculate must-do scores
    for (const [parkId, ratings] of ratingsByPark) {
      const mustDoCount = ratings.reduce((sum, rating) => sum + rating.mustDoCount, 0);
      const avgRating = ratings.reduce((sum, rating) => sum + (rating.averageRating || 0), 0) / ratings.length;
      parkMustDoScores.set(parkId, mustDoCount * avgRating);
    }

    // Sort assignments by must-do score (descending) and assign to lowest crowd days
    const lockedDays = constraints.filter(c => c.isLocked).map(c => c.dayId);
    const fixedDays = constraints.filter(c => c.dayType === 'check-in' || c.dayType === 'check-out').map(c => c.dayId);
    const flexibleAssignments = assignments.filter(a => !lockedDays.includes(a.dayId) && !fixedDays.includes(a.dayId));

    // Sort parks by must-do priority
    const parksByPriority = [...parkMustDoScores.entries()]
      .sort(([,scoreA], [,scoreB]) => scoreB - scoreA)
      .map(([parkId]) => parkId);

    // Sort days by crowd level (ascending - lowest crowds first)
    const daysByCrowd = flexibleAssignments
      .sort((a, b) => (a.crowdLevel || 5) - (b.crowdLevel || 5));

    // Assign highest priority parks to lowest crowd days
    const optimizedAssignments = assignments.map(assignment => {
      if (lockedDays.includes(assignment.dayId) || fixedDays.includes(assignment.dayId)) {
        return assignment; // Keep locked and fixed assignments
      }

      const dayIndex = daysByCrowd.findIndex(day => day.dayId === assignment.dayId);
      if (dayIndex < parksByPriority.length) {
        return {
          ...assignment,
          parkId: parksByPriority[dayIndex]
        };
      }

      return assignment;
    });

    const reasoning = [
      `Analyzed must-do attractions across ${parkMustDoScores.size} parks`,
      'Assigned parks with most must-do attractions to lowest crowd days',
      `Protected ${lockedDays.length} locked day assignments`
    ];

    return { assignment: optimizedAssignments, reasoning };
  }

  /**
   * Optimize for group consensus (parks with conflicts get easier days)
   */
  private async optimizeForGroupConsensus(
    assignments: ParkAssignment[],
    activityRatings: ActivityRatingSummary[],
    crowdData: Map<string, Map<string, number>>,
    constraints: OptimizationConstraint[]
  ): Promise<{ assignment: ParkAssignment[]; reasoning: string[] }> {

    // Calculate consensus scores for each park
    const parkConsensusScores = new Map<string, number>();

    for (const rating of activityRatings) {
      const parkId = this.getAttractionspark(rating.attractionId);

      if (!parkConsensusScores.has(parkId)) {
        parkConsensusScores.set(parkId, 0);
      }

      // Lower consensus level = more conflicts = needs easier day
      const conflictScore = rating.consensusLevel === 'conflict' ? 3 :
                           rating.consensusLevel === 'low' ? 2 :
                           rating.consensusLevel === 'medium' ? 1 : 0;

      parkConsensusScores.set(parkId, parkConsensusScores.get(parkId)! + conflictScore);
    }

    // Assign parks with most conflicts to lowest crowd days
    const lockedDays = constraints.filter(c => c.isLocked).map(c => c.dayId);
    const fixedDays = constraints.filter(c => c.dayType === 'check-in' || c.dayType === 'check-out').map(c => c.dayId);
    const flexibleAssignments = assignments.filter(a => !lockedDays.includes(a.dayId) && !fixedDays.includes(a.dayId));

    // Sort parks by conflict score (descending)
    const parksByConflict = [...parkConsensusScores.entries()]
      .sort(([,scoreA], [,scoreB]) => scoreB - scoreA)
      .map(([parkId]) => parkId);

    // Sort days by crowd level (ascending)
    const daysByCrowd = flexibleAssignments
      .sort((a, b) => (a.crowdLevel || 5) - (b.crowdLevel || 5));

    // Assign conflict parks to easier days
    const optimizedAssignments = assignments.map(assignment => {
      if (lockedDays.includes(assignment.dayId) || fixedDays.includes(assignment.dayId)) {
        return assignment;
      }

      const dayIndex = daysByCrowd.findIndex(day => day.dayId === assignment.dayId);
      if (dayIndex < parksByConflict.length) {
        return {
          ...assignment,
          parkId: parksByConflict[dayIndex]
        };
      }

      return assignment;
    });

    const reasoning = [
      `Analyzed group consensus for ${parkConsensusScores.size} parks`,
      'Assigned parks with most rating conflicts to lowest crowd days',
      'Helps ensure better group experience on challenging days'
    ];

    return { assignment: optimizedAssignments, reasoning };
  }

  /**
   * Optimize for energy management (intensive parks early in trip)
   */
  private async optimizeForEnergy(
    assignments: ParkAssignment[],
    crowdData: Map<string, Map<string, number>>,
    constraints: OptimizationConstraint[]
  ): Promise<{ assignment: ParkAssignment[]; reasoning: string[] }> {

    // Define park intensity levels (this could be data-driven)
    const parkIntensity = new Map<string, number>([
      ['magic-kingdom', 5], // Highest intensity - most walking, most attractions
      ['hollywood-studios', 4],
      ['animal-kingdom', 3],
      ['epcot', 2] // Lower intensity - more relaxed pace
    ]);

    const lockedDays = constraints.filter(c => c.isLocked).map(c => c.dayId);
    const fixedDays = constraints.filter(c => c.dayType === 'check-in' || c.dayType === 'check-out').map(c => c.dayId);
    const flexibleAssignments = assignments.filter(a => !lockedDays.includes(a.dayId) && !fixedDays.includes(a.dayId));

    // Sort days chronologically
    const daysByDate = flexibleAssignments
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Sort parks by intensity (descending)
    const parksByIntensity = [...parkIntensity.entries()]
      .sort(([,intensityA], [,intensityB]) => intensityB - intensityA)
      .map(([parkId]) => parkId);

    // Assign most intensive parks to earliest days
    const optimizedAssignments = assignments.map(assignment => {
      if (lockedDays.includes(assignment.dayId) || fixedDays.includes(assignment.dayId)) {
        return assignment;
      }

      const dayIndex = daysByDate.findIndex(day => day.dayId === assignment.dayId);
      if (dayIndex < parksByIntensity.length) {
        return {
          ...assignment,
          parkId: parksByIntensity[dayIndex]
        };
      }

      return assignment;
    });

    const reasoning = [
      'Scheduled most intensive parks (Magic Kingdom) early in trip',
      'Reserved lower-intensity parks (EPCOT) for later when energy is lower',
      'Maintains optimal energy balance throughout vacation'
    ];

    return { assignment: optimizedAssignments, reasoning };
  }

  /**
   * Calculate improvement score (0-100)
   */
  private calculateImprovementScore(original: ParkAssignment[], optimized: ParkAssignment[]): number {
    const originalScore = original.reduce((sum, a) => sum + (a.score || 0), 0);
    const optimizedScore = optimized.reduce((sum, a) => sum + (a.score || 0), 0);

    if (originalScore === 0) return 0;

    const improvement = ((optimizedScore - originalScore) / originalScore) * 100;
    return Math.max(0, Math.min(100, Math.round(improvement + 50))); // Normalize to 0-100
  }

  /**
   * Calculate total crowd reduction percentage
   */
  private calculateCrowdReduction(original: ParkAssignment[], optimized: ParkAssignment[]): number {
    const originalCrowds = original.reduce((sum, a) => sum + (a.crowdLevel || 5), 0);
    const optimizedCrowds = optimized.reduce((sum, a) => sum + (a.crowdLevel || 5), 0);

    if (originalCrowds === 0) return 0;

    const reduction = ((originalCrowds - optimizedCrowds) / originalCrowds) * 100;
    return Math.max(0, Math.round(reduction));
  }

  /**
   * Calculate confidence score for optimization
   */
  private calculateConfidenceScore(assignments: ParkAssignment[], options: OptimizationOptions): number {
    const lockedCount = options.constraints.filter(c => c.isLocked).length;
    const totalCount = assignments.length;
    const flexibilityRatio = (totalCount - lockedCount) / totalCount;

    // Higher confidence with more flexibility and better crowd data
    const baseConfidence = flexibilityRatio * 70; // Max 70 from flexibility
    const dataConfidence = assignments.filter(a => a.crowdLevel).length / totalCount * 30; // Max 30 from data quality

    return Math.round(baseConfidence + dataConfidence);
  }

  /**
   * Helper to get park ID from attraction ID
   * TODO: This should be replaced with actual attraction-to-park mapping
   */
  private getAttractionspark(attractionId: string): string {
    // Simplified mapping - in real implementation, this would look up the attraction's park
    if (attractionId.includes('mk-') || attractionId.includes('magic')) return 'magic-kingdom';
    if (attractionId.includes('ep-') || attractionId.includes('epcot')) return 'epcot';
    if (attractionId.includes('hs-') || attractionId.includes('hollywood')) return 'hollywood-studios';
    if (attractionId.includes('ak-') || attractionId.includes('animal')) return 'animal-kingdom';

    return 'magic-kingdom'; // Default fallback
  }
}

// Export singleton instance
export const tripOptimizationService = new TripOptimizationService();