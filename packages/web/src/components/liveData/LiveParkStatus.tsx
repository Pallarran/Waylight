import React from 'react';
import { Clock, AlertCircle, CheckCircle, XCircle, Users, RefreshCw } from 'lucide-react';
import { useParkLiveData, useParkLiveDataForDate } from '../../hooks/useLiveDataStore';

interface LiveParkStatusProps {
  parkId: string;
  date?: string; // YYYY-MM-DD format for date-specific data
  className?: string;
}

export const LiveParkStatus: React.FC<LiveParkStatusProps> = ({
  parkId,
  date,
  className = ''
}) => {
  // Use date-specific hook if date is provided, otherwise use current date hook
  const {
    parkData,
    isLoading,
    errors,
    lastUpdated,
    actions
  } = date ? useParkLiveDataForDate(parkId, date) : useParkLiveData(parkId);

  const getParkStatusIcon = (status: string) => {
    switch (status) {
      case 'operating':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'limited':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getParkStatusText = (status: string) => {
    switch (status) {
      case 'operating':
        return 'Open';
      case 'limited':
        return 'Limited Operations';
      case 'closed':
        return 'Closed';
      default:
        return 'Status Unknown';
    }
  };

  const getCrowdLevelColor = (level: number) => {
    if (level <= 2) return 'text-green-600 bg-green-100';
    if (level <= 4) return 'text-yellow-600 bg-yellow-100';
    if (level <= 6) return 'text-orange-600 bg-orange-100';
    if (level <= 8) return 'text-red-600 bg-red-100';
    return 'text-purple-600 bg-purple-100';
  };

  const getCrowdLevelText = (level: number) => {
    if (level <= 2) return 'Very Low';
    if (level <= 4) return 'Low';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Very High';
  };

  const formatTime = (timeString: string | null) => {
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

  const getLastUpdatedText = (timestamp?: string) => {
    if (!timestamp) return '';
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return updated.toLocaleDateString();
  };

  // Show loading state
  if (isLoading.parkData && !parkData) {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm text-blue-600">Loading live park data...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (errors.parkData && !parkData) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Live data unavailable</span>
          </div>
          <button
            onClick={actions.fetchParkData}
            className="text-xs text-yellow-600 hover:text-yellow-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show live park data
  if (parkData) {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getParkStatusIcon(parkData.status)}
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">Live Park Status</h4>
              <p className="text-xs text-gray-600">{getParkStatusText(parkData.status)}</p>
            </div>
          </div>

          {/* Crowd Level */}
          {parkData.crowdLevel && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCrowdLevelColor(parkData.crowdLevel)}`}>
                {getCrowdLevelText(parkData.crowdLevel)} ({parkData.crowdLevel}/10)
              </span>
            </div>
          )}
        </div>

        {/* Park Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Regular Hours */}
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3 text-gray-400" />
            <div>
              <div className="font-medium text-gray-700">Park Hours</div>
              <div className="text-gray-600">
                {parkData.hours.regular.open && parkData.hours.regular.close ? (
                  `${formatTime(parkData.hours.regular.open)} - ${formatTime(parkData.hours.regular.close)}`
                ) : parkData.dataSource === 'unavailable' ? (
                  <span className="text-amber-600 italic">Hours not yet available</span>
                ) : (
                  <span className="text-gray-500">TBD</span>
                )}
              </div>
            </div>
          </div>

          {/* Early Entry */}
          {parkData.hours.earlyEntry && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-700">Early Entry</div>
                <div className="text-gray-600">
                  {formatTime(parkData.hours.earlyEntry.open)}
                </div>
              </div>
            </div>
          )}

          {/* Extended Hours */}
          {parkData.hours.extendedEvening && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gold rounded-full"></div>
              <div>
                <div className="font-medium text-gray-700">Extended Hours</div>
                <div className="text-gray-600">
                  Until {formatTime(parkData.hours.extendedEvening.close)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Last Updated */}
        {lastUpdated.parkData && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Updated {getLastUpdatedText(lastUpdated.parkData)}
              </span>
              <button
                onClick={actions.fetchParkData}
                disabled={isLoading.parkData}
                className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
              >
                {isLoading.parkData ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: no data available, no error, not loading
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Live data not available</span>
        </div>
        <button
          onClick={actions.fetchParkData}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Load Data
        </button>
      </div>
    </div>
  );
};