import { useState } from 'react';
import { Star, StarHalf, Users, AlertTriangle, Ruler, Heart, X, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import type { ActivityRating, GroupRatingData, TravelingPartyMember, PreferenceType, ConsensusLevel } from '../../types';
import { getCategoryIcon, getCategoryColor } from '../../data/activityCategories';

interface GroupRatingCardProps {
  ratingData: GroupRatingData;
  partyMembers: TravelingPartyMember[];
  onRatingChange?: (rating: Partial<ActivityRating>) => void;
  onDeleteRating?: (ratingId: string) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating = ({ rating, onRatingChange, readonly = false, size = 'md' }: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayRating >= star;
        const halfFilled = displayRating >= star - 0.5 && displayRating < star;

        return (
          <button
            key={star}
            className={`${starSizes[size]} ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-all`}
            onClick={() => !readonly && onRatingChange?.(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            disabled={readonly}
          >
            {filled ? (
              <Star className={`${starSizes[size]} fill-glow text-glow`} />
            ) : halfFilled ? (
              <StarHalf className={`${starSizes[size]} fill-glow text-glow`} />
            ) : (
              <Star className={`${starSizes[size]} text-ink-light hover:text-glow transition-colors`} />
            )}
          </button>
        );
      })}
      {readonly && (
        <span className="text-sm text-ink-light ml-2">
          {rating > 0 ? rating.toFixed(1) : 'No rating'}
        </span>
      )}
    </div>
  );
};

const PreferenceSelector = ({
  value,
  onChange,
  disabled = false
}: {
  value?: PreferenceType;
  onChange: (preference: PreferenceType) => void;
  disabled?: boolean;
}) => {
  const preferences: { value: PreferenceType; label: string; color: string; icon: string }[] = [
    { value: 'must_do', label: 'Must Do', color: 'text-glow bg-glow/20 border-glow/50', icon: '⭐' },
    { value: 'want_to_do', label: 'Want to Do', color: 'text-sea bg-sea/20 border-sea/50', icon: '👍' },
    { value: 'neutral', label: 'Neutral', color: 'text-ink bg-gray-300/40 border-gray-400/60', icon: '😐' },
    { value: 'skip', label: 'Skip', color: 'text-orange-400 bg-orange-500/20 border-orange-500/50', icon: '⏭️' },
    { value: 'avoid', label: 'Avoid', color: 'text-red-400 bg-red-500/20 border-red-500/50', icon: '❌' },
  ];

  return (
    <div className="grid grid-cols-5 gap-1">
      {preferences.map((pref) => (
        <button
          key={pref.value}
          onClick={() => onChange(pref.value)}
          disabled={disabled}
          className={`w-8 h-8 rounded-lg border text-sm transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
            value === pref.value ? pref.color : 'text-ink-light bg-surface-dark/20 border-surface-dark/50 hover:bg-surface-dark/40'
          }`}
          title={pref.label}
        >
          {pref.icon}
        </button>
      ))}
    </div>
  );
};

