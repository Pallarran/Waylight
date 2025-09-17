import type { Trip } from '../types';
import type { TravelingPartyMember } from '@waylight/shared';
import type { ParkRatingSummary, ConflictAnalysis, TripRecommendations } from './parkRatingAnalytics';

export class ReportExportService {
  /**
   * Generate a comprehensive text report
   */
  static generateTextReport(
    trip: Trip,
    partyMembers: TravelingPartyMember[],
    parkSummaries: ParkRatingSummary[],
    conflicts: ConflictAnalysis[],
    recommendations: TripRecommendations
  ): string {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let report = '';

    // Header
    report += `🎭 TRIP RATINGS SUMMARY REPORT\n`;
    report += `═══════════════════════════════════════\n\n`;
    report += `Trip: ${trip.name}\n`;
    report += `Dates: ${trip.startDate} to ${trip.endDate} (${tripDuration} days)\n`;
    report += `Party Size: ${partyMembers.length} travelers\n`;
    report += `Generated: ${new Date().toLocaleDateString()}\n\n`;

    // Executive Summary
    const totalMustDos = parkSummaries.reduce((sum, p) => sum + p.mustDoCount, 0);
    const avgConsensus = parkSummaries.reduce((sum, p) => sum + p.consensusScore, 0) / parkSummaries.length;

    report += `📊 EXECUTIVE SUMMARY\n`;
    report += `───────────────────────────────\n`;
    report += `• Total Must-Do Attractions: ${totalMustDos}\n`;
    report += `• Overall Consensus Level: ${(avgConsensus * 100).toFixed(0)}%\n`;
    report += `• Rating Conflicts: ${conflicts.length}\n`;
    report += `• Parks with High Priority: ${parkSummaries.filter(p => p.mustDoCount >= 5).length}\n\n`;

    // Park Priority Rankings
    report += `🏰 PARK PRIORITY RANKINGS\n`;
    report += `───────────────────────────────\n`;
    parkSummaries.forEach((park, index) => {
      report += `${index + 1}. ${park.parkIcon} ${park.parkName}\n`;
      report += `   • Average Rating: ${park.averageRating.toFixed(1)}/5 stars\n`;
      report += `   • Must-Do Attractions: ${park.mustDoCount}\n`;
      report += `   • Consensus Score: ${(park.consensusScore * 100).toFixed(0)}%\n`;
      report += `   • Recommended Days: ${park.recommendedDays}\n`;
      if (park.conflictCount > 0) {
        report += `   ⚠️  ${park.conflictCount} conflicts to resolve\n`;
      }
      report += `\n`;
    });

    // Recommended Park Day Allocation
    report += `📅 RECOMMENDED PARK DAY ALLOCATION\n`;
    report += `───────────────────────────────\n`;
    recommendations.suggestedParkDays.forEach(park => {
      const parkInfo = parkSummaries.find(p => p.parkId === park.parkId);
      report += `• ${parkInfo?.parkName}: ${park.days} day${park.days !== 1 ? 's' : ''}\n`;
      report += `  Reason: ${park.justification}\n\n`;
    });

    // Must-Do Attractions by Park
    report += `⭐ MUST-DO ATTRACTIONS BY PARK\n`;
    report += `───────────────────────────────\n`;
    recommendations.mustDoByPark.forEach(park => {
      if (park.attractions.length > 0) {
        const parkInfo = parkSummaries.find(p => p.parkId === park.parkId);
        report += `${parkInfo?.parkIcon} ${parkInfo?.parkName}:\n`;
        park.attractions.forEach((attraction, index) => {
          report += `  ${index + 1}. ${attraction}\n`;
        });
        report += `\n`;
      }
    });

    // Lightning Lane Priorities
    const hasLightningLane = recommendations.lightningLanePriorities.some(park => park.attractions.length > 0);
    if (hasLightningLane) {
      report += `⚡ LIGHTNING LANE PRIORITIES\n`;
      report += `───────────────────────────────\n`;
      recommendations.lightningLanePriorities.forEach(park => {
        if (park.attractions.length > 0) {
          const parkInfo = parkSummaries.find(p => p.parkId === park.parkId);
          report += `${parkInfo?.parkIcon} ${parkInfo?.parkName}:\n`;
          park.attractions.forEach((attraction, index) => {
            report += `  ${index + 1}. ${attraction}\n`;
          });
          report += `\n`;
        }
      });
    }

    // Conflicts and Resolutions
    if (conflicts.length > 0) {
      report += `⚠️  CONFLICTS & RESOLUTIONS\n`;
      report += `───────────────────────────────\n`;
      conflicts.forEach((conflict, index) => {
        report += `${index + 1}. ${conflict.attractionName} (${conflict.parkName})\n`;
        report += `   Conflict Type: ${conflict.conflictType}\n`;
        report += `   Severity: ${conflict.severity}\n`;
        report += `   Affected Members: ${conflict.conflictingMembers.map(m => m.memberName).join(', ')}\n`;
        report += `   Resolution: ${conflict.suggestedResolution}\n\n`;
      });
    }

    // Compromise Strategies
    if (recommendations.compromiseStrategies.length > 0) {
      report += `🤝 COMPROMISE STRATEGIES\n`;
      report += `───────────────────────────────\n`;
      recommendations.compromiseStrategies.forEach((strategy, index) => {
        report += `${index + 1}. ${strategy}\n`;
      });
      report += `\n`;
    }

    // Detailed Park Analysis
    report += `📋 DETAILED PARK ANALYSIS\n`;
    report += `═══════════════════════════════════════\n\n`;

    parkSummaries.forEach(park => {
      report += `${park.parkIcon} ${park.parkName.toUpperCase()}\n`;
      report += `${'─'.repeat(park.parkName.length + 4)}\n`;
      report += `Attractions Rated: ${park.ratedAttractions} of ${park.totalAttractions}\n`;
      report += `Average Rating: ${park.averageRating.toFixed(1)}/5 stars\n`;
      report += `Must-Do Count: ${park.mustDoCount}\n`;
      report += `Avoid Count: ${park.avoidCount}\n`;
      report += `Consensus Score: ${(park.consensusScore * 100).toFixed(0)}%\n`;
      report += `Recommended Days: ${park.recommendedDays}\n\n`;

      if (park.topAttractions.length > 0) {
        report += `Top Attractions:\n`;
        park.topAttractions.slice(0, 5).forEach((attraction, index) => {
          report += `  ${index + 1}. ${attraction.attractionName} - ${attraction.averageRating.toFixed(1)}★`;
          if (attraction.mustDoCount > 0) {
            report += ` (${attraction.mustDoCount} must-do votes)`;
          }
          if (attraction.hasConflicts) {
            report += ` ⚠️ `;
          }
          report += `\n`;
        });
      }
      report += `\n`;
    });

    // Footer
    report += `\n${'═'.repeat(50)}\n`;
    report += `Generated by Waylight Trip Planner\n`;
    report += `Report created: ${new Date().toLocaleString()}\n`;
    report += `\nHappy planning! 🎭✨\n`;

    return report;
  }

