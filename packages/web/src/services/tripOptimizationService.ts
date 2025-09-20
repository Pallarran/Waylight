import { Trip, TripDay, ActivityRatingSummary } from '@waylight/shared';
import { crowdPredictionRepository } from '@waylight/shared';

export interface OptimizationConstraint {
  dayId: string;
  parkId: string;
  isLocked: boolean;
  reason?: string;
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
   * Validate trip structure and dates
   */
  private validateTripStructure(trip: Trip): void {
    if (!trip.days || trip.days.length === 0) {
      throw new Error('Trip must have at least one day');
    }

    console.log('Validating trip structure:', {
      startDate: trip.startDate,
      endDate: trip.endDate,
      days: trip.days.map(d => ({ date: d.date, parkId: d.parkId }))
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

    console.log('After validation:', {
      validDays: trip.days.length,
      dates: trip.days.map(d => d.date)
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

    // Get unique park IDs and filter out invalid ones
    let parkIds = [...new Set(trip.days.map(day => day.parkId))]
      .filter(parkId => parkId && parkId !== 'undefined' && !parkId.includes('No park'));

    // If no valid parks found, use default Disney World parks for optimization
    if (parkIds.length === 0) {
      console.log('No valid parks found in trip, using default Disney World parks for optimization');
      parkIds = ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom'];
    }

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
    const flexibleAssignments = assignments.filter(a =>
      !lockedAssignments.some(locked => locked.dayId === a.dayId)
    );

    // Get all available parks and dates
    const availableParks = [...new Set(assignments.map(a => a.parkId))];
    const availableDates = assignments.map(a => a.date);

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

    // First, handle locked assignments to mark their parks/dates as used
    const lockedParkAssignments = assignments.filter(a =>
      lockedAssignments.some(locked => locked.dayId === a.dayId)
    );

    for (const locked of lockedParkAssignments) {
      usedDates.add(locked.date);
      // Note: we don't mark parks as used since parks can be visited multiple times
    }

    // Assign flexible days using lowest crowd combinations
    for (const combo of parkDateMatrix) {
      // Skip if this date is already assigned or is locked
      if (usedDates.has(combo.date)) continue;

      // Find the assignment for this date
      const assignment = flexibleAssignments.find(a => a.date === combo.date);
      if (!assignment) continue;

      // Check if this would conflict with a locked assignment (same park, same date)
      const hasConflict = lockedParkAssignments.some(locked =>
        locked.parkId === combo.parkId && locked.date === combo.date
      );

      if (!hasConflict) {
        optimizedFlexible.push({
          dayId: assignment.dayId,
          parkId: combo.parkId,
          date: combo.date,
          crowdLevel: combo.crowdLevel,
          score: 10 - combo.crowdLevel
        });

        usedDates.add(combo.date);
      }
    }

    // Combine locked and optimized assignments
    const finalAssignment = [...lockedParkAssignments, ...optimizedFlexible]
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
      'Used intelligent park-date matching to minimize overall crowd exposure'
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
    const flexibleAssignments = assignments.filter(a => !lockedDays.includes(a.dayId));

    // Sort parks by must-do priority
    const parksByPriority = [...parkMustDoScores.entries()]
      .sort(([,scoreA], [,scoreB]) => scoreB - scoreA)
      .map(([parkId]) => parkId);

    // Sort days by crowd level (ascending - lowest crowds first)
    const daysByCrowd = flexibleAssignments
      .sort((a, b) => (a.crowdLevel || 5) - (b.crowdLevel || 5));

    // Assign highest priority parks to lowest crowd days
    const optimizedAssignments = assignments.map(assignment => {
      if (lockedDays.includes(assignment.dayId)) {
        return assignment; // Keep locked assignments
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
    const flexibleAssignments = assignments.filter(a => !lockedDays.includes(a.dayId));

    // Sort parks by conflict score (descending)
    const parksByConflict = [...parkConsensusScores.entries()]
      .sort(([,scoreA], [,scoreB]) => scoreB - scoreA)
      .map(([parkId]) => parkId);

    // Sort days by crowd level (ascending)
    const daysByCrowd = flexibleAssignments
      .sort((a, b) => (a.crowdLevel || 5) - (b.crowdLevel || 5));

    // Assign conflict parks to easier days
    const optimizedAssignments = assignments.map(assignment => {
      if (lockedDays.includes(assignment.dayId)) {
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
    const flexibleAssignments = assignments.filter(a => !lockedDays.includes(a.dayId));

    // Sort days chronologically
    const daysByDate = flexibleAssignments
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Sort parks by intensity (descending)
    const parksByIntensity = [...parkIntensity.entries()]
      .sort(([,intensityA], [,intensityB]) => intensityB - intensityA)
      .map(([parkId]) => parkId);

    // Assign most intensive parks to earliest days
    const optimizedAssignments = assignments.map(assignment => {
      if (lockedDays.includes(assignment.dayId)) {
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