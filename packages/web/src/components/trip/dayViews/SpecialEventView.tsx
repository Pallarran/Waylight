import { Calendar, Clock, Star, Camera, Phone, Edit, XCircle, Plus, Info, GripVertical, Save, Shirt, MapPin, Ticket, Car, Utensils } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TripDay, Trip, ActivityCategory } from '../../../types';
import { useTripStore } from '../../../stores';
import { useState } from 'react';
import { getCategoryIcon } from '../../../data/activityCategories';
import WeatherHeader from '../../weather/WeatherHeader';

interface SpecialEventViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function SpecialEventView({ trip, tripDay, onQuickAdd, onOpenDayTypeModal }: SpecialEventViewProps) {
  const { updateDay, addItem, deleteItem, updateItem, reorderItems } = useTripStore();
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showCustomActivityForm, setShowCustomActivityForm] = useState(false);
  const [customActivity, setCustomActivity] = useState({ name: '', startTime: '', type: 'entertainment' as ActivityCategory });
  const [selectedTransportation, setSelectedTransportation] = useState('own-car');

  // Find the main special event from the day's items
  const mainEvent = tripDay.items?.find(item =>
    item.type === 'special_events' ||
    item.eventType ||
    item.name.toLowerCase().includes('party') ||
    item.name.toLowerCase().includes('tour')
  ) || { name: 'Special Event', startTime: '19:00' };

  // Transportation options with dynamic tips for special events
  const transportationOptions: Record<string, { label: string; icon: string; tips: string[] }> = {
    'own-car': {
      label: 'Own Car',
      icon: '🚗',
      tips: [
        'Free parking at Disney resort hotels',
        'Arrive early - special events draw crowds',
        'Consider staying until park closes'
      ]
    },
    'rideshare': {
      label: 'Uber/Lyft',
      icon: '🚕',
      tips: [
        'Book return ride in advance after events',
        'Surge pricing likely during event hours',
        'Meet at designated rideshare pickup areas'
      ]
    },
    'resort-transport': {
      label: 'Resort Transportation',
      icon: '🚌',
      tips: [
        'Bus service continues during special events',
        'Expect longer wait times after events',
        'Consider walking to nearby resorts if busy'
      ]
    },
    'taxi': {
      label: 'Taxi',
      icon: '🚖',
      tips: [
        'More reliable than rideshare during events',
        'Fixed rates help avoid surge pricing',
        'Hotel concierge can arrange pickup'
      ]
    },
    'walking': {
      label: 'Walking from Resort',
      icon: '🚶',
      tips: [
        'Only practical from nearby Disney resorts',
        'Walkways well-lit during special events',
        'Avoid long walks in costume if uncomfortable'
      ]
    }
  };

  const updateDayData = async (updates: Partial<TripDay>) => {
    try {
      await updateDay(trip.id, tripDay.id, updates);
    } catch (error) {
      console.error('Failed to update day:', error);
    }
  };

  const handleAddCustomActivity = async () => {
    if (!customActivity.name.trim()) return;

    try {
      await addItem(trip.id, tripDay.id, {
        name: customActivity.name,
        type: customActivity.type,
        startTime: customActivity.startTime || undefined,
        notes: '',
        location: '',
        duration: 0,
        isRopeDropTarget: false,
        priorityLevel: 1
      });

      setCustomActivity({ name: '', startTime: '', type: 'entertainment' });
      setShowCustomActivityForm(false);
    } catch (error) {
      console.error('Failed to add custom activity:', error);
    }
  };

  // DraggableItem component for schedule items
  const DraggableScheduleItem = ({ item, index }: { item: any; index: number }) => {
    const [isEditingThis, setIsEditingThis] = useState(false);
    const [editData, setEditData] = useState({
      name: item.name,
      startTime: item.startTime || '',
      notes: item.notes || '',
    });

    const [{ isDragging }, drag] = useDrag({
      type: 'schedule-item',
      item: { id: item.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'schedule-item',
      hover: (draggedItem: { id: string; index: number }) => {
        if (draggedItem.index !== index) {
          reorderItems(trip.id, tripDay.id, draggedItem.index, index);
          draggedItem.index = index;
        }
      },
    });

    const handleSave = async () => {
      try {
        await updateItem(trip.id, tripDay.id, item.id, {
          ...item,
          ...editData
        });
        setIsEditingThis(false);
      } catch (error) {
        console.error('Failed to update item:', error);
      }
    };

    const handleCancel = () => {
      setEditData({
        name: item.name,
        startTime: item.startTime || '',
        notes: item.notes || '',
      });
      setIsEditingThis(false);
    };

    const handleDelete = async () => {
      try {
        await deleteItem(trip.id, tripDay.id, item.id);
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    };

    const handleEditClick = () => {
      setEditData({
        name: item.name,
        startTime: item.startTime || '',
        notes: item.notes || '',
      });
      setIsEditingThis(true);
    };

    return (
      <div
        ref={(node) => {
          drag(drop(node));
        }}
        className={`flex items-start p-4 bg-surface border border-surface-dark/50 rounded-lg transition-opacity ${
          isDragging ? 'opacity-50' : 'opacity-100'
        }`}
      >
        <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 text-purple-500 rounded-lg mr-3 text-sm font-medium">
          {item.startTime || `${index + 1}`}
        </div>

        <div className="flex-1">
          {isEditingThis ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-purple-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={editData.startTime}
                  onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                  className="px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Notes"
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-3 py-1.5 bg-surface border border-surface-dark hover:bg-surface-dark/20 text-ink text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="font-medium text-ink">{item.name}</div>
              {item.eventType && (
                <div className="text-xs text-purple-500 mt-1">{item.eventType}</div>
              )}
              {item.notes && (
                <div className="text-xs text-ink-light mt-1">{item.notes}</div>
              )}
              {item.location && (
                <div className="flex items-center mt-1">
                  <MapPin className="w-3 h-3 mr-1 text-ink-light" />
                  <span className="text-xs text-ink-light">{item.location}</span>
                </div>
              )}
            </>
          )}
        </div>

        {!isEditingThis && (
          <div className="flex items-center space-x-2 ml-2">
            <button
              onClick={handleEditClick}
              className="p-1 text-ink-light hover:text-ink hover:bg-surface-dark rounded transition-colors"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
            >
              <XCircle className="w-3 h-3" />
            </button>
            <GripVertical className="w-4 h-4 text-ink-light cursor-move" />
          </div>
        )}

        {item.type === 'special_events' && (
          <div className="bg-pink-500/20 text-pink-500 px-2 py-1 rounded-full text-xs font-medium ml-2">
            Main Event
          </div>
        )}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Panel: Main Event Planning */}
        <div className="lg:col-span-8">
          <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
            {/* Event Header */}
            <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-lg p-6 mb-6 border border-purple-500/20 relative">
              {onOpenDayTypeModal && (
                <button
                  onClick={onOpenDayTypeModal}
                  className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
                >
                  <span className="text-base">🎉</span>
                  <span>Change Day Type</span>
                </button>
              )}
              <div className="text-center">
                <span className="text-4xl mb-3 block">🎉</span>
                <h2 className="text-2xl font-bold text-ink mb-2">{mainEvent.name}</h2>
                <p className="text-ink-light">
                  {mainEvent.startTime && `Event starts at ${mainEvent.startTime}`}
                </p>
                <div className="mt-3">
                  <WeatherHeader date={date} />
                </div>
                <div className="mt-3 inline-flex items-center bg-surface/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-surface-dark/30">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  <span className="text-sm text-ink">Special Event Day</span>
                </div>
              </div>
            </div>

            {/* Event Essentials */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 mb-6 border border-purple-500/20">
              <h3 className="text-lg font-semibold text-ink mb-4 flex items-center">
                <Ticket className="w-5 h-5 mr-2 text-purple-500" />
                Event Essentials
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="font-medium text-ink text-sm">Event Time</span>
                  </div>
                  <input
                    type="time"
                    value={mainEvent.startTime || ''}
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <Shirt className="w-4 h-4 mr-2 text-green-500" />
                    <span className="font-medium text-ink text-sm">Dress Code</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Costume encouraged, etc."
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <MapPin className="w-4 h-4 mr-2 text-red-500" />
                    <span className="font-medium text-ink text-sm">Entry Point</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Main entrance, special gate..."
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  Today's Schedule
                </h3>
                <button
                  onClick={() => setShowAddActivityModal(true)}
                  className="flex items-center px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Activity
                </button>
              </div>

              {tripDay.items && tripDay.items.length > 0 ? (
                <div className="space-y-3">
                  {tripDay.items.map((item, index) => (
                    <DraggableScheduleItem key={item.id} item={item} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-5xl mb-4 block">🎪</span>
                  <p className="text-ink-light text-lg">Add your special event and related activities!</p>
                  <button
                    onClick={() => onQuickAdd('special_events', undefined, 'Main Special Event')}
                    className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    Add Main Event
                  </button>
                </div>
              )}

              {/* Custom Activity Form */}
              {showCustomActivityForm && (
                <div className="bg-surface-dark/20 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-ink">Add Custom Activity</h4>
                    <button
                      onClick={() => setShowCustomActivityForm(false)}
                      className="p-1 text-ink-light hover:text-ink hover:bg-surface-dark rounded transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Activity name"
                      value={customActivity.name}
                      onChange={(e) => setCustomActivity({ ...customActivity, name: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="time"
                      placeholder="Start time (optional)"
                      value={customActivity.startTime}
                      onChange={(e) => setCustomActivity({ ...customActivity, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-purple-500"
                    />
                    <select
                      value={customActivity.type}
                      onChange={(e) => setCustomActivity({ ...customActivity, type: e.target.value as ActivityCategory })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="entertainment">Entertainment</option>
                      <option value="dining">Dining</option>
                      <option value="attraction">Attraction</option>
                      <option value="meet_greet">Character Meet</option>
                      <option value="show">Show</option>
                      <option value="break">Break</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddCustomActivity}
                    className="mt-3 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Add Activity
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Tips & Quick Actions */}
        <div className="lg:col-span-4">
          <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
            <div className="space-y-6">

              {/* Getting There Section */}
              <div>
                <h3 className="text-lg font-medium text-ink mb-4 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-blue-500" />
                  Getting There
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={selectedTransportation}
                      onChange={(e) => setSelectedTransportation(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-purple-500"
                    >
                      {Object.entries(transportationOptions).map(([key, option]) => (
                        <option key={key} value={key}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Tips */}
                  <div>
                    <div className="space-y-2">
                      {transportationOptions[selectedTransportation]?.tips.slice(0, 3).map((tip, index) => (
                        <div key={index} className="flex items-start text-xs text-ink-light">
                          <span className="text-purple-500 mr-2 mt-0.5">•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Preparation */}
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <h4 className="font-medium text-ink mb-3">🎭 Event Preparation</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => onQuickAdd('dining', undefined, 'Pre-Event Dinner')}
                    className="w-full flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <Utensils className="w-4 h-4 mr-2 text-orange-500" />
                    <span className="text-sm text-ink">Pre-Event Dining</span>
                  </button>
                  <button
                    onClick={() => onQuickAdd('break', undefined, 'Costume Prep')}
                    className="w-full flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <Shirt className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-sm text-ink">Costume & Prep Time</span>
                  </button>
                  <button
                    onClick={() => onQuickAdd('attraction', undefined, 'Early Arrival')}
                    className="w-full flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 mr-2 text-purple-500" />
                    <span className="text-sm text-ink">Arrive Early</span>
                  </button>
                </div>
              </div>

              {/* Event Highlights */}
              <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                <h4 className="font-medium text-ink mb-3">⭐ Event Highlights</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => onQuickAdd('attraction', undefined, 'Priority Attractions')}
                    className="w-full flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <span className="text-lg mr-2">🎢</span>
                    <span className="text-sm text-ink">Exclusive Attractions</span>
                  </button>
                  <button
                    onClick={() => onQuickAdd('meet_greet', undefined, 'Special Characters')}
                    className="w-full flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <span className="text-lg mr-2">🐭</span>
                    <span className="text-sm text-ink">Event Characters</span>
                  </button>
                  <button
                    onClick={() => onQuickAdd('show', undefined, 'Special Entertainment')}
                    className="w-full flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <span className="text-lg mr-2">🎭</span>
                    <span className="text-sm text-ink">Special Shows</span>
                  </button>
                </div>
              </div>

              {/* Photo Opportunities */}
              <div className="bg-pink-500/10 rounded-lg p-4 border border-pink-500/20">
                <h4 className="font-medium text-ink mb-3 flex items-center">
                  <Camera className="w-4 h-4 mr-2 text-pink-500" />
                  Photo Opportunities
                </h4>
                <button
                  onClick={() => onQuickAdd('attraction', undefined, 'PhotoPass Opportunities')}
                  className="w-full flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left mb-3"
                >
                  <Camera className="w-4 h-4 mr-2 text-pink-500" />
                  <span className="text-sm text-ink">PhotoPass Spots</span>
                </button>
                <div className="bg-surface border border-surface-dark rounded-lg p-3">
                  <div className="text-sm font-medium text-ink mb-2">Photo Wishlist</div>
                  <textarea
                    placeholder="Family in costumes by castle, character interactions, special decorations..."
                    className="w-full px-2 py-1 bg-surface-dark border border-surface-dark rounded text-xs text-ink focus:outline-none focus:border-pink-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
              <h4 className="font-medium text-ink mb-3">💡 Event Pro Tips</h4>
              <div className="text-sm text-ink-light space-y-2">
                <p>• Arrive early for the best spots and atmosphere</p>
                <p>• Bring layers - events can run late and get cool</p>
                <p>• Stay hydrated throughout the event</p>
                <p>• Download all PhotoPass photos the next day</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      {showAddActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-surface-dark/20">
              <h3 className="text-xl font-semibold text-ink">Add Activity</h3>
              <button
                onClick={() => setShowAddActivityModal(false)}
                className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <button
                onClick={() => setShowCustomActivityForm(true)}
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Custom Activity
              </button>
            </div>
            <div className="flex justify-end items-center p-6 border-t border-surface-dark/20 bg-surface-dark/5">
              <button
                onClick={() => setShowAddActivityModal(false)}
                className="px-4 py-2 bg-surface border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface-dark/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
}