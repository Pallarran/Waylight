import { useState, useMemo } from 'react';
import { X, Download, BarChart3, AlertTriangle, Star, TrendingUp, Calendar, Users, MapPin, ChevronRight, Info, FileText, Share, Copy } from 'lucide-react';
import type { Trip, ActivityRating, ActivityRatingSummary } from '../../types';
import type { TravelingPartyMember } from '@waylight/shared';
import { ParkRatingAnalytics, type ParkRatingSummary, type ConflictAnalysis, type TripRecommendations } from '../../services/parkRatingAnalytics';
import { ReportExportService } from '../../services/reportExportService';

interface SummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  ratings: ActivityRating[];
  summaries: ActivityRatingSummary[];
  partyMembers: TravelingPartyMember[];
}

type TabType = 'overview' | 'parks' | 'conflicts' | 'recommendations';

export default function SummaryReportModal({
  isOpen,
  onClose,
  trip,
  ratings,
  summaries,
  partyMembers
}: SummaryReportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activeParkTab, setActiveParkTab] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate analytics data
  const parkSummaries = useMemo(() =>
    ParkRatingAnalytics.generateParkSummaries(ratings, summaries, partyMembers, trip),
    [ratings, summaries, partyMembers, trip]
  );

  const conflicts = useMemo(() =>
    ParkRatingAnalytics.identifyConflicts(ratings, summaries, partyMembers),
    [ratings, summaries, partyMembers]
  );

  const availableParkDays = useMemo(() =>
    ParkRatingAnalytics.calculateAvailableParkDays(trip),
    [trip]
  );

  const actualTripDays = useMemo(() => {
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [trip.startDate, trip.endDate]);


  const attractionEfficiencies = useMemo(() =>
    ParkRatingAnalytics.generateAttractionEfficiencies(ratings, summaries, partyMembers),
    [ratings, summaries, partyMembers]
  );

  const recommendations = useMemo(() =>
    ParkRatingAnalytics.generateRecommendations(parkSummaries, conflicts, trip, attractionEfficiencies),
    [parkSummaries, conflicts, trip, attractionEfficiencies]
  );

  const handleExportJSON = () => {
    ReportExportService.downloadJSONReport(trip, partyMembers, parkSummaries, conflicts, recommendations);
    setShowExportMenu(false);
  };

  const handleExportText = () => {
    ReportExportService.downloadTextReport(trip, partyMembers, parkSummaries, conflicts, recommendations);
    setShowExportMenu(false);
  };

  const handleCopyToClipboard = async () => {
    const success = await ReportExportService.copyTextToClipboard(trip, partyMembers, parkSummaries, conflicts, recommendations);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    setShowExportMenu(false);
  };

  if (!isOpen) return null;

  const totalRatings = ratings.length;
  const totalMustDos = summaries.reduce((sum, s) => sum + s.mustDoCount, 0);
  const avgConsensus = parkSummaries.reduce((sum, p) => sum + p.consensusScore, 0) / parkSummaries.length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'parks', label: 'Park Analysis', icon: MapPin },
    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle, badge: conflicts.length }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl border border-surface-dark/30 w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-dark/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sea/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-sea" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Trip Ratings Summary</h2>
              <p className="text-sm text-ink-light">{trip.name} • {partyMembers.length} travelers</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn-secondary btn-sm flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-surface-dark rounded-lg shadow-lg z-50">
                  <div className="p-1">
                    <button
                      onClick={handleExportText}
                      className="w-full flex items-center px-3 py-2 text-sm text-ink hover:bg-surface-dark/50 rounded-md"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Text Report (.txt)
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full flex items-center px-3 py-2 text-sm text-ink hover:bg-surface-dark/50 rounded-md"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      JSON Data (.json)
                    </button>
                    <button
                      onClick={handleCopyToClipboard}
                      className="w-full flex items-center px-3 py-2 text-sm text-ink hover:bg-surface-dark/50 rounded-md"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-surface-dark/30 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors relative ${
                activeTab === tab.id
                  ? 'border-sea text-sea'
                  : 'border-transparent text-ink-light hover:text-ink'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface-dark/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-glow" />
                    <div>
                      <p className="text-sm text-ink-light">Total Ratings</p>
                      <p className="text-xl font-semibold text-ink">{totalRatings}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-dark/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-sea" />
                    <div>
                      <p className="text-sm text-ink-light">Must-Do Items</p>
                      <p className="text-xl font-semibold text-ink">{totalMustDos}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-dark/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-ink-light">Consensus Level</p>
                      <p className="text-xl font-semibold text-ink">{(avgConsensus * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-dark/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-sm text-ink-light">Conflicts</p>
                      <p className="text-xl font-semibold text-ink">{conflicts.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Park Days Info */}
              <div className="bg-surface-dark/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-ink mb-4">Trip Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-surface rounded-lg p-4">
                    <p className="text-sm text-ink-light mb-1">Available Park Days</p>
                    <p className="text-2xl font-semibold text-sea">{availableParkDays}</p>
                    <p className="text-xs text-ink-light">
                      From {actualTripDays} total trip days
                    </p>
                  </div>
                  <div className="bg-surface rounded-lg p-4">
                    <p className="text-sm text-ink-light mb-1">Allocated Days</p>
                    <p className="text-2xl font-semibold text-glow">{parkSummaries.reduce((sum, p) => sum + p.recommendedDays, 0)}</p>
                    <p className="text-xs text-ink-light">Optimized distribution</p>
                  </div>
                  <div className="bg-surface rounded-lg p-4">
                    <p className="text-sm text-ink-light mb-1">Planning Status</p>
                    <p className="text-2xl font-semibold text-green-400">✓</p>
                    <p className="text-xs text-ink-light">Days efficiently allocated</p>
                  </div>
                </div>
              </div>

              {/* Top Parks Quick View */}
              <div className="bg-surface-dark/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-ink mb-4">Park Priority Ranking</h3>
                <div className="space-y-3">
                  {parkSummaries.slice(0, 4).map((park, index) => {
                    const allocatedDays = recommendations.suggestedParkDays.find(p => p.parkId === park.parkId)?.days || 0;
                    return (
                      <div key={park.parkId} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{park.parkIcon}</span>
                          <div>
                            <p className="font-medium text-ink">{park.parkName}</p>
                            <p className="text-sm text-ink-light">
                              {park.mustDoCount} must-do • {park.averageRating.toFixed(1)}★ avg
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-ink">{allocatedDays} day{allocatedDays !== 1 ? 's' : ''}</p>
                          <p className="text-xs text-ink-light">allocated</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lightning Lane Strategy */}
              <div className="bg-surface-dark/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-ink mb-4">⚡ Lightning Lane Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.lightningLanePriorities
                    .filter(park => park.attractions.length > 0)
                    .slice(0, 4)
                    .map(park => {
                      const parkInfo = parkSummaries.find(p => p.parkId === park.parkId);
                      return (
                        <div key={park.parkId} className="bg-surface rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-lg">{parkInfo?.parkIcon}</span>
                            <h4 className="font-medium text-ink">{parkInfo?.parkName}</h4>
                          </div>
                          <div className="space-y-2">
                            {park.attractions.slice(0, 3).map((attraction, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="text-ink-light">{idx + 1}.</span>{' '}
                                <span className="text-ink">{attraction}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
                {recommendations.lightningLanePriorities.every(park => park.attractions.length === 0) && (
                  <p className="text-ink-light text-center py-4">
                    No Lightning Lane recommendations - consider rating more attractions to get personalized suggestions.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'parks' && (
            <div className="space-y-6">
              {/* Park Sub-tabs */}
              <div className="flex flex-wrap gap-2 border-b border-surface-dark/30 pb-2">
                {parkSummaries.map((park) => (
                  <button
                    key={park.parkId}
                    onClick={() => setActiveParkTab(activeParkTab === park.parkId ? '' : park.parkId)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeParkTab === park.parkId
                        ? 'bg-sea text-white'
                        : 'bg-surface-dark/50 text-ink-light hover:text-ink hover:bg-surface-dark'
                    }`}
                  >
                    <span>{park.parkIcon}</span>
                    <span className="font-medium">{park.parkName}</span>
                    {park.mustDoCount > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activeParkTab === park.parkId ? 'bg-white/20' : 'bg-glow/20 text-glow'
                      }`}>
                        {park.mustDoCount}
                      </span>
                    )}
                  </button>
                ))}
                {activeParkTab && (
                  <button
                    onClick={() => setActiveParkTab('')}
                    className="px-3 py-2 text-sm text-ink-light hover:text-ink rounded-lg hover:bg-surface-dark/50"
                  >
                    Show All
                  </button>
                )}
              </div>

              {/* Park Content */}
              {activeParkTab ? (
                // Single park detailed view
                (() => {
                  const park = parkSummaries.find(p => p.parkId === activeParkTab);
                  if (!park) return null;

                  const allocatedDays = recommendations.suggestedParkDays.find(p => p.parkId === park.parkId)?.days || 0;

                  return (
                    <div className="bg-surface-dark/20 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <span className="text-4xl">{park.parkIcon}</span>
                          <div>
                            <h3 className="text-2xl font-bold text-ink">{park.parkName}</h3>
                            <p className="text-ink-light">
                              {park.ratedAttractions} of {park.totalAttractions} attractions rated
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-ink">{park.averageRating.toFixed(1)}★</p>
                          <p className="text-sm text-ink-light">Average rating</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-surface rounded-lg p-4">
                          <p className="text-sm text-ink-light mb-1">Must-Do Attractions</p>
                          <p className="text-xl font-semibold text-glow">{park.mustDoCount}</p>
                        </div>
                        <div className="bg-surface rounded-lg p-4">
                          <p className="text-sm text-ink-light mb-1">Consensus Score</p>
                          <p className="text-xl font-semibold text-sea">{(park.consensusScore * 100).toFixed(0)}%</p>
                        </div>
                        <div className="bg-surface rounded-lg p-4">
                          <p className="text-sm text-ink-light mb-1">Allocated Days</p>
                          <p className="text-xl font-semibold text-purple-400">{allocatedDays}</p>
                        </div>
                        <div className="bg-surface rounded-lg p-4">
                          <p className="text-sm text-ink-light mb-1">Conflicts</p>
                          <p className="text-xl font-semibold text-red-400">{park.conflictCount}</p>
                        </div>
                      </div>

                      {/* Ranked Attractions List */}
                      <div>
                        <h4 className="text-lg font-semibold text-ink mb-4">Ranked Attractions List</h4>
                        {(() => {
                          // Filter out attractions where everyone rated 1 (all avoid)
                          const planningAttractions = park.topAttractions.filter(attraction => {
                            // Exclude if everyone who rated it gave it a 1
                            const ratings = attraction.individualRatings;
                            if (ratings.length === 0) return true; // Include unrated attractions
                            const allRatedOne = ratings.every(rating => rating.rating === 1);
                            return !allRatedOne;
                          });

                          if (planningAttractions.length === 0) {
                            return (
                              <div className="text-center py-8 text-ink-light">
                                <p>No attractions available for planning analysis.</p>
                                <p className="text-sm">Rate attractions in the Preferences tab to see comprehensive recommendations.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              {planningAttractions.map((attraction) => (
                                <div key={attraction.attractionId} className="bg-surface rounded-lg p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className="flex items-center space-x-1">
                                        <Star className="w-4 h-4 text-glow" />
                                        <span className="font-medium text-ink min-w-[2.5rem]">
                                          {attraction.averageRating > 0 ? attraction.averageRating.toFixed(1) : 'N/A'}
                                        </span>
                                      </div>

                                      <span className="font-medium text-ink">{attraction.attractionName}</span>

                                      {attraction.hasConflicts && (
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-2 text-xs">
                                      {attraction.mustDoCount > 0 && (
                                        <span className="bg-glow/20 text-glow px-2 py-1 rounded font-medium">
                                          {attraction.mustDoCount} must-do
                                        </span>
                                      )}


                                      {attraction.lightningLaneStrategy && attraction.lightningLaneStrategy !== 'standby' && (
                                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                          ⚡ {attraction.lightningLaneStrategy === 'multipass' ? 'MP' : 'SP'}
                                        </span>
                                      )}

                                      {attraction.avoidCount > 0 && (
                                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded">
                                          {attraction.avoidCount} avoid
                                        </span>
                                      )}

                                      <span className="bg-surface-dark/30 text-ink-light px-2 py-1 rounded capitalize text-xs">
                                        {attraction.consensusLevel}
                                      </span>
                                    </div>
                                  </div>

                                  {attraction.individualRatings.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-surface-dark/30">
                                      <div className="flex flex-wrap gap-1">
                                        {attraction.individualRatings.map((rating, idx) => (
                                          <span key={idx} className="text-xs bg-surface-dark/30 px-2 py-1 rounded">
                                            {rating.memberName}: {rating.rating}★
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Summary view of all parks
                <div className="space-y-4">
                  <div className="text-center py-4 text-ink-light">
                    <p>Select a park above to see detailed must-do lists and complete attraction ratings.</p>
                  </div>
                  {parkSummaries.map((park) => {
                    const allocatedDays = recommendations.suggestedParkDays.find(p => p.parkId === park.parkId)?.days || 0;
                    return (
                      <div key={park.parkId} className="bg-surface-dark/20 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{park.parkIcon}</span>
                            <div>
                              <h4 className="text-lg font-semibold text-ink">{park.parkName}</h4>
                              <p className="text-sm text-ink-light">
                                {park.mustDoCount} must-do • {park.averageRating.toFixed(1)}★ avg • {allocatedDays} day{allocatedDays !== 1 ? 's' : ''} allocated
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveParkTab(park.parkId)}
                            className="px-3 py-1 text-sm bg-sea text-white rounded-lg hover:bg-sea/80 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div className="space-y-4">
              {conflicts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-ink mb-2">Great Consensus!</h3>
                  <p className="text-ink-light">Your group is in agreement on most attractions. This will make planning much easier.</p>
                </div>
              ) : (
                <>
                  <div className="bg-surface-dark/20 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Info className="w-5 h-5 text-sea" />
                      <h3 className="font-medium text-ink">Conflict Resolution Tips</h3>
                    </div>
                    <p className="text-sm text-ink-light">
                      Conflicts are normal in family trip planning. Review the suggestions below to find compromises that work for everyone.
                    </p>
                  </div>

                  {conflicts.map((conflict, index) => (
                    <div key={`${conflict.attractionId}-${conflict.conflictType}`} className="bg-surface-dark/20 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            conflict.severity === 'high' ? 'bg-red-500/20' :
                            conflict.severity === 'medium' ? 'bg-yellow-500/20' :
                            'bg-blue-500/20'
                          }`}>
                            <AlertTriangle className={`w-4 h-4 ${
                              conflict.severity === 'high' ? 'text-red-400' :
                              conflict.severity === 'medium' ? 'text-yellow-400' :
                              'text-blue-400'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-ink">{conflict.attractionName}</h4>
                            <p className="text-sm text-ink-light">{conflict.parkName} • {conflict.conflictType} conflict</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          conflict.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          conflict.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {conflict.severity}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-ink mb-2">Affected Family Members:</h5>
                        <div className="space-y-1">
                          {conflict.conflictingMembers.map((member, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-ink">{member.memberName}</span>
                              <span className="text-ink-light">{member.issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-surface rounded-lg p-4">
                        <h5 className="text-sm font-medium text-ink mb-2">Suggested Resolution:</h5>
                        <p className="text-sm text-ink-light">{conflict.suggestedResolution}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}