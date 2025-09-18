import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Plus, Calendar, Clock, MapPin, ChevronDown, GripVertical, Edit, Save, XCircle, ArrowLeft, Info, Users, Star, Share2 } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTripStore } from '../../stores';
import { PARKS, getParkName } from '../../data/parks';
import { getCategoryIcon, getCategoryColor, getCategoryInfo } from '../../data/activityCategories';
import { getAllDoItems, getAllEatItems } from '@waylight/shared';
import { detectDayType, getDayIcon, getDayTypeInfo } from '../../utils/dayTypeUtils';
// import QuickAddBar from './QuickAddBar'; // Temporarily disabled due to syntax error
import TripOverview from './TripOverview';
import CheatSheetView from './CheatSheetView';
import TripSharingModal from '../collaboration/TripSharingModal';
import RestDayView from './dayViews/RestDayView';
import CheckInDayView from './dayViews/CheckInDayView';
import CheckOutDayView from './dayViews/CheckOutDayView';
import DisneySpringsView from './dayViews/DisneySpringsView';
import SpecialEventView from './dayViews/SpecialEventView';
import ParkDayView from './dayViews/ParkDayView';
import DayTypeModal from './DayTypeModal';
import ActivityPreferences from './ActivityPreferences';
import RatingsSummary from './RatingsSummary';

import type { Trip, ItineraryItem, ActivityCategory, TripDay, DayType } from '../../types';

interface TripDayPlannerProps {
  trip: Trip;
  onBackToTrips?: () => void;
}

interface DraggableItemProps {
  item: ItineraryItem;
  index: number;
  tripId: string;
  dayId: string;
  moveItem: (startIndex: number, endIndex: number) => void;
}

