import { getAllDoItems } from '@waylight/shared';
import { TripDay, ActivityRatingSummary } from '../types';
import { LightningLaneStrategy, LightningLaneRecommendation } from '../types/optimization';

class LightningLaneService {
  /**
   * Generate a comprehensive Lightning Lane strategy for a trip day
   */
  async generateStrategy(
    tripDay: TripDay,
    activityRatings: ActivityRatingSummary[],
    groupSize: number
  ): Promise<LightningLaneStrategy> {
    const allAttractions = getAllDoItems();

    // Get attractions available in this park
    const parkAttractions = allAttractions.filter(attraction =>
      attraction.parkId === tripDay.parkId
    );

    // Get Lightning Lane eligible attractions
    const multiPassAttractions = parkAttractions.filter(attraction =>
      attraction.features?.multiPass || attraction.features?.hasLightningLane
    );

    const individualLLAttractions = parkAttractions.filter(attraction =>
      attraction.features?.singlePass || attraction.features?.hasIndividualLL
    );

    // Generate recommendations based on activity ratings
    const multiPassRecommendations = this.generateMultiPassRecommendations(
      multiPassAttractions,
      activityRatings,
      tripDay
    );

    const individualLLRecommendations = this.generateIndividualLLRecommendations(
      individualLLAttractions,
      activityRatings,
      tripDay
    );

    // Analyze if Genie+ purchase is worth it
    const shouldPurchaseGeneiePlus = this.shouldPurchaseGeneiePlus(
      multiPassRecommendations,
      groupSize,
      tripDay
    );

    // Calculate costs
    const costAnalysis = this.calculateCosts(
      shouldPurchaseGeneiePlus,
      individualLLRecommendations,
      groupSize,
      tripDay
    );

    // Estimate time savings
    const timeSavings = this.estimateTimeSavings(
      multiPassRecommendations,
      individualLLRecommendations,
      shouldPurchaseGeneiePlus
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(
      shouldPurchaseGeneiePlus,
      multiPassRecommendations,
      individualLLRecommendations,
      costAnalysis,
      timeSavings,
      groupSize
    );

    return {
      shouldPurchaseGeneiePlus,
      reasoning,
      costAnalysis,
      timeSavings,
      multiPassRecommendations: multiPassRecommendations.slice(0, 8), // Top 8 recommendations
      individualLLRecommendations
    };
  }

  private generateMultiPassRecommendations(
    attractions: any[],
    activityRatings: ActivityRatingSummary[],
    tripDay: TripDay
  ): LightningLaneRecommendation[] {
    return attractions
      .map(attraction => {
        const rating = activityRatings.find(r => r.attractionId === attraction.id);
        const groupRating = rating?.averageRating || 3.0;
        const mustDoCount = rating?.mustDoCount || 0;

        // Calculate priority based on multiple factors
        let priority = Math.min(groupRating * 2, 10); // Base on rating (max 10)

        // Boost for must-do attractions
        if (mustDoCount > 0) {
          priority += Math.min(mustDoCount * 1.5, 3);
        }

        // Boost for high-intensity attractions (tend to have longer waits)
        if (attraction.intensity === 'high' || attraction.intensity === 'extreme') {
          priority += 1;
        }

        // Boost for popular attractions known to have long waits
        if (this.isHighDemandAttraction(attraction.id)) {
          priority += 2;
        }

        // Boost for attractions that are planned for this day
        if (tripDay.items?.some(item => item.attractionId === attraction.id)) {
          priority += 1.5;
        }

        priority = Math.min(priority, 10); // Cap at 10

        return {
          attractionId: attraction.id,
          attractionName: attraction.name,
          priority: Math.round(priority * 10) / 10,
          reasoning: this.generateAttractionReasoning(attraction, rating, 'multipass'),
          estimatedSavings: this.estimateWaitTimeSavings(attraction.id, 'multipass'),
          groupRating,
          sellsOutBy: this.getSellOutTime(attraction.id)
        };
      })
      .filter(rec => rec.priority >= 5) // Only recommend if priority >= 5
      .sort((a, b) => b.priority - a.priority);
  }

  private generateIndividualLLRecommendations(
    attractions: any[],
    activityRatings: ActivityRatingSummary[],
    tripDay: TripDay
  ): LightningLaneRecommendation[] {
    return attractions
      .map(attraction => {
        const rating = activityRatings.find(r => r.attractionId === attraction.id);
        const groupRating = rating?.averageRating || 3.0;
        const mustDoCount = rating?.mustDoCount || 0;

        // Individual LL has higher threshold - must be highly rated
        let priority = Math.min(groupRating * 1.8, 10);

        // Strong boost for must-do attractions
        if (mustDoCount > 0) {
          priority += Math.min(mustDoCount * 2, 4);
        }

        // Individual LL attractions are typically very high demand
        priority += 2;

        // Strong boost if planned for this day
        if (tripDay.items?.some(item => item.attractionId === attraction.id)) {
          priority += 2;
        }

        priority = Math.min(priority, 10);

        return {
          attractionId: attraction.id,
          attractionName: attraction.name,
          priority: Math.round(priority * 10) / 10,
          reasoning: this.generateAttractionReasoning(attraction, rating, 'individual'),
          estimatedSavings: this.estimateWaitTimeSavings(attraction.id, 'individual'),
          groupRating,
          sellsOutBy: this.getSellOutTime(attraction.id),
          cost: this.getIndividualLLCost(attraction.id)
        };
      })
      .filter(rec => rec.priority >= 7) // Higher threshold for Individual LL
      .sort((a, b) => b.priority - a.priority);
  }

  private shouldPurchaseGeneiePlus(
    multiPassRecommendations: LightningLaneRecommendation[],
    groupSize: number,
    tripDay: TripDay
  ): boolean {
    // Calculate potential value
    const highPriorityCount = multiPassRecommendations.filter(rec => rec.priority >= 8).length;
    const totalTimeSavings = multiPassRecommendations
      .slice(0, 3) // Realistically can only use 3-4 per day
      .reduce((sum, rec) => sum + rec.estimatedSavings, 0);

    // Cost per person per day (typical range $25-35)
    const costPerPerson = this.getGeniePlusCost(tripDay.date);
    const totalCost = costPerPerson * groupSize;

    // Decision factors
    const worthwhileConditions = [
      highPriorityCount >= 3, // At least 3 high-priority attractions
      totalTimeSavings >= 120, // At least 2 hours savings potential
      totalCost <= groupSize * 35, // Cost is reasonable
      multiPassRecommendations.length >= 4 // Enough options available
    ];

    // Must meet at least 3 of 4 conditions
    return worthwhileConditions.filter(Boolean).length >= 3;
  }

  private calculateCosts(
    shouldPurchaseGeneiePlus: boolean,
    individualLLRecommendations: LightningLaneRecommendation[],
    groupSize: number,
    tripDay: TripDay
  ) {
    const geniePlusCost = shouldPurchaseGeneiePlus
      ? this.getGeniePlusCost(tripDay.date) * groupSize
      : 0;

    // Estimate Individual LL cost for all recommended attractions
    const individualLLCost = individualLLRecommendations
      .reduce((sum, rec) => sum + (rec.cost || 0), 0) * groupSize;

    return {
      geniePlusCost,
      individualLLCost,
      totalCost: geniePlusCost + individualLLCost
    };
  }

  private estimateTimeSavings(
    multiPassRecommendations: LightningLaneRecommendation[],
    individualLLRecommendations: LightningLaneRecommendation[],
    shouldPurchaseGeneiePlus: boolean
  ) {
    let estimatedMinutes = 0;
    let confidenceLevel: 'low' | 'medium' | 'high' = 'medium';

    if (shouldPurchaseGeneiePlus) {
      // Conservative estimate: use top 3 MultiPass attractions
      estimatedMinutes += multiPassRecommendations
        .slice(0, 3)
        .reduce((sum, rec) => sum + rec.estimatedSavings, 0);
    }

    // Add Individual LL savings
    estimatedMinutes += individualLLRecommendations
      .reduce((sum, rec) => sum + rec.estimatedSavings, 0);

    // Adjust confidence based on total recommendations
    if (multiPassRecommendations.length + individualLLRecommendations.length < 3) {
      confidenceLevel = 'low';
    } else if (multiPassRecommendations.length + individualLLRecommendations.length > 6) {
      confidenceLevel = 'high';
    }

    return {
      estimatedMinutes: Math.round(estimatedMinutes),
      confidenceLevel
    };
  }

  private generateReasoning(
    shouldPurchaseGeneiePlus: boolean,
    multiPassRecommendations: LightningLaneRecommendation[],
    individualLLRecommendations: LightningLaneRecommendation[],
    costAnalysis: any,
    timeSavings: any,
    groupSize: number
  ): string[] {
    const reasoning: string[] = [];

    if (shouldPurchaseGeneiePlus) {
      reasoning.push(`Your group has ${multiPassRecommendations.filter(r => r.priority >= 8).length} highly-rated attractions that offer Genie+`);
      reasoning.push(`Estimated time savings: ${timeSavings.estimatedMinutes} minutes (${Math.round(timeSavings.estimatedMinutes / 60 * 10) / 10} hours)`);
      reasoning.push(`Cost per hour saved: $${Math.round(costAnalysis.geniePlusCost / (timeSavings.estimatedMinutes / 60))}`);

      if (groupSize > 2) {
        reasoning.push(`With ${groupSize} people, the time savings benefit justifies the group cost`);
      }
    } else {
      reasoning.push(`Limited high-priority Genie+ attractions for your group`);
      reasoning.push(`Better value using rope drop and Individual Lightning Lanes for must-do attractions`);

      if (costAnalysis.totalCost > groupSize * 40) {
        reasoning.push(`Total projected cost ($${costAnalysis.totalCost}) exceeds recommended budget`);
      }
    }

    if (individualLLRecommendations.length > 0) {
      reasoning.push(`${individualLLRecommendations.length} premium attraction${individualLLRecommendations.length > 1 ? 's' : ''} worth considering for Individual Lightning Lane`);
    }

    return reasoning;
  }

  private generateAttractionReasoning(
    attraction: any,
    rating: ActivityRatingSummary | undefined,
    type: 'multipass' | 'individual'
  ): string[] {
    const reasons: string[] = [];

    if (rating?.averageRating && rating.averageRating >= 4.5) {
      reasons.push(`Highly rated by your group (${rating.averageRating.toFixed(1)} stars)`);
    }

    if (rating?.mustDoCount && rating.mustDoCount > 0) {
      reasons.push(`${rating.mustDoCount} group member${rating.mustDoCount > 1 ? 's' : ''} marked as must-do`);
    }

    if (attraction.intensity === 'high' || attraction.intensity === 'extreme') {
      reasons.push('High-intensity attraction typically has long waits');
    }

    if (this.isHighDemandAttraction(attraction.id)) {
      reasons.push('Popular attraction with consistently long wait times');
    }

    if (type === 'individual') {
      reasons.push('Premium attraction with limited Lightning Lane availability');
    }

    return reasons;
  }

  // Helper methods for data that would typically come from APIs or configuration
  private isHighDemandAttraction(attractionId: string): boolean {
    const highDemandAttractions = [
      'space-mountain',
      'seven-dwarfs-mine-train',
      'guardians-of-the-galaxy',
      'rise-of-the-resistance',
      'avatar-flight-of-passage',
      'expedition-everest'
    ];
    return highDemandAttractions.includes(attractionId);
  }

  private estimateWaitTimeSavings(attractionId: string, type: 'multipass' | 'individual'): number {
    // Base wait time estimates (would typically come from historical data)
    const waitTimeEstimates: Record<string, number> = {
      'space-mountain': 75,
      'seven-dwarfs-mine-train': 90,
      'haunted-mansion': 45,
      'pirates-of-the-caribbean': 35,
      'big-thunder-mountain': 60,
      'splash-mountain': 65,
      'guardians-of-the-galaxy': 85,
      'test-track': 70,
      'rise-of-the-resistance': 120,
      'millennium-falcon': 80,
      'avatar-flight-of-passage': 100,
      'expedition-everest': 70
    };

    const baseWait = waitTimeEstimates[attractionId] || 50;

    // Individual LL typically saves more time than MultiPass
    const savingsMultiplier = type === 'individual' ? 0.9 : 0.75;

    return Math.round(baseWait * savingsMultiplier);
  }

  private getSellOutTime(attractionId: string): string | undefined {
    // Attractions that typically sell out early
    const sellOutTimes: Record<string, string> = {
      'seven-dwarfs-mine-train': '11:00 AM',
      'rise-of-the-resistance': '10:30 AM',
      'avatar-flight-of-passage': '11:30 AM',
      'guardians-of-the-galaxy': '12:00 PM'
    };

    return sellOutTimes[attractionId];
  }

  private getIndividualLLCost(attractionId: string): number {
    // Typical Individual LL costs (would come from API)
    const costs: Record<string, number> = {
      'seven-dwarfs-mine-train': 12,
      'rise-of-the-resistance': 20,
      'avatar-flight-of-passage': 14,
      'guardians-of-the-galaxy': 14,
      'tron-lightcycle-run': 20
    };

    return costs[attractionId] || 15;
  }

  private getGeniePlusCost(date: string): number {
    // Dynamic pricing based on crowd levels (would typically come from Disney API)
    const dayOfWeek = new Date(date).getDay();
    const basePrice = 25;

    // Weekend and holiday pricing
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      return basePrice + 8;
    }

    // Weekday pricing
    return basePrice + 2;
  }
}

export const lightningLaneService = new LightningLaneService();