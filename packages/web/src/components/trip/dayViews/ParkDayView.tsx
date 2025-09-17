import { useState, useEffect, useMemo } from 'react';
import {
  Clock, Plus, MapPin, Zap, Calendar, Car, Utensils,
  Star, Edit, Save, X, GripVertical, Target,
  ChevronDown, Sparkles, Info, XCircle
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTripStore } from '../../../stores';
import { getParkById } from '../../../data/parks';
import { getDoItemsByPark, getEatItemsByPark, entertainment, getEntertainmentShowTimes, ActivityRatingsService } from '@waylight/shared';
import { ParkHoursSummary } from '../../liveData';
import type {
  Trip, TripDay, ActivityCategory, ItineraryItem,
  PhotoOpportunity, BackupPlan, ActivityRatingSummary
} from '../../../types';

interface ParkDayViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

interface DraggableScheduleItemProps {
  item: ItineraryItem;
  index: number;
  onUpdate: (item: ItineraryItem) => void;
  onDelete: (itemId: string) => void;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableScheduleItem = ({ item, index, onUpdate, onDelete, moveItem }: DraggableScheduleItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: item.name,
    startTime: item.startTime || '',
    notes: item.notes || ''
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'schedule-item',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'schedule-item',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const handleSave = () => {
    onUpdate({
      ...item,
      name: editData.name,
      startTime: editData.startTime,
      notes: editData.notes
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: item.name,
      startTime: item.startTime || '',
      notes: item.notes || ''
    });
    setIsEditing(false);
  };

  const getItemIcon = () => {
    switch (item.type) {
      case 'ride': return '🎢';
      case 'show': return '🎭';
      case 'dining': return '🍽️';
      case 'meet_greet': return '🤝';
      case 'break': return '☕';
      default: return '📍';
    }
  };

  // Helper function to detect and parse ADR activities
  const getAdrDetails = () => {
    if (item.type === 'dining' && item.name.includes('ADR:')) {
      const nameParts = item.name.split(' (');
      const restaurantName = nameParts[0].replace('ADR: ', '');
      const details = nameParts[1]?.replace(')', '') || '';

      // Parse details like "Time: 7:00 PM, Party: 4, Confirmation: 123456789"
      const partyMatch = details.match(/Party: (\d+)/);
      const confirmationMatch = details.match(/Confirmation: ([^,]+)/);

      return {
        restaurant: restaurantName,
        partySize: partyMatch?.[1],
        confirmation: confirmationMatch?.[1]
      };
    }
    return null;
  };

  // Helper function to detect and parse break activities
  const getBreakDetails = () => {
    if (item.type === 'break') {
      // Parse names like "Return to Hotel (Leave: 12:00, Return: 3:00)"
      const match = item.name.match(/^(.+) \(Leave: ([^,]+), Return: ([^)]+)\)$/);
      if (match) {
        return {
          type: match[1],
          leaveTime: match[2],
          returnTime: match[3]
        };
      }
    }
    return null;
  };

  const adrDetails = getAdrDetails();
  const breakDetails = getBreakDetails();

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`bg-surface-dark/20 rounded-lg p-4 border border-surface-dark/30 transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${item.isMustDo ? 'border-l-4 border-l-glow' : ''}`}
    >
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getItemIcon()}</span>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="flex-1 px-3 py-1 bg-surface border border-surface-dark rounded text-ink text-sm"
            />
            <input
              type="time"
              value={editData.startTime}
              onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
              className="px-3 py-1 bg-surface border border-surface-dark rounded text-ink text-sm"
            />
          </div>
          <input
            type="text"
            placeholder="Notes..."
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            className="w-full px-3 py-1 bg-surface border border-surface-dark rounded text-ink text-sm"
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center px-3 py-1 bg-sea hover:bg-sea/80 text-white rounded text-sm"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center px-3 py-1 bg-surface-dark hover:bg-surface-dark/80 text-ink-light rounded text-sm"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <GripVertical className="w-4 h-4 text-ink-light cursor-grab" />
          <span className="text-lg">{getItemIcon()}</span>
          <div className="flex-1">
            {adrDetails ? (
              // Enhanced ADR Display
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-ink">{adrDetails.restaurant}</span>
                  {item.startTime && (
                    <span className="text-xs text-ink-light bg-surface-dark/50 px-2 py-1 rounded">
                      {item.startTime}
                    </span>
                  )}
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">ADR</span>
                  {item.isMustDo && (
                    <span className="text-xs text-glow bg-glow/10 px-2 py-1 rounded">Must-Do</span>
                  )}
                </div>
                <div className="text-xs text-ink-light mt-1 space-y-1">
                  {adrDetails.partySize && (
                    <div>Party of {adrDetails.partySize}</div>
                  )}
                  {adrDetails.confirmation && (
                    <div>Confirmation: {adrDetails.confirmation}</div>
                  )}
                </div>
                {item.notes && (
                  <p className="text-sm text-ink-light mt-2">{item.notes}</p>
                )}
              </div>
            ) : breakDetails ? (
              // Enhanced Break Display
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-ink">{breakDetails.type}</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Break</span>
                  {item.isMustDo && (
                    <span className="text-xs text-glow bg-glow/10 px-2 py-1 rounded">Must-Do</span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-2 text-xs text-ink-light">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-1">🚪</span>
                    <span>Leave: {breakDetails.leaveTime}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-1">🔙</span>
                    <span>Return: {breakDetails.returnTime}</span>
                  </div>
                </div>
                {item.notes && (
                  <p className="text-sm text-ink-light mt-2">{item.notes}</p>
                )}
              </div>
            ) : (
              // Standard Activity Display
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-ink">{item.name}</span>
                  {item.startTime && (
                    <span className="text-xs text-ink-light bg-surface-dark/50 px-2 py-1 rounded">
                      {item.startTime}
                    </span>
                  )}
                  {item.isMustDo && (
                    <span className="text-xs text-glow bg-glow/10 px-2 py-1 rounded">Must-Do</span>
                  )}
                </div>
                {item.notes && (
                  <p className="text-sm text-ink-light mt-1">{item.notes}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-ink-light hover:text-ink rounded transition-colors"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 text-ink-light hover:text-red-400 rounded transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple StarRating component for displaying single colored star with numeric rating
const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) => {
  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };

  // Color based on rating score
  const getStarColor = (rating: number) => {
    if (rating >= 4.5) return 'fill-green-400 text-green-400'; // Excellent (green)
    if (rating >= 4.0) return 'fill-glow text-glow'; // Very good (gold/yellow)
    if (rating >= 3.5) return 'fill-orange-400 text-orange-400'; // Good (orange)
    if (rating >= 3.0) return 'fill-yellow-500 text-yellow-500'; // Average (yellow)
    return 'fill-red-400 text-red-400'; // Below average (red)
  };

  return (
    <div className="flex items-center space-x-1">
      <Star className={`${starSizes[size]} ${getStarColor(rating)}`} />
      <span className="text-xs text-ink-light">({rating.toFixed(1)})</span>
    </div>
  );
};

export default function ParkDayView({ trip, tripDay, date, onQuickAdd, onOpenDayTypeModal }: ParkDayViewProps) {
  const { updateDay, reorderItems, updateItem, deleteItem, addItem } = useTripStore();
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [ratingSummaries, setRatingSummaries] = useState<ActivityRatingSummary[]>([]);

  // Initialize empty data structures if they don't exist
  const arrivalPlan = tripDay.arrivalPlan || {};
  const lightningLanePlan = tripDay.lightningLanePlan || {};
  const familyPriorities = tripDay.familyPriorities || [];
  const diningReservations = tripDay.diningReservations || [];
  const breakPlan = tripDay.breakPlan || {};
  const entertainment = tripDay.entertainment || [];
  const backupPlan = tripDay.backupPlan || {};
  const photoOpportunities = tripDay.photoOpportunities || [];
  const safetyInfo = tripDay.safetyInfo || {};

  const parkInfo = tripDay.parkId ? getParkById(tripDay.parkId) : null;

  // Get header info based on park and day type
  const getHeaderInfo = () => {
    const detectedDayType = tripDay.dayType || 'park-day';

    if (detectedDayType === 'park-hopper') {
      return {
        icon: '🎢',
        title: 'Park Hopper Day',
        subtitle: 'Maximize your magic across multiple parks in one unforgettable day'
      };
    }

    if (!tripDay.parkId) {
      return {
        icon: '🏰',
        title: 'Park Day Planning',
        subtitle: 'Strategic planning for your magical Disney park adventure'
      };
    }

    const parkData = getParkById(tripDay.parkId);
    if (!parkData) {
      return {
        icon: '🏰',
        title: 'Park Day Planning',
        subtitle: 'Strategic planning for your magical Disney park adventure'
      };
    }

    const subtitles = {
      'magic-kingdom': 'Where dreams come true and childhood magic comes to life',
      'epcot': 'Discover innovation, culture, and culinary adventures around the world',
      'hollywood-studios': 'Step into the movies with thrilling attractions and immersive storytelling',
      'animal-kingdom': 'Experience the circle of life through wild adventures and conservation'
    };

    return {
      icon: parkData.icon,
      title: parkData.name,
      subtitle: subtitles[tripDay.parkId as keyof typeof subtitles] || 'Strategic planning for your magical Disney park adventure'
    };
  };

  // Load rating summaries for this trip
  useEffect(() => {
    const loadRatingSummaries = async () => {
      try {
        const summaries = await ActivityRatingsService.getRatingSummariesForTrip(trip.id);
        setRatingSummaries(summaries);
      } catch (error) {
        console.error('Error loading rating summaries:', error);
      }
    };

    loadRatingSummaries();
  }, [trip.id]);

  // Helper function to get rating for an activity
  const getActivityRating = (attractionId: string): number | null => {
    const summary = ratingSummaries.find(s => s.attractionId === attractionId);
    return summary?.averageRating ?? null;
  };

  const moveScheduleItem = (dragIndex: number, hoverIndex: number) => {
    reorderItems(trip.id, tripDay.id, dragIndex, hoverIndex);
  };

  const handleUpdateItem = (updatedItem: ItineraryItem) => {
    updateItem(trip.id, tripDay.id, updatedItem.id, updatedItem);
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItem(trip.id, tripDay.id, itemId);
  };

  const updateTripDayData = (updates: Partial<TripDay>) => {
    updateDay(trip.id, tripDay.id, updates);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Panel: Main Planning Sections */}
        <div className="lg:col-span-8">
          <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center mb-6 py-4 px-4 border-b border-surface-dark/20 relative bg-gradient-to-r from-sea-light/60 to-sea/60 rounded-lg min-h-[120px]">
              {onOpenDayTypeModal && (
                <button
                  onClick={onOpenDayTypeModal}
                  className="absolute top-3 right-3 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Change Day Type</span>
                </button>
              )}

              <div className="flex items-center justify-center w-12 h-12 mr-4">
                <span className="text-2xl">{getHeaderInfo().icon}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  {getHeaderInfo().title}
                </h2>
                <p className="text-ink-light">
                  {getHeaderInfo().subtitle}
                </p>
              </div>
            </div>


            {/* Arrival Strategy Box */}
            <div className="bg-surface-dark/10 rounded-lg p-4 mb-6 border border-surface-dark/20">
              <ArrivalStrategyBox
                arrivalPlan={arrivalPlan}
                tripDay={tripDay}
                onUpdate={(plan) => updateTripDayData({ arrivalPlan: plan })}
              />
            </div>

            {/* Entertainment Shows Box */}
            <div className="bg-surface-dark/10 rounded-lg p-4 mb-6 border border-surface-dark/20">
              <EntertainmentShowsBox
                parkId={tripDay.parkId}
              />
            </div>

            {/* Day Schedule */}
            <div className="px-0 py-4">
              <ScheduleSection
                tripDay={tripDay}
                items={tripDay.items || []}
                moveItem={moveScheduleItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onAddActivity={() => setShowAddActivityModal(true)}
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Quick Actions & Summary */}
        <div className="lg:col-span-4">
          <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
            <h3 className="text-xl font-semibold text-ink mb-6">Park Day Dashboard</h3>

            {/* Park Hours Summary */}
            {tripDay.parkId && (
              <ParkHoursSummary
                parkId={tripDay.parkId}
                date={date.toISOString().split('T')[0]} // Convert Date to YYYY-MM-DD format
              />
            )}

            {/* Family Priorities */}
            <PrioritiesSection
              priorities={familyPriorities}
              tripDay={tripDay}
              onUpdate={(priorities) => updateTripDayData({ familyPriorities: priorities })}
              getActivityRating={getActivityRating}
            />

            {/* Lightning Lane */}
            <LightningLaneSection
              lightningLanePlan={lightningLanePlan}
              tripDay={tripDay}
              onUpdate={(plan) => updateTripDayData({ lightningLanePlan: plan })}
            />

            {/* Photos and Magic Shots */}
            <MagicShotsSection
              photos={photoOpportunities}
              onUpdate={(photos) => updateTripDayData({ photoOpportunities: photos })}
            />

            <BackupPlanSection
              backupPlan={backupPlan}
              onUpdate={(plan) => updateTripDayData({ backupPlan: plan })}
            />
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      {showAddActivityModal && (
        <ParkDayAddActivityModal
          trip={trip}
          tripDay={tripDay}
          onClose={() => setShowAddActivityModal(false)}
          onQuickAdd={onQuickAdd}
        />
      )}
    </DndProvider>
  );
}

// Individual section components (to be implemented)
const ScheduleSection = ({ tripDay, items, moveItem, onUpdateItem, onDeleteItem, onAddActivity }: any) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-ink">Day Schedule</h3>
      <div className="flex items-center space-x-3">
        <button
          onClick={onAddActivity}
          className="flex items-center px-3 py-1.5 bg-sea hover:bg-sea/80 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Activity
        </button>
      </div>
    </div>

    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-8 text-ink-light">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No activities scheduled yet</p>
          <p className="text-sm">Add activities to start building your day</p>
        </div>
      ) : (
        items.map((item: ItineraryItem, index: number) => (
          <DraggableScheduleItem
            key={item.id}
            item={item}
            index={index}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            moveItem={moveItem}
          />
        ))
      )}
    </div>
  </div>
);