const DraggableItem = ({ item, index, tripId, dayId, moveItem }: DraggableItemProps) => {
  const { deleteItem, updateItem } = useTripStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // Get attraction data if this item references an attraction
  const allItems = [...getAllDoItems(), ...getAllEatItems()];
  const attraction = item.attractionId ? allItems.find(a => a.id === item.attractionId) : null;
  const [editData, setEditData] = useState({
    name: item.name,
    startTime: item.startTime || '',
    attractionId: item.attractionId || '',
    notes: item.notes || '',
    location: item.location || '',
    reservationNumber: item.reservationNumber || '',
    fastPassTime: item.fastPassTime || '',
    partySize: item.partySize || undefined,
    characters: item.characters?.join(', ') || '',
    tourGuide: item.tourGuide || '',
    eventType: item.eventType || '',
    isMustDo: item.isMustDo || false,
    isRopeDropTarget: item.isRopeDropTarget || false,
    priorityLevel: item.priorityLevel || undefined
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'itinerary-item',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'itinerary-item',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const handleDelete = async () => {
    try {
      await deleteItem(tripId, dayId, item.id);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateItem(tripId, dayId, item.id, {
        name: editData.name,
        startTime: editData.startTime || undefined,
        attractionId: editData.attractionId || undefined,
        notes: editData.notes || undefined,
        location: editData.location || undefined,
        reservationNumber: editData.reservationNumber || undefined,
        fastPassTime: editData.fastPassTime || undefined,
        partySize: editData.partySize || undefined,
        characters: editData.characters ? editData.characters.split(',').map(c => c.trim()).filter(c => c) : undefined,
        tourGuide: editData.tourGuide || undefined,
        eventType: editData.eventType || undefined,
        isMustDo: editData.isMustDo,
        isRopeDropTarget: editData.isRopeDropTarget,
        priorityLevel: editData.priorityLevel
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: item.name,
      startTime: item.startTime || '',
      attractionId: item.attractionId || '',
      notes: item.notes || '',
      location: item.location || '',
      reservationNumber: item.reservationNumber || '',
      fastPassTime: item.fastPassTime || '',
      partySize: item.partySize || undefined,
      characters: item.characters?.join(', ') || '',
      tourGuide: item.tourGuide || '',
      eventType: item.eventType || '',
      isMustDo: item.isMustDo || false,
      isRopeDropTarget: item.isRopeDropTarget || false,
      priorityLevel: item.priorityLevel || undefined
    });
    setIsEditing(false);
  };

  const renderCategorySpecificFields = () => {
    switch (item.type) {
      case 'dining':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Location</label>
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Restaurant location"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Reservation #</label>
              <input
                type="text"
                value={editData.reservationNumber}
                onChange={(e) => setEditData({ ...editData, reservationNumber: e.target.value })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Confirmation number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Party Size</label>
              <input
                type="number"
                value={editData.partySize || ''}
                onChange={(e) => setEditData({ ...editData, partySize: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Number of people"
                min="1"
                max="20"
              />
            </div>
          </>
        );
      case 'ride':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Location Override</label>
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Override attraction location"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Lightning Lane Time</label>
              <input
                type="time"
                value={editData.fastPassTime}
                onChange={(e) => setEditData({ ...editData, fastPassTime: e.target.value })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
              />
            </div>
          </>
        );
      case 'meet_greet':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Location</label>
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Meet & greet location"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Characters</label>
              <input
                type="text"
                value={editData.characters}
                onChange={(e) => setEditData({ ...editData, characters: e.target.value })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Mickey, Minnie, etc. (comma separated)"
              />
            </div>
          </>
        );
      case 'tours':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Meeting Location</label>
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Tour meeting point"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Tour Guide</label>
              <input
                type="text"
                value={editData.tourGuide}
                onChange={(e) => setEditData({ ...editData, tourGuide: e.target.value })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Guide name or contact"
              />
            </div>
          </>
        );
      case 'special_events':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Event Type</label>
              <input
                type="text"
                value={editData.eventType}
                onChange={(e) => setEditData({ ...editData, eventType: e.target.value })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Party, parade, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Location</label>
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Event location"
              />
            </div>
          </>
        );
      case 'show':
      case 'attraction':
      case 'waterpark':
      case 'shopping':
        return (
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Location</label>
            <input
              type="text"
              value={editData.location}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
              placeholder="Location/area"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = () => {
    if (item.isMustDo) {
      return (
        <div className="flex items-center bg-glow/20 text-glow px-2 py-1 rounded-md text-xs font-medium border border-glow/30">
          ⭐ Must-Do
        </div>
      );
    }
    if (item.isRopeDropTarget) {
      return (
        <div className="flex items-center bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md text-xs font-medium border border-orange-500/30">
          🌅 Rope Drop
        </div>
      );
    }
    if (item.priorityLevel && item.priorityLevel <= 2) {
      return (
        <div className="flex items-center bg-red-500/20 text-red-400 px-2 py-1 rounded-md text-xs font-medium border border-red-500/30">
          🔥 High Priority
        </div>
      );
    }
    return null;
  };

  const getItemBorderStyle = () => {
    if (item.isMustDo) return 'border-glow/50 bg-glow/5';
    if (item.isRopeDropTarget) return 'border-orange-500/50 bg-orange-500/5';
    if (item.priorityLevel && item.priorityLevel <= 2) return 'border-red-500/50 bg-red-500/5';
    if (item.fastPassTime) return 'border-sea/50 bg-sea/5';
    return 'border-surface-dark/50 bg-surface';
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`relative flex items-start p-4 rounded-xl border transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:shadow-md'
      } ${getItemBorderStyle()}`}
    >
      {/* Priority indicator line */}
      {(item.isMustDo || item.isRopeDropTarget || (item.priorityLevel && item.priorityLevel <= 2)) && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
          item.isMustDo ? 'bg-glow' :
          item.isRopeDropTarget ? 'bg-orange-500' :
          'bg-red-500'
        }`} />
      )}
      
      {/* Category icon with enhanced styling */}
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl mr-4 text-lg font-medium shadow-sm ${getCategoryColor(item.type).replace('text-', 'bg-')}/20 ${getCategoryColor(item.type)} border border-current/20`}>
        {getCategoryIcon(item.type, item.name)}
      </div>
      
      <GripVertical className="w-4 h-4 text-ink-light mr-3 cursor-grab active:cursor-grabbing hover:text-ink transition-colors" />
      <div className="flex-1">
        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Activity name"
              />
              <input
                type="time"
                value={editData.startTime}
                onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                className="px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
              />
            </div>
            
            {/* Category-specific fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {renderCategorySpecificFields()}
            </div>
            
            {/* Priority and planning fields */}
            <div className="border-t border-surface-dark pt-3">
              <h5 className="text-sm font-medium text-ink mb-2">Priority & Planning</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.isMustDo}
                    onChange={(e) => setEditData({ ...editData, isMustDo: e.target.checked })}
                    className="rounded border-surface-dark bg-surface-dark text-sea focus:border-sea focus:ring-0"
                  />
                  <span className="text-sm text-ink">⭐ Must-Do Priority</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.isRopeDropTarget}
                    onChange={(e) => setEditData({ ...editData, isRopeDropTarget: e.target.checked })}
                    className="rounded border-surface-dark bg-surface-dark text-sea focus:border-sea focus:ring-0"
                  />
                  <span className="text-sm text-ink">🌅 Rope Drop Target</span>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Priority Level</label>
                  <select
                    value={editData.priorityLevel || ''}
                    onChange={(e) => setEditData({ ...editData, priorityLevel: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                  >
                    <option value="">No priority set</option>
                    <option value="1">1 - Highest</option>
                    <option value="2">2 - High</option>
                    <option value="3">3 - Medium</option>
                    <option value="4">4 - Low</option>
                    <option value="5">5 - Lowest</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                className="btn-primary btn-sm flex items-center"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary btn-sm flex items-center"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </button>
            </div>
            <textarea
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
              placeholder="Notes (optional)"
              rows={2}
            />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-ink text-base">{item.name}</h4>
                  {item.startTime && (
                    <div className="flex items-center bg-surface-dark/50 px-2 py-1 rounded-md text-xs text-ink-light">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.startTime}
                    </div>
                  )}
                </div>
                
                {/* Priority badges */}
                <div className="flex items-center space-x-2 mb-2">
                  {getPriorityBadge()}
                  {item.fastPassTime && (
                    <div className="flex items-center bg-sea/20 text-sea px-2 py-1 rounded-md text-xs font-medium border border-sea/30">
                      ⚡ {item.fastPassTime}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-1 ml-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-ink-light hover:text-ink px-2 py-1 rounded-md hover:bg-surface-dark/50 transition-colors flex items-center"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              </div>
            </div>
            {/* Activity metadata */}
            <div className="flex items-center space-x-3 text-sm">
              <div className={`px-2 py-1 rounded-md ${getCategoryColor(item.type).replace('text-', 'bg-')}/20 ${getCategoryColor(item.type)} font-medium`}>
                {getCategoryInfo(item.type)?.name || item.type}
              </div>
              
              {attraction && (
                <>
                  <div className="flex items-center text-ink-light">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{attraction.duration} min</span>
                  </div>
                  
                  {attraction.heightRequirement && (
                    <div className="flex items-center text-ink-light">
                      <Users className="w-3 h-3 mr-1" />
                      <span>{attraction.heightRequirement}"</span>
                    </div>
                  )}
                  
                  <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                    attraction.intensity === 'low' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                    attraction.intensity === 'moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {attraction.intensity}
                  </div>
                </>
              )}
            </div>
            
            {/* Category-specific display info */}
            <div className="mt-3 flex flex-wrap gap-2">
              {(attraction?.location || item.location) && (
                <div className="flex items-center bg-surface-dark/30 px-2 py-1 rounded-md text-xs text-ink-light">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{attraction?.location || item.location}</span>
                </div>
              )}
              
              {item.reservationNumber && (
                <div className="flex items-center bg-surface-dark/30 px-2 py-1 rounded-md text-xs text-ink-light">
                  <span className="font-mono">#{item.reservationNumber}</span>
                </div>
              )}
              
              {item.partySize && (
                <div className="flex items-center bg-surface-dark/30 px-2 py-1 rounded-md text-xs text-ink-light">
                  <Users className="w-3 h-3 mr-1" />
                  <span>{item.partySize} people</span>
                </div>
              )}
              
              {item.characters && item.characters.length > 0 && (
                <div className="flex items-center bg-surface-dark/30 px-2 py-1 rounded-md text-xs text-ink-light">
                  <span>🐭 {item.characters.join(', ')}</span>
                </div>
              )}
              
              {item.tourGuide && (
                <div className="flex items-center bg-surface-dark/30 px-2 py-1 rounded-md text-xs text-ink-light">
                  <span>👨‍🏫 {item.tourGuide}</span>
                </div>
              )}
              
              {item.eventType && (
                <div className="flex items-center bg-surface-dark/30 px-2 py-1 rounded-md text-xs text-ink-light">
                  <span>🎉 {item.eventType}</span>
                </div>
              )}
            </div>
            
            {item.notes && (
              <div className="mt-3 p-3 bg-surface-dark/20 rounded-lg border-l-2 border-ink-light/30">
                <p className="text-sm text-ink-light italic">{item.notes}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function TripDayPlanner({ trip, onBackToTrips }: TripDayPlannerProps) {
  const [currentView, setCurrentView] = useState<'overview' | 'preferences' | number>('overview');
  const [showParkSelector, setShowParkSelector] = useState(false);
  const [showDayTypeModal, setShowDayTypeModal] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [tripEditData, setTripEditData] = useState({
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate
  });
  const { addDay, updateDay, addItem, reorderItems, updateTrip } = useTripStore();

  // Parse dates as local dates to avoid timezone issues
  const startDate = new Date(trip.startDate + 'T00:00:00');
  const endDate = new Date(trip.endDate + 'T00:00:00');

  // Generate all days in the trip
  const tripDays: Date[] = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    tripDays.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  // Auto-create missing days with default day types
  useEffect(() => {
    const autoCreateMissingDays = async () => {
      const existingDates = new Set(trip.days?.map(day => day.date) || []);
      const totalDays = tripDays.length;
      
      for (let index = 0; index < tripDays.length; index++) {
        const date = tripDays[index];
        const dateString = format(date, 'yyyy-MM-dd');
        
        if (!existingDates.has(dateString)) {
          // Determine default day type
          let defaultDayType: DayType;
          const isFirstDay = index === 0;
          const isLastDay = index === totalDays - 1;
          
          if (isFirstDay) {
            defaultDayType = 'check-in';
          } else if (isLastDay) {
            defaultDayType = 'check-out';
          } else {
            defaultDayType = 'park-day';
          }
          
          try {
            await addDay(trip.id, dateString, defaultDayType);
          } catch (error) {
            console.error(`Failed to auto-create day ${dateString}:`, error);
          }
        }
      }
    };
    
    autoCreateMissingDays();
  }, [trip.id, trip.startDate, trip.endDate]); // Dependencies: re-run if trip ID or date range changes

  // Helper function to update day data
  const updateDayData = async (dayId: string, updates: Partial<TripDay>) => {
    try {
      await updateDay(trip.id, dayId, updates);
    } catch (error) {
      console.error('Failed to update day:', error);
    }
  };

  const selectedDayIndex = typeof currentView === 'number' ? currentView : 0;
  const selectedDate = tripDays[selectedDayIndex];
  const selectedDay = selectedDate ? trip.days?.find(d => d.date === format(selectedDate, 'yyyy-MM-dd')) : undefined;
  
  // If showing overview, we don't need a selectedDate
  if (currentView !== 'overview' && !selectedDate) {
    return <div className="text-center text-ink-light">No valid date selected</div>;
  }


  const handleQuickAdd = async (type: ActivityCategory, attractionId?: string, customName?: string) => {
    if (!selectedDay) return;

    if (attractionId) {
      // Adding a specific attraction
      const allAttractions = [...getAllDoItems(), ...getAllEatItems()];
      const attraction = allAttractions.find(a => a.id === attractionId);
      if (!attraction) return;

      const newItem = {
        type: attraction.type as ActivityCategory,
        name: customName || attraction.name,
        attractionId: attraction.id,
        startTime: '09:00',
        notes: ''
      };

      
      try {
        await addItem(trip.id, selectedDay.id, newItem);
      } catch (error) {
        console.error('Failed to add attraction:', error);
      }
    } else {
      // Adding a custom activity of a category
      const newItem = {
        type: type,
        name: customName || 'New Activity',
        startTime: '09:00',
        notes: ''
      };
      
      try {
        await addItem(trip.id, selectedDay.id, newItem);
      } catch (error) {
        console.error('Failed to add custom item:', error);
      }
    }
  };

  const handleParkSelection = async (parkId: string) => {
    if (!selectedDay) return;
    
    try {
      await updateDay(trip.id, selectedDay.id, { parkId });
      setShowParkSelector(false);
    } catch (error) {
      console.error('Failed to update park:', error);
    }
  };

  const handleDayTypeSelection = async (dayType: DayType | null, selectedParks?: string[]) => {
    if (!selectedDay) return;

    const updates: Partial<TripDay> = { dayType };

    // Handle park selection for park day types
    if (dayType === 'park-day' && selectedParks?.length === 1) {
      updates.parkId = selectedParks[0];
    } else if (dayType === 'park-hopper' && selectedParks?.length > 1) {
      // For park hopper, set the first park as the primary parkId
      // Note: You may need to extend TripDay type to support multiple parks
      updates.parkId = selectedParks[0];
      // TODO: Consider adding parkIds field to TripDay type for park hopper support
    }

    try {
      await updateDay(trip.id, selectedDay.id, updates);
      setShowDayTypeModal(false);
    } catch (error) {
      console.error('Failed to update day type:', error);
    }
  };

  const moveItem = async (startIndex: number, endIndex: number) => {
    if (!selectedDay) return;
    
    try {
      await reorderItems(trip.id, selectedDay.id, startIndex, endIndex);
    } catch (error) {
      console.error('Failed to reorder items:', error);
    }
  };



  const handleTripSave = async () => {
    try {
      await updateTrip(trip.id, tripEditData);
      setIsEditingTrip(false);
    } catch (error) {
      console.error('Failed to update trip:', error);
    }
  };

  const handleTripCancel = () => {
    setTripEditData({
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate
    });
    setIsEditingTrip(false);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Trip Header */}
        <div className="space-y-4">
          {isEditingTrip ? (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-ink mb-4">Edit Trip Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Trip Name</label>
                  <input
                    type="text"
                    value={tripEditData.name}
                    onChange={(e) => setTripEditData({ ...tripEditData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                    placeholder="Enter trip name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Start Date</label>
                    <input
                      type="date"
                      value={tripEditData.startDate}
                      onChange={(e) => setTripEditData({ ...tripEditData, startDate: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">End Date</label>
                    <input
                      type="date"
                      value={tripEditData.endDate}
                      onChange={(e) => setTripEditData({ ...tripEditData, endDate: e.target.value })}
                      className="w-full px-4 py-3 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleTripSave}
                    className="btn-primary flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleTripCancel}
                    className="btn-secondary flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {onBackToTrips && (
                  <button
                    onClick={onBackToTrips}
                    className="btn-secondary btn-sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Trips
                  </button>
                )}
                <h2 className="text-xl font-semibold text-ink">{trip.name}</h2>
                <button
                  onClick={() => setIsEditingTrip(true)}
                  className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded-lg transition-colors"
                  title="Edit trip details"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSharingModal(true)}
                  className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded-lg transition-colors"
                  title="Share trip"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!isEditingTrip && (
            <div className="flex items-center space-x-6 text-sm text-ink-light">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{format(startDate, 'MMMM d, yyyy')} - {format(endDate, 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>
                  {trip.travelingParty && trip.travelingParty.length > 0 
                    ? `${trip.travelingParty.length} traveler${trip.travelingParty.length !== 1 ? 's' : ''}`
                    : 'No travelers'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-surface-dark/50">
          <div className="flex space-x-1 overflow-x-auto pb-1">
            {/* Trip Overview Tab */}
            <button
              onClick={() => setCurrentView('overview')}
              className={`flex flex-col items-center px-4 py-3 rounded-t-lg whitespace-nowrap transition-colors ${
                currentView === 'overview'
                  ? 'bg-sea/10 text-sea-dark border-b-2 border-sea'
                  : 'text-ink-light hover:text-ink hover:bg-surface-dark/50'
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="text-xs mt-1">Overview</span>
            </button>

            {/* Activity Preferences Tab */}
            <button
              onClick={() => setCurrentView('preferences')}
              className={`flex flex-col items-center px-4 py-3 rounded-t-lg whitespace-nowrap transition-colors ${
                currentView === 'preferences'
                  ? 'bg-sea/10 text-sea-dark border-b-2 border-sea'
                  : 'text-ink-light hover:text-ink hover:bg-surface-dark/50'
              }`}
            >
              <Star className="w-4 h-4" />
              <span className="text-xs mt-1">Preferences</span>
            </button>

            {/* Day Tabs */}
            {tripDays.map((date, index) => {
              const dayData = trip.days?.find(d => d.date === format(date, 'yyyy-MM-dd'));
              const isSelected = currentView === index;
              
              // Detect day type and get appropriate icon
              let dayTypeIcon = null;
              let dayTypeName = null;
              
              if (dayData) {
                const detectedDayType = detectDayType(dayData, trip, index);
                const finalDayType = dayData.dayType || detectedDayType || 'rest-day';
                dayTypeIcon = getDayIcon(dayData, detectedDayType) || '📅';
                dayTypeName = getDayTypeInfo(finalDayType).name;
              }
              
              return (
                <button
                  key={format(date, 'yyyy-MM-dd')}
                  onClick={() => setCurrentView(index)}
                  className={`flex flex-col items-center px-4 py-3 rounded-t-lg whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-sea/10 text-sea-dark border-b-2 border-sea'
                      : 'text-ink-light hover:text-ink hover:bg-surface-dark/50'
                  }`}
                  title={dayData ? dayTypeName || 'Planned day' : 'Empty day'}
                >
                  <span className="text-sm font-medium">
                    {format(date, 'EEE')}
                  </span>
                  <span className="text-xs">
                    {format(date, 'MMM d')}
                  </span>
                  {dayTypeIcon ? (
                    <span className="text-sm mt-1" role="img" aria-label={dayTypeName || 'Day type'}>
                      {dayTypeIcon}
                    </span>
                  ) : dayData ? (
                    <div className="w-2 h-2 bg-glow rounded-full mt-1"></div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {currentView === 'overview' && <TripOverview trip={trip} />}
        {currentView === 'preferences' && <ActivityPreferences trip={trip} />}
        {typeof currentView === 'number' && !selectedDay && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
            <div className="lg:col-span-12 flex items-center justify-center">
              <div className="text-center py-16">
                <Calendar className="w-20 h-20 text-ink-light/30 mx-auto mb-6" />
                <h4 className="text-lg font-medium text-ink mb-2">Loading Day...</h4>
                <p className="text-ink-light mb-6">Setting up your schedule</p>
              </div>
            </div>
          </div>
        )}
        {typeof currentView === 'number' && selectedDay && (() => {
          const detectedDayType = detectDayType(selectedDay, trip, selectedDayIndex);

          // Render specialized day view based on detected type
          if (detectedDayType === 'rest-day') {
            return <RestDayView trip={trip} tripDay={selectedDay} date={selectedDate!} onQuickAdd={handleQuickAdd} onOpenDayTypeModal={() => setShowDayTypeModal(true)} />;
          } else if (detectedDayType === 'check-in') {
            return <CheckInDayView trip={trip} tripDay={selectedDay} date={selectedDate!} onQuickAdd={handleQuickAdd} onOpenDayTypeModal={() => setShowDayTypeModal(true)} />;
          } else if (detectedDayType === 'check-out') {
            return <CheckOutDayView trip={trip} tripDay={selectedDay} date={selectedDate!} onQuickAdd={handleQuickAdd} onOpenDayTypeModal={() => setShowDayTypeModal(true)} />;
          } else if (detectedDayType === 'disney-springs') {
            return <DisneySpringsView trip={trip} tripDay={selectedDay} date={selectedDate!} onQuickAdd={handleQuickAdd} onOpenDayTypeModal={() => setShowDayTypeModal(true)} />;
          } else if (detectedDayType === 'special-event') {
            return <SpecialEventView trip={trip} tripDay={selectedDay} date={selectedDate!} onQuickAdd={handleQuickAdd} onOpenDayTypeModal={() => setShowDayTypeModal(true)} />;
          } else if (detectedDayType === 'park-day' || detectedDayType === 'park-hopper') {
            return <ParkDayView trip={trip} tripDay={selectedDay} date={selectedDate!} onQuickAdd={handleQuickAdd} onOpenDayTypeModal={() => setShowDayTypeModal(true)} />;
          }

          // Default to existing 3-column layout for park days and park hopper days
          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
            {/* Left Panel: Day Context & Quick Actions */}
            <div className="lg:col-span-3">
              <div className="bg-surface rounded-xl border border-surface-dark/30 p-5 h-full overflow-y-auto">
                {/* Day Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-ink">
                      {selectedDate && format(selectedDate, 'EEE, MMM d')}
                    </h3>
                    <div className="text-sm text-ink-light bg-surface-dark/50 px-3 py-1 rounded-full">
                      Day {selectedDayIndex + 1}
                    </div>
                  </div>
                  
                  {/* Park Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center text-ink-light">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">
                        {selectedDay?.parkId ? getParkName(selectedDay.parkId) : 'No park selected'}
                      </span>
                      <button
                        onClick={() => setShowParkSelector(!showParkSelector)}
                        className="ml-auto p-1 text-ink-light hover:text-ink rounded transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${showParkSelector ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    
                    {/* Day Type Selection */}
                    <button
                      onClick={() => setShowDayTypeModal(true)}
                      className="flex items-center text-ink-light hover:text-ink w-full p-2 rounded-lg hover:bg-surface-dark/20 transition-colors"
                    >
                      <span className="text-lg mr-2">{getDayIcon(selectedDay, detectDayType(selectedDay, trip, selectedDayIndex)) || '📅'}</span>
                      <span className="text-sm font-medium">
                        {getDayTypeInfo(selectedDay?.dayType || detectDayType(selectedDay, trip, selectedDayIndex)).name}
                      </span>
                      <span className="ml-auto text-xs text-ink-light">Change</span>
                    </button>
                  </div>
                </div>

                {/* Park Selector */}
                {showParkSelector && (
                  <div className="mb-6 space-y-3 p-4 bg-surface-dark/30 rounded-lg border border-surface-dark/50">
                    <div className="text-sm font-medium text-ink mb-3">Select a park:</div>
                    <div className="space-y-2">
                      {PARKS.map((park) => (
                        <button
                          key={park.id}
                          onClick={() => handleParkSelection(park.id)}
                          className={`w-full p-3 rounded-lg border text-left transition-all hover:scale-[0.98] ${
                            selectedDay?.parkId === park.id
                              ? 'border-sea bg-sea/10 text-sea shadow-sm'
                              : 'border-surface-dark text-ink-light hover:border-sea/50 hover:bg-surface-dark/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{park.icon}</span>
                            <div>
                              <div className="font-medium text-sm">{park.abbreviation}</div>
                              <div className="text-xs opacity-75">{park.name}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedDay?.parkId && (
                      <button
                        onClick={() => handleParkSelection('')}
                        className="w-full p-2 text-sm text-ink-light hover:text-ink border border-surface-dark rounded-lg hover:bg-surface-dark/50 transition-colors"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                )}


                {selectedDay && (
                  <div className="space-y-6">
                    {/* Day Stats */}
                    <div className="bg-surface-dark/20 rounded-lg p-4">
                      <div className="text-sm font-medium text-ink mb-3">Day Overview</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center text-ink-light">
                          <Clock className="w-4 h-4 mr-2 text-sea" />
                          <span>{selectedDay.items?.length || 0} activities</span>
                        </div>
                        <div className="flex items-center text-ink-light">
                          <Users className="w-4 h-4 mr-2 text-glow" />
                          <span>{selectedDay.items?.filter(item => item.isMustDo).length || 0} must-do</span>
                        </div>
                      </div>
                    </div>

                    {/* Group Ratings Summary */}
                    {selectedDay.items && selectedDay.items.length > 0 && (
                      <RatingsSummary
                        tripId={trip.id}
                        attractionIds={selectedDay.items.map(item => item.attractionId).filter(Boolean)}
                        partyMembers={trip.travelingParty || []}
                      />
                    )}

                    {/* Quick Add Section */}
                    <div>
                      <div className="text-sm font-medium text-ink mb-3 flex items-center">
                        <Plus className="w-4 h-4 mr-2 text-sea" />
                        Quick Add Activity
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">QuickAddBar temporarily disabled</p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-ink mb-3">Quick Actions</div>
                      <button
                        onClick={() => setShowCheatSheet(true)}
                        className="w-full btn-secondary btn-sm flex items-center justify-center text-sm"
                      >
                        📄 Generate Cheat Sheet
                      </button>
                    </div>
                  </div>
                )}

                {!selectedDay && (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-ink-light/50 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-ink mb-2">Loading Day...</h4>
                    <p className="text-ink-light mb-6 text-sm">Setting up your schedule</p>
                  </div>
                )}
              </div>
            </div>

            {/* Center Panel: Main Itinerary */}
            <div className="lg:col-span-6">
              <div className="bg-surface rounded-xl border border-surface-dark/30 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-dark/30">
                  <div>
                    <h3 className="text-xl font-semibold text-ink">Day Schedule</h3>
                    {selectedDay && (
                      <p className="text-sm text-ink-light mt-1">
                        {selectedDay.items?.length || 0} activities planned
                      </p>
                    )}
                  </div>
                  {selectedDay && selectedDay.items?.length > 0 && (
                    <div className="text-xs text-ink-light bg-surface-dark/50 px-3 py-1 rounded-full">
                      Drag to reorder
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {selectedDay?.items?.length ? (
                    <div className="space-y-3">
                      {selectedDay.items.map((item, index) => (
                        <DraggableItem
                          key={item.id}
                          item={item}
                          index={index}
                          tripId={trip.id}
                          dayId={selectedDay.id}
                          moveItem={moveItem}
                        />
                      ))}
                    </div>
                  ) : selectedDay ? (
                    <div className="text-center py-16">
                      <div className="max-w-sm mx-auto">
                        <Clock className="w-20 h-20 text-ink-light/30 mx-auto mb-6" />
                        <h4 className="text-lg font-medium text-ink mb-2">Start Your Day</h4>
                        <p className="text-ink-light mb-6">No activities planned yet. Add your first activity using the Quick Add bar.</p>
                        <div className="text-sm text-ink-light/70 bg-surface-dark/20 p-3 rounded-lg">
                          💡 Tip: Start with must-do attractions and work around meal times
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="max-w-sm mx-auto">
                        <Calendar className="w-20 h-20 text-ink-light/30 mx-auto mb-6" />
                        <h4 className="text-lg font-medium text-ink mb-2">Loading Day...</h4>
                        <p className="text-ink-light">Setting up your schedule</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: Planning Tools */}
            <div className="lg:col-span-3">
              <div className="bg-surface rounded-xl border border-surface-dark/30 p-5 h-full overflow-y-auto">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-ink mb-2">Planning Tools</h3>
                  <p className="text-sm text-ink-light">Organize your day details</p>
                </div>
                
                {selectedDay ? (
                  <div className="space-y-6">
                    {/* Arrival Plan */}
                    <div className="bg-surface-dark/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-ink flex items-center">
                          🚗 Arrival Plan
                        </h4>
                        <div className="text-xs text-ink-light/50">Click to edit</div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-ink-light mb-1">Departure</label>
                            <input
                              type="time"
                              value={selectedDay.arrivalPlan?.departureTime || ''}
                              onChange={(e) => {
                                updateDayData(selectedDay.id, {
                                  arrivalPlan: {
                                    ...selectedDay.arrivalPlan,
                                    departureTime: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                              placeholder="--:--"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-ink-light mb-1">Park Entry</label>
                            <input
                              type="time"
                              value={selectedDay.arrivalPlan?.tapInTime || ''}
                              onChange={(e) => {
                                updateDayData(selectedDay.id, {
                                  arrivalPlan: {
                                    ...selectedDay.arrivalPlan,
                                    tapInTime: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                              placeholder="--:--"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-ink-light mb-1">Transportation</label>
                          <select
                            value={selectedDay.arrivalPlan?.transportMethod || ''}
                            onChange={(e) => {
                              updateDayData(selectedDay.id, {
                                arrivalPlan: {
                                  ...selectedDay.arrivalPlan,
                                  transportMethod: e.target.value as 'car' | 'monorail' | 'bus' | 'boat' | 'rideshare' | 'walk'
                                }
                              });
                            }}
                            className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                          >
                            <option value="">Choose transportation...</option>
                            <option value="car">🚗 Car</option>
                            <option value="monorail">🚝 Monorail</option>
                            <option value="bus">🚌 Bus</option>
                            <option value="boat">⛵ Boat</option>
                            <option value="rideshare">🚙 Rideshare</option>
                            <option value="walk">🚶 Walk</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Lightning Lane Plan */}
                    <div className="bg-surface-dark/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-ink flex items-center">
                          ⚡ Lightning Lane
                        </h4>
                        <div className="text-xs text-ink-light/50">Auto-saves</div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-ink-light mb-1">Multi Pass Pre-selected</label>
                          <textarea
                            value={selectedDay.lightningLanePlan?.multiPassSelections?.join(', ') || ''}
                            onChange={(e) => {
                              const selections = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                              updateDayData(selectedDay.id, {
                                lightningLanePlan: {
                                  ...selectedDay.lightningLanePlan,
                                  multiPassSelections: selections
                                }
                              });
                            }}
                            placeholder="Peter Pan, Big Thunder Mountain, etc."
                            className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors resize-none"
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-ink-light mb-1">Refill Strategy</label>
                          <input
                            type="text"
                            value={selectedDay.lightningLanePlan?.refillStrategy || ''}
                            onChange={(e) => {
                              updateDayData(selectedDay.id, {
                                lightningLanePlan: {
                                  ...selectedDay.lightningLanePlan,
                                  refillStrategy: e.target.value
                                }
                              });
                            }}
                            placeholder="Prioritize family must-dos nearby"
                            className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Backup Plan */}
                    <div className="bg-surface-dark/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-ink flex items-center">
                          ☂️ Backup Plan
                        </h4>
                        <div className="text-xs text-ink-light/50">Auto-saves</div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-ink-light mb-1">If it rains</label>
                          <input
                            type="text"
                            value={selectedDay.backupPlan?.rainPlan || ''}
                            onChange={(e) => {
                              updateDayData(selectedDay.id, {
                                backupPlan: {
                                  ...selectedDay.backupPlan,
                                  rainPlan: e.target.value
                                }
                              });
                            }}
                            className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                            placeholder="Indoor shows, shopping, covered areas..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-ink-light mb-1">If waits are high</label>
                          <input
                            type="text"
                            value={selectedDay.backupPlan?.highWaitsPlan || ''}
                            onChange={(e) => {
                              updateDayData(selectedDay.id, {
                                backupPlan: {
                                  ...selectedDay.backupPlan,
                                  highWaitsPlan: e.target.value
                                }
                              });
                            }}
                            className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                            placeholder="Character meets, PhotoPass, explore shops..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Family Priorities */}
                    <div className="bg-surface-dark/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-ink mb-3">📝 Family Priorities</h4>
                      <div className="text-sm text-ink-light">
                        {selectedDay.familyPriorities?.length ? (
                          <div className="space-y-2">
                            {selectedDay.familyPriorities.slice(0, 3).map((priority, index) => (
                              <div key={priority.id} className="flex items-center p-2 bg-surface-dark/30 rounded">
                                <span className="mr-3 text-xs font-medium bg-glow/20 text-glow px-2 py-1 rounded-full">{index + 1}</span>
                                <span className={priority.type === 'must-do' ? 'font-medium text-ink' : 'text-ink-light'}>
                                  {priority.name}
                                </span>
                              </div>
                            ))}
                            {selectedDay.familyPriorities.length > 3 && (
                              <div className="text-xs text-ink-light/60 text-center mt-2">
                                +{selectedDay.familyPriorities.length - 3} more priorities...
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-ink-light/50 text-sm">Mark activities as priorities in your schedule</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-surface-dark/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🛠️</span>
                      </div>
                      <h4 className="text-lg font-medium text-ink mb-2">Planning Tools</h4>
                      <p className="text-ink-light/70 text-sm">Select a day to access arrival plans, Lightning Lane strategy, and backup options</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}

        {/* Cheat Sheet Modal */}
        {showCheatSheet && selectedDay && (
          <CheatSheetView
            tripDay={selectedDay}
            onClose={() => setShowCheatSheet(false)}
          />
        )}

        {/* Day Type Modal */}
        {selectedDay && (
          <DayTypeModal
            isOpen={showDayTypeModal}
            onClose={() => setShowDayTypeModal(false)}
            trip={trip}
            tripDay={selectedDay}
            dayIndex={selectedDayIndex}
            onSelectDayType={handleDayTypeSelection}
          />
        )}

        {/* Trip Sharing Modal */}
        <TripSharingModal
          tripId={trip.id}
          tripName={trip.name}
          isOpen={showSharingModal}
          onClose={() => setShowSharingModal(false)}
          onSuccess={() => {
            // Optionally show success message or refresh data
            console.log('Trip shared successfully from day planner');
          }}
        />
      </div>
    </DndProvider>
  );
}