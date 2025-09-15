import { X, ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';
import { DayType, Trip, TripDay, Park } from '../../types';
import { getDayTypeInfo, detectDayType } from '../../utils/dayTypeUtils';
import { PARKS } from '../../data/parks';

interface DayTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  tripDay: TripDay;
  dayIndex: number;
  onSelectDayType: (dayType: DayType | null, selectedParks?: string[]) => Promise<void>;
}

export default function DayTypeModal({
  isOpen,
  onClose,
  trip,
  tripDay,
  dayIndex,
  onSelectDayType
}: DayTypeModalProps) {
  const [modalStep, setModalStep] = useState<'day-type' | 'park-selection' | 'park-hopper-selection'>('day-type');
  const [selectedDayType, setSelectedDayType] = useState<DayType | null>(null);
  const [selectedParks, setSelectedParks] = useState<string[]>([]);

  if (!isOpen) return null;

  const detectedDayType = detectDayType(tripDay, trip, dayIndex);
  const currentDayType = tripDay.dayType || detectedDayType;

  const handleDayTypeClick = async (dayType: DayType | null) => {
    if (dayType === 'park-day') {
      setSelectedDayType(dayType);
      setModalStep('park-selection');
    } else if (dayType === 'park-hopper') {
      setSelectedDayType(dayType);
      setModalStep('park-hopper-selection');
    } else {
      // Handle other day types immediately
      await onSelectDayType(dayType);
      onClose();
      resetModalState();
    }
  };

  const handleSingleParkSelection = async (parkId: string) => {
    await onSelectDayType(selectedDayType, [parkId]);
    onClose();
    resetModalState();
  };

  const handleParkToggle = (parkId: string) => {
    setSelectedParks(prev =>
      prev.includes(parkId)
        ? prev.filter(id => id !== parkId)
        : [...prev, parkId]
    );
  };

  const handleParkHopperConfirm = async () => {
    if (selectedParks.length >= 2) {
      await onSelectDayType(selectedDayType, selectedParks);
      onClose();
      resetModalState();
    }
  };

  const resetModalState = () => {
    setModalStep('day-type');
    setSelectedDayType(null);
    setSelectedParks([]);
  };

  const goBack = () => {
    setModalStep('day-type');
    setSelectedDayType(null);
    setSelectedParks([]);
  };

  const handleClose = () => {
    onClose();
    resetModalState();
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

  const renderParkCard = (park: Park, isMultiSelect: boolean = false) => {
    const isSelected = selectedParks.includes(park.id);

    return (
      <button
        key={park.id}
        onClick={() => isMultiSelect ? handleParkToggle(park.id) : handleSingleParkSelection(park.id)}
        className={`relative p-4 rounded-xl border-2 text-center transition-all hover:scale-[0.98] ${
          isSelected
            ? 'border-sea bg-sea/10 shadow-lg'
            : 'border-surface-dark hover:border-sea/50 hover:bg-surface-dark/30'
        }`}
      >
        {isMultiSelect && isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-sea rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        <div className="text-4xl mb-2">{park.icon}</div>
        <div className="font-bold text-lg text-ink mb-1">{park.abbreviation}</div>
        <div className="text-sm text-ink-light font-medium">{park.name}</div>
        <div className="text-xs text-ink-light mt-2 px-2 leading-tight">{park.description}</div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl border border-surface-dark shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-dark/30">
          <div className="flex items-center">
            {modalStep !== 'day-type' && (
              <button
                onClick={goBack}
                className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded-lg transition-colors mr-3"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-ink">
                {modalStep === 'day-type' && 'Choose Day Type'}
                {modalStep === 'park-selection' && 'Select Park'}
                {modalStep === 'park-hopper-selection' && 'Select Parks for Park Hopper'}
              </h2>
              <p className="text-sm text-ink-light mt-1">
                {modalStep === 'day-type' && 'Customize the layout and features for this day'}
                {modalStep === 'park-selection' && 'Choose which park you\'ll visit'}
                {modalStep === 'park-hopper-selection' && `Select 2-4 parks • ${selectedParks.length} of 4 selected`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {modalStep === 'day-type' && (
            <>
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
              <div>
                <div className="text-sm font-medium text-ink mb-4">Available day types:</div>
                <div className="grid grid-cols-3 gap-4">
                  {dayTypes.map((dayType) => {
                    const dayTypeInfo = getDayTypeInfo(dayType);
                    const isSelected = tripDay.dayType === dayType;
                    const isDetected = !tripDay.dayType && detectedDayType === dayType;

                    return (
                      <button
                        key={dayType}
                        onClick={() => handleDayTypeClick(dayType)}
                        className={`p-4 rounded-lg border text-center transition-all hover:scale-[0.98] ${
                          isSelected
                            ? 'border-sea bg-sea/10 text-sea shadow-sm'
                            : isDetected
                              ? 'border-purple-500/50 bg-purple-500/10 text-purple-500 shadow-sm'
                              : 'border-surface-dark text-ink-light hover:border-sea/50 hover:bg-surface-dark/50'
                        }`}
                      >
                        <div className="text-2xl mb-2">{dayTypeInfo.icon}</div>
                        <div className="font-medium text-base mb-1">{dayTypeInfo.name}</div>
                        <div className="text-xs opacity-75 leading-tight px-1">{dayTypeInfo.description}</div>
                        {isSelected && (
                          <div className="text-xs text-sea mt-2 font-medium">✓ Currently selected</div>
                        )}
                        {isDetected && !isSelected && (
                          <div className="text-xs text-purple-500 mt-2 font-medium">Auto-detected</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset Option */}
              {tripDay.dayType && (
                <div className="mt-6 pt-4 border-t border-surface-dark/30">
                  <button
                    onClick={() => handleDayTypeClick(null)}
                    className="w-full p-3 text-sm text-ink-light hover:text-ink border border-surface-dark rounded-lg hover:bg-surface-dark/50 transition-colors"
                  >
                    Reset to auto-detect ({getDayTypeInfo(detectedDayType).name})
                  </button>
                </div>
              )}
            </>
          )}

          {modalStep === 'park-selection' && (
            <div className="grid grid-cols-2 gap-4">
              {PARKS.map((park) => renderParkCard(park, false))}
            </div>
          )}

          {modalStep === 'park-hopper-selection' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {PARKS.map((park) => renderParkCard(park, true))}
              </div>

              {/* Confirmation Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleParkHopperConfirm}
                  disabled={selectedParks.length < 2}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    selectedParks.length >= 2
                      ? 'bg-sea hover:bg-sea/80 text-white'
                      : 'bg-surface-dark text-ink-light cursor-not-allowed'
                  }`}
                >
                  Confirm Selection ({selectedParks.length} parks)
                </button>
              </div>

              {selectedParks.length < 2 && (
                <p className="text-xs text-ink-light mt-3 text-center">
                  Select at least 2 parks for Park Hopper Day
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}