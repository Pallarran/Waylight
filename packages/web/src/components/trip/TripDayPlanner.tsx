import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Plus, Calendar, Clock, MapPin, ChevronDown, GripVertical, Edit2, Save, X, Download, Share, ArrowLeft } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTripStore } from '../../stores';
import { PARKS, getParkName } from '../../data/parks';

import type { Trip, ItineraryItem } from '../../types';

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
  const [editData, setEditData] = useState({
    name: item.name,
    startTime: item.startTime || '',
    duration: item.duration || 60,
    notes: item.notes || ''
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
        duration: editData.duration,
        notes: editData.notes || undefined
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
      duration: item.duration || 60,
      notes: item.notes || ''
    });
    setIsEditing(false);
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center p-4 bg-surface rounded-lg border border-surface-dark/50 transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-center justify-center w-8 h-8 bg-sea/10 text-sea-dark rounded-full mr-4 text-sm font-medium">
        {index + 1}
      </div>
      <GripVertical className="w-4 h-4 text-ink-light mr-3 cursor-grab active:cursor-grabbing" />
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
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={editData.duration}
                onChange={(e) => setEditData({ ...editData, duration: parseInt(e.target.value) || 60 })}
                className="px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                placeholder="Duration (minutes)"
                min="5"
                max="480"
              />
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
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-ink">{item.name}</h4>
              <div className="flex items-center space-x-2">
                {item.startTime && (
                  <span className="text-sm text-ink-light">{item.startTime}</span>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-ink-light hover:text-ink px-2 py-1 rounded hover:bg-surface-dark/50 transition-colors flex items-center"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-ink-light">
              <span className="capitalize">{item.type}</span>
              {item.duration && (
                <span>{item.duration} minutes</span>
              )}
            </div>
            {item.notes && (
              <p className="text-sm text-ink-light mt-2">{item.notes}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function TripDayPlanner({ trip, onBackToTrips }: TripDayPlannerProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showParkSelector, setShowParkSelector] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
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

  const selectedDay = trip.days?.[selectedDayIndex];
  const selectedDate = tripDays[selectedDayIndex];
  
  if (!selectedDate) {
    return <div className="text-center text-ink-light">No valid date selected</div>;
  }

  const handleAddDay = async (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    try {
      await addDay(trip.id, dateString);
    } catch (error) {
      console.error('Failed to add day:', error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedDay) return;
    
    const newItem = {
      type: 'attraction' as const,
      name: 'New Activity',
      startTime: '09:00',
      duration: 60,
      notes: ''
    };
    
    try {
      await addItem(trip.id, selectedDay.id, newItem);
    } catch (error) {
      console.error('Failed to add item:', error);
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

  const moveItem = async (startIndex: number, endIndex: number) => {
    if (!selectedDay) return;
    
    try {
      await reorderItems(trip.id, selectedDay.id, startIndex, endIndex);
    } catch (error) {
      console.error('Failed to reorder items:', error);
    }
  };

  const exportTripAsJSON = () => {
    const exportData = {
      trip: {
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        days: trip.days?.map(day => ({
          date: day.date,
          park: day.parkId ? getParkName(day.parkId) : 'No park selected',
          items: day.items || []
        })) || []
      },
      exportedAt: new Date().toISOString(),
      exportedBy: 'Waylight Trip Planner'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_trip.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportTripAsText = () => {
    let text = `${trip.name}\n`;
    text += `${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}\n\n`;

    trip.days?.forEach(day => {
      text += `${format(new Date(day.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}\n`;
      text += `Park: ${day.parkId ? getParkName(day.parkId) : 'No park selected'}\n`;
      
      if (day.items && day.items.length > 0) {
        text += '\nItinerary:\n';
        day.items.forEach((item, index) => {
          text += `${index + 1}. ${item.name}`;
          if (item.startTime) text += ` (${item.startTime})`;
          if (item.duration) text += ` - ${item.duration} minutes`;
          text += `\n`;
          if (item.notes) text += `   Notes: ${item.notes}\n`;
        });
      } else {
        text += '\nNo activities planned for this day.\n';
      }
      text += '\n';
    });

    text += `\nExported from Waylight Trip Planner on ${format(new Date(), 'MMMM d, yyyy h:mm a')}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_trip.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareTrip = async () => {
    const text = `Check out my ${trip.name} itinerary!\n\n${format(startDate, 'MMMM d, yyyy')} - ${format(endDate, 'MMMM d, yyyy')}\n\nPlanned with Waylight Trip Planner`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${trip.name} - Disney World Trip`,
          text: text,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to clipboard
        copyToClipboard(text);
      }
    } else {
      // Fallback to clipboard
      copyToClipboard(text);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
      console.log('Trip details copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
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
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={shareTrip}
                className="btn-secondary btn-sm flex items-center"
              >
                <Share className="w-4 h-4 mr-1" />
                Share
              </button>
              <button
                onClick={exportTripAsText}
                className="btn-secondary btn-sm flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Export Text
              </button>
              <button
                onClick={exportTripAsJSON}
                className="btn-secondary btn-sm flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Export JSON
              </button>
            </div>
          </div>
        )}

        {!isEditingTrip && (
          <div className="text-sm text-ink-light">
            {format(startDate, 'MMMM d, yyyy')} - {format(endDate, 'MMMM d, yyyy')}
          </div>
        )}
      </div>

      {/* Day Tabs */}
      <div className="border-b border-surface-dark/50">
        <div className="flex space-x-1 overflow-x-auto pb-1">
          {tripDays.map((date, index) => {
            const dayData = trip.days?.find(d => d.date === format(date, 'yyyy-MM-dd'));
            const isSelected = index === selectedDayIndex;
            
            return (
              <button
                key={format(date, 'yyyy-MM-dd')}
                onClick={() => setSelectedDayIndex(index)}
                className={`flex flex-col items-center px-4 py-3 rounded-t-lg whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-sea/10 text-sea-dark border-b-2 border-sea'
                    : 'text-ink-light hover:text-ink hover:bg-surface-dark/50'
                }`}
              >
                <span className="text-sm font-medium">
                  {format(date, 'EEE')}
                </span>
                <span className="text-xs">
                  {format(date, 'MMM d')}
                </span>
                {dayData && (
                  <div className="w-2 h-2 bg-glow rounded-full mt-1"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Day Overview */}
        <div className="md:col-span-1">
          <div className="card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-ink">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h3>
            </div>

            {selectedDay ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-ink-light">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {selectedDay.parkId ? getParkName(selectedDay.parkId) : 'No park selected'}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowParkSelector(!showParkSelector)}
                      className="btn-secondary btn-sm"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showParkSelector ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  
                  {showParkSelector && (
                    <div className="space-y-2 p-3 bg-surface-dark/50 rounded-lg">
                      <p className="text-sm font-medium text-ink">Select a park:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PARKS.map((park) => (
                          <button
                            key={park.id}
                            onClick={() => handleParkSelection(park.id)}
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              selectedDay.parkId === park.id
                                ? 'border-sea bg-sea/10 text-sea-dark'
                                : 'border-surface-dark text-ink-light hover:border-sea/50 hover:bg-surface-dark/50'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{park.icon}</span>
                              <div>
                                <div className="font-medium text-sm">{park.abbreviation}</div>
                                <div className="text-xs opacity-75">{park.name}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {selectedDay.parkId && (
                        <button
                          onClick={() => handleParkSelection('')}
                          className="w-full p-2 text-sm text-ink-light hover:text-ink border border-surface-dark rounded-lg hover:bg-surface-dark/50 transition-colors"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center text-ink-light">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    {selectedDay.items?.length || 0} activities planned
                  </span>
                </div>

                {selectedDay.notes && (
                  <div className="p-3 bg-surface-dark/50 rounded-lg">
                    <p className="text-sm text-ink-light">{selectedDay.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-ink-light mx-auto mb-4" />
                <p className="text-ink-light mb-4">This day hasn't been planned yet</p>
                <button
                  onClick={() => handleAddDay(selectedDate)}
                  className="btn-primary"
                >
                  Start Planning
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Day Schedule */}
        <div className="md:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink">Day Schedule</h3>
              {selectedDay && (
                <button
                  onClick={handleAddItem}
                  className="btn-primary btn-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Activity
                </button>
              )}
            </div>

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
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-ink-light mx-auto mb-4" />
                <p className="text-ink-light mb-4">No activities planned for this day</p>
                <button
                  onClick={handleAddItem}
                  className="btn-primary"
                >
                  Add First Activity
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-ink-light">Plan this day to start building your schedule</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </DndProvider>
  );
}