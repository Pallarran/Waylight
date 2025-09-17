import { useState, useEffect } from 'react';
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

  // Map preference types to rating values
  const getPreferenceRating = (preferenceType?: string): number => {
    const ratingMap: Record<string, number> = {
      'must_do': 5,      // ⭐ = 5 stars
      'want_to_do': 4,   // 👍 = 4 stars
      'neutral': 3,      // 😐 = 3 stars
      'skip': 2,         // ⏭️ = 2 stars
      'avoid': 1         // ❌ = 1 star
    };
    return preferenceType ? ratingMap[preferenceType] || 3 : 3;
  };

  // Helper function to check if member meets height requirement
  const checkHeightRequirement = (member: TravelingPartyMember, heightRequirement: number): boolean => {
    if (!member.height) return false;
    const heightInInches = parseFloat(member.height);
    return !isNaN(heightInInches) && heightInInches >= heightRequirement;
  };

  // Helper function to check if member is a child
  const isChild = (member: TravelingPartyMember): boolean => {
    return member.guestType?.toLowerCase() === 'child';
  };

  const handleRatingUpdate = (partyMemberId: string, updates: Partial<ActivityRating>) => {
    const existingRating = ratingsMap.get(partyMemberId);
    const member = partyMembers.find(m => m.id === partyMemberId);

    // Calculate rating based on preference type
    const newPreferenceType = updates.preferenceType || existingRating?.preferenceType;
    const calculatedRating = getPreferenceRating(newPreferenceType);

    // Auto-calculate height restriction for children
    let heightRestrictionOk = true; // Default for adults
    if (member && isChild(member) && hasHeightRequirement) {
      heightRestrictionOk = checkHeightRequirement(member, hasHeightRequirement);
    }

    onRatingChange?.({
      ...existingRating,
      tripId: existingRating?.tripId || '',
      partyMemberId,
      attractionId: attraction.id,
      activityType: getValidActivityType(attraction.type),
      rating: calculatedRating, // Use calculated rating based on preference
      heightRestrictionOk: updates.heightRestrictionOk !== undefined ? updates.heightRestrictionOk : heightRestrictionOk,
      intensityComfortable: true, // Remove intensity checking
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


  // Check for refurbishment in description text
  const isRefurbishment = 'description' in attraction &&
    attraction.description &&
    (attraction.description.toLowerCase().includes('currently closed') ||
     attraction.description.toLowerCase().includes('closed for refurbishment') ||
     attraction.description.toLowerCase().includes('temporarily closed'));

  // Auto-calculate height restrictions for children when component loads
  useEffect(() => {
    if (!hasHeightRequirement || !partyMembers.length || !onRatingChange) return;

    partyMembers.forEach(member => {
      if (isChild(member)) {
        const existingRating = ratingsMap.get(member.id);
        const currentHeightOk = existingRating?.heightRestrictionOk;
        const calculatedHeightOk = checkHeightRequirement(member, hasHeightRequirement);

        // Only update if the calculated value differs from current value or no rating exists
        if (currentHeightOk !== calculatedHeightOk || !existingRating) {
          onRatingChange({
            ...existingRating,
            tripId: existingRating?.tripId || '',
            partyMemberId: member.id,
            attractionId: attraction.id,
            activityType: getValidActivityType(attraction.type),
            rating: existingRating?.rating || 3,
            heightRestrictionOk: calculatedHeightOk,
            intensityComfortable: true,
            createdAt: existingRating?.createdAt || '',
            updatedAt: existingRating?.updatedAt || '',
            preferenceType: existingRating?.preferenceType
          });
        }
      }
    });
  }, [partyMembers, hasHeightRequirement, onRatingChange]);

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
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-ink-light">
                <span className={`px-2 py-1 rounded-md ${getCategoryColor(attraction.type).replace('text-', 'bg-')}/20 ${getCategoryColor(attraction.type)} font-medium`}>
                  {attraction.type}
                </span>
                {'location' in attraction && attraction.location && (
                  <span>{attraction.location}</span>
                )}
                {'duration' in attraction && attraction.duration && (
                  <span>{attraction.duration} min</span>
                )}
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
                {isRefurbishment && (
                  <div className="flex items-center text-xs text-gray-500 bg-gray-200/20 px-2 py-1 rounded-md">
                    <X className="w-3 h-3 mr-1" />
                    Closed for refurbishment
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

                  {/* Height Warning (only for children with height requirements) */}
                  {hasHeightRequirement && isChild(member) && (
                    <div className="mt-2">
                      {/* Height requirement status */}
                      <div className="flex items-center gap-2">
                        {!member.height ? (
                          /* No height set - show prompt */
                          <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded flex items-center gap-1">
                            <span>⚠️</span>
                            Set height in Overview tab
                          </span>
                        ) : (
                          /* Height set - show status */
                          <div className="flex items-center gap-2">
                            {checkHeightRequirement(member, hasHeightRequirement) ? (
                              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded flex items-center gap-1">
                                <span>✓</span>
                                Meets {hasHeightRequirement}" requirement
                              </span>
                            ) : (
                              <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded flex items-center gap-1">
                                <span>✗</span>
                                Below {hasHeightRequirement}" requirement ({member.height}")
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}