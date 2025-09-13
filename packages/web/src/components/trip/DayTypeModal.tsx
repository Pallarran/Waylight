import { X } from 'lucide-react';
import { DayType, Trip, TripDay } from '../../types';
import { getDayTypeInfo, detectDayType } from '../../utils/dayTypeUtils';

interface DayTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  tripDay: TripDay;
  dayIndex: number;
  onSelectDayType: (dayType: DayType | null) => Promise<void>;
}

export default function DayTypeModal({ 
  isOpen, 
  onClose, 
  trip, 
  tripDay, 
  dayIndex, 
  onSelectDayType 
}: DayTypeModalProps) {
  if (!isOpen) return null;

  const detectedDayType = detectDayType(tripDay, trip, dayIndex);
  const currentDayType = tripDay.dayType || detectedDayType;

  const handleSelectDayType = async (dayType: DayType | null) => {
    await onSelectDayType(dayType);
    onClose();
  };

  const dayTypes: DayType[] = [
    'park-day', 
    'park-hopper', 
    'check-in', 
    'check-out', 
    'rest-day', 
    'disney-springs', 
    'special-event'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl border border-surface-dark shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-dark/30">
          <div>
            <h2 className="text-xl font-semibold text-ink">Choose Day Type</h2>
            <p className="text-sm text-ink-light mt-1">
              Customize the layout and features for this day
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Status */}
          <div className="mb-6 p-4 bg-surface-dark/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getDayTypeInfo(currentDayType).icon}</span>
              <div>
                <div className="font-medium text-ink">{getDayTypeInfo(currentDayType).name}</div>
                <div className="text-sm text-ink-light">
                  {tripDay.dayType ? 'Manually selected' : 'Auto-detected'}
                </div>
              </div>
            </div>
          </div>

          {/* Day Type Options */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-ink mb-4">Available day types:</div>
            
            {dayTypes.map((dayType) => {
              const dayTypeInfo = getDayTypeInfo(dayType);
              const isSelected = tripDay.dayType === dayType;
              const isDetected = !tripDay.dayType && detectedDayType === dayType;
              
              return (
                <button
                  key={dayType}
                  onClick={() => handleSelectDayType(dayType)}
                  className={`w-full p-4 rounded-lg border text-left transition-all hover:scale-[0.99] ${
                    isSelected
                      ? 'border-sea bg-sea/10 text-sea shadow-sm'
                      : isDetected 
                        ? 'border-purple-500/50 bg-purple-500/10 text-purple-500 shadow-sm'
                        : 'border-surface-dark text-ink-light hover:border-sea/50 hover:bg-surface-dark/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{dayTypeInfo.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-base">{dayTypeInfo.name}</div>
                      <div className="text-sm opacity-75 mt-1">{dayTypeInfo.description}</div>
                      {isSelected && (
                        <div className="text-xs text-sea mt-1 font-medium">✓ Currently selected</div>
                      )}
                      {isDetected && !isSelected && (
                        <div className="text-xs text-purple-500 mt-1 font-medium">Auto-detected</div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reset Option */}
          {tripDay.dayType && (
            <div className="mt-6 pt-4 border-t border-surface-dark/30">
              <button
                onClick={() => handleSelectDayType(null)}
                className="w-full p-3 text-sm text-ink-light hover:text-ink border border-surface-dark rounded-lg hover:bg-surface-dark/50 transition-colors"
              >
                Reset to auto-detect ({getDayTypeInfo(detectedDayType).name})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}