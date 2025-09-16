import { useState, useMemo, useEffect } from 'react';
import { Filter, Search, Star, Users, TrendingUp, AlertTriangle, Download, BarChart3 } from 'lucide-react';
import GroupRatingCard from './GroupRatingCard';
import { getAllDoItems, getAllEatItems } from '@waylight/shared';
import { ActivityRatingsService } from '@waylight/shared';
import { PARKS } from '../../data/parks';
import type { Trip, ActivityRating, ActivityRatingSummary, GroupRatingData, ActivityCategory, TravelingPartyMember } from '../../types';

interface ActivityPreferencesProps {
  trip: Trip;
}

type FilterTab = 'all' | 'rides' | 'shows' | 'meet_greet' | 'attractions';
type SortOption = 'name' | 'rating' | 'consensus' | 'priority';

export default function ActivityPreferences({ trip }: ActivityPreferencesProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedParks, setSelectedParks] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showHighPriorityOnly, setShowHighPriorityOnly] = useState(false);

  // State for ratings data
  const [ratings, setRatings] = useState<ActivityRating[]>([]);
  const [summaries, setSummaries] = useState<ActivityRatingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load ratings data on component mount
  useEffect(() => {
    const loadRatingsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [ratingsData, summariesData] = await Promise.all([
          ActivityRatingsService.getRatingsForTrip(trip.id),
          ActivityRatingsService.getRatingSummariesForTrip(trip.id)
        ]);

        setRatings(ratingsData);
        setSummaries(summariesData);
      } catch (err) {
        console.error('Error loading ratings data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ratings data');
      } finally {
        setLoading(false);
      }
    };

    // Only load if we have a valid trip ID
    if (trip?.id) {
      loadRatingsData();
    } else {
      console.warn('No trip ID available, skipping ratings load');
      setLoading(false);
    }
  }, [trip?.id]);

  // Helper functions
  const getPartyMembers = (): TravelingPartyMember[] => {
    return trip.travelingParty || [];
  };

  const getCurrentPartyMemberId = (): string => {
    // Get the current user's party member ID (typically the planner)
    const plannerMember = trip.travelingParty?.find(member => member.isPlanner);
    return plannerMember?.id || trip.travelingParty?.[0]?.id || '';
  };

  // Get all available attractions
  const allAttractions = useMemo(() => {
    const doItems = getAllDoItems();
    const eatItems = getAllEatItems();
    return [...doItems, ...eatItems];
  }, []);

  // Filter attractions based on current filters
  const filteredAttractions = useMemo(() => {
    let filtered = allAttractions;

    // Exclude transportation and dining items from preferences
    filtered = filtered.filter(item =>
      item.type !== 'transportation' &&
      !['quick_service', 'table_service', 'snack', 'lounge', 'food_cart'].includes(item.type)
    );

    // Filter by parks
    if (selectedParks.size > 0) {
      filtered = filtered.filter(item => selectedParks.has(item.parkId));
    }

    // Filter by category
    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => {
        if (activeFilter === 'rides') return item.type === 'ride';
        if (activeFilter === 'shows') return item.type === 'show';
        if (activeFilter === 'meet_greet') return item.type === 'meet_greet';
        if (activeFilter === 'attractions') return ['attraction', 'experience', 'walkthrough'].includes(item.type);
        return true;
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [allAttractions, selectedParks, activeFilter, searchQuery]);

  // Create GroupRatingData objects
  const groupRatingData: GroupRatingData[] = useMemo(() => {
    return filteredAttractions.map(attraction => {
      const attractionRatings = ratings.filter(r => r.attractionId === attraction.id);
      const summary = summaries.find(s => s.attractionId === attraction.id);
      const userRating = attractionRatings.find(r => r.partyMemberId === getCurrentPartyMemberId());

      return {
        attraction,
        summary,
        individualRatings: attractionRatings,
        userRating
      };
    });
  }, [filteredAttractions, ratings, summaries]);

  // Sort the data
  const sortedData = useMemo(() => {
    const data = [...groupRatingData];

    // Filter high priority if enabled
    if (showHighPriorityOnly) {
      return data.filter(item =>
        item.summary?.mustDoCount > 0 ||
        item.summary?.averageRating >= 4 ||
        item.userRating?.preferenceType === 'must_do'
      );
    }

    // Sort
    data.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          const ratingA = a.summary?.averageRating || 0;
          const ratingB = b.summary?.averageRating || 0;
          return ratingB - ratingA;

        case 'consensus':
          const consensusOrder = { 'high': 4, 'medium': 3, 'low': 2, 'conflict': 1 };
          const consensusA = consensusOrder[a.summary?.consensusLevel || 'medium'];
          const consensusB = consensusOrder[b.summary?.consensusLevel || 'medium'];
          return consensusB - consensusA;

        case 'priority':
          const priorityA = a.summary?.mustDoCount || 0;
          const priorityB = b.summary?.mustDoCount || 0;
          return priorityB - priorityA;

        default: // name
          return a.attraction.name.localeCompare(b.attraction.name);
      }
    });

    return data;
  }, [groupRatingData, sortBy, showHighPriorityOnly]);


  const handleRatingChange = async (rating: Partial<ActivityRating>) => {
    try {
      // Ensure required fields are set
      const ratingToSave: Partial<ActivityRating> = {
        ...rating,
        tripId: trip.id,
        partyMemberId: rating.partyMemberId || getCurrentPartyMemberId(),
        heightRestrictionOk: rating.heightRestrictionOk ?? true,
        intensityComfortable: rating.intensityComfortable ?? true
      };

      const savedRating = await ActivityRatingsService.upsertRating(ratingToSave);

      // Update local state
      if (rating.id) {
        setRatings(prev => prev.map(r => r.id === rating.id ? savedRating : r));
      } else {
        setRatings(prev => [...prev, savedRating]);
      }

      // Reload summaries to get updated consensus data
      const updatedSummaries = await ActivityRatingsService.getRatingSummariesForTrip(trip.id);
      setSummaries(updatedSummaries);

    } catch (err) {
      console.error('Error saving rating:', err);
      setError(err instanceof Error ? err.message : 'Failed to save rating');
    }
  };

  const handleDeleteRating = async (ratingId: string) => {
    try {
      await ActivityRatingsService.deleteRating(ratingId);

      // Update local state
      setRatings(prev => prev.filter(r => r.id !== ratingId));

      // Reload summaries to get updated consensus data
      const updatedSummaries = await ActivityRatingsService.getRatingSummariesForTrip(trip.id);
      console.log('Updated summaries after rating change:', updatedSummaries);
      setSummaries(updatedSummaries);


    } catch (err) {
      console.error('Error deleting rating:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete rating');
    }
  };

  const toggleCardExpanded = (attractionId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(attractionId)) {
        newSet.delete(attractionId);
      } else {
        newSet.add(attractionId);
      }
      return newSet;
    });
  };

  const exportRatings = () => {
    // TODO: Implement ratings export functionality
    console.log('Export ratings for trip:', trip.id);
  };

  const generateSummaryReport = () => {
    // TODO: Implement summary report generation
    console.log('Generate summary report for trip:', trip.id);
  };

  const filterTabs: { id: FilterTab; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '🎭' },
    { id: 'rides', label: 'Rides', icon: '🎢' },
    { id: 'shows', label: 'Shows', icon: '🎪' },
    { id: 'meet_greet', label: 'Characters', icon: '🐭' },
    { id: 'attractions', label: 'Attractions', icon: '🏰' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Activity Preferences</h2>
          <p className="text-ink-light mt-1">Rate attractions for all party members to help prioritize your trip planning</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={generateSummaryReport}
            className="btn-secondary btn-sm flex items-center"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Summary Report
          </button>
          <button
            onClick={exportRatings}
            className="btn-secondary btn-sm flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Ratings
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg p-4 border border-surface-dark/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sea/20 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-sea" />
            </div>
            <div>
              <p className="text-sm text-ink-light">Total Ratings</p>
              <p className="text-xl font-semibold text-ink">{ratings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4 border border-surface-dark/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-glow/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-glow" />
            </div>
            <div>
              <p className="text-sm text-ink-light">Must-Do Items</p>
              <p className="text-xl font-semibold text-ink">
                {summaries.reduce((sum, s) => sum + s.mustDoCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4 border border-surface-dark/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-ink-light">Conflicts</p>
              <p className="text-xl font-semibold text-ink">
                {summaries.filter(s => s.consensusLevel === 'conflict').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4 border border-surface-dark/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-ink-light">Party Members</p>
              <p className="text-xl font-semibold text-ink">{getPartyMembers().length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface rounded-lg p-4 border border-surface-dark/30">
        <div className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Activity Category Filters */}
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeFilter === tab.id
                    ? 'bg-sea text-white'
                    : 'bg-surface-dark/50 text-ink-light hover:text-ink hover:bg-surface-dark'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}

            {/* Separator */}
            <div className="w-px h-6 bg-surface-dark/50 mx-2"></div>

            {/* Park Filters */}
            <span className="text-sm text-ink-light font-medium">Parks:</span>
            {PARKS.map(park => (
              <button
                key={park.id}
                onClick={() => {
                  setSelectedParks(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(park.id)) {
                      newSet.delete(park.id);
                    } else {
                      newSet.add(park.id);
                    }
                    return newSet;
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  selectedParks.has(park.id)
                    ? 'bg-sea text-white'
                    : 'bg-surface-dark/50 text-ink-light hover:text-ink hover:bg-surface-dark'
                }`}
              >
                <span>{park.icon}</span>
                <span>{park.abbreviation}</span>
              </button>
            ))}
            {(selectedParks.size > 0 || activeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedParks(new Set());
                  setActiveFilter('all');
                }}
                className="px-2 py-1.5 rounded-lg text-xs text-ink-light hover:text-ink hover:bg-surface-dark/50 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-light w-4 h-4" />
              <input
                type="text"
                placeholder="Search attractions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-ink-light" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm px-3 py-2 focus:outline-none focus:border-sea"
                >
                  <option value="name">Sort by Name</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="consensus">Sort by Consensus</option>
                  <option value="priority">Sort by Priority</option>
                </select>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showHighPriorityOnly}
                  onChange={(e) => setShowHighPriorityOnly(e.target.checked)}
                  className="rounded border-surface-dark bg-surface-dark text-sea focus:border-sea focus:ring-0"
                />
                <span className="text-sm text-ink">High priority only</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Rating Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-surface-dark/30 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Star className="w-8 h-8 text-ink-light/50" />
            </div>
            <h3 className="text-lg font-medium text-ink mb-2">Loading ratings...</h3>
            <p className="text-ink-light">Fetching your activity preferences</p>
          </div>
        ) : sortedData.length > 0 ? (
          sortedData.map((data) => (
            <GroupRatingCard
              key={data.attraction.id}
              ratingData={data}
              partyMembers={getPartyMembers()}
              onRatingChange={handleRatingChange}
              onDeleteRating={handleDeleteRating}
              expanded={expandedCards.has(data.attraction.id)}
              onToggleExpand={() => toggleCardExpanded(data.attraction.id)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-surface-dark/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-ink-light/50" />
            </div>
            <h3 className="text-lg font-medium text-ink mb-2">No activities found</h3>
            <p className="text-ink-light">
              {searchQuery ? 'Try adjusting your search or filters' : 'Start by selecting a category above'}
            </p>
          </div>
        )}
      </div>

      {/* Show results count */}
      {sortedData.length > 0 && (
        <div className="text-center text-sm text-ink-light">
          Showing {sortedData.length} of {filteredAttractions.length} activities
        </div>
      )}
    </div>
  );
}