  /**
   * Generate a structured JSON report
   */
  static generateJSONReport(
    trip: Trip,
    partyMembers: TravelingPartyMember[],
    parkSummaries: ParkRatingSummary[],
    conflicts: ConflictAnalysis[],
    recommendations: TripRecommendations
  ): any {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      metadata: {
        tripName: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        tripDuration,
        partySize: partyMembers.length,
        partyMembers: partyMembers.map(member => ({
          id: member.id,
          name: member.name,
          age: member.age,
          isPlanner: member.isPlanner
        })),
        generatedAt: new Date().toISOString(),
        generatedBy: 'Waylight Trip Planner'
      },

      summary: {
        totalMustDos: parkSummaries.reduce((sum, p) => sum + p.mustDoCount, 0),
        averageConsensus: parkSummaries.reduce((sum, p) => sum + p.consensusScore, 0) / parkSummaries.length,
        totalConflicts: conflicts.length,
        highPriorityParks: parkSummaries.filter(p => p.mustDoCount >= 5).length
      },

      parkAnalysis: parkSummaries.map(park => ({
        parkId: park.parkId,
        parkName: park.parkName,
        icon: park.parkIcon,
        metrics: {
          totalAttractions: park.totalAttractions,
          ratedAttractions: park.ratedAttractions,
          averageRating: park.averageRating,
          mustDoCount: park.mustDoCount,
          avoidCount: park.avoidCount,
          consensusScore: park.consensusScore,
          conflictCount: park.conflictCount,
          recommendedDays: park.recommendedDays,
          priorityScore: park.priorityScore
        },
        topAttractions: park.topAttractions.slice(0, 10).map(attraction => ({
          id: attraction.attractionId,
          name: attraction.attractionName,
          averageRating: attraction.averageRating,
          mustDoCount: attraction.mustDoCount,
          consensusLevel: attraction.consensusLevel,
          hasConflicts: attraction.hasConflicts,
          individualRatings: attraction.individualRatings
        }))
      })),

      conflicts: conflicts.map(conflict => ({
        attractionId: conflict.attractionId,
        attractionName: conflict.attractionName,
        parkId: conflict.parkId,
        parkName: conflict.parkName,
        type: conflict.conflictType,
        severity: conflict.severity,
        affectedMembers: conflict.conflictingMembers,
        resolution: conflict.suggestedResolution
      })),

      recommendations: {
        parkPriorityOrder: recommendations.parkPriorityOrder,
        suggestedParkDays: recommendations.suggestedParkDays,
        mustDoByPark: recommendations.mustDoByPark,
        lightningLanePriorities: recommendations.lightningLanePriorities,
        ropeDropTargets: recommendations.ropDropTargets,
        compromiseStrategies: recommendations.compromiseStrategies
      }
    };
  }

  /**
   * Download text report
   */
  static downloadTextReport(
    trip: Trip,
    partyMembers: TravelingPartyMember[],
    parkSummaries: ParkRatingSummary[],
    conflicts: ConflictAnalysis[],
    recommendations: TripRecommendations
  ): void {
    const textReport = this.generateTextReport(trip, partyMembers, parkSummaries, conflicts, recommendations);
    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ratings_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Download JSON report
   */
  static downloadJSONReport(
    trip: Trip,
    partyMembers: TravelingPartyMember[],
    parkSummaries: ParkRatingSummary[],
    conflicts: ConflictAnalysis[],
    recommendations: TripRecommendations
  ): void {
    const jsonReport = this.generateJSONReport(trip, partyMembers, parkSummaries, conflicts, recommendations);
    const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ratings_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy report to clipboard
   */
  static async copyTextToClipboard(
    trip: Trip,
    partyMembers: TravelingPartyMember[],
    parkSummaries: ParkRatingSummary[],
    conflicts: ConflictAnalysis[],
    recommendations: TripRecommendations
  ): Promise<boolean> {
    try {
      const textReport = this.generateTextReport(trip, partyMembers, parkSummaries, conflicts, recommendations);
      await navigator.clipboard.writeText(textReport);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}