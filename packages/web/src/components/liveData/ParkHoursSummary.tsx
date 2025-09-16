import React from 'react';
import { Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useParkLiveData, useParkLiveDataForDate } from '../../hooks/useLiveDataStore';

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
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
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