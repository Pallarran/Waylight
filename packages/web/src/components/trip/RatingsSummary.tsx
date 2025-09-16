import { useState, useEffect } from 'react';
import { Star, Users, AlertTriangle } from 'lucide-react';
import { ActivityRatingsService } from '@waylight/shared';
import type { ActivityRatingSummary, TravelingPartyMember } from '../../types';

interface RatingsSummaryProps {
  tripId: string;
  attractionIds: string[];
  partyMembers: TravelingPartyMember[];
  className?: string;
}

export default function RatingsSummary({ tripId, attractionIds, partyMembers, className = '' }: RatingsSummaryProps) {
  const [summaries, setSummaries] = useState<ActivityRatingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummaries = async () => {
      try {
        setLoading(true);
        const allSummaries = await ActivityRatingsService.getRatingSummariesForTrip(tripId);

        // Filter to only show summaries for attractions in the current day
        const filteredSummaries = allSummaries.filter(summary =>
          attractionIds.includes(summary.attractionId)
        );

        setSummaries(filteredSummaries);
      } catch (err) {
        console.error('Error loading rating summaries:', err);
      } finally {
        setLoading(false);
      }
    };

    if (attractionIds.length > 0) {
      loadSummaries();
    } else {
      setSummaries([]);
      setLoading(false);
    }
  }, [tripId, attractionIds]);

  if (loading) {
    return (
      <div className={`bg-surface-dark/20 rounded-lg p-3 ${className}`}>
        <div className="text-sm text-ink-light">Loading ratings...</div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return null;
  }

  const totalRatings = summaries.reduce((sum, s) => sum + s.ratingCount, 0);
  const averageRating = summaries.reduce((sum, s) => sum + (s.averageRating || 0) * s.ratingCount, 0) / Math.max(totalRatings, 1);
  const mustDoCount = summaries.reduce((sum, s) => sum + s.mustDoCount, 0);
  const conflictCount = summaries.filter(s => s.consensusLevel === 'conflict').length;
  const heightIssues = summaries.reduce((sum, s) => sum + s.heightRestrictedCount, 0);

  return (
    <div className={`bg-surface-dark/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-ink">Group Ratings</h4>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-glow" />
          <span className="text-sm font-medium text-ink">
            {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-glow rounded-full"></div>
          <span className="text-ink-light">{mustDoCount} must-do items</span>
        </div>

        <div className="flex items-center space-x-2">
          <Users className="w-3 h-3 text-ink-light" />
          <span className="text-ink-light">{totalRatings} ratings</span>
        </div>

        {conflictCount > 0 && (
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-red-400">{conflictCount} conflicts</span>
          </div>
        )}

        {heightIssues > 0 && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-orange-400">{heightIssues} height issues</span>
          </div>
        )}
      </div>

      {summaries.length > 0 && (
        <div className="mt-3 pt-3 border-t border-surface-dark/30">
          <div className="text-xs text-ink-light">
            Top rated: {summaries
              .filter(s => s.averageRating > 0)
              .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
              .slice(0, 2)
              .map(s => {
                // Get attraction name - in real implementation this would come from attraction data
                return `Item ${s.attractionId.slice(-4)}`;
              })
              .join(', ') || 'None rated yet'}
          </div>
        </div>
      )}
    </div>
  );
}