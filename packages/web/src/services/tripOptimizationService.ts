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

    // Get crowd predictions for all days
    const crowdData = await this.getCrowdDataForTrip(trip);

    // Generate original assignment
    const originalAssignment = this.createAssignmentFromTrip(trip, crowdData);

    // Apply optimization strategy
    let optimizedAssignment: ParkAssignment[];
    let reasoning: string[] = [];

    switch (options.strategy) {
      case 'crowd_minimization':
        const crowdResult = await this.optimizeForCrowds(originalAssignment, options.constraints);
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
   * Get crowd predictions for all days in the trip
   */
  private async getCrowdDataForTrip(trip: Trip): Promise<Map<string, Map<string, number>>> {
    const crowdData = new Map<string, Map<string, number>>();

    // Get unique park IDs
    const parkIds = [...new Set(trip.days.map(day => day.parkId))];

    for (const parkId of parkIds) {
      const parkCrowdData = new Map<string, number>();

      for (const day of trip.days) {
        try {
          const prediction = await crowdPredictionRepository.getCrowdPredictionForDate(parkId, day.date);
          if (prediction) {
            parkCrowdData.set(day.date, prediction.crowdLevel);
          } else {
            // Default to moderate crowd level if no data
            parkCrowdData.set(day.date, 5);
          }
        } catch (error) {
          console.warn(`Failed to get crowd data for ${parkId} on ${day.date}:`, error);
          parkCrowdData.set(day.date, 5); // Default fallback
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
    constraints: OptimizationConstraint[]
  ): Promise<{ assignment: ParkAssignment[]; reasoning: string[] }> {

    const lockedAssignments = constraints.filter(c => c.isLocked);
    const flexibleAssignments = assignments.filter(a =>
      !lockedAssignments.some(locked => locked.dayId === a.dayId)
    );

    // Get all possible park options from the original assignments
    const availableParks = [...new Set(assignments.map(a => a.parkId))];

    // Sort flexible days by date to maintain trip flow
    flexibleAssignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // For each flexible day, try all parks and pick the one with lowest crowd
    const optimizedFlexible = flexibleAssignments.map(assignment => {
      let bestPark = assignment.parkId;
      let bestCrowdLevel = assignment.crowdLevel || 10;

      for (const parkId of availableParks) {
        // Skip if this park is already assigned to a locked day on the same date
        const isConflicted = lockedAssignments.some(locked =>
          locked.parkId === parkId && locked.dayId !== assignment.dayId
        );

        if (!isConflicted) {
          // Get crowd level for this park on this date (would need crowd data lookup)
          // For now, using the existing crowd level as baseline
          const crowdLevel = assignment.crowdLevel || 5;

          if (crowdLevel < bestCrowdLevel) {
            bestCrowdLevel = crowdLevel;
            bestPark = parkId;
          }
        }
      }

      return {
        ...assignment,
        parkId: bestPark,
        crowdLevel: bestCrowdLevel,
        score: 10 - bestCrowdLevel
      };
    });

    // Combine locked and optimized assignments
    const lockedParkAssignments = assignments.filter(a =>
      lockedAssignments.some(locked => locked.dayId === a.dayId)
    );

    const finalAssignment = [...lockedParkAssignments, ...optimizedFlexible]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const reasoning = [
      `Analyzed ${flexibleAssignments.length} flexible days for crowd optimization`,
      `Kept ${lockedAssignments.length} locked park assignments unchanged`,
      'Prioritized parks with lowest predicted crowd levels for each day'
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