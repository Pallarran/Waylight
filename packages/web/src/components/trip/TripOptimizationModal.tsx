import { useState, useEffect } from 'react';
import { X, Zap, Lock, Unlock, TrendingDown, Target, Users, RotateCcw, CheckCircle } from 'lucide-react';
import { Trip, TripDay, ActivityRatingSummary } from '@waylight/shared';
import {
  tripOptimizationService,
  OptimizationConstraint,
  OptimizationResult,
  OptimizationStrategy,
  OptimizationAlternative
} from '../../services/tripOptimizationService';
import { getParkName, getParkById } from '../../data/parks';
import { crowdPredictionRepository } from '@waylight/shared';
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


      const result = await tripOptimizationService.optimizeTrip(filteredTrip, activityRatings, {
        strategy: selectedStrategy,
        constraints: constraints
      });

      setOptimizationResult(result);
      setShowPreview(true);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string>('');

  // Auto-select the first (recommended) alternative when results are loaded
  useEffect(() => {
    if (optimizationResult?.alternatives?.length > 0) {
      setSelectedAlternativeId(optimizationResult.alternatives[0].id);
    }
  }, [optimizationResult]);

  const handleApplyChanges = () => {
    if (optimizationResult) {
      const selectedAlternative = optimizationResult.alternatives.find(alt => alt.id === selectedAlternativeId);
      if (selectedAlternative) {
        // Convert assignments back to TripDay format
        const optimizedDays = trip.days.map(day => {
          const assignment = selectedAlternative.assignment.find(a => a.dayId === day.id);
          if (assignment && assignment.parkId !== day.parkId) {
            return { ...day, parkId: assignment.parkId };
          }
          return day;
        });

        onApplyOptimization(optimizedDays);
      }
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

  // Helper function to get park icon from parks data
  const getParkIcon = (parkId: string): string => {
    const park = getParkById(parkId);
    return park?.icon || '🏞️'; // Default park icon
  };

  // State for crowd data
  const [crowdData, setCrowdData] = useState<Map<string, Map<string, number>>>(new Map());

  // Load crowd data when trip changes
  useEffect(() => {
    const loadCrowdData = async () => {
      const data = new Map<string, Map<string, number>>();

      // Get unique park IDs from trip days
      const parkIds = [...new Set(validTripDays.map(day => day.parkId).filter(Boolean))];

      for (const parkId of parkIds) {
        const parkCrowdData = new Map<string, number>();

        for (const day of validTripDays) {
          try {
            const prediction = await crowdPredictionRepository.getCrowdPredictionForDate(parkId, day.date);
            if (prediction) {
              parkCrowdData.set(day.date, prediction.crowdLevel);
            }
          } catch (error) {
            // Silently fail for missing data
          }
        }

        if (parkCrowdData.size > 0) {
          data.set(parkId, parkCrowdData);
        }
      }

      setCrowdData(data);
    };

    if (validTripDays.length > 0) {
      loadCrowdData();
    }
  }, [validTripDays.length]);

  // Helper function to get crowd level for a specific date
  const getCrowdLevelForDay = (date: string, parkId?: string): number | null => {
    if (!parkId) return null;
    return crowdData.get(parkId)?.get(date) || null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-sea/5 to-transparent">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-sea/15 rounded-xl">
              <Zap className="w-6 h-6 text-sea" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-ink">Trip Optimizer</h2>
              <p className="text-sm text-gray-600">Find the perfect park schedule for your visit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-160px)]">
          {!showPreview ? (
            /* Configuration Phase */
            <div className="space-y-8">
              {/* Current Schedule Preview */}
              <div className="px-6 pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <h3 className="text-base font-medium text-gray-600">Current Schedule</h3>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                    {validTripDays.map((day, index) => {
                      const constraint = constraints.find(c => c.dayId === day.id);
                      const isLocked = constraint?.isLocked || false;
                      const dayType = constraint?.dayType || detectDayType(day, trip, index);
                      const dayTypeInfo = getDayTypeInfo(dayType);
                      const isFixed = dayType === 'check-in' || dayType === 'check-out';
                      const isParkDay = dayType === 'park-day';

                      const parkName = getParkName(day.parkId);

                      return (
                        <div key={day.id} className="relative min-w-0">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1 font-medium">
                              {formatDateSafe(day.date).split(' ')[0]} {/* Show "Mon" */}
                            </div>
                            <div className="text-xs text-gray-600 mb-2 font-medium">
                              {formatDateSafe(day.date).split(' ').slice(1).join(' ')} {/* Show "Nov 15" */}
                            </div>
                            <div className={`relative bg-white rounded-lg p-2 border-2 shadow-sm transition-all min-h-[110px] flex flex-col justify-between ${
                              isFixed
                                ? 'border-gray-300 bg-gray-100'
                                : isLocked
                                  ? 'border-orange-300 bg-orange-50'
                                  : 'border-green-300 bg-green-50'
                            }`}>
                              <div className="flex-1 flex flex-col items-center">
                                <div className="text-base mb-1">
                                  {isParkDay ? getParkIcon(day.parkId) : dayTypeInfo.icon}
                                </div>
                                <div className="text-xs font-medium text-gray-800 mb-1 leading-tight text-center">
                                  {isParkDay ? (parkName || 'No Park') : dayTypeInfo.name}
                                </div>

                                {/* Show crowd level for park days */}
                                {isParkDay && (() => {
                                  const crowdLevel = getCrowdLevelForDay(day.date, day.parkId);
                                  return crowdLevel && (
                                    <div className="flex items-center justify-center space-x-1 mb-1">
                                      <div className={`w-2 h-2 rounded-full ${
                                        crowdLevel <= 2 ? 'bg-green-500' :
                                        crowdLevel <= 4 ? 'bg-blue-500' :
                                        crowdLevel <= 6 ? 'bg-yellow-500' :
                                        crowdLevel <= 8 ? 'bg-orange-500' : 'bg-red-500'
                                      }`}></div>
                                      <span className="text-xs text-gray-600">{crowdLevel}/10</span>
                                    </div>
                                  );
                                })()}
                              </div>

                              {!isFixed && (
                                <button
                                  onClick={() => toggleConstraintLock(day.id)}
                                  className={`w-full flex items-center justify-center text-xs px-1 py-0.5 rounded transition-colors ${
                                    isLocked
                                      ? 'text-orange-700 bg-orange-200 hover:bg-orange-300'
                                      : 'text-green-700 bg-green-200 hover:bg-green-300'
                                  }`}
                                >
                                  {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                </button>
                              )}
                              {isFixed && (
                                <div className="w-full flex items-center justify-center text-xs px-1 py-0.5 rounded bg-gray-200 text-gray-500">
                                  <Lock className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Strategy Selection */}
              <div className="px-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Zap className="w-5 h-5 text-sea" />
                  <h3 className="text-lg font-medium text-ink">Choose Your Strategy</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {strategyOptions.map(strategy => {
                    const IconComponent = strategy.icon;
                    return (
                      <label
                        key={strategy.id}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedStrategy === strategy.id
                            ? 'border-sea bg-sea/10 text-sea'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                        <div className={`p-1.5 rounded ${selectedStrategy === strategy.id ? 'bg-sea/20' : 'bg-gray-100'}`}>
                          <IconComponent className={`w-4 h-4 ${selectedStrategy === strategy.id ? 'text-sea' : strategy.color}`} />
                        </div>
                        <span className="font-medium text-sm">{strategy.name}</span>
                        {selectedStrategy === strategy.id && (
                          <CheckCircle className="w-4 h-4 text-sea" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Constraints Helper Text */}
              <div className="px-6 pb-6">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Click the lock buttons above to prevent specific days from being changed during optimization.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Results Preview Phase */
            <div className="space-y-8">
              <div className="px-6 pt-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingDown className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-green-800 text-lg">Optimization Complete!</div>
                        <div className="text-sm text-green-600">Found better scheduling options for your trip</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-700">
                        {optimizationResult?.alternatives?.[0]?.benefits?.crowdReduction || 0}%
                      </div>
                      <div className="text-xs text-green-600">crowd reduction</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="text-green-700">{optimizationResult?.confidence}% confidence</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="w-4 h-4 text-green-600" />
                        <span className="text-green-700">{optimizationResult?.summary?.totalAlternatives || 0} alternatives</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Schedule Comparison */}
              <div className="px-6 space-y-8">
                {/* Current Schedule */}
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <h4 className="font-medium text-gray-600">Current Schedule</h4>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                      {optimizationResult?.originalAssignment.map(assignment => (
                        <div key={assignment.dayId} className="text-center min-w-0">
                          <div className="text-xs text-gray-500 mb-1 font-medium">
                            {formatDateSafe(assignment.date).split(' ')[0]} {/* Show "Mon" */}
                          </div>
                          <div className="text-xs text-gray-600 mb-2 font-medium">
                            {formatDateSafe(assignment.date).split(' ').slice(1).join(' ')} {/* Show "Nov 15" */}
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm min-h-[110px] flex flex-col justify-between">
                            <div className="flex-1 flex flex-col items-center">
                              <div className="text-base mb-1">
                                {assignment.parkId ? getParkIcon(assignment.parkId) : '🏨'}
                              </div>
                              <div className="text-xs font-medium text-gray-800 mb-1 leading-tight text-center">
                                {getParkName(assignment.parkId) || 'Rest'}
                              </div>
                              {assignment.crowdLevel && (
                                <div className="flex items-center justify-center space-x-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    assignment.crowdLevel <= 2 ? 'bg-green-500' :
                                    assignment.crowdLevel <= 4 ? 'bg-blue-500' :
                                    assignment.crowdLevel <= 6 ? 'bg-yellow-500' :
                                    assignment.crowdLevel <= 8 ? 'bg-orange-500' : 'bg-red-500'
                                  }`}></div>
                                  <span className="text-xs text-gray-600">{assignment.crowdLevel}/10</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alternative Schedules */}
                {optimizationResult?.alternatives?.map((alternative, index) => (
                  <div key={alternative.id} className="relative">
                    <label
                      htmlFor={`alternative-${alternative.id}`}
                      className={`block cursor-pointer transition-all duration-300 ${
                        selectedAlternativeId === alternative.id
                          ? 'transform scale-[1.02]'
                          : 'hover:transform hover:scale-[1.01]'
                      }`}
                    >
                      <div className={`rounded-xl border-2 transition-all duration-200 ${
                        selectedAlternativeId === alternative.id
                          ? index === 0
                            ? 'border-sea bg-gradient-to-r from-sea/10 to-sea/5 shadow-lg'
                            : 'border-blue-400 bg-gradient-to-r from-blue-100 to-blue-50 shadow-lg'
                          : index === 0
                            ? 'border-sea/30 bg-gradient-to-r from-sea/5 to-transparent'
                            : 'border-blue-200 bg-gradient-to-r from-blue-50 to-transparent'
                      }`}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 pb-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id={`alternative-${alternative.id}`}
                              name="selectedAlternative"
                              value={alternative.id}
                              checked={selectedAlternativeId === alternative.id}
                              onChange={(e) => setSelectedAlternativeId(e.target.value)}
                              className="w-5 h-5 text-sea border-gray-300 focus:ring-sea focus:ring-2"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-ink text-lg">{alternative.name}</span>
                                {index === 0 && (
                                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200">
                                    ⭐ Recommended
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Click to select this optimization strategy
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-700">{alternative.score}</div>
                            <div className="text-xs text-gray-500">score</div>
                          </div>
                        </div>
                        {/* Schedule Grid */}
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                            {alternative.assignment.map(assignment => (
                              <div key={assignment.dayId} className="text-center min-w-0">
                                <div className="text-xs text-gray-500 mb-1 font-medium">
                                  {formatDateSafe(assignment.date).split(' ')[0]} {/* Show "Mon" */}
                                </div>
                                <div className="text-xs text-gray-600 mb-2 font-medium">
                                  {formatDateSafe(assignment.date).split(' ').slice(1).join(' ')} {/* Show "Nov 15" */}
                                </div>
                                <div className={`bg-white rounded-lg p-2 border-2 shadow-sm transition-all min-h-[110px] flex flex-col justify-between ${
                                  selectedAlternativeId === alternative.id
                                    ? index === 0
                                      ? 'border-sea/60 shadow-sea/20'
                                      : 'border-blue-400 shadow-blue/20'
                                    : 'border-gray-200'
                                }`}>
                                  <div className="flex-1 flex flex-col items-center">
                                    <div className="text-base mb-1">
                                      {assignment.parkId ? getParkIcon(assignment.parkId) : '🏨'}
                                    </div>
                                    <div className="text-xs font-medium text-gray-800 mb-1 leading-tight text-center">
                                      {getParkName(assignment.parkId) || 'Rest'}
                                    </div>
                                    {assignment.crowdLevel && (
                                      <div className="flex items-center justify-center space-x-1">
                                        <div className={`w-2 h-2 rounded-full ${
                                          assignment.crowdLevel <= 2 ? 'bg-green-500' :
                                          assignment.crowdLevel <= 4 ? 'bg-blue-500' :
                                          assignment.crowdLevel <= 6 ? 'bg-yellow-500' :
                                          assignment.crowdLevel <= 8 ? 'bg-orange-500' : 'bg-red-500'
                                        }`}></div>
                                        <span className="text-xs text-gray-600">{assignment.crowdLevel}/10</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Benefits Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pb-4">
                          <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                            <div className="flex items-center justify-center mb-1">
                              <TrendingDown className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {alternative.benefits.crowdReduction}%
                            </div>
                            <div className="text-xs text-gray-600 font-medium">Crowd Reduction</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
                            <div className="flex items-center justify-center mb-1">
                              <Target className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {alternative.benefits.activityAlignment}%
                            </div>
                            <div className="text-xs text-gray-600 font-medium">Activity Match</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                            <div className="flex items-center justify-center mb-1">
                              <Users className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="text-lg font-bold text-purple-600">
                              {alternative.benefits.energyBalance}%
                            </div>
                            <div className="text-xs text-gray-600 font-medium">Energy Balance</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center border border-orange-200">
                            <div className="flex items-center justify-center mb-1">
                              <CheckCircle className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="text-lg font-bold text-orange-600">
                              {alternative.benefits.totalSavings.waitTimeHours}h
                            </div>
                            <div className="text-xs text-gray-600 font-medium">Time Saved</div>
                          </div>
                        </div>

                        {/* Highlights */}
                        {alternative.benefits.highlights.length > 0 && (
                          <div className="px-4 pb-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="space-y-2">
                                {alternative.benefits.highlights.map((highlight, idx) => (
                                  <div key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="leading-relaxed">{highlight}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center space-x-3">
            {showPreview && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            {!showPreview ? (
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="px-6 py-2 bg-sea text-white rounded-lg hover:bg-sea/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center font-medium shadow-lg hover:shadow-xl"
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
                className="px-6 py-2 bg-sea text-white rounded-lg hover:bg-sea/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center font-medium shadow-lg hover:shadow-xl"
                disabled={!selectedAlternativeId}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply {optimizationResult?.alternatives?.find(alt => alt.id === selectedAlternativeId)?.name || 'Selected'} Schedule
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}