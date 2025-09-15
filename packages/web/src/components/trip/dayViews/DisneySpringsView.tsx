import { ShoppingBag, Car, MapPin, Clock, Plus, GripVertical, Edit, Save, XCircle } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TripDay, Trip, ActivityCategory } from '../../../types';
import { useTripStore } from '../../../stores';
import { useState } from 'react';

interface DisneySpringsViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function DisneySpringsView({ trip, tripDay, onQuickAdd, onOpenDayTypeModal }: DisneySpringsViewProps) {
  const { updateDay, deleteItem, updateItem, reorderItems } = useTripStore();
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showCustomActivityForm, setShowCustomActivityForm] = useState(false);
  const [customActivity, setCustomActivity] = useState({ name: '', startTime: '', type: 'entertainment' as ActivityCategory });
  const [selectedTransportation, setSelectedTransportation] = useState('own-car');

  // Transportation options with dynamic tips
  const transportationOptions: Record<string, { label: string; icon: string; tips: string[] }> = {
    'own-car': {
      label: 'Own Car',
      icon: '🚗',
      tips: [
        'Free parking in all Disney Springs garages',
        'Orange Garage is closest to Marketplace',
        'Arrive early on weekends for better spots'
      ]
    },
    'rideshare': {
      label: 'Uber/Lyft',
      icon: '🚕',
      tips: [
        'Drop-off location is near the Orange Garage',
        'Surge pricing may apply during peak hours',
        'Book return ride in advance during busy periods'
      ]
    },
    'resort-transport': {
      label: 'Resort Transportation',
      icon: '🚌',
      tips: [
        'Available from Disney resort hotels only',
        'Bus service runs every 20 minutes',
        'Check operating hours - service may end early'
      ]
    },
    'boat': {
      label: 'Boat from Resort',
      icon: '⛵',
      tips: [
        'Available from Saratoga Springs & Old Key West',
        'Most scenic way to arrive at Disney Springs',
        'Weather dependent - may not operate in storms'
      ]
    },
    'walking': {
      label: 'Walking from Resort',
      icon: '🚶',
      tips: [
        'Only practical from Saratoga Springs Resort',
        'About 10-15 minute walk via bridge',
        'Well-lit, safe pedestrian walkway'
      ]
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateDayData = async (updates: Partial<TripDay>) => {
    try {
      await updateDay(trip.id, tripDay.id, updates);
    } catch (error) {
      console.error('Failed to update day:', error);
    }
  };

  // DraggableItem component for schedule items
  const DraggableScheduleItem = ({ item, index }: { item: unknown; index: number }) => {
    const [isEditingThis, setIsEditingThis] = useState(false);
    const [editData, setEditData] = useState({
      name: item.name,
      startTime: item.startTime || '',
      notes: item.notes || '',
    });

    const [{ isDragging }, drag] = useDrag({
      type: 'SCHEDULE_ITEM',
      item: { id: item.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'SCHEDULE_ITEM',
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
          name: editData.name,
          startTime: editData.startTime || undefined,
          notes: editData.notes || undefined,
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

    const handleEdit = () => {
      setIsEditingThis(true);
    };

    return (
      <div
        ref={(node) => {
          drag(drop(node));
        }}
        className={`relative flex items-start p-3 bg-surface border border-surface-dark/50 rounded-lg transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:border-surface-dark'
        } group`}
      >
        <div className="flex items-center justify-center mr-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing self-center">
          <GripVertical className="w-4 h-4 text-ink-light" />
        </div>
        <div className="flex items-center justify-center w-8 h-8 mr-3 text-lg">
          {item.type === 'dining' ? '🍽️' :
           item.type === 'shopping' ? '🛍️' :
           item.type === 'show' ? '🎵' : '✨'}
        </div>
        <div className="flex-1">
          {isEditingThis ? (
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                  placeholder="Activity name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={editData.startTime}
                  onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                  className="px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                />
                <input
                  type="text"
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                  placeholder="Notes (optional)"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-3 py-1.5 bg-surface-dark hover:bg-surface-dark/80 text-ink text-xs rounded transition-colors"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-ink text-sm">{item.name}</h4>
                  <div className="flex items-center text-xs text-ink-light mt-1 space-x-3">
                    {item.startTime && (
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {item.startTime}
                      </span>
                    )}
                    {item.notes && (
                      <span className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {item.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {!isEditingThis && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded transition-colors"
              title="Edit activity"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteItem(trip.id, tripDay.id, item.id)}
              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
              title="Delete activity"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Panel: Main Planning Content */}
        <div className="lg:col-span-8">
          <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center mb-6 py-4 px-4 border-b border-surface-dark/20 relative bg-gradient-to-r from-sea-light/60 to-sea/60 rounded-lg min-h-[120px]">
              {onOpenDayTypeModal && (
                <button
                  onClick={onOpenDayTypeModal}
                  className="absolute top-3 right-3 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
                >
                  <span className="text-base">🛍️</span>
                  <span>Change Day Type</span>
                </button>
              )}
              <div className="flex items-center justify-center w-12 h-12 mr-4">
                <span className="text-2xl">🛍️</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink">Disney Springs Adventure</h2>
                <p className="text-ink-light">Entertainment, dining, and shopping district</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Getting There & Transportation */}
              <div className="bg-surface-dark/20 rounded-lg p-4">
                <h3 className="font-semibold text-ink mb-4 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-blue-500" />
                  Getting There & Transportation
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Transportation Selector */}
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Select your transportation method:
                    </label>
                    <select
                      value={selectedTransportation}
                      onChange={(e) => setSelectedTransportation(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
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
                          <span className="text-green-500 mr-2 mt-0.5">•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                      {transportationOptions[selectedTransportation]?.tips.length > 3 && (
                        <div className="text-xs text-ink-light/70 italic">
                          +{transportationOptions[selectedTransportation].tips.length - 3} more tips available
                        </div>
                      )}
                    </div>
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
                    className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
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
                  <div className="text-center py-8">
                    <span className="text-3xl mb-2 block">🎯</span>
                    <p className="text-sm text-ink-light">Add dining, shopping, and entertainment plans!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Tips & Quick Actions */}
        <div className="lg:col-span-4">
          <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
            <div className="space-y-6">
            {/* Disney Springs Philosophy */}
            <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-lg p-4 border border-orange-500/20">
              <h3 className="font-semibold text-ink mb-3 text-lg">🏞️ Disney Springs Experience</h3>
              <p className="text-sm text-ink-light leading-relaxed mb-3">
                Disney Springs is where magic meets modern lifestyle. It's not just shopping and dining—it's an
                immersive experience that blends Disney storytelling with world-class entertainment and cuisine.
              </p>
              <div className="bg-orange-500/20 rounded-lg p-3">
                <p className="text-xs font-medium text-ink">✨ Today's Focus</p>
                <p className="text-sm text-ink-light mt-1">
                  Explore at your own pace, discover unique experiences, and create memories beyond the parks.
                </p>
              </div>
            </div>

            {/* Quick Budget Tracker */}
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <h4 className="font-medium text-ink mb-3">💰 Budget Tracker</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Budget</label>
                  <input
                    type="number"
                    placeholder="$200"
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Spent</label>
                  <input
                    type="number"
                    placeholder="$0"
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                  />
                </div>
              </div>
            </div>

            {/* Pro Tips & Shortcuts */}
            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
              <h4 className="font-medium text-ink mb-3">💡 Pro Tips & Shortcuts</h4>
              <div className="text-sm text-ink-light space-y-2">
                <div className="flex items-start">
                  <span className="mr-2 text-purple-400 text-xs">📱</span>
                  <span>Download Disney Springs app for live wait times & exclusive offers</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2 text-purple-400 text-xs">🚗</span>
                  <span>Free parking but arrive early on weekends (lots fill by noon)</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2 text-purple-400 text-xs">🍽️</span>
                  <span>Many restaurants accept walk-ins after 2pm</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2 text-purple-400 text-xs">📦</span>
                  <span>Free resort delivery on purchases $50+ (order by 3pm)</span>
                </div>
                <div className="flex items-start">
                  <span className="mr-2 text-purple-400 text-xs">🎪</span>
                  <span>Check for seasonal events, pop-ups & live entertainment</span>
                </div>
              </div>
            </div>

            </div>
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      {showAddActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-surface-dark/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-dark/20 bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-green-500/10">
              <div>
                <h3 className="text-xl font-semibold text-ink flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-orange-500" />
                  Add Disney Springs Activity
                </h3>
                <p className="text-sm text-ink-light mt-1">
                  Add dining, shopping, or entertainment to your Disney Springs day
                </p>
              </div>
              <button
                onClick={() => setShowAddActivityModal(false)}
                className="p-2 rounded-lg hover:bg-surface-dark/20 transition-colors"
              >
                <XCircle className="w-5 h-5 text-ink-light" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">

            {/* Popular Disney Springs Activities - Vertical Layout */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-ink mb-4">Popular Disney Springs Activities</h3>

              {/* General Activities - Moved to top */}
              <div className="rounded-lg p-4 mb-6">
                <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  ✨ General Activities
                </h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      onQuickAdd('break', undefined, 'Leisurely Shopping Browse');
                      setShowAddActivityModal(false);
                    }}
                    className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                  >
                    <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🚶</span>
                    <div className="flex-1">
                      <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                        Leisurely Shopping Browse
                      </div>
                      <div className="text-xs text-ink-light mt-1">
                        Explore at your own pace
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                  <button
                    onClick={() => {
                      onQuickAdd('dining', undefined, 'Quick Snack & Drinks');
                      setShowAddActivityModal(false);
                    }}
                    className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                  >
                    <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🥨</span>
                    <div className="flex-1">
                      <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                        Quick Snack & Drinks
                      </div>
                      <div className="text-xs text-ink-light mt-1">
                        Grab food and beverages
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                  <button
                    onClick={() => {
                      onQuickAdd('tours', undefined, 'Explore Marketplace');
                      setShowAddActivityModal(false);
                    }}
                    className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                  >
                    <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🗺️</span>
                    <div className="flex-1">
                      <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                        Explore Marketplace
                      </div>
                      <div className="text-xs text-ink-light mt-1">
                        Discover all areas
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                  <button
                    onClick={() => {
                      onQuickAdd('break', undefined, 'Rest & People Watch');
                      setShowAddActivityModal(false);
                    }}
                    className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                  >
                    <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">☕</span>
                    <div className="flex-1">
                      <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                        Rest & People Watch
                      </div>
                      <div className="text-xs text-ink-light mt-1">
                        Relax and observe the crowds
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Dining Highlights */}
                <div className="rounded-lg p-4">
                  <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    🍽️ Dining Highlights
                  </h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        onQuickAdd('dining', undefined, 'Table Service Restaurant');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🍽️</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Table Service Restaurant
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Make reservations recommended
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('dining', undefined, 'Marketplace Treats');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🧁</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Quick Treats
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Gideon's, Joffrey's
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('entertainment', undefined, 'Live Entertainment');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🎵</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Live Entertainment
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Street performers
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  </div>
                </div>

                {/* Shopping & Entertainment */}
                <div className="rounded-lg p-4">
                  <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    🛍️ Shopping & Entertainment
                  </h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        onQuickAdd('shopping', undefined, 'World of Disney');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🏰</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          World of Disney
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Largest Disney merchandise store
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('shopping', undefined, 'UNIQLO Disney');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">👕</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          UNIQLO Disney
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Disney apparel
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('shopping', undefined, 'Disney Pin Traders');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📍</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Pin Traders
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Pin trading
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('entertainment', undefined, 'Cirque du Soleil');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🎭</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Cirque du Soleil
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Live show
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('entertainment', undefined, 'AMC Disney Springs');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🎬</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          AMC Theater
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Movies
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  </div>
                </div>
              </div>


              {/* Custom Activity Form in Modal */}
              {showCustomActivityForm ? (
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
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                    />
                    <input
                      type="time"
                      placeholder="Start time (optional)"
                      value={customActivity.startTime}
                      onChange={(e) => setCustomActivity({ ...customActivity, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                    />
                    <select
                      value={customActivity.type}
                      onChange={(e) => setCustomActivity({ ...customActivity, type: e.target.value as ActivityCategory })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                    >
                      <option value="dining">Dining</option>
                      <option value="shopping">Shopping</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="break">Break</option>
                      <option value="tours">Tour</option>
                    </select>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => {
                        if (customActivity.name.trim()) {
                          onQuickAdd(customActivity.type, undefined, customActivity.name);
                          setCustomActivity({ name: '', startTime: '', type: 'entertainment' });
                          setShowCustomActivityForm(false);
                          setShowAddActivityModal(false);
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Add Activity
                    </button>
                    <button
                      onClick={() => setShowCustomActivityForm(false)}
                      className="px-4 py-2 bg-surface-dark hover:bg-surface-dark/80 text-ink text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomActivityForm(true)}
                  className="w-full mt-4 p-3 border-2 border-dashed border-surface-dark rounded-lg text-ink-light hover:text-ink hover:border-ink transition-colors text-center"
                >
                  <Plus className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm">Add Custom Activity</span>
                </button>
              )}
            </div>
            </div>
            </div>

            {/* Modal Footer */}
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