const ConsensusIndicator = ({ level }: { level?: ConsensusLevel }) => {
  if (!level) return null;

  const indicators = {
    high: { color: 'text-green-400 bg-green-500/20', icon: '✅', label: 'High consensus' },
    medium: { color: 'text-yellow-400 bg-yellow-500/20', icon: '⚖️', label: 'Some agreement' },
    low: { color: 'text-orange-400 bg-orange-500/20', icon: '🤷', label: 'Mixed opinions' },
    conflict: { color: 'text-red-400 bg-red-500/20', icon: '⚡', label: 'Strong disagreement' }
  };

  const indicator = indicators[level];

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${indicator.color}`} title={indicator.label}>
      <span className="mr-1">{indicator.icon}</span>
      {indicator.label}
    </div>
  );
};

export default function GroupRatingCard({
  ratingData,
  partyMembers,
  onRatingChange,
  onDeleteRating,
  expanded = false,
  onToggleExpand
}: GroupRatingCardProps) {
  const { attraction, summary, individualRatings } = ratingData;

  // Create ratings map for quick lookup
  const ratingsMap = new Map<string, ActivityRating>();
  individualRatings.forEach(rating => {
    ratingsMap.set(rating.partyMemberId, rating);
  });

  // Map attraction types to valid activity types for database
  const getValidActivityType = (attractionType: string): string => {
    const typeMap: Record<string, string> = {
      'ride': 'ride',
      'show': 'show',
      'dining': 'dining',
      'meet_greet': 'meet_greet',
      'shopping': 'shopping',
      'attraction': 'attraction',
      'waterpark': 'waterpark',
      'tours': 'tours',
      'special_events': 'special_events',
      'quick_service': 'quick_service',
      'table_service': 'table_service',
      'snack': 'snack',
      'lounge': 'lounge',
      'experience': 'experience',
      'walkthrough': 'walkthrough',
      'entertainment': 'entertainment',
      'transportation': 'transportation',
      'parade': 'parade'
    };

    return typeMap[attractionType] || 'attraction'; // Default to 'attraction' if type not found
  };

  const handleRatingUpdate = (partyMemberId: string, updates: Partial<ActivityRating>) => {
    const existingRating = ratingsMap.get(partyMemberId);

    onRatingChange?.({
      ...existingRating,
      tripId: existingRating?.tripId || '',
      partyMemberId,
      attractionId: attraction.id,
      activityType: getValidActivityType(attraction.type),
      rating: existingRating?.rating || 3, // Default to 3 stars if no existing rating
      heightRestrictionOk: true,
      intensityComfortable: true,
      createdAt: existingRating?.createdAt || '',
      updatedAt: existingRating?.updatedAt || '',
      ...updates
    });
  };

  const getPartyMemberName = (memberId: string) => {
    const member = partyMembers.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  };

  // Check if attraction has height requirements
  const hasHeightRequirement = 'heightRequirement' in attraction && attraction.heightRequirement;
  const isIntenseRide = 'intensity' in attraction && ['high', 'extreme'].includes(attraction.intensity);

  return (
    <div className="bg-surface rounded-xl border border-surface-dark/30 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-surface-dark/30">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Category Icon */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-lg font-medium shadow-sm ${getCategoryColor(attraction.type).replace('text-', 'bg-')}/20 ${getCategoryColor(attraction.type)} border border-current/20`}>
              {getCategoryIcon(attraction.type)}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-ink text-lg mb-1">{attraction.name}</h3>
              <div className="flex items-center space-x-3 text-sm text-ink-light">
                <span className={`px-2 py-1 rounded-md ${getCategoryColor(attraction.type).replace('text-', 'bg-')}/20 ${getCategoryColor(attraction.type)} font-medium`}>
                  {attraction.type}
                </span>
                {'location' in attraction && attraction.location && (
                  <span>{attraction.location}</span>
                )}
                {'duration' in attraction && attraction.duration && (
                  <span>{attraction.duration} min</span>
                )}
              </div>

              {/* Warnings */}
              <div className="flex items-center space-x-2 mt-2">
                {hasHeightRequirement && (
                  <div className="flex items-center text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md">
                    <Ruler className="w-3 h-3 mr-1" />
                    {hasHeightRequirement}" required
                  </div>
                )}
                {isIntenseRide && (
                  <div className="flex items-center text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-md">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    High intensity
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Group Summary */}
            {summary && summary.ratingCount > 0 && (
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <StarRating rating={summary.averageRating || 0} readonly size="sm" />
                  <span className="text-xs text-ink-light">({summary.ratingCount})</span>
                </div>
                <ConsensusIndicator level={summary.consensusLevel} />
              </div>
            )}

            {/* Expand/Collapse */}
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded-lg transition-colors"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Rating Interface - All Party Members Side-by-Side */}
      <div className="p-4 bg-surface-dark/20">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-ink flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Rate for All Party Members
          </h4>

          {/* Party Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {partyMembers.map((member) => {
              const memberRating = ratingsMap.get(member.id);

              return (
                <div key={member.id} className="p-3 bg-surface rounded-lg border border-surface-dark/30">
                  {/* Member Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="font-medium text-ink text-sm">{member.name}</span>
                      {member.isPlanner && (
                        <span className="ml-1 text-xs text-sea">★</span>
                      )}
                    </div>
                    {memberRating && onDeleteRating && (
                      <button
                        onClick={() => onDeleteRating(memberRating.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Compact Preference Selector - Emoji Only */}
                  <div className="space-y-2">
                    <PreferenceSelector
                      value={memberRating?.preferenceType}
                      onChange={(preferenceType) => handleRatingUpdate(member.id, { preferenceType })}
                    />
                  </div>

                  {/* Safety Warnings (if applicable) */}
                  {(hasHeightRequirement || isIntenseRide) && (
                    <div className="mt-2 flex gap-1">
                      {hasHeightRequirement && (
                        <button
                          onClick={() => handleRatingUpdate(member.id, { heightRestrictionOk: !(memberRating?.heightRestrictionOk ?? true) })}
                          className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${
                            memberRating?.heightRestrictionOk !== false
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                          title={`Height requirement ${hasHeightRequirement}" - Click to toggle`}
                        >
                          {memberRating?.heightRestrictionOk !== false ? '✓' : '✗'}
                        </button>
                      )}
                      {isIntenseRide && (
                        <button
                          onClick={() => handleRatingUpdate(member.id, { intensityComfortable: !(memberRating?.intensityComfortable ?? true) })}
                          className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${
                            memberRating?.intensityComfortable !== false
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                          title="High intensity - Click to toggle comfort level"
                        >
                          {memberRating?.intensityComfortable !== false ? '💪' : '😰'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded Section - Group Ratings */}
      {expanded && (
        <div className="p-4 border-t border-surface-dark/30">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-ink">Group Ratings</h4>
              {summary && (
                <div className="text-sm text-ink-light">
                  {summary.mustDoCount > 0 && <span className="text-glow">{summary.mustDoCount} must-do</span>}
                  {summary.avoidCount > 0 && <span className="text-red-400 ml-2">{summary.avoidCount} avoid</span>}
                </div>
              )}
            </div>

            {individualRatings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {individualRatings.map((rating) => (
                  <div key={rating.id} className="p-3 bg-surface-dark/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-ink">{getPartyMemberName(rating.partyMemberId)}</span>
                      {onDeleteRating && (
                        <button
                          onClick={() => onDeleteRating(rating.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <StarRating rating={rating.rating} readonly size="sm" />
                      {rating.preferenceType && (
                        <div className="flex items-center space-x-2">
                          <Heart className="w-3 h-3 text-ink-light" />
                          <span className="text-xs text-ink-light capitalize">{rating.preferenceType.replace('_', ' ')}</span>
                        </div>
                      )}
                      {!rating.heightRestrictionOk && (
                        <div className="text-xs text-orange-400">⚠️ Height restriction concern</div>
                      )}
                      {!rating.intensityComfortable && (
                        <div className="text-xs text-red-400">⚠️ Intensity concern</div>
                      )}
                      {rating.notes && (
                        <p className="text-xs text-ink-light italic">"{rating.notes}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-ink-light">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No ratings from group members yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}