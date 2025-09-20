import { useState, useEffect } from 'react';
import { X, Zap, Lock, Unlock, TrendingDown, Target, Users, RotateCcw } from 'lucide-react';
import { Trip, TripDay, ActivityRatingSummary } from '@waylight/shared';
import {
  tripOptimizationService,
  OptimizationConstraint,
  OptimizationResult,
  OptimizationStrategy
} from '../../services/tripOptimizationService';
import { getParkName } from '../../data/parks';
import { DayType, detectDayType, getDayTypeInfo } from '../../utils/dayTypeUtils';

interface TripOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onApplyOptimization: (optimizedDays: TripDay[]) => void;
  activityRatings?: ActivityRatingSummary[]; // Optional for now
}

export default function TripOptimizationModal({
  isOpen,
  onClose,
  trip,
  onApplyOptimization,
  activityRatings = []
}: TripOptimizationModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizationStrategy>('crowd_minimization');
  const [constraints, setConstraints] = useState<OptimizationConstraint[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Filter valid trip days (within date range, no duplicates)
  const getValidTripDays = (trip: Trip) => {
    if (!trip || !trip.days) return [];

    const seenDates = new Set<string>();
    return trip.days.filter(day => {
      // Normalize date to YYYY-MM-DD format
      const normalizedDate = day.date.split('T')[0];

      // Check if date is within trip range (inclusive)
      const isWithinRange = normalizedDate >= trip.startDate && normalizedDate <= trip.endDate;

      // Check for duplicates
      const isDuplicate = seenDates.has(normalizedDate);
      seenDates.add(normalizedDate);

      return isWithinRange && !isDuplicate;
    }).sort((a, b) => a.date.localeCompare(b.date));
  };

  const validTripDays = getValidTripDays(trip);

  // Initialize constraints from valid trip days only
  useEffect(() => {
    if (validTripDays.length > 0) {
      const initialConstraints: OptimizationConstraint[] = validTripDays.map((day, index) => {
        // Detect day type if not already set
        const dayType = day.dayType || detectDayType(day, trip, index);

        // Determine if this day type can be optimized
        const canOptimize = dayType === 'park-day' || dayType === 'park-hopper' || dayType === 'rest-day' || dayType === 'disney-springs' || dayType === 'special-event';

        // Auto-lock check-in/check-out days
        const isLocked = dayType === 'check-in' || dayType === 'check-out';

        return {
          dayId: day.id,
          parkId: day.parkId || '',
          isLocked,
          dayType,
          canOptimize,
          reason: isLocked ? `${dayType === 'check-in' ? 'Check-in' : 'Check-out'} day cannot be changed` : undefined
        };
      });
      setConstraints(initialConstraints);
    }
  }, [validTripDays.length]);

  const toggleConstraintLock = (dayId: string) => {
    setConstraints(prev =>
      prev.map(constraint => {
        if (constraint.dayId === dayId) {
          // Don't allow unlocking of check-in/check-out days
          if (constraint.dayType === 'check-in' || constraint.dayType === 'check-out') {
            return constraint;
          }
          return { ...constraint, isLocked: !constraint.isLocked };
        }
        return constraint;
      })
    );
  };

  const strategyOptions = [
    {
      id: 'crowd_minimization' as OptimizationStrategy,
      name: 'Minimize Crowds',
      description: 'Assign parks to days with lowest crowd predictions',
      icon: TrendingDown,
      color: 'text-green-600'
    },
    {
      id: 'must_do_priority' as OptimizationStrategy,
      name: 'Must-Do Priority',
      description: 'Give best crowd days to parks with most must-do attractions',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      id: 'group_consensus' as OptimizationStrategy,
      name: 'Group Harmony',
      description: 'Easier days for parks with rating conflicts',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      id: 'energy_management' as OptimizationStrategy,
      name: 'Energy Management',
      description: 'Schedule intensive parks early in trip',
      icon: Zap,
      color: 'text-orange-600'
    }
  ];

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      // Create a filtered trip with only valid days
      const filteredTrip = {
        ...trip,
        days: validTripDays
      };

      console.log('Optimizing trip with filtered days:', {
        originalDayCount: trip.days.length,
        filteredDayCount: validTripDays.length,
        validDates: validTripDays.map(d => d.date)
      });

      const result = await tripOptimizationService.optimizeTrip(filteredTrip, activityRatings, {
        strategy: selectedStrategy,
        constraints: constraints
      });

      setOptimizationResult(result);
      setShowPreview(true);
    } catch (error) {
      console.error('Optimization failed:', error);
      // TODO: Show error message to user
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyChanges = () => {
    if (optimizationResult) {
      // TODO: Apply optimization changes to trip
      onClose();
    }
  };

  const handleReset = () => {
    setOptimizationResult(null);
    setShowPreview(false);
    setConstraints(prev => prev.map(c => ({ ...c, isLocked: false })));
  };

  // Helper function to format dates without timezone issues
  const formatDateSafe = (dateString: string) => {
    try {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sea/10 rounded-lg">
              <Zap className="w-5 h-5 text-sea" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Optimize Trip</h2>
              <p className="text-sm text-ink-light">Improve your park assignments with smart optimization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!showPreview ? (
            /* Configuration Phase */
            <div className="space-y-6">
              {/* Strategy Selection */}
              <div>
                <h3 className="text-lg font-medium text-ink mb-4">Choose Optimization Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strategyOptions.map(strategy => {
                    const IconComponent = strategy.icon;
                    return (
                      <label
                        key={strategy.id}
                        className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedStrategy === strategy.id
                            ? 'border-sea bg-sea/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="strategy"
                          value={strategy.id}
                          checked={selectedStrategy === strategy.id}
                          onChange={(e) => setSelectedStrategy(e.target.value as OptimizationStrategy)}
                          className="sr-only"
                        />
                        <div className="flex items-start space-x-3">
                          <IconComponent className={`w-5 h-5 mt-0.5 ${strategy.color}`} />
                          <div>
                            <div className="font-medium text-ink">{strategy.name}</div>
                            <div className="text-sm text-ink-light">{strategy.description}</div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Constraints */}
              <div>
                <h3 className="text-lg font-medium text-ink mb-4">Day Constraints</h3>
                <p className="text-sm text-ink-light mb-4">
                  Check-in/out days are automatically fixed. Lock other days that can't be changed (e.g., dinner reservations, special events).
                  Rest days and park days can receive optimization recommendations.
                </p>
                <div className="space-y-3">
                  {validTripDays.map((day, index) => {
                    const constraint = constraints.find(c => c.dayId === day.id);
                    const isLocked = constraint?.isLocked || false;
                    const dayType = constraint?.dayType || detectDayType(day, trip, index);
                    const dayTypeInfo = getDayTypeInfo(dayType);
                    const canOptimize = constraint?.canOptimize ?? true;

                    return (
                      <div
                        key={day.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isLocked ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{dayTypeInfo.icon}</span>
                            <div className="text-sm font-medium text-ink">
                              {formatDateSafe(day.date)}
                            </div>
                          </div>
                          <div className="text-sm text-ink-light">→</div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-ink">{getParkName(day.parkId) || 'No park selected'}</div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${dayTypeInfo.color} bg-gray-100`}>
                              {dayTypeInfo.name}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleConstraintLock(day.id)}
                          disabled={dayType === 'check-in' || dayType === 'check-out'}
                          title={constraint?.reason || (isLocked ? 'Click to unlock for optimization' : 'Click to lock assignment')}
                          className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-lg transition-colors ${
                            dayType === 'check-in' || dayType === 'check-out'
                              ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                              : isLocked
                              ? 'text-orange-600 bg-orange-100 hover:bg-orange-200'
                              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          <span>
                            {dayType === 'check-in' || dayType === 'check-out'
                              ? 'Fixed'
                              : isLocked ? 'Locked' : 'Unlocked'
                            }
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Results Preview Phase */
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Optimization Complete!</span>
                </div>
                <div className="text-sm text-green-700">
                  Found {optimizationResult?.totalCrowdReduction}% reduction in overall crowd exposure
                  with {optimizationResult?.improvementScore}% confidence score.
                </div>
              </div>

              {/* Before/After Comparison */}
              <div>
                <h3 className="text-lg font-medium text-ink mb-4">Recommended Changes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-ink mb-3">Current Assignment</h4>
                    <div className="space-y-2">
                      {optimizationResult?.originalAssignment.map(assignment => (
                        <div key={assignment.dayId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm">
                            {formatDateSafe(assignment.date)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{getParkName(assignment.parkId)}</span>
                            {assignment.crowdLevel && (
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  assignment.crowdLevel <= 2 ? 'bg-green-500' :
                                  assignment.crowdLevel <= 4 ? 'bg-blue-500' :
                                  assignment.crowdLevel <= 6 ? 'bg-yellow-500' :
                                  assignment.crowdLevel <= 8 ? 'bg-orange-500' : 'bg-red-500'
                                }`}></div>
                                <span className="text-xs text-gray-500">{assignment.crowdLevel}/10</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-ink mb-3">Optimized Assignment</h4>
                    <div className="space-y-2">
                      {optimizationResult?.optimizedAssignment.map(assignment => (
                        <div key={assignment.dayId} className="flex items-center justify-between p-3 bg-sea/5 border border-sea/20 rounded-lg">
                          <span className="text-sm">
                            {formatDateSafe(assignment.date)}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{getParkName(assignment.parkId)}</span>
                            {assignment.crowdLevel && (
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  assignment.crowdLevel <= 2 ? 'bg-green-500' :
                                  assignment.crowdLevel <= 4 ? 'bg-blue-500' :
                                  assignment.crowdLevel <= 6 ? 'bg-yellow-500' :
                                  assignment.crowdLevel <= 8 ? 'bg-orange-500' : 'bg-red-500'
                                }`}></div>
                                <span className="text-xs text-gray-500">{assignment.crowdLevel}/10</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            {showPreview && (
              <button
                onClick={handleReset}
                className="btn-secondary flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            {!showPreview ? (
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="btn-primary flex items-center"
              >
                {isOptimizing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Optimize Trip
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleApplyChanges}
                className="btn-primary"
              >
                Apply Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}