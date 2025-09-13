import { Plane, Car, Clock, MapPin, Hotel, Utensils, Camera, CheckCircle, Phone, Droplets, Edit2, X, Plus, Info, GripVertical, Save } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TripDay, Trip, ActivityCategory } from '../../../types';
import { useTripStore } from '../../../stores';
import { useState } from 'react';
import { getHotelById, allHotels, type HotelData } from '@waylight/shared';
import { getCategoryIcon, getCategoryColor } from '../../../data/activityCategories';

interface CheckInDayViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function CheckInDayView({ trip, tripDay, date, onQuickAdd, onOpenDayTypeModal }: CheckInDayViewProps) {
  const { updateDay, addItem, deleteItem, updateItem, reorderItems } = useTripStore();
  const [showCustomActivityForm, setShowCustomActivityForm] = useState(false);
  const [customActivity, setCustomActivity] = useState({ name: '', startTime: '', type: 'attraction' as ActivityCategory });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showTransportInfo, setShowTransportInfo] = useState(false);
  const [showCheckInInfo, setShowCheckInInfo] = useState(false);

  // Helper function to clean hotel names for display
  const getDisplayHotelName = (hotelName: string) => {
    return hotelName
      .replace(/^Disney's\s+/i, '')
      .replace(/^Universal's\s+/i, '')
      .replace(/^Universal\s+/i, '');
  };

  // Get hotel information for tailored content
  const selectedHotel = trip.accommodation?.hotelName ?
    (() => {
      // Try to find by name first (for custom entries), then by ID
      const hotelOptions = [
        // You'd need to import getHotelOptions and flatten it, but for now let's work with what we have
      ];

      // For now, we'll use a simple approach to get hotel info
      // This could be enhanced later with proper hotel matching
      return null; // Will implement based on available hotel data
    })() : null;

  // Helper function to get hotel-specific transportation recommendations
  const getHotelTransportationTips = (hotelName: string) => {
    const name = hotelName.toLowerCase();

    if (name.includes('grand floridian') || name.includes('polynesian') || name.includes('contemporary')) {
      return {
        primary: 'monorail',
        description: 'Your resort has direct monorail access to Magic Kingdom',
        tips: ['Walking distance to Magic Kingdom', 'Monorail to EPCOT via TTC', 'Premium location benefits']
      };
    } else if (name.includes('riviera') || name.includes('caribbean beach') || name.includes('art of animation') || name.includes('pop century')) {
      return {
        primary: 'skyliner',
        description: 'Your resort has Disney Skyliner access',
        tips: ['Direct Skyliner to EPCOT and Hollywood Studios', 'Scenic aerial transportation', 'No need for buses to these parks']
      };
    } else if (name.includes('yacht') || name.includes('beach club') || name.includes('swan') || name.includes('dolphin')) {
      return {
        primary: 'walking',
        description: 'Your resort has boat and walking access to EPCOT',
        tips: ['Walking distance to EPCOT', 'Boat transportation to Hollywood Studios', 'Close to Disney BoardWalk']
      };
    } else if (name.includes('port orleans') || name.includes('old key west') || name.includes('saratoga springs')) {
      return {
        primary: 'boat',
        description: 'Your resort has boat access to Disney Springs',
        tips: ['Boat transportation to Disney Springs', 'Scenic waterway transportation', 'Bus service to theme parks']
      };
    }

    return {
      primary: 'bus',
      description: 'Your resort uses Disney bus transportation',
      tips: ['Complimentary bus service to all parks', 'Buses run approximately every 20 minutes', 'Check My Disney Experience for schedules']
    };
  };

  // Helper function to get hotel-specific check-in tips using hotel database
  const getHotelCheckInTips = (hotelName: string) => {
    // Find the hotel in the database by name
    const hotel = allHotels.find(h => h.name === hotelName);

    if (hotel) {
      // Use the actual priceLevel from the database
      switch (hotel.priceLevel) {
        case 'deluxe_villa':
          return {
            checkInTime: '4:00 PM',
            type: 'Deluxe Villa (DVC)',
            benefits: ['Extended Evening Hours at select parks', 'DVC member benefits', 'Premium resort amenities']
          };
        case 'deluxe':
          return {
            checkInTime: '3:00 PM',
            type: 'Deluxe Resort',
            benefits: ['Extended Evening Hours at select parks', 'Premium location and amenities', 'Deluxe resort transportation']
          };
        case 'moderate':
          return {
            checkInTime: '3:00 PM',
            type: 'Moderate Resort',
            benefits: ['Themed resort experience', 'Unique transportation options', 'Enhanced amenities']
          };
        case 'value':
          return {
            checkInTime: '3:00 PM',
            type: 'Value Resort',
            benefits: ['Fun themed environments', 'All Disney resort benefits', 'Great value for families']
          };
        default:
          return {
            checkInTime: '3:00 PM',
            type: 'Resort',
            benefits: ['Disney resort benefits']
          };
      }
    }

    // Fallback for hotels not in database
    return {
      checkInTime: '3:00 PM',
      type: 'Resort',
      benefits: ['Standard resort amenities']
    };
  };

  // Helper function to get transportation info for bubble
  const getTransportationInfo = (transportMethod: string) => {
    switch (transportMethod) {
      case 'mears':
        return {
          title: 'Mears Connect Pricing (2025)',
          details: [
            'Standard: $17.60 adult, $14.30 child (one-way)',
            'Express: $238 for group of 4 (faster service)',
            '24/7 service from both main & C terminals',
            'Travel time: 30-60 minutes depending on stops'
          ]
        };
      case 'rideshare':
        return {
          title: 'Rideshare Estimated Cost',
          details: [
            'Normal times: $25-35 (before tip)',
            'Peak/surge times: $50-70+',
            'Late night arrivals: Can reach $100+',
            'Travel time: 20-30 minutes direct'
          ]
        };
      case 'car':
        return {
          title: 'Rental Car Information',
          details: [
            'Travel time: 20-30 minutes from MCO',
            'Resort parking: $15-25/night (varies by resort tier)',
            'Complimentary self-parking for day guests',
            'Valet parking available at most resorts'
          ]
        };
      case 'taxi':
        return {
          title: 'Taxi Service',
          details: [
            'Metered fare: $60-70 typical cost',
            'No flat rates - distance-based pricing',
            'Available at designated airport areas',
            'Travel time: 20-30 minutes'
          ]
        };
      case 'minnie-van':
        return {
          title: 'Minnie Van Airport Service',
          details: [
            'Available for all Deluxe Resort guests',
            'Cost: $199 each way',
            'Book via Lyft app',
            'Premium, direct service'
          ]
        };
      case 'private-service':
        return {
          title: 'Private Transportation Service',
          details: [
            'Cost varies: $150-400+ depending on vehicle type',
            'Direct, door-to-door service',
            'Advance booking required',
            'Luxury vehicles available',
            'Travel time: 20-30 minutes direct'
          ]
        };
      default:
        return {
          title: 'Transportation Information',
          details: [
            'Transportation details not available for this option',
            'Contact transportation provider for pricing and details'
          ]
        };
    }
  };

  const updateDayData = async (updates: Partial<TripDay>) => {
    try {
      await updateDay(trip.id, tripDay.id, updates);
    } catch (error) {
      console.error('Failed to update day:', error);
    }
  };

  const updateAccommodationData = async (updates: any) => {
    try {
      const { updateTrip } = useTripStore.getState();
      await updateTrip(trip.id, {
        accommodation: {
          ...trip.accommodation,
          ...updates
        }
      });
    } catch (error) {
      console.error('Failed to update accommodation:', error);
    }
  };

  const handleAddCustomActivity = async () => {
    if (!customActivity.name.trim()) return;

    try {
      await addItem(trip.id, tripDay.id, {
        type: customActivity.type,
        name: customActivity.name,
        startTime: customActivity.startTime || undefined,
        notes: ''
      });
      setCustomActivity({ name: '', startTime: '', type: 'attraction' });
      setShowCustomActivityForm(false);
    } catch (error) {
      console.error('Failed to add custom activity:', error);
    }
  };

  const handleDeleteActivity = async (itemId: string) => {
    try {
      await deleteItem(trip.id, tripDay.id, itemId);
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const moveItem = async (startIndex: number, endIndex: number) => {
    try {
      await reorderItems(trip.id, tripDay.id, startIndex, endIndex);
    } catch (error) {
      console.error('Failed to reorder items:', error);
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

    const handleSave = async () => {
      try {
        await updateItem(trip.id, tripDay.id, item.id, {
          name: editData.name,
          startTime: editData.startTime || undefined,
          notes: editData.notes || undefined,
        });
        setIsEditingThis(false);
        setEditingItem(null);
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
      setEditingItem(null);
    };

    const handleEdit = () => {
      setIsEditingThis(true);
      setEditingItem(item.id);
    };

    return (
      <div
        ref={(node) => drag(drop(node))}
        className={`relative flex items-start p-3 bg-surface border border-surface-dark/50 rounded-lg transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-95' : 'opacity-100 hover:border-surface-dark'
        } group`}
      >
        <div className="flex items-center mr-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-ink-light" />
        </div>
        <div className="flex items-center justify-center w-8 h-8 mr-3 text-lg">
          {getCategoryIcon(item.type)}
        </div>
        <div className="flex-1">
          {isEditingThis ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Activity Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Start Time</label>
                <input
                  type="time"
                  value={editData.startTime}
                  onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Notes</label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea resize-none"
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-sea text-white rounded text-sm hover:bg-sea-dark transition-colors"
                >
                  <Save className="w-3 h-3 inline mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-surface-dark text-ink rounded text-sm hover:bg-surface-dark/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="font-medium text-ink">{item.name}</div>
              {item.startTime && (
                <div className="text-xs text-ink-light">{item.startTime}</div>
              )}
              {item.notes && (
                <div className="text-xs text-ink-light mt-1">{item.notes}</div>
              )}
            </>
          )}
        </div>
        {!isEditingThis && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded transition-colors"
              title="Edit activity"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleDeleteActivity(item.id)}
              className="p-1 text-ink-light hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Delete activity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
      {/* Left Panel: Arrival Logistics */}
      <div className="lg:col-span-8">
        <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center mb-6 pb-4 border-b border-surface-dark/20 relative">
            {onOpenDayTypeModal && (
              <button
                onClick={onOpenDayTypeModal}
                className="absolute top-0 right-0 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
              >
                <span className="text-base">📅</span>
                <span>Change Day Type</span>
              </button>
            )}
            <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 text-green-500 rounded-xl mr-4">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Welcome to Your Disney Adventure!</h2>
              <p className="text-ink-light">Arrival day - let's get you settled in</p>
            </div>
          </div>

          {/* Travel & Transportation to Resort */}
          <div className="space-y-6">
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Plane className="w-5 h-5 mr-2 text-blue-500" />
                  Travel & Transportation
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowTransportInfo(!showTransportInfo)}
                    className="text-ink-light hover:text-ink transition-colors"
                    title="Transportation information"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  {/* Transportation Info Bubble */}
                  {showTransportInfo && tripDay.arrivalPlan?.transportMethod && (() => {
                    const transportInfo = getTransportationInfo(tripDay.arrivalPlan.transportMethod);
                    return transportInfo && (
                      <div className="absolute right-0 top-6 z-10 w-80 bg-surface border border-surface-dark rounded-lg shadow-lg p-3">
                        <div className="text-xs">
                          <div className="font-medium text-ink mb-2">{transportInfo.title}</div>
                          <div className="text-ink-light space-y-1">
                            {transportInfo.details.map((detail, index) => (
                              <div key={index}>• {detail}</div>
                            ))}
                          </div>
                          <div className="mt-3 pt-2 border-t border-surface-dark/30 text-ink-light italic">
                            <div className="text-xs">
                              💡 Prices are estimates and subject to change. Check official sources for current rates.
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-0 right-3 transform -translate-y-1 w-2 h-2 bg-surface border-l border-t border-surface-dark rotate-45"></div>
                      </div>
                    );
                  })()}
                </div>
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-10 gap-4 items-start">
                    <div className="md:col-span-5">
                      <div className="flex items-center justify-between mb-1 min-h-[20px]">
                        <label className="block text-xs font-medium text-ink">Flight/Drive Details</label>
                      </div>
                      <input
                        type="text"
                        value={tripDay.arrivalPlan?.departureTime || ''}
                        onChange={(e) => updateDayData({
                          arrivalPlan: {
                            ...tripDay.arrivalPlan,
                            departureTime: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                        placeholder="Flight AA123, departing 8:30 AM from LAX..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1 min-h-[20px]">
                        <label className="block text-xs font-medium text-ink">Expected Arrival</label>
                      </div>
                      <input
                        type="time"
                        value={tripDay.arrivalPlan?.tapInTime || ''}
                        onChange={(e) => updateDayData({
                          arrivalPlan: {
                            ...tripDay.arrivalPlan,
                            tapInTime: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between mb-1 min-h-[20px]">
                        <label className="block text-xs font-medium text-ink">Transportation</label>
                      </div>
                      <select
                        value={tripDay.arrivalPlan?.transportMethod || ''}
                        onChange={(e) => updateDayData({
                          arrivalPlan: {
                            ...tripDay.arrivalPlan,
                            transportMethod: e.target.value as any
                          }
                        })}
                        className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                      >
                        <option value="">Choose...</option>
                        <option value="mears">🚌 Mears Connect</option>
                        <option value="rideshare">🚙 Rideshare</option>
                        <option value="car">🚗 Rental Car</option>
                        <option value="taxi">🚕 Taxi</option>
                        <option value="minnie-van">🎭 Minnie Van</option>
                        <option value="private">🚐 Private Service</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            </div>


            {/* Hotel Check-in */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Hotel className="w-5 h-5 mr-2 text-orange-500" />
                  Check-in
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowCheckInInfo(!showCheckInInfo)}
                    className="text-ink-light hover:text-ink transition-colors"
                    title="Digital check-in information"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  {/* Digital Check-in Info Bubble */}
                  {showCheckInInfo && (
                    <div className="absolute right-0 top-6 z-10 w-72 bg-surface border border-surface-dark rounded-lg shadow-lg p-3">
                      <div className="text-xs">
                        <div className="font-medium text-ink mb-2">📱 Digital Check-in Available</div>
                        <div className="text-ink-light space-y-1">
                          <div>• Use My Disney Experience app for contactless check-in</div>
                          <div>• Room assignment notifications sent to your phone</div>
                          <div>• Early check-in subject to availability</div>
                          <div>• Store luggage with Bell Services if room not ready</div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-3 transform -translate-y-1 w-2 h-2 bg-surface border-l border-t border-surface-dark rotate-45"></div>
                    </div>
                  )}
                </div>
              </h3>


              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-10 gap-4 items-start">
                  {/* Resort Address */}
                  <div className="md:col-span-5">
                    <div className="flex items-center justify-between mb-1 min-h-[20px]">
                      <label className="block text-xs font-medium text-ink">Resort Address</label>
                    </div>
                    <div className="px-3 py-2 bg-surface/50 border border-surface-dark/50 rounded-lg text-ink text-sm">
                      {trip.accommodation?.address || 'Address not available'}
                    </div>
                  </div>

                  {/* Check-in Time */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1 min-h-[20px]">
                      <label className="block text-xs font-medium text-ink">Check-in Time</label>
                    </div>
                    <div className="px-3 py-2 bg-surface/50 border border-surface-dark/50 rounded-lg text-ink text-sm">
                      {trip.accommodation?.hotelName
                        ? getHotelCheckInTips(trip.accommodation.hotelName).checkInTime
                        : '3:00 PM'
                      }
                    </div>
                  </div>

                  {/* Confirmation Number */}
                  <div className="md:col-span-3">
                    <div className="flex items-center justify-between mb-1 min-h-[20px]">
                      <label className="block text-xs font-medium text-ink">Confirmation Number</label>
                    </div>
                    <div className="px-3 py-2 bg-surface/50 border border-surface-dark/50 rounded-lg text-ink text-sm">
                      {trip.accommodation?.confirmationNumber || 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* First Day Activities */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-pink-500" />
                Light First Day Activities
              </h3>
              <p className="text-sm text-ink-light mb-6">
                Keep it simple today - you might be tired from travel. Focus on getting oriented and settling in.
              </p>

              {/* 3-Column Activity Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                {/* Column 1: Essential First Day */}
                <div className="border-2 border-gray-400/30 rounded-lg p-4 bg-gray-400/5">
                  <h4 className="font-medium text-ink mb-3 text-sm">Essential First Day</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => onQuickAdd('dining', undefined, 'Welcome Dinner')}
                      className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                    >
                      <Utensils className="w-4 h-4 mr-3 text-orange-500" />
                      <span className="text-sm text-ink">Welcome Dinner Reservation</span>
                    </button>
                    <button
                      onClick={() => onQuickAdd('tours', undefined, 'Resort Exploration')}
                      className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 mr-3 text-purple-500" />
                      <span className="text-sm text-ink">Explore Your Resort</span>
                    </button>
                    <button
                      onClick={() => onQuickAdd('break', undefined, 'Early Rest & Recovery')}
                      className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                    >
                      <span className="w-4 h-4 mr-3 text-green-500">🛌</span>
                      <span className="text-sm text-ink">Early Rest & Recovery</span>
                    </button>
                  </div>
                </div>

                {/* Column 2: Resort-Specific */}
                <div className="border-2 border-pink-500/30 rounded-lg p-4 bg-pink-500/5">
                  <h4 className="font-medium text-ink mb-3 text-sm">Resort features</h4>
                  <div className="space-y-3">
                    {trip.accommodation?.hotelName && (() => {
                      const hotelName = trip.accommodation.hotelName.toLowerCase();
                      let suggestions = [];

                      if (hotelName.includes('animal kingdom lodge')) {
                        suggestions = [
                          { name: 'Savanna Animal Viewing', type: 'attraction', icon: '🦁' },
                          { name: 'Boma African Dinner', type: 'dining', icon: '🍽️' },
                          { name: 'African Cultural Activities', type: 'attraction', icon: '🥁' }
                        ];
                      } else if (hotelName.includes('grand floridian')) {
                        suggestions = [
                          { name: 'Monorail Resort Tour', type: 'attraction', icon: '🚝' },
                          { name: '1900 Park Fare Brunch', type: 'dining', icon: '🥂' },
                          { name: 'Victorian Garden Walk', type: 'attraction', icon: '🌹' }
                        ];
                      } else if (hotelName.includes('polynesian')) {
                        suggestions = [
                          { name: 'Lava Pool & Waterslide', type: 'attraction', icon: '🌋' },
                          { name: 'Seven Seas Lagoon Beach', type: 'break', icon: '🏖️' },
                          { name: 'Electrical Water Pageant', type: 'attraction', icon: '✨' }
                        ];
                      } else if (hotelName.includes('wilderness lodge')) {
                        suggestions = [
                          { name: 'Geyser Viewing (Hourly)', type: 'attraction', icon: '💦' },
                          { name: 'Hidden Mickey Hunt', type: 'attraction', icon: '🔍' },
                          { name: 'Artist Point Dinner', type: 'dining', icon: '🏔️' }
                        ];
                      } else if (hotelName.includes('beach club') || hotelName.includes('yacht club')) {
                        suggestions = [
                          { name: 'Stormalong Bay Pool', type: 'attraction', icon: '🏊' },
                          { name: 'BoardWalk Entertainment', type: 'attraction', icon: '🎠' },
                          { name: 'Beaches & Cream', type: 'dining', icon: '🍦' }
                        ];
                      } else if (hotelName.includes('art of animation')) {
                        suggestions = [
                          { name: 'Big Blue Pool', type: 'attraction', icon: '🐠' },
                          { name: 'Themed Pool Areas', type: 'attraction', icon: '🎨' },
                          { name: 'Animation Hall Displays', type: 'attraction', icon: '🎭' }
                        ];
                      } else if (hotelName.includes('port orleans')) {
                        suggestions = [
                          { name: 'Boat to Disney Springs', type: 'attraction', icon: '⛵' },
                          { name: 'Beignets at French Quarter', type: 'dining', icon: '🥐' },
                          { name: 'Resort Grounds Walk', type: 'attraction', icon: '🚶' }
                        ];
                      } else if (hotelName.includes('island tower')) {
                        suggestions = [
                          { name: 'Island Tower Views', type: 'attraction', icon: '🏝️' },
                          { name: 'Polynesian Lobby Visit', type: 'attraction', icon: '🌺' },
                          { name: 'Seven Seas Lagoon Walk', type: 'break', icon: '🌊' }
                        ];
                      } else {
                        // Generic resort suggestions
                        suggestions = [
                          { name: 'Resort Pool Time', type: 'attraction', icon: '🏊' },
                          { name: 'Resort Dining', type: 'dining', icon: '🍽️' },
                          { name: 'Lobby & Grounds Tour', type: 'attraction', icon: '🏨' }
                        ];
                      }

                      return suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => onQuickAdd(suggestion.type as ActivityCategory, undefined, suggestion.name)}
                          className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                        >
                          <span className="w-4 h-4 mr-3 text-pink-500">{suggestion.icon}</span>
                          <span className="text-sm text-ink">{suggestion.name}</span>
                        </button>
                      ));
                    })()}
                  </div>
                </div>

                {/* Column 3: Water Parks */}
                <div className="border-2 border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
                  <h4 className="font-medium text-ink mb-3 text-sm">Water Parks Today</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => onQuickAdd('waterpark', undefined, 'Typhoon Lagoon Water Park')}
                      className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                    >
                      <span className="w-4 h-4 mr-3 text-blue-500">🌊</span>
                      <span className="text-sm text-ink">Typhoon Lagoon</span>
                    </button>
                    <button
                      onClick={() => onQuickAdd('waterpark', undefined, 'Blizzard Beach Water Park')}
                      className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                    >
                      <span className="w-4 h-4 mr-3 text-cyan-500">❄️</span>
                      <span className="text-sm text-ink">Blizzard Beach</span>
                    </button>
                    <button
                      onClick={() => onQuickAdd('waterpark', undefined, 'Resort Pool Time')}
                      className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                    >
                      <span className="w-4 h-4 mr-3 text-teal-500">🏊</span>
                      <span className="text-sm text-ink">Resort Pool Time</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Activity Form */}
              {showCustomActivityForm ? (
                <div className="bg-surface/50 rounded-lg p-3 border border-surface-dark/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-ink text-sm">Add Custom Activity</h4>
                    <button
                      onClick={() => setShowCustomActivityForm(false)}
                      className="text-ink-light hover:text-ink"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Activity name"
                      value={customActivity.name}
                      onChange={(e) => setCustomActivity({ ...customActivity, name: e.target.value })}
                      className="px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                    />
                    <input
                      type="time"
                      value={customActivity.startTime}
                      onChange={(e) => setCustomActivity({ ...customActivity, startTime: e.target.value })}
                      className="px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                    />
                    <select
                      value={customActivity.type}
                      onChange={(e) => setCustomActivity({ ...customActivity, type: e.target.value as ActivityCategory })}
                      className="px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                    >
                      <option value="attraction">Attraction</option>
                      <option value="dining">Dining</option>
                      <option value="shopping">Shopping</option>
                      <option value="break">Rest/Break</option>
                      <option value="travel">Travel</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddCustomActivity}
                      className="btn-primary btn-sm"
                      disabled={!customActivity.name.trim()}
                    >
                      Add Activity
                    </button>
                    <button
                      onClick={() => {
                        setCustomActivity({ name: '', startTime: '', type: 'attraction' });
                        setShowCustomActivityForm(false);
                      }}
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomActivityForm(true)}
                  className="w-full flex items-center justify-center p-3 border-2 border-dashed border-surface-dark/50 rounded-lg hover:border-sea/50 hover:bg-surface-dark/10 transition-colors text-ink-light hover:text-ink"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="text-sm">Add Custom Activity</span>
                </button>
              )}
            </div>

            {/* Today's Schedule */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                Today's Schedule
              </h3>

              {tripDay.items && tripDay.items.length > 0 ? (
                <div className="space-y-3">
                  {tripDay.items.map((item, index) => (
                    <DraggableScheduleItem key={item.id} item={item} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl mb-4 block">🎯</span>
                  <p className="text-ink-light">Add some light activities for your arrival day!</p>
                  <p className="text-xs text-ink-light mt-2">Use the buttons above or add a custom activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Quick Info & Tips */}
      <div className="lg:col-span-4">
        <div className="bg-surface rounded-xl border border-surface-dark/30 p-5 h-full overflow-y-auto">
          <h3 className="text-lg font-semibold text-ink mb-4">Arrival Day Tips</h3>
          
          <div className="space-y-4">

            {/* Important Numbers */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h4 className="font-medium text-ink mb-3 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-blue-500" />
                Important Numbers (2025)
              </h4>
              <div className="space-y-2 text-sm text-ink-light">
                <div>General Guest Services: (407) 939-5277</div>
                <div>Dining Reservations: (407) 939-3463</div>
                <div>Lost & Found: (407) 824-4245</div>
                <div>Existing Reservations: (407) 934-7639</div>
                <div>Guest Relations: Available in My Disney Experience app</div>
              </div>
            </div>

            {/* Weather */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h4 className="font-medium text-ink mb-3">☀️ Weather & Packing</h4>
              <div className="text-sm text-ink-light space-y-1">
                <p>Check the weather app for today's forecast</p>
                <p>Pack layers for air conditioning</p>
                <p>Don't forget sunscreen & water bottle</p>
              </div>
            </div>

            {/* First Day Tips */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <h4 className="font-medium text-ink mb-3">💡 First Day Tips (2025)</h4>
              <div className="text-sm text-ink-light space-y-2">
                <p>• Take it slow - you have the whole vacation ahead</p>
                <p>• Explore your resort layout and amenities</p>
                <p>• Set up Lightning Lane Multi Pass for tomorrow (7 days advance for resort guests)</p>
                <p>• Download your resort confirmation to My Disney Experience app</p>
                <p>• Take photos of parking location if driving</p>
                <p>• Try mobile ordering for quick dining options</p>
                <p>• Stay hydrated - Florida heat can be intense</p>
                <p>• Consider the FREE water park option today!</p>
              </div>
            </div>

            {/* Resort Transportation Access & Benefits */}
            {trip.accommodation?.hotelName && (
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <h4 className="font-medium text-ink mb-3 flex items-center">
                  <Car className="w-4 h-4 mr-2 text-purple-500" />
                  Resort Transportation & Benefits
                </h4>

                {/* Transportation Access */}
                <div className="mb-4">
                  <div className="text-sm">
                    <div className="font-medium text-ink mb-2">
                      🚊 {getHotelTransportationTips(trip.accommodation.hotelName).description}
                    </div>
                    <div className="text-ink-light space-y-1">
                      {getHotelTransportationTips(trip.accommodation.hotelName).tips.map((tip, index) => (
                        <div key={index}>• {tip}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Resort Benefits */}
                <div className="border-t border-purple-500/20 pt-3">
                  <div className="text-sm">
                    <div className="font-medium text-ink mb-2">
                      🏨 {getHotelCheckInTips(trip.accommodation.hotelName).type} Perks
                    </div>
                    <div className="text-ink-light space-y-1">
                      {getHotelCheckInTips(trip.accommodation.hotelName).benefits.map((benefit, index) => (
                        <div key={index}>• {benefit}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </DndProvider>
  );
}