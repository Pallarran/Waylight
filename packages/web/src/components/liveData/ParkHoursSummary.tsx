import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, XCircle, Users } from 'lucide-react';
import { useParkLiveData, useParkLiveDataForDate } from '../../hooks/useLiveDataStore';
import { crowdPredictionRepository } from '@waylight/shared';

interface ParkHoursSummaryProps {
  parkId: string;
  date?: string; // YYYY-MM-DD format for date-specific data
  className?: string;
}

export const ParkHoursSummary: React.FC<ParkHoursSummaryProps> = ({
  parkId,
  date,
  className = ''
}) => {
  // Use date-specific hook if date is provided, otherwise use current date hook
  const {
    parkData,
    parkEvents,
    isLoading,
    errors
  } = date ? useParkLiveDataForDate(parkId, date) : useParkLiveData(parkId);

  // Crowd level data state
  const [crowdData, setCrowdData] = useState<{
    level: number;
    description: string;
    recommendation?: string;
  } | null>(null);
  const [crowdLoading, setCrowdLoading] = useState(false);

  // Fetch crowd data for the specific date
  useEffect(() => {
    if (!date) return;

    const fetchCrowdData = async () => {
      setCrowdLoading(true);
      try {
        const prediction = await crowdPredictionRepository.getCrowdPredictionForDate(parkId, date);
        if (prediction) {
          setCrowdData({
            level: prediction.crowdLevel,
            description: prediction.description,
            recommendation: prediction.recommendation
          });
        } else {
          setCrowdData(null);
        }
      } catch (error) {
        console.warn('Failed to fetch crowd data:', error);
        setCrowdData(null);
      } finally {
        setCrowdLoading(false);
      }
    };

    fetchCrowdData();
  }, [parkId, date]);

  // Helper functions for crowd level visualization
  const getCrowdLevelColor = (level: number) => {
    if (level <= 2) return 'text-green-600 bg-green-100';
    if (level <= 4) return 'text-blue-600 bg-blue-100';
    if (level <= 6) return 'text-yellow-600 bg-yellow-100';
    if (level <= 8) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getCrowdLevelIcon = (level: number) => {
    const baseProps = "w-3 h-3";
    if (level <= 2) return <Users className={`${baseProps} text-green-600`} />;
    if (level <= 4) return <Users className={`${baseProps} text-blue-600`} />;
    if (level <= 6) return <Users className={`${baseProps} text-yellow-600`} />;
    if (level <= 8) return <Users className={`${baseProps} text-orange-600`} />;
    return <Users className={`${baseProps} text-red-600`} />;
  };

  const getCrowdLevelBars = (level: number) => {
    const bars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.ceil(level / 2);
      bars.push(
        <div
          key={i}
          className={`w-1 h-3 rounded-sm ${
            filled ? (getCrowdLevelColor(level).split(' ')[0] || '').replace('text-', 'bg-') : 'bg-gray-200'
          }`}
        />
      );
    }
    return <div className="flex space-x-0.5">{bars}</div>;
  };

  const getParkStatusColor = (status: string) => {
    switch (status) {
      case 'operating':
        return 'bg-green-100 border-green-300';
      case 'limited':
        return 'bg-yellow-100 border-yellow-300';
      case 'closed':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getParkStatusIcon = (status: string) => {
    switch (status) {
      case 'operating':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'limited':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return null;
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      return `${hour.toString().padStart(2, '0')}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  const getEventIcon = (eventName: string, eventDate: string) => {
    const eventLower = eventName.toLowerCase();
    const currentDate = new Date();
    const eventDateObj = new Date(eventDate);
    const month = eventDateObj.getMonth();


    // Halloween events (September-November)
    if (eventLower.includes('halloween') || eventLower.includes('not-so-scary') ||
        (eventLower.includes('special') && month >= 8 && month <= 10)) {
      return '🎃';
    }

    // Christmas events (November-January)
    if (eventLower.includes('christmas') || eventLower.includes('holiday') || eventLower.includes('very merry') ||
        (eventLower.includes('special') && (month >= 10 || month <= 1))) {
      return '🎄';
    }

    // After Hours events
    if (eventLower.includes('after hours')) {
      return '🌙';
    }

    // Party events
    if (eventLower.includes('party')) {
      return '🎉';
    }

    // Default special event
    return '✨';
  };

  const getEventDisplayName = (eventName: string) => {
    // Clean up common event names for better display
    if (eventName.toLowerCase().includes('special ticketed event')) {
      const eventLower = eventName.toLowerCase();
      const currentMonth = new Date().getMonth();

      // Make educated guesses based on timing
      if (currentMonth >= 8 && currentMonth <= 10) {
        return 'Halloween Party';
      } else if (currentMonth >= 10 || currentMonth <= 1) {
        return 'Christmas Party';
      }
      return 'Special Event';
    }

    return eventName;
  };

  // Show loading state
  if (isLoading.parkData && !parkData) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Loading park hours...</span>
        </div>
      </div>
    );
  }

  // Show error state or no data
  if (errors.parkData || !parkData) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Park hours unavailable</span>
        </div>
      </div>
    );
  }

  // Show park hours summary
  return (
    <div className={`${getParkStatusColor(parkData.status)} border rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        {getParkStatusIcon(parkData.status)}
        <h4 className="text-sm font-semibold text-gray-800">Park Hours</h4>
      </div>

      <div className="space-y-2">
        {/* Early Entry Hours - First Priority */}
        {parkData.hours.earlyEntry && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-700">Early Entry</span>
            </div>
            <span className="text-xs text-gray-600">
              {formatTime(parkData.hours.earlyEntry.open)}
            </span>
          </div>
        )}

        {/* Regular Park Hours - Second Priority */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Park Hours</span>
          </div>
          <span className="text-xs text-gray-600">
            {parkData.hours.regular.open && parkData.hours.regular.close ? (
              `${formatTime(parkData.hours.regular.open)} - ${formatTime(parkData.hours.regular.close)}`
            ) : parkData.dataSource === 'unavailable' ? (
              <span className="text-amber-600 italic">TBD</span>
            ) : (
              <span className="text-gray-500">TBD</span>
            )}
          </span>
        </div>

        {/* Expected Crowd Level - Priority after Park Hours */}
        {date && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {crowdLoading ? (
                <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
              ) : crowdData ? (
                getCrowdLevelIcon(crowdData.level)
              ) : (
                <Users className="w-3 h-3 text-gray-400" />
              )}
              <span className="text-xs font-medium text-gray-700">Expected Crowds</span>
            </div>
            <div className="flex items-center space-x-2">
              {crowdLoading ? (
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
              ) : crowdData ? (
                <>
                  {getCrowdLevelBars(crowdData.level)}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCrowdLevelColor(crowdData.level)}`}>
                    {crowdData.description}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-500">No data</span>
              )}
            </div>
          </div>
        )}

        {/* Extended Evening Hours - Third Priority */}
        {parkData.hours.extendedEvening && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-700">Extended Hours</span>
            </div>
            <span className="text-xs text-gray-600">
              Until {formatTime(parkData.hours.extendedEvening.close)}
            </span>
          </div>
        )}

        {/* Special Events - Fourth Priority */}
        {!isLoading.parkEvents && parkEvents && parkEvents.length > 0 && parkEvents.map((event, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm">{getEventIcon(event.eventName, event.eventDate)}</span>
              <span className="text-xs font-medium text-gray-700">{getEventDisplayName(event.eventName)}</span>
            </div>
            <span className="text-xs text-gray-600">
              {event.eventOpen && event.eventClose ? (
                `${formatTime(event.eventOpen)} - ${formatTime(event.eventClose)}`
              ) : (
                <span className="text-gray-500 italic">TBD</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};