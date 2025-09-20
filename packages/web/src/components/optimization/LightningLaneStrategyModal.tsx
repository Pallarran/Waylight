import { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Check, Clock, DollarSign, Star, Zap, Target } from 'lucide-react';
import { TripDay, ActivityRatingSummary } from '../../types';
import { LightningLaneStrategy, LightningLaneRecommendation } from '../../types/optimization';
import { lightningLaneService } from '../../services/lightningLaneService';

interface LightningLaneStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripDay: TripDay;
  activityRatings: ActivityRatingSummary[];
  groupSize: number;
}

type ModalStep = 'analysis' | 'multipass' | 'individual' | 'summary';

export default function LightningLaneStrategyModal({
  isOpen,
  onClose,
  tripDay,
  activityRatings,
  groupSize
}: LightningLaneStrategyModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('analysis');
  const [strategy, setStrategy] = useState<LightningLaneStrategy | null>(null);
  const [selectedMultiPass, setSelectedMultiPass] = useState<string[]>([]);
  const [selectedIndividualLL, setSelectedIndividualLL] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      generateStrategy();
    }
  }, [isOpen, tripDay, activityRatings, groupSize]);

  const generateStrategy = async () => {
    setIsLoading(true);
    try {
      const llStrategy = await lightningLaneService.generateStrategy(
        tripDay,
        activityRatings,
        groupSize
      );
      setStrategy(llStrategy);

      // Pre-select top recommendations
      setSelectedMultiPass(
        llStrategy.multiPassRecommendations
          .filter(rec => rec.priority >= 8)
          .map(rec => rec.attractionId)
      );
      setSelectedIndividualLL(
        llStrategy.individualLLRecommendations
          .filter(rec => rec.priority >= 9)
          .map(rec => rec.attractionId)
      );
    } catch (error) {
      console.error('Failed to generate Lightning Lane strategy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('analysis');
    setSelectedMultiPass([]);
    setSelectedIndividualLL([]);
    onClose();
  };

  const handleNext = () => {
    if (currentStep === 'analysis') {
      setCurrentStep(strategy?.shouldPurchaseGeneiePlus ? 'multipass' : 'individual');
    } else if (currentStep === 'multipass') {
      setCurrentStep('individual');
    } else if (currentStep === 'individual') {
      setCurrentStep('summary');
    }
  };

  const handleBack = () => {
    if (currentStep === 'multipass') {
      setCurrentStep('analysis');
    } else if (currentStep === 'individual') {
      setCurrentStep(strategy?.shouldPurchaseGeneiePlus ? 'multipass' : 'analysis');
    } else if (currentStep === 'summary') {
      setCurrentStep('individual');
    }
  };

  const toggleMultiPassSelection = (attractionId: string) => {
    setSelectedMultiPass(prev =>
      prev.includes(attractionId)
        ? prev.filter(id => id !== attractionId)
        : [...prev, attractionId]
    );
  };

  const toggleIndividualLLSelection = (attractionId: string) => {
    setSelectedIndividualLL(prev =>
      prev.includes(attractionId)
        ? prev.filter(id => id !== attractionId)
        : [...prev, attractionId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-surface/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {currentStep !== 'analysis' && (
                <button
                  onClick={handleBack}
                  className="btn-secondary btn-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-ink">Lightning Lane Strategy</h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="btn-secondary btn-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className={currentStep === 'analysis' ? 'text-blue-600 font-medium' : ''}>
                Analysis
              </span>
              <span>→</span>
              <span className={currentStep === 'multipass' ? 'text-blue-600 font-medium' : ''}>
                Multi Pass
              </span>
              <span>→</span>
              <span className={currentStep === 'individual' ? 'text-blue-600 font-medium' : ''}>
                Individual LL
              </span>
              <span>→</span>
              <span className={currentStep === 'summary' ? 'text-blue-600 font-medium' : ''}>
                Summary
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Analyzing your day...</span>
              </div>
            ) : (
              <>
                {currentStep === 'analysis' && strategy && (
                  <AnalysisStep strategy={strategy} groupSize={groupSize} />
                )}

                {currentStep === 'multipass' && strategy && (
                  <MultiPassStep
                    recommendations={strategy.multiPassRecommendations}
                    selected={selectedMultiPass}
                    onToggle={toggleMultiPassSelection}
                  />
                )}

                {currentStep === 'individual' && strategy && (
                  <IndividualLLStep
                    recommendations={strategy.individualLLRecommendations}
                    selected={selectedIndividualLL}
                    onToggle={toggleIndividualLLSelection}
                  />
                )}

                {currentStep === 'summary' && strategy && (
                  <SummaryStep
                    strategy={strategy}
                    selectedMultiPass={selectedMultiPass}
                    selectedIndividualLL={selectedIndividualLL}
                    groupSize={groupSize}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!isLoading && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {currentStep === 'analysis' && 'Review the recommendations for your group'}
                {currentStep === 'multipass' && 'Select which attractions to prioritize'}
                {currentStep === 'individual' && 'Consider individual Lightning Lanes'}
                {currentStep === 'summary' && 'Your personalized Lightning Lane strategy'}
              </div>
              <div className="flex items-center space-x-3">
                {currentStep !== 'summary' && (
                  <button
                    onClick={handleNext}
                    className="btn-primary flex items-center"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                )}
                {currentStep === 'summary' && (
                  <button
                    onClick={handleClose}
                    className="btn-primary flex items-center"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    <span>Done</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function AnalysisStep({ strategy, groupSize }: { strategy: LightningLaneStrategy; groupSize: number }) {
  return (
    <div className="space-y-6">
      {/* Purchase Recommendation */}
      <div className={`p-4 rounded-lg border-2 ${
        strategy.shouldPurchaseGeneiePlus
          ? 'border-green-200 bg-green-50'
          : 'border-yellow-200 bg-yellow-50'
      }`}>
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            strategy.shouldPurchaseGeneiePlus ? 'bg-green-500' : 'bg-yellow-500'
          }`}>
            {strategy.shouldPurchaseGeneiePlus ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Clock className="w-4 h-4 text-white" />
            )}
          </div>
          <h3 className="text-lg font-semibold">
            {strategy.shouldPurchaseGeneiePlus
              ? '✅ Recommend purchasing Genie+'
              : '⚠️ Consider alternatives to Genie+'
            }
          </h3>
        </div>
        <div className="space-y-2">
          {strategy.reasoning.map((reason, index) => (
            <p key={index} className="text-sm text-gray-700">• {reason}</p>
          ))}
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Total Cost</span>
          </div>
          <div className="text-2xl font-bold text-ink">
            ${strategy.costAnalysis.totalCost}
          </div>
          <div className="text-xs text-gray-500">
            For {groupSize} {groupSize === 1 ? 'person' : 'people'}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Time Savings</span>
          </div>
          <div className="text-2xl font-bold text-ink">
            {strategy.timeSavings.estimatedMinutes}min
          </div>
          <div className="text-xs text-gray-500">
            {strategy.timeSavings.confidenceLevel} confidence
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium mb-3">Cost Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Genie+ ({groupSize} × ${strategy.costAnalysis.geniePlusCost / groupSize})</span>
            <span>${strategy.costAnalysis.geniePlusCost}</span>
          </div>
          <div className="flex justify-between">
            <span>Individual Lightning Lanes</span>
            <span>${strategy.costAnalysis.individualLLCost}</span>
          </div>
          <div className="border-t pt-2 font-medium flex justify-between">
            <span>Total</span>
            <span>${strategy.costAnalysis.totalCost}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MultiPassStep({
  recommendations,
  selected,
  onToggle
}: {
  recommendations: LightningLaneRecommendation[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Genie+ Priority List</h3>
        <p className="text-sm text-gray-600">
          Select attractions to prioritize for Lightning Lane Multi Pass.
          We recommend booking these in order of priority.
        </p>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={rec.attractionId}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selected.includes(rec.attractionId)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onToggle(rec.attractionId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <h4 className="font-medium">{rec.attractionName}</h4>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">{rec.groupRating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium">~{rec.estimatedSavings}min saved</div>
                  {rec.sellsOutBy && (
                    <div className="text-xs text-red-600">Sells out by {rec.sellsOutBy}</div>
                  )}
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selected.includes(rec.attractionId)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selected.includes(rec.attractionId) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2">
              {rec.reasoning.map((reason, idx) => (
                <p key={idx} className="text-xs text-gray-600">• {reason}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndividualLLStep({
  recommendations,
  selected,
  onToggle
}: {
  recommendations: LightningLaneRecommendation[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Individual Lightning Lanes needed</h3>
        <p className="text-gray-600">
          Based on your group's preferences, we don't recommend any Individual Lightning Lanes for today.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Individual Lightning Lanes</h3>
        <p className="text-sm text-gray-600">
          Consider these premium attractions that require separate Individual Lightning Lane purchases.
        </p>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.attractionId}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selected.includes(rec.attractionId)
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onToggle(rec.attractionId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h4 className="font-medium">{rec.attractionName}</h4>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">{rec.groupRating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium">${rec.cost}/person</div>
                  <div className="text-xs text-gray-600">~{rec.estimatedSavings}min saved</div>
                  {rec.sellsOutBy && (
                    <div className="text-xs text-red-600">Sells out by {rec.sellsOutBy}</div>
                  )}
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selected.includes(rec.attractionId)
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300'
                }`}>
                  {selected.includes(rec.attractionId) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2">
              {rec.reasoning.map((reason, idx) => (
                <p key={idx} className="text-xs text-gray-600">• {reason}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryStep({
  strategy,
  selectedMultiPass,
  selectedIndividualLL,
  groupSize
}: {
  strategy: LightningLaneStrategy;
  selectedMultiPass: string[];
  selectedIndividualLL: string[];
  groupSize: number;
}) {
  const multiPassCost = strategy.shouldPurchaseGeneiePlus ? strategy.costAnalysis.geniePlusCost : 0;
  const selectedIndividualCost = strategy.individualLLRecommendations
    .filter(rec => selectedIndividualLL.includes(rec.attractionId))
    .reduce((sum, rec) => sum + (rec.cost || 0), 0) * groupSize;

  const totalSelectedCost = multiPassCost + selectedIndividualCost;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Your Lightning Lane Strategy</h3>
        <p className="text-sm text-gray-600">
          Here's your personalized strategy based on your selections
        </p>
      </div>

      {/* Cost Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Total Cost</h4>
          <div className="text-2xl font-bold text-blue-600">${totalSelectedCost}</div>
        </div>
        <div className="space-y-1 text-sm text-gray-600">
          {strategy.shouldPurchaseGeneiePlus && (
            <div className="flex justify-between">
              <span>Genie+ Multi Pass</span>
              <span>${multiPassCost}</span>
            </div>
          )}
          {selectedIndividualLL.length > 0 && (
            <div className="flex justify-between">
              <span>Individual Lightning Lanes</span>
              <span>${selectedIndividualCost}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Attractions */}
      {selectedMultiPass.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Multi Pass Targets ({selectedMultiPass.length})</h4>
          <div className="space-y-2">
            {strategy.multiPassRecommendations
              .filter(rec => selectedMultiPass.includes(rec.attractionId))
              .map((rec, index) => (
                <div key={rec.attractionId} className="flex items-center space-x-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span>{rec.attractionName}</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-gray-600">{rec.groupRating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {selectedIndividualLL.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Individual Lightning Lanes ({selectedIndividualLL.length})</h4>
          <div className="space-y-2">
            {strategy.individualLLRecommendations
              .filter(rec => selectedIndividualLL.includes(rec.attractionId))
              .map((rec) => (
                <div key={rec.attractionId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <span>{rec.attractionName}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-gray-600">{rec.groupRating.toFixed(1)}</span>
                    </div>
                  </div>
                  <span className="text-purple-600 font-medium">${rec.cost}/person</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium mb-3">Next Steps</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• Open the Disney Genie app at park opening</p>
          {strategy.shouldPurchaseGeneiePlus && (
            <p>• Purchase Genie+ Multi Pass for your group</p>
          )}
          <p>• Book Lightning Lanes in the order shown above</p>
          <p>• Check availability for Individual Lightning Lanes early</p>
          <p>• Modify your strategy based on real-time availability</p>
        </div>
      </div>
    </div>
  );
}