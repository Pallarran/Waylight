import React from 'react';
import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { LiveAttractionData } from '@waylight/shared';

interface WaitTimeDisplayProps {
  attractionData: LiveAttractionData;
  attractionName: string;
  className?: string;
}

export const WaitTimeDisplay: React.FC<WaitTimeDisplayProps> = ({
  attractionData,
  attractionName,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (attractionData.status) {
      case 'operating':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delayed':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'down':
      case 'temporary_closure':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (attractionData.status) {
      case 'operating':
        return 'Operating';
      case 'delayed':
        return 'Delayed';
      case 'down':
        return 'Down';
      case 'temporary_closure':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const getWaitTimeColor = (waitTime: number) => {
    if (waitTime <= 0) return 'text-gray-500';
    if (waitTime <= 15) return 'text-green-600';
    if (waitTime <= 30) return 'text-yellow-600';
    if (waitTime <= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatWaitTime = (waitTime: number) => {
    if (waitTime <= 0) return 'Walk On';
    if (waitTime === 1) return '1 min';
    return `${waitTime} mins`;
  };

  const isOperating = attractionData.status === 'operating';
  const hasValidWaitTime = attractionData.waitTime > -1;

  return (
    <div className={`flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm ${className}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div>
          <h4 className="font-medium text-gray-900 text-sm">{attractionName}</h4>
          <p className="text-xs text-gray-500">{getStatusText()}</p>
        </div>
      </div>

      <div className="text-right">
        {isOperating && hasValidWaitTime ? (
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className={`font-semibold text-sm ${getWaitTimeColor(attractionData.waitTime)}`}>
              {formatWaitTime(attractionData.waitTime)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">No wait data</span>
        )}

        {/* Lightning Lane indicator */}
        {isOperating && attractionData.lightningLane?.available && (
          <div className="mt-1">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              LL
              {attractionData.lightningLane.returnTime && (
                <span className="ml-1">{new Date(attractionData.lightningLane.returnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
              )}
            </span>
          </div>
        )}

        {/* Single Rider indicator */}
        {isOperating && attractionData.singleRider?.available && (
          <div className="mt-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              SR
              {attractionData.singleRider.waitTime && (
                <span className="ml-1">{attractionData.singleRider.waitTime}m</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};