const ArrivalSection = ({ arrivalPlan, onUpdate }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    departureTime: arrivalPlan.departureTime || '',
    flightDetails: arrivalPlan.flightDetails || '',
    flightType: arrivalPlan.flightType || 'driving',
    transportMethod: arrivalPlan.transportMethod || 'car',
    securityTime: arrivalPlan.securityTime || '',
    tapInTime: arrivalPlan.tapInTime || '',
    ropeDropTarget: arrivalPlan.ropeDropTarget || ''
  });

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      departureTime: arrivalPlan.departureTime || '',
      flightDetails: arrivalPlan.flightDetails || '',
      flightType: arrivalPlan.flightType || 'driving',
      transportMethod: arrivalPlan.transportMethod || 'car',
      securityTime: arrivalPlan.securityTime || '',
      tapInTime: arrivalPlan.tapInTime || '',
      ropeDropTarget: arrivalPlan.ropeDropTarget || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink flex items-center">
          <Car className="w-5 h-5 mr-3 text-sea" />
          Arrival Plan & Transport
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-secondary btn-sm"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Leave Room By */}
        <div className="bg-surface-dark/20 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Clock className="w-4 h-4 mr-2 text-blue-400" />
            <h4 className="font-medium text-ink">Leave room by</h4>
          </div>
          {isEditing ? (
            <input
              type="time"
              value={formData.departureTime}
              onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
            />
          ) : (
            <div className="text-2xl font-semibold text-ink">
              {arrivalPlan.departureTime || '6:45 am'}
            </div>
          )}
        </div>

        {/* At Security By */}
        <div className="bg-surface-dark/20 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Shield className="w-4 h-4 mr-2 text-green-400" />
            <h4 className="font-medium text-ink">At security by</h4>
          </div>
          {isEditing ? (
            <input
              type="time"
              value={formData.securityTime}
              onChange={(e) => setFormData({ ...formData, securityTime: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
            />
          ) : (
            <div className="text-2xl font-semibold text-ink">
              {arrivalPlan.securityTime || '7:10 am'}
            </div>
          )}
        </div>
      </div>

      {/* Transport Options */}
      <div>
        <h4 className="font-medium text-ink mb-3">Transport</h4>
        {isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'car', label: '🚗 Own Car', icon: '🚗' },
              { id: 'monorail', label: '🚝 Monorail', icon: '🚝' },
              { id: 'bus', label: '🚌 Bus', icon: '🚌' },
              { id: 'boat', label: '⛵ Boat', icon: '⛵' },
              { id: 'rideshare', label: '🚕 RideShare', icon: '🚕' },
              { id: 'walk', label: '🚶 Walk', icon: '🚶' }
            ].map((transport) => (
              <button
                key={transport.id}
                onClick={() => setFormData({ ...formData, transportMethod: transport.id as any })}
                className={`p-3 rounded-lg border text-sm text-center transition-colors ${
                  formData.transportMethod === transport.id
                    ? 'border-sea bg-sea/10 text-sea'
                    : 'border-surface-dark text-ink-light hover:border-sea/50'
                }`}
              >
                <div className="text-lg mb-1">{transport.icon}</div>
                <div>{transport.label.replace(/🚗|🚝|🚌|⛵|🚕|🚶 /, '')}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            {arrivalPlan.transportMethod === 'car' && <span className="text-lg">🚗</span>}
            {arrivalPlan.transportMethod === 'monorail' && <span className="text-lg">🚝</span>}
            {arrivalPlan.transportMethod === 'bus' && <span className="text-lg">🚌</span>}
            {arrivalPlan.transportMethod === 'boat' && <span className="text-lg">⛵</span>}
            {arrivalPlan.transportMethod === 'rideshare' && <span className="text-lg">🚕</span>}
            {arrivalPlan.transportMethod === 'walk' && <span className="text-lg">🚶</span>}
            <span className="text-ink font-medium capitalize">
              {arrivalPlan.transportMethod || 'Walk to TTC'}
            </span>
          </div>
        )}
      </div>

      {/* Tap In & First Target */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-surface-dark/20 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Clock className="w-4 h-4 mr-2 text-blue-500" />
            <h4 className="font-medium text-ink">Tap in by</h4>
          </div>
          {isEditing ? (
            <input
              type="time"
              value={formData.tapInTime}
              onChange={(e) => setFormData({ ...formData, tapInTime: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
            />
          ) : (
            <div className="text-2xl font-semibold text-ink">
              {arrivalPlan.tapInTime || '7:25 am (EE)'}
            </div>
          )}
        </div>

        <div className="bg-surface-dark/20 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Zap className="w-4 h-4 mr-2 text-yellow-400" />
            <h4 className="font-medium text-ink">First showtime/parade to catch</h4>
          </div>
          {isEditing ? (
            <input
              type="text"
              placeholder="e.g., Festival of Fantasy 3:00 pm"
              value={formData.ropeDropTarget}
              onChange={(e) => setFormData({ ...formData, ropeDropTarget: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm"
            />
          ) : (
            <div className="text-sm font-medium text-ink">
              {arrivalPlan.ropeDropTarget || 'Festival of Fantasy 3:00 pm'}
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center space-x-3 pt-4 border-t border-surface-dark/30">
          <button
            onClick={handleSave}
            className="btn-primary btn-sm flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            className="btn-secondary btn-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

const LightningLaneSection = ({ lightningLanePlan, onUpdate, tripDay }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    multiPassSelections: lightningLanePlan.multiPassSelections || ['', '', ''],
    refillStrategy: lightningLanePlan.refillStrategy || '',
    singlePassTargets: lightningLanePlan.singlePassTargets || [''],
    notes: lightningLanePlan.notes || ''
  });

  // Get available rides with multipass for the current park
  const availableRides = getDoItemsByPark(tripDay.parkId || 'magic-kingdom')
    .filter(item =>
      (item.type === 'ride' || item.type === 'show') &&
      item.features?.multiPass &&
      !item.tags?.includes('temporarily-closed') &&
      !item.tags?.includes('permanently-closed')
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get rides available for single pass (high demand rides)
  const singlePassRides = getDoItemsByPark(tripDay.parkId || 'magic-kingdom')
    .filter(item =>
      (item.type === 'ride' || item.type === 'show') &&
      item.features?.singlePass &&
      !item.tags?.includes('temporarily-closed') &&
      !item.tags?.includes('permanently-closed')
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleModalSave = () => {
    onUpdate(formData);
    setShowModal(false);
  };

  const handleModalCancel = () => {
    setFormData({
      multiPassSelections: lightningLanePlan.multiPassSelections || ['', '', ''],
      refillStrategy: lightningLanePlan.refillStrategy || '',
      singlePassTargets: lightningLanePlan.singlePassTargets || [''],
      notes: lightningLanePlan.notes || ''
    });
    setShowModal(false);
  };

  const handleCancel = () => {
    setFormData({
      multiPassSelections: lightningLanePlan.multiPassSelections || ['', '', ''],
      refillStrategy: lightningLanePlan.refillStrategy || '',
      singlePassTargets: lightningLanePlan.singlePassTargets || [''],
      notes: lightningLanePlan.notes || ''
    });
    setIsEditing(false);
  };

  const updateMultiPass = (index: number, value: string) => {
    const newSelections = [...formData.multiPassSelections];
    newSelections[index] = value;
    setFormData({ ...formData, multiPassSelections: newSelections });
  };

  const updateSinglePass = (index: number, value: string) => {
    const newTargets = [...formData.singlePassTargets];
    newTargets[index] = value;
    setFormData({ ...formData, singlePassTargets: newTargets });
  };

  const addSinglePassSlot = () => {
    setFormData({
      ...formData,
      singlePassTargets: [...formData.singlePassTargets, '']
    });
  };

  // Check if any Lightning Lane data exists
  const hasMultiPassData = lightningLanePlan.multiPassSelections?.some((selection: string) => selection?.trim());
  const hasRefillStrategy = lightningLanePlan.refillStrategy?.trim();
  const hasSinglePassData = lightningLanePlan.singlePassTargets?.some((target: string) => target?.trim());
  const hasNotes = lightningLanePlan.notes?.trim();
  const hasAnyData = hasMultiPassData || hasRefillStrategy || hasSinglePassData || hasNotes;

  return (
    <div className="bg-surface-dark/10 border border-surface-dark/20 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-medium text-ink flex items-center">
          <span className="text-lg mr-2">⚡</span>
          Lightning Lane Plan
        </h4>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 hover:bg-surface-dark/30 rounded-lg transition-colors"
          title="Edit Lightning Lane Plan"
        >
          <Edit className="w-4 h-4 text-ink-light hover:text-ink" />
        </button>
      </div>

      <div className="space-y-4">
        {!hasAnyData ? (
          <div className="text-center py-6 text-ink-light">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm font-medium">No Lightning Lane plan set yet</p>
            <p className="text-xs mt-1">Click the edit icon to set up your Lightning Lane strategy!</p>
          </div>
        ) : (
          <>
            {/* Multi Pass Section - only show if has data */}
            {hasMultiPassData && (
              <div className="bg-surface-dark/20 rounded-lg p-4">
                <h4 className="font-medium text-ink mb-3 flex items-center">
                  <span className="text-blue-400 mr-2">⚡</span>
                  Multi Pass — Pre-selected 3
                </h4>
                <div className="space-y-3">
                  {lightningLanePlan.multiPassSelections?.map((selection: string, index: number) =>
                    selection?.trim() && (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="text-sm text-ink-light w-8">#{index + 1}</span>
                        <div className="flex-1 text-sm text-ink">{selection}</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Refill Strategy - only show if has data */}
            {hasRefillStrategy && (
              <div className="bg-surface-dark/20 rounded-lg p-4">
                <h4 className="font-medium text-ink mb-3 flex items-center">
                  <span className="text-green-400 mr-2">🔄</span>
                  Refill strategy
                </h4>
                <div className="text-sm text-ink">{lightningLanePlan.refillStrategy}</div>
              </div>
            )}

            {/* Single Pass - only show if has data */}
            {hasSinglePassData && (
              <div className="bg-surface-dark/20 rounded-lg p-4">
                <h4 className="font-medium text-ink mb-3 flex items-center">
                  <span className="text-purple-400 mr-2">🎯</span>
                  Single Pass
                </h4>
                <div className="space-y-2">
                  {lightningLanePlan.singlePassTargets?.map((target: string, index: number) =>
                    target?.trim() && (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="text-sm text-ink-light w-8">#{index + 1}</span>
                        <div className="flex-1 text-sm text-ink">{target}</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            {/* Notes - only show if has data */}
            {hasNotes && (
              <div className="bg-surface-dark/20 rounded-lg p-4">
                <h4 className="font-medium text-ink mb-2">Notes</h4>
                <p className="text-sm text-ink-light">{lightningLanePlan.notes}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightning Lane Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                <span className="text-xl mr-2">⚡</span>
                Lightning Lane Plan
              </h3>
              <button
                onClick={handleModalCancel}
                className="p-2 hover:bg-surface-dark/30 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-ink-light hover:text-ink" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Multi Pass Section */}
              <div>
                <h4 className="text-sm font-medium text-ink mb-2 flex items-center">
                  <span className="text-base mr-2">⚡</span>
                  Multi Pass — Select 3 rides
                </h4>
                <div className="space-y-2">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-xs text-ink-light w-6">#{index + 1}</span>
                      <select
                        value={formData.multiPassSelections[index]}
                        onChange={(e) => updateMultiPass(index, e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-surface border border-surface-dark rounded text-ink text-xs"
                      >
                        <option value="">Select a ride...</option>
                        {availableRides.map((ride) => (
                          <option key={ride.id} value={ride.name}>
                            {ride.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refill Strategy */}
              <div>
                <h4 className="text-sm font-medium text-ink mb-2 flex items-center">
                  <span className="text-base mr-2">🔄</span>
                  Refill strategy (after first 3)
                </h4>
                <textarea
                  placeholder="e.g., Focus on family priorities nearby, or target specific attractions at desired times..."
                  value={formData.refillStrategy}
                  onChange={(e) => setFormData({ ...formData, refillStrategy: e.target.value })}
                  className="w-full px-2 py-1.5 bg-surface border border-surface-dark rounded text-ink text-xs h-16"
                />
              </div>

              {/* Single Pass */}
              <div>
                <h4 className="text-sm font-medium text-ink mb-2 flex items-center">
                  <span className="text-base mr-2">🎯</span>
                  Single Pass (if needed)
                </h4>
                <div className="space-y-2">
                  {formData.singlePassTargets.map((target, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-xs text-ink-light w-6">#{index + 1}</span>
                      <select
                        value={target}
                        onChange={(e) => updateSinglePass(index, e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-surface border border-surface-dark rounded text-ink text-xs"
                      >
                        <option value="">Select a ride...</option>
                        {singlePassRides.map((ride) => (
                          <option key={ride.id} value={ride.name}>
                            {ride.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button
                    onClick={addSinglePassSlot}
                    className="text-xs text-sea hover:text-sea/80 flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add another Single Pass slot
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-sm font-medium text-ink mb-2">Notes</h4>
                <textarea
                  placeholder="Stack PM windows if taking midday break..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-2 py-1.5 bg-surface border border-surface-dark rounded text-ink text-xs h-16"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-surface-dark/30 mt-6">
              <button
                onClick={handleModalCancel}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                className="btn-primary btn-sm flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



const BreakSection = ({ breakPlan, onUpdate }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    breakType: breakPlan.breakType || 'hotel',
    returnTime: breakPlan.returnTime || '',
    backInParkTime: breakPlan.backInParkTime || '',
    notes: breakPlan.notes || ''
  });

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      breakType: breakPlan.breakType || 'hotel',
      returnTime: breakPlan.returnTime || '',
      backInParkTime: breakPlan.backInParkTime || '',
      notes: breakPlan.notes || ''
    });
    setIsEditing(false);
  };

  const getBreakIcon = (type: string) => {
    switch (type) {
      case 'hotel': return '🏨';
      case 'nap': return '😴';
      case 'pool': return '🏊';
      case 'rest_in_park': return '🌳';
      default: return '☕';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink flex items-center">
          <Clock className="w-5 h-5 mr-3 text-blue-400" />
          Midday Break
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-secondary btn-sm"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Break Type Selection */}
      <div>
        <h4 className="font-medium text-ink mb-3">Break Type</h4>
        {isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'hotel', label: 'Return to Hotel', icon: '🏨' },
              { id: 'nap', label: 'Nap Time', icon: '😴' },
              { id: 'pool', label: 'Pool Break', icon: '🏊' },
              { id: 'rest_in_park', label: 'Rest in Park', icon: '🌳' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setFormData({ ...formData, breakType: option.id as any })}
                className={`p-3 rounded-lg border text-sm text-center transition-colors ${
                  formData.breakType === option.id
                    ? 'border-sea bg-sea/10 text-sea'
                    : 'border-surface-dark text-ink-light hover:border-sea/50'
                }`}
              >
                <div className="text-lg mb-1">{option.icon}</div>
                <div>{option.label}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <span className="text-2xl">{getBreakIcon(breakPlan.breakType)}</span>
            <span className="text-ink font-medium">
              {breakPlan.breakType === 'hotel' ? 'Return to Hotel' :
               breakPlan.breakType === 'nap' ? 'Nap Time' :
               breakPlan.breakType === 'pool' ? 'Pool Break' :
               breakPlan.breakType === 'rest_in_park' ? 'Rest in Park' :
               'Return to Hotel'}
            </span>
          </div>
        )}
      </div>

      {/* Timing */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-surface-dark/20 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Clock className="w-4 h-4 mr-2 text-blue-400" />
            <h4 className="font-medium text-ink">Return to Poly by</h4>
          </div>
          {isEditing ? (
            <input
              type="time"
              value={formData.returnTime}
              onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
            />
          ) : (
            <div className="text-2xl font-semibold text-ink">
              {breakPlan.returnTime || '1:00 pm'}
            </div>
          )}
        </div>

        <div className="bg-surface-dark/20 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <MapPin className="w-4 h-4 mr-2 text-green-400" />
            <h4 className="font-medium text-ink">Back in park by</h4>
          </div>
          {isEditing ? (
            <input
              type="time"
              value={formData.backInParkTime}
              onChange={(e) => setFormData({ ...formData, backInParkTime: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
            />
          ) : (
            <div className="text-2xl font-semibold text-ink">
              {breakPlan.backInParkTime || '4:00 pm'}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {isEditing && (
        <div className="bg-surface-dark/20 rounded-lg p-4">
          <h4 className="font-medium text-ink mb-3">Break Notes</h4>
          <textarea
            placeholder="Lunch plans, nap schedule, pool activities, etc..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm h-20"
          />
        </div>
      )}

      {breakPlan.notes && !isEditing && (
        <div className="bg-surface-dark/20 rounded-lg p-4">
          <h4 className="font-medium text-ink mb-2">Break Notes</h4>
          <p className="text-sm text-ink-light">{breakPlan.notes}</p>
        </div>
      )}

      {isEditing && (
        <div className="flex items-center space-x-3 pt-4 border-t border-surface-dark/30">
          <button
            onClick={handleSave}
            className="btn-primary btn-sm flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            className="btn-secondary btn-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};


const PrioritiesSection = ({ priorities, tripDay, onUpdate, getActivityRating }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // 'rating' or 'alphabetical'
  const [selectedPriorities, setSelectedPriorities] = useState(priorities || []);
  const [celebratingItems, setCelebratingItems] = useState<Set<string>>(new Set());
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  // Enhance priorities with completion tracking
  const enhancedPriorities = (priorities || []).map((priority: any) => ({
    ...priority,
    completed: priority.completed || false,
    completedAt: priority.completedAt || null
  }));

  // Calculate completion stats
  const completedCount = enhancedPriorities.filter((p: any) => p.completed).length;
  const totalCount = enhancedPriorities.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Get available activities from the park
  const getAvailableActivities = () => {
    if (!tripDay.parkId) return [];

    const activities = [];

    try {
      // Get only rides and shows (no experiences or dining) and filter out closed attractions
      const attractions = getDoItemsByPark(tripDay.parkId).filter(item => {
        // Only include rides and shows
        if (item.type !== 'ride' && item.type !== 'show') return false;

        // Filter out closed attractions (temporarily or permanently closed)
        if (item.tags?.includes('temporarily-closed') || item.tags?.includes('permanently-closed')) {
          return false;
        }

        return true;
      });
      attractions.forEach(item => {
        activities.push({
          id: item.id,
          name: item.name,
          type: 'attraction',
          category: item.type
        });
      });
    } catch (error) {
      console.log('Error loading activities:', error);
    }

    return activities;
  };

  const availableActivities = getAvailableActivities();

  // Filter activities based on search term and sort by selected criteria using useMemo for proper re-rendering
  const filteredActivities = useMemo(() => {
    return availableActivities
      .filter(activity =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'alphabetical') {
          return a.name.localeCompare(b.name);
        } else {
          // Sort by rating (highest to lowest)
          const ratingA = getActivityRating(a.id) || 0;
          const ratingB = getActivityRating(b.id) || 0;

          if (ratingB !== ratingA) {
            return ratingB - ratingA; // Higher ratings first
          }
          // If ratings are equal, fall back to alphabetical
          return a.name.localeCompare(b.name);
        }
      });
  }, [availableActivities, searchTerm, sortBy, getActivityRating]);

  // Toggle completion status with magical effects
  const toggleCompletion = (priorityId: string) => {
    const updatedPriorities = enhancedPriorities.map((priority: any) => {
      if (priority.id === priorityId) {
        const wasCompleted = priority.completed;
        const newCompleted = !wasCompleted;

        if (newCompleted && !wasCompleted) {
          // Trigger celebration for new completion
          triggerCelebration(priorityId);
          setJustCompleted(priorityId);
          setTimeout(() => setJustCompleted(null), 2000);
        }

        return {
          ...priority,
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : null
        };
      }
      return priority;
    });

    onUpdate(updatedPriorities);
  };

  // Trigger celebration animation
  const triggerCelebration = (itemId: string) => {
    setCelebratingItems(prev => new Set([...prev, itemId]));
    setTimeout(() => {
      setCelebratingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }, 2000);
  };

  // Confetti component for celebrations
  const ConfettiEffect = ({ isVisible }: { isVisible: boolean }) => {
    if (!isVisible) return null;

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full animate-bounce`}
            style={{
              left: `${20 + (i * 60) % 60}%`,
              backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'][i % 5],
              animationDelay: `${i * 100}ms`,
              animationDuration: '1000ms'
            }}
          />
        ))}
      </div>
    );
  };

  const openModal = () => {
    setSelectedPriorities([...enhancedPriorities]);
    setSearchTerm('');
    setSortBy('rating'); // Reset to default sort
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSearchTerm('');
    setSortBy('rating');
  };

  const addToPriorities = (activity: any) => {
    if (selectedPriorities.length >= 5) return; // Max 5 priorities
    if (selectedPriorities.find((p: any) => p.id === activity.id)) return; // Already selected

    const newPriority = {
      id: activity.id,
      name: activity.name,
      priority: selectedPriorities.length + 1,
      type: 'must-do',
      notes: '',
      category: activity.category,
      completed: false,
      completedAt: null
    };

    setSelectedPriorities([...selectedPriorities, newPriority]);
  };

  const removeFromPriorities = (id: string) => {
    const newPriorities = selectedPriorities.filter((p: any) => p.id !== id);
    // Update priority numbers
    newPriorities.forEach((p, index) => {
      p.priority = index + 1;
    });
    setSelectedPriorities(newPriorities);
  };

  const movePriority = (id: string, direction: 'up' | 'down') => {
    const currentIndex = selectedPriorities.findIndex((p: any) => p.id === id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === selectedPriorities.length - 1)
    ) return;

    const newPriorities = [...selectedPriorities];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newPriorities[currentIndex], newPriorities[targetIndex]] =
    [newPriorities[targetIndex], newPriorities[currentIndex]];

    // Update priority numbers
    newPriorities.forEach((p, index) => {
      p.priority = index + 1;
    });

    setSelectedPriorities(newPriorities);
  };

  const savePriorities = () => {
    onUpdate(selectedPriorities);
    closeModal();
  };

  return (
    <div className="bg-surface-dark/10 border border-surface-dark/20 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-medium text-ink flex items-center">
          <span className="text-lg mr-2">🎯</span>
          Today Priorities
        </h4>
        <div className="flex items-center space-x-2">
          {totalCount > 0 && (
            <div className="text-xs text-ink-light">
              {completedCount}/{totalCount}
            </div>
          )}
          <button
            onClick={openModal}
            className="text-sea hover:text-sea/80 p-1 rounded transition-colors"
            title="Edit priorities"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-ink-light">Progress</span>
            <span className="text-xs font-medium text-ink">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-surface-dark/30 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-glow to-sea rounded-full transition-all duration-700 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {completionPercentage === 100 && (
            <div className="text-center mt-2">
              <span className="text-xs text-glow font-medium">🎉 All priorities completed! Amazing job! 🎉</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {enhancedPriorities.length === 0 ? (
          <div className="text-center py-6 text-ink-light">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-sm font-medium">No priorities set yet</p>
            <p className="text-xs mt-1">Add your top priorities for the day!</p>
          </div>
        ) : (
          enhancedPriorities.map((priority: any, index: number) => (
            <div
              key={priority.id}
              className={`relative group rounded-lg border transition-all duration-500 ease-out ${
                priority.completed
                  ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
                  : 'bg-surface-dark/10 border-surface-dark/30 hover:border-glow/30 hover:bg-surface-dark/20'
              } ${justCompleted === priority.id ? 'animate-pulse' : ''}`}
            >
              {/* Celebration Effect */}
              <ConfettiEffect isVisible={celebratingItems.has(priority.id)} />

              <div className="p-2">
                <div className="flex items-center space-x-3">
                  {/* Custom Checkbox */}
                  <button
                    onClick={() => toggleCompletion(priority.id)}
                    className={`relative w-5 h-5 rounded-md border-2 transition-all duration-300 ease-out flex items-center justify-center group-hover:scale-110 ${
                      priority.completed
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 shadow-lg shadow-green-500/30'
                        : 'border-surface-dark/50 hover:border-glow/50 hover:shadow-md hover:shadow-glow/20'
                    }`}
                  >
                    {priority.completed && (
                      <div className="text-white animate-bounce">
                        ✓
                      </div>
                    )}
                    {/* Magical ring effect for incomplete items */}
                    {!priority.completed && (
                      <div className="absolute inset-0 rounded-lg border-2 border-glow/20 scale-0 group-hover:scale-100 transition-transform duration-300" />
                    )}
                  </button>

                  {/* Priority Number */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    priority.completed
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-glow/20 text-glow'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Activity Name */}
                  <div className="flex-1">
                    <span className={`text-sm font-medium transition-all duration-500 ${
                      priority.completed
                        ? 'text-green-400 line-through'
                        : 'text-ink'
                    }`}>
                      {priority.name}
                    </span>
                    {priority.completed && priority.completedAt && (
                      <div className="text-xs text-green-400/70 mt-1">
                        ✨ Completed {new Date(priority.completedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>

                  {/* Completion Status Icons */}
                  <div className="flex items-center space-x-1">
                    {priority.completed ? (
                      <div className="flex items-center space-x-1 animate-bounce">
                        <span className="text-lg">🎉</span>
                        <span className="text-lg">⭐</span>
                      </div>
                    ) : (
                      <div className="opacity-30 group-hover:opacity-60 transition-opacity">
                        <span className="text-sm">🎯</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Magical completion wave effect */}
                {justCompleted === priority.id && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-glow/20 to-sea/20 animate-pulse pointer-events-none" />
                )}
              </div>
            </div>
          ))
        )}
      </div>


      {/* Priority Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] border border-surface-dark/30 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                <Target className="w-5 h-5 mr-2 text-glow" />
                Edit Priorities
              </h3>
              <button
                onClick={closeModal}
                className="text-ink-light hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Available Activities */}
              <div className="w-1/2 p-6 border-r border-surface-dark/20">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-ink mb-2">Available Activities</h4>
                  <input
                    type="text"
                    placeholder="Search rides and shows..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 mb-3 bg-surface-dark/20 border border-surface-dark rounded text-ink text-sm focus:border-glow/50 focus:ring-1 focus:ring-glow/20 transition-all"
                  />

                  {/* Sort Options */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-ink-light">Sort by:</span>
                    <div className="flex bg-surface-dark/20 rounded p-1">
                      <button
                        onClick={() => setSortBy('rating')}
                        className={`px-3 py-1 text-xs rounded transition-all ${
                          sortBy === 'rating'
                            ? 'bg-glow/20 text-glow border border-glow/30'
                            : 'text-ink-light hover:text-ink'
                        }`}
                      >
                        Rating
                      </button>
                      <button
                        onClick={() => setSortBy('alphabetical')}
                        className={`px-3 py-1 text-xs rounded transition-all ${
                          sortBy === 'alphabetical'
                            ? 'bg-glow/20 text-glow border border-glow/30'
                            : 'text-ink-light hover:text-ink'
                        }`}
                      >
                        A-Z
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-80">
                  {filteredActivities.map((activity) => {
                    const isSelected = selectedPriorities.find((p: any) => p.id === activity.id);
                    const canAdd = selectedPriorities.length < 5 && !isSelected;

                    return (
                      <div
                        key={activity.id}
                        className={`p-3 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-glow/30 bg-glow/10 text-ink shadow-md shadow-glow/20'
                            : canAdd
                            ? 'border-surface-dark/30 bg-surface-dark/10 hover:bg-surface-dark/20 hover:border-glow/30 hover:shadow-md text-ink'
                            : 'border-surface-dark/30 bg-surface-dark/5 text-ink-light opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => canAdd && addToPriorities(activity)}
                      >
                        <div className="font-medium flex items-center">
                          {isSelected && <span className="mr-2">✨</span>}
                          {activity.name}
                        </div>
                        <div className="text-xs text-ink-light mt-1 flex items-center justify-between">
                          <span>
                            {activity.type === 'attraction' ? '🎢' : '🍽️'} {activity.category}
                          </span>
                          {(() => {
                            const rating = getActivityRating(activity.id);
                            return rating ? <StarRating rating={rating} size="sm" /> : null;
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Priorities */}
              <div className="w-1/2 p-6">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-ink flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-glow" />
                    Selected Priorities ({selectedPriorities.length}/5)
                  </h4>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-80">
                  {selectedPriorities.map((priority: any, index: number) => (
                    <div key={priority.id} className="p-3 bg-surface-dark/20 rounded-lg border border-surface-dark/30 hover:border-glow/30 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-1 mr-2">
                          <div className="w-5 h-5 rounded-full bg-glow/20 flex items-center justify-center text-xs font-bold text-glow">
                            {index + 1}
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-ink">{priority.name}</span>
                            {(() => {
                              const rating = getActivityRating(priority.id);
                              return rating ? <StarRating rating={rating} size="sm" /> : null;
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => movePriority(priority.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-ink-light hover:text-glow disabled:opacity-30 transition-colors"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => movePriority(priority.id, 'down')}
                            disabled={index === selectedPriorities.length - 1}
                            className="p-1 text-ink-light hover:text-glow disabled:opacity-30 transition-colors"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeFromPriorities(priority.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedPriorities.length === 0 && (
                    <div className="text-center py-8 text-ink-light">
                      <div className="text-3xl mb-2">🎯</div>
                      <p className="text-sm font-medium">No priorities selected</p>
                      <p className="text-xs mt-1">Select up to 5 activities from the left</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-surface-dark/20">
              <div className="text-xs text-ink-light">
Select up to 5 priority rides and shows for today
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-ink-light hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePriorities}
                  className="px-4 py-2 bg-gradient-to-r from-glow to-sea text-white rounded-lg hover:shadow-lg hover:shadow-glow/30 transition-all"
                >
                  Save Priorities
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



const MagicShotsSection = ({ photos, onUpdate }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [photoPlans, setPhotoPlans] = useState({
    familyPhoto: photos?.familyPhoto || '',
    magicShots: photos?.magicShots || ''
  });

  const saveChanges = () => {
    onUpdate(photoPlans);
    setIsEditing(false);
  };

  return (
    <div className="bg-surface-dark/10 border border-surface-dark/20 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-medium text-ink flex items-center">
          <span className="text-lg mr-2">📸</span>
          Photos and Magic Shots
        </h4>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 hover:bg-surface-dark/30 rounded-lg transition-colors"
          title="Edit Photos and Magic Shots"
        >
          <Edit className="w-4 h-4 text-ink-light hover:text-ink" />
        </button>
      </div>
      <div className="space-y-1 text-xs text-ink-light">
        {photoPlans.familyPhoto && <p>{photoPlans.familyPhoto}</p>}
        {photoPlans.magicShots && <p>{photoPlans.magicShots}</p>}
        {!photoPlans.familyPhoto && !photoPlans.magicShots && (
          <p className="text-ink-light/60 italic">No photo plans set yet</p>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full border border-surface-dark/30">
            <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                <span className="text-xl mr-2">📸</span>
                Edit Photos and Magic Shots
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-ink-light hover:text-ink"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <label className="block text-sm font-medium text-ink mb-4">
                Add your photo plans and magic shot ideas:
              </label>
              <textarea
                value={photoPlans.familyPhoto}
                onChange={(e) => setPhotoPlans({ ...photoPlans, familyPhoto: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm"
                rows={3}
                placeholder=""
              />
              <textarea
                value={photoPlans.magicShots}
                onChange={(e) => setPhotoPlans({ ...photoPlans, magicShots: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm"
                rows={3}
                placeholder=""
              />
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t border-surface-dark/20">
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BackupPlanSection = ({ backupPlan, onUpdate }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [plans, setPlans] = useState({
    rainPlan: backupPlan?.rainPlan || '',
    crowdPlan: backupPlan?.crowdPlan || ''
  });

  const saveChanges = () => {
    onUpdate(plans);
    setIsEditing(false);
  };

  return (
    <div className="bg-surface-dark/10 border border-surface-dark/20 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-medium text-ink flex items-center">
          <span className="text-lg mr-2">☂️</span>
          Backup Plan
        </h4>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 hover:bg-surface-dark/30 rounded-lg transition-colors"
          title="Edit Backup Plan"
        >
          <Edit className="w-4 h-4 text-ink-light hover:text-ink" />
        </button>
      </div>
      <div className="space-y-1 text-xs text-ink-light">
        {plans.rainPlan && <p>{plans.rainPlan}</p>}
        {plans.crowdPlan && <p>{plans.crowdPlan}</p>}
        {!plans.rainPlan && !plans.crowdPlan && (
          <p className="text-ink-light/60 italic">No backup plans set yet</p>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full border border-surface-dark/30">
            <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                <span className="text-xl mr-2">☂️</span>
                Edit Backup Plan
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-ink-light hover:text-ink"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <label className="block text-sm font-medium text-ink mb-4">
                Add your backup plans for rain and crowds:
              </label>
              <textarea
                value={plans.rainPlan}
                onChange={(e) => setPlans({ ...plans, rainPlan: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm"
                rows={3}
                placeholder=""
              />
              <textarea
                value={plans.crowdPlan}
                onChange={(e) => setPlans({ ...plans, crowdPlan: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm"
                rows={3}
                placeholder=""
              />
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t border-surface-dark/20">
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EntertainmentShowsBox = ({ parkId }: any) => {
  // Get entertainment shows from database, filtering for parades and fireworks only
  const getEntertainmentShows = (parkId: string) => {
    if (!parkId) return { parades: [], fireworks: [] };

    // Filter entertainment by park and type (parades and fireworks only)
    const parkEntertainment = entertainment.filter(item => item.parkId === parkId);

    // Separate parades and fireworks based on tags
    const parades = parkEntertainment.filter(item =>
      item.tags?.includes('parade') || item.tags?.includes('nighttime-parade')
    );

    const fireworks = parkEntertainment.filter(item =>
      item.tags?.includes('fireworks')
    );

    // Map to display format with times from schedule system
    const formatShows = (shows: any[]) => shows.map(show => ({
      name: show.name,
      times: getEntertainmentShowTimes(parkId, show.id),
      type: show.tags?.includes('fireworks') ? 'fireworks' : 'parade'
    }));

    return {
      parades: formatShows(parades),
      fireworks: formatShows(fireworks)
    };
  };

  const shows = getEntertainmentShows(parkId);
  const hasShows = shows.parades.length > 0 || shows.fireworks.length > 0;

  if (!hasShows) return null;

  return (
    <div className="bg-surface-dark/10 border border-surface-dark/20 rounded-xl p-4">
      <h4 className="text-sm font-medium text-ink mb-4 flex items-center">
        <span className="text-base mr-2">🎭</span>
        Today's Entertainment
      </h4>

      <div className="relative">
        {/* Create timeline entries for all shows */}
        {(() => {
          // Combine all shows with their times and create timeline entries
          const timelineEntries: Array<{time: string, name: string, type: 'parade' | 'fireworks', icon: string}> = [];

          // Add parades
          shows.parades.forEach(show => {
            show.times.forEach((time: string) => {
              timelineEntries.push({
                time: time,
                name: show.name,
                type: 'parade',
                icon: '🎪'
              });
            });
          });

          // Add fireworks
          shows.fireworks.forEach(show => {
            show.times.forEach((time: string) => {
              timelineEntries.push({
                time: time,
                name: show.name,
                type: 'fireworks',
                icon: '🎆'
              });
            });
          });

          // Sort by time
          timelineEntries.sort((a, b) => {
            const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
            const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
            return timeA - timeB;
          });

          if (timelineEntries.length === 0) return null;

          // Determine grid columns based on number of entries
          const gridCols = timelineEntries.length === 1 ? 'grid-cols-1' :
                          timelineEntries.length === 2 ? 'grid-cols-2' :
                          timelineEntries.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

          return (
            <>
              {/* Timeline Line (only if more than 1 entry) */}
              {timelineEntries.length > 1 && (
                <div className="absolute top-6 left-6 right-6 h-0.5 z-0" style={{
                  background: 'linear-gradient(to right, rgb(168 85 247), rgb(74 222 128))'
                }}></div>
              )}

              {/* Timeline entries */}
              <div className={`grid ${gridCols} gap-4`}>
                {timelineEntries.map((entry, index) => {
                  const colors = entry.type === 'fireworks'
                    ? { border: 'border-green-400', bg: 'bg-green-400/20', text: 'text-green-400' }
                    : { border: 'border-purple-400', bg: 'bg-purple-400/20', text: 'text-purple-400' };

                  return (
                    <div key={index} className="text-center">
                      {/* Large circular icon */}
                      <div className={`w-12 h-12 rounded-full bg-surface border-2 ${colors.border} flex items-center justify-center mx-auto mb-3 relative z-10`}>
                        <div className={`absolute inset-0 rounded-full ${colors.bg}`}></div>
                        <span className="text-lg relative z-10">{entry.icon}</span>
                      </div>

                      {/* Show name */}
                      <div className="font-semibold text-ink text-sm mb-1 leading-tight">
                        {entry.name}
                      </div>

                      {/* Time */}
                      <div className={`text-xl font-bold ${colors.text} mb-1`}>
                        {entry.time.toLowerCase()}
                      </div>

                      {/* Type label */}
                      <div className="text-xs text-ink-light">
                        {entry.type === 'fireworks' ? 'Fireworks' : 'Parade'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

const ArrivalStrategyBox = ({ arrivalPlan, onUpdate, tripDay }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTimingInfo, setShowTimingInfo] = useState(false);

  // Transport time estimates (in minutes)
  const transportTimes = {
    walk: 15,    // Walk to TTC + monorail
    monorail: 20, // Direct monorail
    bus: 25,     // Bus transport
    car: 20,     // Drive + parking + walk
    boat: 30,    // Boat transport
    rideshare: 15 // Quick drop-off
  };

  const getTransportIcon = (method: string) => {
    const icons = {
      car: '🚗', monorail: '🚝', bus: '🚌', boat: '⛵', rideshare: '🚕', walk: '🚶'
    };
    return icons[method as keyof typeof icons] || '🚶';
  };

  // Calculate times based on tap-in time and transport method
  const calculateTimes = () => {
    const tapInTime = arrivalPlan.tapInTime || '07:25';
    const transportMethod = arrivalPlan.transportMethod || 'walk';

    const tapIn = new Date(`2000-01-01T${tapInTime}`);
    const time = new Date(`2000-01-01T${tapInTime}`);
    const hour = time.getHours();
    const minute = time.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Use 30 minutes for rope drop scenarios (before 8:30 AM), otherwise 15 minutes
    const isRopeDrop = totalMinutes <= 510; // Before 8:30 AM
    const securityBuffer = isRopeDrop ? 30 : 15;
    const transportTime = transportTimes[transportMethod as keyof typeof transportTimes] || 15;

    // Calculate arrival at park entrance (tap in - security buffer)
    const arriveAtParkTime = new Date(tapIn.getTime() - (securityBuffer * 60000));

    // Calculate leave room time (arrival at park - transport time)
    const leaveTime = new Date(arriveAtParkTime.getTime() - (transportTime * 60000));

    return {
      leaveRoom: leaveTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      security: arriveAtParkTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      tapIn: tapIn.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      breakdown: {
        transportTime,
        securityBuffer,
        isRopeDrop,
        totalMinutes: transportTime + securityBuffer
      }
    };
  };

  const times = calculateTimes();

  const handleTapInTimeChange = (newTime: string) => {
    onUpdate({ ...arrivalPlan, tapInTime: newTime });
  };

  const handleTransportChange = (newTransport: string) => {
    onUpdate({ ...arrivalPlan, transportMethod: newTransport });
  };

  const handleFirstTargetChange = (newTarget: string) => {
    onUpdate({ ...arrivalPlan, ropeDropTarget: newTarget });
  };

  // Get attractions for dropdown
  const getAvailableAttractions = () => {
    const dayType = tripDay.dayType || 'park-day';

    // Fallback attractions for each park
    const fallbackAttractions = {
      'magic-kingdom': [
        'Seven Dwarfs Mine Train', 'Space Mountain', 'Big Thunder Mountain', 'Splash Mountain',
        'Pirates of the Caribbean', 'Haunted Mansion', 'Peter Pan\'s Flight', 'It\'s a Small World'
      ],
      'epcot': [
        'Guardians of the Galaxy', 'Test Track', 'Soarin\'', 'Frozen Ever After',
        'Remy\'s Ratatouille Adventure', 'The Seas with Nemo', 'Living with the Land'
      ],
      'hollywood-studios': [
        'Rise of the Resistance', 'Millennium Falcon', 'Rock \'n\' Roller Coaster', 'Tower of Terror',
        'Slinky Dog Dash', 'Mickey & Minnie\'s Runaway Railway', 'Toy Story Midway Mania'
      ],
      'animal-kingdom': [
        'Avatar Flight of Passage', 'Expedition Everest', 'Kilimanjaro Safaris', 'Na\'vi River Journey',
        'DINOSAUR', 'Kali River Rapids', 'TriceraTop Spin'
      ]
    };

    if (dayType === 'park-hopper') {
      // For park hopper, get all attractions from all parks
      const allParks = ['magic-kingdom', 'epcot', 'hollywood-studios', 'animal-kingdom'];
      const allAttractions = allParks.flatMap(parkId => {
        try {
          const attractions = getDoItemsByPark(parkId).filter(item =>
            item.type === 'ride' || item.type === 'show' || item.type === 'experience'
          );

          if (attractions.length > 0) {
            return attractions.map(item => ({
              ...item,
              displayName: `${item.name} (${getParkById(parkId)?.abbreviation || parkId})`
            }));
          } else {
            // Use fallback data
            return fallbackAttractions[parkId as keyof typeof fallbackAttractions]?.map(name => ({
              id: `${parkId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
              name,
              displayName: `${name} (${getParkById(parkId)?.abbreviation || parkId})`
            })) || [];
          }
        } catch (error) {
          // Use fallback data on error
          return fallbackAttractions[parkId as keyof typeof fallbackAttractions]?.map(name => ({
            id: `${parkId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
            name,
            displayName: `${name} (${getParkById(parkId)?.abbreviation || parkId})`
          })) || [];
        }
      });
      return allAttractions;
    } else if (tripDay.parkId) {
      // For single park day, get attractions from selected park
      try {
        const attractions = getDoItemsByPark(tripDay.parkId).filter(item =>
          item.type === 'ride' || item.type === 'show' || item.type === 'experience'
        );

        if (attractions.length > 0) {
          return attractions.map(item => ({
            ...item,
            displayName: item.name
          }));
        } else {
          // Use fallback data
          return fallbackAttractions[tripDay.parkId as keyof typeof fallbackAttractions]?.map(name => ({
            id: `${tripDay.parkId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
            name,
            displayName: name
          })) || [];
        }
      } catch (error) {
        // Use fallback data on error
        return fallbackAttractions[tripDay.parkId as keyof typeof fallbackAttractions]?.map(name => ({
          id: `${tripDay.parkId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
          name,
          displayName: name
        })) || [];
      }
    }

    return [];
  };

  const availableAttractions = getAvailableAttractions();

  // Determine if tap-in time is during early entry or regular hours
  const getTapInLabel = () => {
    const tapInTime = arrivalPlan.tapInTime || '07:25';
    const time = new Date(`2000-01-01T${tapInTime}`);
    const hour = time.getHours();
    const minute = time.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Early Entry is typically 7:00-8:30 AM (420-510 minutes from midnight)
    // Regular park opening is usually 9:00 AM (540 minutes)
    if (totalMinutes <= 510) { // Before 8:30 AM
      return 'Early Entry 🎯';
    } else if (totalMinutes <= 540) { // 8:30-9:00 AM
      return 'Pre-Opening 🚪';
    } else if (totalMinutes <= 720) { // 9:00 AM - 12:00 PM
      return 'Morning Entry ☀️';
    } else if (totalMinutes <= 1080) { // 12:00 PM - 6:00 PM
      return 'Afternoon Entry 🌤️';
    } else {
      return 'Evening Entry 🌙';
    }
  };

  // Determine the appropriate label for first target based on time
  const getFirstTargetLabel = () => {
    const tapInTime = arrivalPlan.tapInTime || '07:25';
    const time = new Date(`2000-01-01T${tapInTime}`);
    const hour = time.getHours();
    const minute = time.getMinutes();
    const totalMinutes = hour * 60 + minute;

    if (totalMinutes <= 510) { // Before 8:30 AM
      return 'Rope drop';
    } else if (totalMinutes <= 540) { // 8:30-9:00 AM
      return 'First ride';
    } else if (totalMinutes <= 720) { // 9:00 AM - 12:00 PM
      return 'Morning target';
    } else if (totalMinutes <= 1080) { // 12:00 PM - 6:00 PM
      return 'Next attraction';
    } else {
      return 'Evening plan';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-base font-semibold text-ink flex items-center">
            <Clock className="w-4 h-4 mr-2 text-sea" />
            Arrival Strategy
          </h3>
          <button
            onClick={() => setShowTimingInfo(true)}
            className="ml-2 p-1 rounded-full hover:bg-surface-dark/20 transition-colors"
            title="View timing breakdown"
          >
            <Info className="w-4 h-4 text-ink-light" />
          </button>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-sea hover:text-sea/80 flex items-center p-2 rounded bg-sea/10 transition-colors"
          title={isEditing ? 'Done editing' : 'Edit arrival strategy'}
        >
          {isEditing ? (
            <Save className="w-4 h-4" />
          ) : (
            <Edit className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Horizontal Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 z-0" style={{ background: 'linear-gradient(to right, rgb(248 113 113), rgb(250 204 21), rgb(74 222 128), rgb(168 85 247))' }}></div>

        {/* Timeline Steps - Horizontal Grid */}
        <div className="grid grid-cols-4 gap-4">
          {/* Step 1: Leave Room */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-surface border-2 border-red-400 flex items-center justify-center mx-auto mb-3 relative z-10">
              <div className="absolute inset-0 rounded-full bg-red-400/20"></div>
              <span className="text-lg relative z-10">🏨</span>
            </div>
            <div className="font-semibold text-ink text-sm mb-1">Leave room by</div>
            <div className="text-xl font-bold text-red-400 mb-1">{times.leaveRoom.toLowerCase()}</div>
            <div className="text-xs text-ink-light">Pack & go</div>
          </div>

          {/* Step 2: At Security */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-surface border-2 border-yellow-400 flex items-center justify-center mx-auto mb-3 relative z-10">
              <div className="absolute inset-0 rounded-full bg-yellow-400/20"></div>
              <div className="text-lg relative z-10">{getTransportIcon(arrivalPlan.transportMethod)}</div>
            </div>
            <div className="font-semibold text-ink text-sm mb-1">At park entrance by</div>
            <div className="text-xl font-bold text-yellow-400 mb-1">{times.security.toLowerCase()}</div>
            <div className="text-xs text-ink-light">
              {isEditing ? (
                <select
                  value={arrivalPlan.transportMethod || 'walk'}
                  onChange={(e) => handleTransportChange(e.target.value)}
                  className="bg-surface border border-surface-dark rounded px-1 py-1 text-xs w-full"
                >
                  <option value="walk">🚶 Walk</option>
                  <option value="monorail">🚝 Monorail</option>
                  <option value="bus">🚌 Bus</option>
                  <option value="car">🚗 Drive</option>
                  <option value="boat">⛵ Boat</option>
                  <option value="rideshare">🚕 Rideshare</option>
                </select>
              ) : (
                <span>{arrivalPlan.transportMethod || 'walk'}</span>
              )}
            </div>
          </div>

          {/* Step 3: Tap In */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-surface border-2 border-green-400 flex items-center justify-center mx-auto mb-3 relative z-10">
              <div className="absolute inset-0 rounded-full bg-green-400/20"></div>
              <span className="text-xl relative z-10">⏰</span>
            </div>
            <div className="font-semibold text-ink text-sm mb-1">Tap in by</div>
            <div className="text-xl font-bold text-green-400 mb-1">
              {isEditing ? (
                <input
                  type="time"
                  value={arrivalPlan.tapInTime || '07:25'}
                  onChange={(e) => handleTapInTimeChange(e.target.value)}
                  className="bg-surface border border-surface-dark rounded px-2 py-1 text-green-400 font-bold text-sm w-full"
                />
              ) : (
                times.tapIn.toLowerCase()
              )}
            </div>
            <div className="text-xs text-ink-light">{getTapInLabel()}</div>
          </div>

          {/* Step 4: First Target */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-surface border-2 border-purple-400 flex items-center justify-center mx-auto mb-3 relative z-10">
              <div className="absolute inset-0 rounded-full bg-purple-400/20"></div>
              <span className="text-xl relative z-10">🎯</span>
            </div>
            <div className="font-semibold text-ink text-sm mb-1">First target</div>
            <div className="text-sm font-semibold text-purple-400 mb-1 min-h-[1.25rem]">
              {isEditing ? (
                <select
                  value={arrivalPlan.ropeDropTarget || ''}
                  onChange={(e) => handleFirstTargetChange(e.target.value)}
                  className="bg-surface border border-surface-dark rounded px-2 py-1 text-purple-400 font-semibold text-xs w-full"
                >
                  <option value="">Select attraction</option>
                  {availableAttractions.map((attraction) => (
                    <option key={attraction.id} value={attraction.name}>
                      {attraction.displayName}
                    </option>
                  ))}
                </select>
              ) : (
                arrivalPlan.ropeDropTarget || '7 Dwarfs'
              )}
            </div>
            <div className="text-xs text-ink-light">{getFirstTargetLabel()}</div>
          </div>
        </div>
      </div>

      {/* Arrival Timing Breakdown Modal */}
      {showTimingInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                <Clock className="w-5 h-5 mr-2 text-sea" />
                Park Arrival Timing Breakdown
              </h3>
              <button
                onClick={() => setShowTimingInfo(false)}
                className="p-1 rounded-lg hover:bg-surface-dark/10 transition-colors"
              >
                <XCircle className="w-5 h-5 text-ink-light" />
              </button>
            </div>

            <div className="p-4">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-ink">
                  {times.breakdown.totalMinutes}m
                </div>
                <div className="text-sm text-ink-light">
                  Total time from leaving room to tapping in
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-ink">Transportation</div>
                    <div className="text-sm text-ink-light capitalize">
                      {arrivalPlan.transportMethod || 'walk'} to park entrance
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {times.breakdown.transportTime}m
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="font-medium text-ink">Security Wait Time</div>
                    <div className="text-sm text-ink-light">
                      {times.breakdown.isRopeDrop ? 'Arrive early, wait for rope drop' : 'Wait in security line'}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {times.breakdown.securityBuffer}m
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-glow/10 rounded-lg">
                <div className="text-sm text-ink font-medium mb-1">💡 Pro Tip</div>
                <div className="text-xs text-ink-light">
                  {times.breakdown.isRopeDrop
                    ? 'Rope drop requires extra buffer time due to larger crowds and longer security lines. Arrive early for the best attraction access!'
                    : 'Regular park hours typically have shorter security lines, but still allow buffer time for unexpected delays.'
                  }
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-surface-dark/20">
              <button
                onClick={() => setShowTimingInfo(false)}
                className="px-4 py-2 bg-sea text-white rounded-lg hover:bg-sea/80 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Comprehensive Add Activity Modal for Park Days
const ParkDayAddActivityModal = ({ trip, tripDay, onClose, onQuickAdd }: any) => {
  const { addItem } = useTripStore();
  const [customActivity, setCustomActivity] = useState({ name: '', startTime: '', type: 'ride' as ActivityCategory });
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showAdrModal, setShowAdrModal] = useState(false);
  const [showNonAdrModal, setShowNonAdrModal] = useState(false);
  const [adrForm, setAdrForm] = useState({
    restaurantName: '',
    time: '',
    partySize: 2,
    confirmationNumber: '',
    notes: ''
  });
  // Individual break modal states
  const [showHotelBreakModal, setShowHotelBreakModal] = useState(false);
  const [showPoolBreakModal, setShowPoolBreakModal] = useState(false);
  const [showRestBreakModal, setShowRestBreakModal] = useState(false);

  // Individual break form states
  const [hotelBreakForm, setHotelBreakForm] = useState({ leaveTime: '', returnTime: '', notes: '' });
  const [poolBreakForm, setPoolBreakForm] = useState({ leaveTime: '', returnTime: '', notes: '' });
  const [restBreakForm, setRestBreakForm] = useState({ leaveTime: '', returnTime: '', notes: '' });
  const [nonAdrRestaurant, setNonAdrRestaurant] = useState('');

  const parkInfo = tripDay.parkId ? getParkById(tripDay.parkId) : null;

  // Get available attractions for this park
  const getAvailableAttractions = () => {
    if (!tripDay.parkId) return [];

    try {
      const attractions = getDoItemsByPark(tripDay.parkId);
      return attractions.filter(item =>
        item.type === 'ride' ||
        item.type === 'show' ||
        item.type === 'experience' ||
        item.type === 'meet_greet'
      );
    } catch {
      return [];
    }
  };

  const availableAttractions = getAvailableAttractions();

  // Get available restaurants for this park
  const getAvailableRestaurants = () => {
    if (!tripDay.parkId) return [];

    try {
      const restaurants = getEatItemsByPark(tripDay.parkId);
      return restaurants.filter(item =>
        item.type === 'table_service' ||
        item.type === 'quick_service'
      );
    } catch {
      return [];
    }
  };

  const availableRestaurants = getAvailableRestaurants();

  const getBreakIcon = (type: string) => {
    switch (type) {
      case 'hotel': return '🏨';
      case 'pool': return '🏊';
      case 'rest_in_park': return '🌳';
      default: return '☕';
    }
  };

  const getBreakLabel = (type: string) => {
    switch (type) {
      case 'hotel': return 'Return to Hotel';
      case 'pool': return 'Pool Break';
      case 'rest_in_park': return 'Rest in Park';
      default: return 'Return to Hotel';
    }
  };

  const addAdr = () => {
    if (!adrForm.restaurantName || !adrForm.time) return;

    // Create ADR name in the format expected by the enhanced card parser
    const details = [
      `Party: ${adrForm.partySize}`,
      ...(adrForm.confirmationNumber ? [`Confirmation: ${adrForm.confirmationNumber}`] : [])
    ].join(', ');

    const adrName = `ADR: ${adrForm.restaurantName} (${details})`;

    // Use addItem directly with startTime to create the enhanced ADR card
    addItem(trip.id, tripDay.id, {
      type: 'dining',
      name: adrName,
      startTime: adrForm.time,
      notes: adrForm.notes || ''
    });

    setAdrForm({ restaurantName: '', time: '', partySize: 2, confirmationNumber: '', notes: '' });
    setShowAdrModal(false);
    onClose();
  };

  const addNonAdr = () => {
    if (!nonAdrRestaurant) return;

    onQuickAdd('dining', undefined, nonAdrRestaurant);
    setNonAdrRestaurant('');
    setShowNonAdrModal(false);
    onClose();
  };

  const addHotelBreak = () => {
    if (!hotelBreakForm.leaveTime || !hotelBreakForm.returnTime) return;
    const breakName = `Return to Hotel (Leave: ${hotelBreakForm.leaveTime}, Return: ${hotelBreakForm.returnTime})`;
    onQuickAdd('break', undefined, breakName);
    setHotelBreakForm({ leaveTime: '', returnTime: '', notes: '' });
    setShowHotelBreakModal(false);
    onClose();
  };

  const addPoolBreak = () => {
    if (!poolBreakForm.leaveTime || !poolBreakForm.returnTime) return;
    const breakName = `Pool Break (Leave: ${poolBreakForm.leaveTime}, Return: ${poolBreakForm.returnTime})`;
    onQuickAdd('break', undefined, breakName);
    setPoolBreakForm({ leaveTime: '', returnTime: '', notes: '' });
    setShowPoolBreakModal(false);
    onClose();
  };

  const addRestBreak = () => {
    if (!restBreakForm.leaveTime || !restBreakForm.returnTime) return;
    const breakName = `Rest in Park (Leave: ${restBreakForm.leaveTime}, Return: ${restBreakForm.returnTime})`;
    onQuickAdd('break', undefined, breakName);
    setRestBreakForm({ leaveTime: '', returnTime: '', notes: '' });
    setShowRestBreakModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-surface rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-surface-dark/30">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-dark/20 bg-gradient-to-r from-sea-light/20 to-sea/20">
          <div>
            <h3 className="text-xl font-semibold text-ink flex items-center">
              {parkInfo ? (
                <>
                  <span className="text-2xl mr-2">{parkInfo.icon}</span>
                  Add Activity to {parkInfo.name}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2 text-sea" />
                  Add Park Day Activity
                </>
              )}
            </h3>
            <p className="text-sm text-ink-light mt-1">
              Add rides, shows, dining, or breaks to your park day schedule
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-dark/20 transition-colors"
          >
            <XCircle className="w-5 h-5 text-ink-light" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-8">

            {/* Restaurant Section */}
            <div>
              <h4 className="text-lg font-semibold text-ink mb-4 flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-orange-500" />
                Restaurant / Dining
              </h4>
              <div className="grid md:grid-cols-3 gap-3">
                <button
                  onClick={() => setShowAdrModal(true)}
                  className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                >
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🍽️</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink group-hover:text-sea transition-colors">
                      Add ADR (Advance Dining)
                    </div>
                    <div className="text-xs text-ink-light mt-1">
                      With confirmation details
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-ink-light group-hover:text-sea ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                </button>

                <button
                  onClick={() => setShowNonAdrModal(true)}
                  className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                >
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🍔</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink group-hover:text-sea transition-colors">
                      Add Restaurant/QS
                    </div>
                    <div className="text-xs text-ink-light mt-1">
                      Quick service or walk-up
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-ink-light group-hover:text-sea ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onQuickAdd('dining', undefined, 'Mobile Order Pickup');
                    onClose();
                  }}
                  className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                >
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📱</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink group-hover:text-sea transition-colors">
                      Mobile Order Pickup
                    </div>
                    <div className="text-xs text-ink-light mt-1">
                      Quick service meal
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-ink-light group-hover:text-sea ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              </div>
            </div>

            {/* Midday Break Section */}
            <div>
              <h4 className="text-lg font-semibold text-ink mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                Add Midday Break
              </h4>
              <div className="grid md:grid-cols-3 gap-3">
                {/* Return to Hotel Button */}
                <button
                  onClick={() => setShowHotelBreakModal(true)}
                  className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                >
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🏨</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink group-hover:text-sea transition-colors">
                      Return to Hotel
                    </div>
                    <div className="text-xs text-ink-light mt-1">
                      Take a break at your resort
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-ink-light group-hover:text-sea ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                </button>

                {/* Pool Break Button */}
                <button
                  onClick={() => setShowPoolBreakModal(true)}
                  className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                >
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🏊</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink group-hover:text-sea transition-colors">
                      Pool Break
                    </div>
                    <div className="text-xs text-ink-light mt-1">
                      Relax at the resort pool
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-ink-light group-hover:text-sea ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                </button>

                {/* Rest in Park Button */}
                <button
                  onClick={() => setShowRestBreakModal(true)}
                  className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                >
                  <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🌳</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink group-hover:text-sea transition-colors">
                      Rest in Park
                    </div>
                    <div className="text-xs text-ink-light mt-1">
                      Find a quiet spot in the park
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-ink-light group-hover:text-sea ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              </div>
            </div>

            {/* Available Attractions */}
            {availableAttractions.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-ink mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-500" />
                  {parkInfo?.name} Attractions
                </h4>
                <div className="grid md:grid-cols-3 gap-3">
                  {availableAttractions.slice(0, 12).map((attraction) => (
                    <button
                      key={attraction.id}
                      onClick={() => {
                        onQuickAdd(attraction.type, attraction.id, attraction.name);
                        onClose();
                      }}
                      className="flex items-start p-3 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-xl mr-3 group-hover:scale-110 transition-transform">
                        {attraction.type === 'ride' ? '🎢' :
                         attraction.type === 'show' ? '🎭' :
                         attraction.type === 'meet_greet' ? '👋' : '✨'}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-sea transition-colors text-sm">
                          {attraction.name}
                        </div>
                        <div className="text-xs text-ink-light mt-1 capitalize">
                          {attraction.type.replace('_', ' ')} • {attraction.intensity} intensity
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-sea ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Common Activity Types */}
            <div>
              <h4 className="text-lg font-semibold text-ink mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-glow" />
                Common Activities
              </h4>
              <div className="grid md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    onQuickAdd('shopping', undefined, 'Souvenir Shopping');
                    onClose();
                  }}
                  className="flex items-start p-3 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                >
                  <span className="text-xl mr-3 group-hover:scale-110 transition-transform">🛍️</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink group-hover:text-sea transition-colors text-sm">
                      Souvenir Shopping
                    </div>
                    <div className="text-xs text-ink-light mt-1">
                      Browse gift shops
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-ink-light group-hover:text-sea ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onQuickAdd('photos', undefined, 'PhotoPass Photos');
                    onClose();
                  }}
                  className="flex items-start p-3 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                >
                  <span className="text-xl mr-3 group-hover:scale-110 transition-transform">📸</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink group-hover:text-sea transition-colors text-sm">
                      PhotoPass Photos
                    </div>
                    <div className="text-xs text-ink-light mt-1">
                      Capture magical moments
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-ink-light group-hover:text-sea ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              </div>
            </div>

            {/* Custom Activity */}
            {!showCustomForm ? (
              <button
                onClick={() => setShowCustomForm(true)}
                className="w-full mt-4 p-3 border-2 border-dashed border-surface-dark rounded-lg text-ink-light hover:text-ink hover:border-ink transition-colors text-center"
              >
                <Plus className="w-4 h-4 mx-auto mb-1" />
                <span className="text-sm">Add Custom Activity</span>
              </button>
            ) : (
                <div className="bg-surface-dark/10 rounded-lg p-4 border border-surface-dark/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Activity name"
                      value={customActivity.name}
                      onChange={(e) => setCustomActivity({ ...customActivity, name: e.target.value })}
                      className="px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                    />
                    <select
                      value={customActivity.type}
                      onChange={(e) => setCustomActivity({ ...customActivity, type: e.target.value as ActivityCategory })}
                      className="px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                    >
                      <option value="ride">Ride</option>
                      <option value="show">Show</option>
                      <option value="dining">Dining</option>
                      <option value="shopping">Shopping</option>
                      <option value="photos">Photos</option>
                      <option value="break">Break</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        if (customActivity.name.trim()) {
                          onQuickAdd(customActivity.type, undefined, customActivity.name);
                          setCustomActivity({ name: '', startTime: '', type: 'ride' });
                          setShowCustomForm(false);
                          onClose();
                        }
                      }}
                      className="px-4 py-2 bg-sea hover:bg-sea/80 text-white rounded-lg transition-colors"
                    >
                      Add Activity
                    </button>
                    <button
                      onClick={() => setShowCustomForm(false)}
                      className="px-4 py-2 bg-surface-dark hover:bg-surface-dark/80 text-ink rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end items-center p-6 border-t border-surface-dark/20 bg-surface-dark/5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface-dark/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>

      {/* ADR Modal */}
      {showAdrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full border border-surface-dark/30">
            <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-orange-500" />
                Add ADR Details
              </h3>
              <button
                onClick={() => setShowAdrModal(false)}
                className="p-1 rounded-lg hover:bg-surface-dark/10 transition-colors"
              >
                <XCircle className="w-5 h-5 text-ink-light" />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Restaurant</label>
                  <select
                    value={adrForm.restaurantName}
                    onChange={(e) => setAdrForm({ ...adrForm, restaurantName: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                  >
                    <option value="">Select restaurant...</option>
                    {availableRestaurants.filter(r => r.features?.adrRequired || r.type === 'table_service').map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.name}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Time</label>
                    <input
                      type="time"
                      value={adrForm.time}
                      onChange={(e) => setAdrForm({ ...adrForm, time: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Party Size</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={adrForm.partySize}
                      onChange={(e) => setAdrForm({ ...adrForm, partySize: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Confirmation Number (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., 123456789"
                    value={adrForm.confirmationNumber}
                    onChange={(e) => setAdrForm({ ...adrForm, confirmationNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={addAdr}
                  disabled={!adrForm.restaurantName || !adrForm.time}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Add ADR
                </button>
                <button
                  onClick={() => setShowAdrModal(false)}
                  className="px-4 py-2 bg-surface-dark hover:bg-surface-dark/80 text-ink rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-ADR Restaurant Modal */}
      {showNonAdrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full border border-surface-dark/30">
            <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-orange-500" />
                Select Restaurant
              </h3>
              <button
                onClick={() => setShowNonAdrModal(false)}
                className="p-1 rounded-lg hover:bg-surface-dark/10 transition-colors"
              >
                <XCircle className="w-5 h-5 text-ink-light" />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Restaurant</label>
                  <select
                    value={nonAdrRestaurant}
                    onChange={(e) => setNonAdrRestaurant(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                  >
                    <option value="">Select restaurant...</option>
                    {availableRestaurants.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.name}>
                        {restaurant.name} ({restaurant.type.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={addNonAdr}
                  disabled={!nonAdrRestaurant}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Add Restaurant
                </button>
                <button
                  onClick={() => setShowNonAdrModal(false)}
                  className="px-4 py-2 bg-surface-dark hover:bg-surface-dark/80 text-ink rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hotel Break Modal */}
      {showHotelBreakModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full border border-surface-dark/30">
            <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                🏨 Return to Hotel
              </h3>
              <button
                onClick={() => setShowHotelBreakModal(false)}
                className="p-1 rounded-lg hover:bg-surface-dark/10 transition-colors"
              >
                <XCircle className="w-5 h-5 text-ink-light" />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Leave park at</label>
                    <input
                      type="time"
                      value={hotelBreakForm.leaveTime}
                      onChange={(e) => setHotelBreakForm({ ...hotelBreakForm, leaveTime: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Return to park at</label>
                    <input
                      type="time"
                      value={hotelBreakForm.returnTime}
                      onChange={(e) => setHotelBreakForm({ ...hotelBreakForm, returnTime: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={addHotelBreak}
                  disabled={!hotelBreakForm.leaveTime || !hotelBreakForm.returnTime}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Add Hotel Break
                </button>
                <button
                  onClick={() => setShowHotelBreakModal(false)}
                  className="px-4 py-2 bg-surface-dark hover:bg-surface-dark/80 text-ink rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pool Break Modal */}
      {showPoolBreakModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full border border-surface-dark/30">
            <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                🏊 Pool Break
              </h3>
              <button
                onClick={() => setShowPoolBreakModal(false)}
                className="p-1 rounded-lg hover:bg-surface-dark/10 transition-colors"
              >
                <XCircle className="w-5 h-5 text-ink-light" />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Leave park at</label>
                    <input
                      type="time"
                      value={poolBreakForm.leaveTime}
                      onChange={(e) => setPoolBreakForm({ ...poolBreakForm, leaveTime: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Return to park at</label>
                    <input
                      type="time"
                      value={poolBreakForm.returnTime}
                      onChange={(e) => setPoolBreakForm({ ...poolBreakForm, returnTime: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={addPoolBreak}
                  disabled={!poolBreakForm.leaveTime || !poolBreakForm.returnTime}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Add Pool Break
                </button>
                <button
                  onClick={() => setShowPoolBreakModal(false)}
                  className="px-4 py-2 bg-surface-dark hover:bg-surface-dark/80 text-ink rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest in Park Modal */}
      {showRestBreakModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-surface rounded-xl shadow-xl max-w-md w-full border border-surface-dark/30">
            <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                🌳 Rest in Park
              </h3>
              <button
                onClick={() => setShowRestBreakModal(false)}
                className="p-1 rounded-lg hover:bg-surface-dark/10 transition-colors"
              >
                <XCircle className="w-5 h-5 text-ink-light" />
              </button>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Leave park at</label>
                    <input
                      type="time"
                      value={restBreakForm.leaveTime}
                      onChange={(e) => setRestBreakForm({ ...restBreakForm, leaveTime: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Return to park at</label>
                    <input
                      type="time"
                      value={restBreakForm.returnTime}
                      onChange={(e) => setRestBreakForm({ ...restBreakForm, returnTime: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={addRestBreak}
                  disabled={!restBreakForm.leaveTime || !restBreakForm.returnTime}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Add Rest Break
                </button>
                <button
                  onClick={() => setShowRestBreakModal(false)}
                  className="px-4 py-2 bg-surface-dark hover:bg-surface-dark/80 text-ink rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};