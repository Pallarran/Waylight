/* eslint-disable @typescript-eslint/no-explicit-any */
import { Plane, Clock, Hotel, Camera, Phone, Edit, XCircle, Plus, Info, GripVertical, Save } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TripDay, Trip, ActivityCategory } from '../../../types';
import { useTripStore } from '../../../stores';
import { useState } from 'react';
import { allHotels } from '@waylight/shared';
import { getCategoryIcon } from '../../../data/activityCategories';
import WeatherHeader from '../../weather/WeatherHeader';

interface CheckInDayViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function CheckInDayView({ trip, tripDay, onQuickAdd, onOpenDayTypeModal }: CheckInDayViewProps) {
  const { updateDay, addItem, deleteItem, updateItem, reorderItems } = useTripStore();
  const [showCustomActivityForm, setShowCustomActivityForm] = useState(false);
  const [customActivity, setCustomActivity] = useState({ name: '', startTime: '', type: 'attraction' as ActivityCategory });
  const [showTransportInfo, setShowTransportInfo] = useState(false);
  const [showCheckInInfo, setShowCheckInInfo] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);




  // Helper function to get hotel-specific check-in time
  const getHotelCheckInTime = (hotelName: string) => {
    // Find the hotel in the database by name
    const hotel = allHotels.find((h: any) => h.name === hotelName);  

    if (hotel) {
      // Use the actual priceLevel from the database
      switch (hotel.priceLevel) {
        case 'deluxe_villa':
          return '16:00';
        case 'deluxe':
        case 'moderate':
        case 'value':
        default:
          return '15:00';
      }
    }

    // Fallback for hotels not in database
    return '15:00';
  };

  // Helper function to calculate expected resort arrival time
  const calculateResortArrival = (flightTime: string, transportMethod: string, flightType: string = 'domestic') => {
    if (!flightTime || !transportMethod) return '';

    const flight = new Date(`1970-01-01T${flightTime}:00`);

    // Airport processing time based on travel mode
    let airportProcessing = 0;
    let travelTime = 0;

    if (flightType === 'driving') {
      airportProcessing = 0; // No airport processing for driving
      travelTime = 0; // Direct to resort
    } else {
      // Airport processing time based on flight type
      if (flightType === 'international') {
        airportProcessing = 60; // Immigration, customs, baggage claim
      } else {
        airportProcessing = 30; // Domestic baggage claim and exit
      }
      // Travel time from MCO to Disney (30 minutes baseline)
      travelTime = 30;
    }

    // Transportation-specific delays
    let transportBuffer = 0;
    switch (transportMethod) {
      case 'car':
        if (flightType === 'driving') {
          transportBuffer = 0; // Direct drive, no additional buffer
        } else {
          transportBuffer = 30; // Car rental pickup and shuttle time
        }
        break;
      case 'rideshare':
        transportBuffer = 15; // Wait time for pickup
        break;
      case 'mears':
        transportBuffer = 20; // Boarding and multiple stops
        break;
      case 'mears-express':
        transportBuffer = 10; // Boarding, fewer stops
        break;
      case 'taxi':
        transportBuffer = 10; // Minimal wait time
        break;
      case 'minnie-van':
        transportBuffer = 5; // Premium service, minimal wait
        break;
      case 'private':
        transportBuffer = 5; // Premium service, minimal wait
        break;
      default:
        transportBuffer = 15; // Default buffer
    }

    const totalMinutes = airportProcessing + travelTime + transportBuffer;
    const arrival = new Date(flight.getTime() + (totalMinutes * 60000));
    return arrival.toTimeString().slice(0, 5);
  };

  // Helper function to get arrival timing breakdown for display
  const getArrivalTimingBreakdown = (flightTime: string, transportMethod: string, flightType: string = 'domestic') => {
    if (!flightTime || !transportMethod) return null;

    let airportProcessing = 0;
    let travelTime = 0;
    let transportBuffer = 0;

    if (flightType === 'driving') {
      airportProcessing = 0;
      travelTime = 0;
    } else {
      if (flightType === 'international') {
        airportProcessing = 60; // Immigration, customs, baggage claim
      } else {
        airportProcessing = 30; // Domestic baggage claim and exit
      }
      travelTime = 30;
    }

    switch (transportMethod) {
      case 'car':
        if (flightType === 'driving') {
          transportBuffer = 0;
        } else {
          transportBuffer = 30; // Car rental pickup and shuttle time
        }
        break;
      case 'rideshare':
        transportBuffer = 15;
        break;
      case 'mears':
        transportBuffer = 20;
        break;
      case 'mears-express':
        transportBuffer = 10;
        break;
      case 'taxi':
        transportBuffer = 10;
        break;
      case 'minnie-van':
        transportBuffer = 5;
        break;
      case 'private':
        transportBuffer = 5;
        break;
      default:
        transportBuffer = 15;
    }

    const totalMinutes = airportProcessing + travelTime + transportBuffer;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return {
      airportProcessing,
      travelTime,
      transportBuffer,
      totalMinutes,
      totalHours,
      remainingMinutes
    };
  };

  // Helper function to get transportation info for bubble
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getTransportationInfo = (transportMethod: string) => {
    switch (transportMethod) {
      case 'mears':
        return {
          title: 'Mears Connect Pricing',
          details: [
            'Standard: $17.60 adult, $14.30 child (one-way)',
            '24/7 service from both main & C terminals',
            'Travel time: 45-75 minutes with multiple stops',
            'Round-trip packages available'
          ]
        };
      case 'mears-express':
        return {
          title: 'Mears Connect Express Pricing',
          details: [
            'Express: $238 for group of 4 (faster service)',
            'Direct service with fewer stops',
            'Travel time: 30-45 minutes',
            'Book online in advance for guaranteed service'
          ]
        };
      case 'car':
        return {
          title: 'Personal/Rental Car Information',
          details: [
            'Parking: Free self-parking at Disney resort hotels',
            'Valet parking available for additional fee at most resorts',
            'GPS recommended - Disney signage can be confusing',
            'Consider traffic during peak arrival/departure times'
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

  // Helper function to get specific activity icons based on name, with fallback to category icon
  const getActivityIcon = (activityName: string, categoryType: string): string => {
    // Map specific activity names to their modal icons
    const specificIconMap: { [key: string]: string } = {
      'Room Settling Time': '🧳',
      'Welcome Dinner': '🍽️',
      'Welcome Dinner Reservation': '🍽️',
      'Resort Exploration': '🗺️',
      'Explore Your Resort': '🗺️',
      'Early Rest & Recovery': '🛌',
      'Resort Map & Orientation': '🗺️',
      'Pool Area Exploration': '🏊',
      'Locate Resort Spa': '💆',
      'Resort Beach Walk': '🏖️',
      'Explore Marina & Watercraft': '⛵',
      'Golf Course Walk': '⛳',
      'Check Resort Activities': '🎭',
      'Monorail Resort Tour': '🚝',
      'Explore Water Features': '💦',
      'Animal Safari Viewing': '🦒',
      'Volcano Pool Exploration': '🌋',
      'Resort Monorail Experience': '🚝',
      'Beach & Sand Castle Building': '🏖️',
      'Contemporary Tower Views': '🏢',
      'Wilderness Lodge Tour': '🏕️',
      'Typhoon Lagoon Water Park': '🌊',
      'Blizzard Beach Water Park': '❄️',
    };

    // Return specific icon if found, otherwise fall back to category icon
    return specificIconMap[activityName] || getCategoryIcon(categoryType);
  };

  // Helper function to get hotel feature-based activity suggestions
  const getHotelFeatureSuggestions = (hotelData: any) => {
    const suggestions = [];

    // Smart detection for pool time - arrival day appropriate
    if (hotelData?.features?.amenities?.pool) {
      suggestions.push({ name: 'Pool Area Exploration', type: 'break', icon: '🏊' });
    }

    // Spa reconnaissance rather than booking/experience
    if (hotelData?.features?.amenities?.spa) {
      suggestions.push({ name: 'Locate Resort Spa', type: 'tours', icon: '💆' });
    }

    if (hotelData?.features?.amenities?.beach) {
      suggestions.push({ name: 'Resort Beach Walk', type: 'break', icon: '🏖️' });
    }

    if (hotelData?.features?.amenities?.marina) {
      suggestions.push({ name: 'Explore Marina & Watercraft', type: 'tours', icon: '⛵' });
    }

    // Light exploration rather than passive viewing
    if (hotelData?.features?.amenities?.golf) {
      suggestions.push({ name: 'Golf Course Walk', type: 'break', icon: '⛳' });
    }

    // Information gathering rather than participation
    if (hotelData?.features?.amenities?.entertainment) {
      suggestions.push({ name: 'Check Resort Activities', type: 'tours', icon: '🎭' });
    }

    if (hotelData?.features?.transportation?.monorail) {
      suggestions.push({ name: 'Monorail Resort Tour', type: 'tours', icon: '🚝' });
    }

    if (hotelData?.features?.amenities?.waterFeatures) {
      suggestions.push({ name: 'Explore Water Features', type: 'tours', icon: '💦' });
    }

    // Add special features based on hotel specifics - arrival day appropriate
    if (hotelData?.id === 'animal-kingdom-lodge') {
      suggestions.push({ name: 'Savanna Animal Viewing', type: 'attraction', icon: '🦁' });
    }

    if (hotelData?.id === 'grand-floridian') {
      suggestions.push({ name: 'Victorian Garden Walk', type: 'break', icon: '🌹' });
    }

    if (hotelData?.id === 'polynesian') {
      suggestions.push({ name: 'Electrical Water Pageant Viewing', type: 'attraction', icon: '✨' });
    }

    if (hotelData?.id === 'wilderness-lodge') {
      suggestions.push({ name: 'Geyser Viewing (Hourly)', type: 'attraction', icon: '💦' });
    }

    // Add more hotel-specific arrival day activities
    if (hotelData?.id === 'contemporary') {
      suggestions.push({ name: 'Monorail Concourse Exploration', type: 'tours', icon: '🚝' });
    }

    if (hotelData?.id === 'beach-club' || hotelData?.id === 'yacht-club') {
      suggestions.push({ name: 'Stormalong Bay Familiarization', type: 'tours', icon: '🏖️' });
    }

    if (hotelData?.id === 'boardwalk') {
      suggestions.push({ name: 'BoardWalk Promenade Stroll', type: 'break', icon: '🎪' });
    }

    if (hotelData?.id === 'riviera') {
      suggestions.push({ name: 'Skyliner Station Exploration', type: 'tours', icon: '🚠' });
    }

    // Always add these essential arrival day activities if we have space
    if (suggestions.length < 3) {
      suggestions.push({ name: 'Lobby & Architecture Tour', type: 'tours', icon: '🏨' });
    }

    if (suggestions.length < 3 && hotelData?.features?.amenities?.dining) {
      suggestions.push({ name: 'Explore Dining Options', type: 'tours', icon: '🍽️' });
    }


    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  // Helper function to check water park access
  const hasWaterParkAccess = (hotelData: any) => {
    // Disney resort guests typically have water park access (with separate ticket)
    if (hotelData?.type === 'disney') return true;

    // Universal guests don't have Disney water park access
    if (hotelData?.type === 'universal') return false;

    // Off-property hotels don't have included access
    if (hotelData?.type === 'other') return false;

    // Default: if we can't determine, show water parks (better to show than hide)
    return true;
  };

  const updateDayData = async (updates: Partial<TripDay>) => {
    try {
      await updateDay(trip.id, tripDay.id, updates);
    } catch (error) {
      console.error('Failed to update day:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _updateAccommodationData = async (updates: any) => {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleAddCustomActivity = async () => {
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
          {getActivityIcon(item.name, item.type)}
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
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleDeleteActivity(item.id)}
              className="p-1 text-ink-light hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Delete activity"
            >
              <XCircle className="w-3 h-3" />
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
          <div className="flex items-center mb-6 py-4 px-4 border-b border-surface-dark/20 relative bg-gradient-to-r from-sea-light/60 to-sea/60 rounded-lg min-h-[120px]">
            {onOpenDayTypeModal && (
              <button
                onClick={onOpenDayTypeModal}
                className="absolute top-3 right-3 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
              >
                <span className="text-base">📅</span>
                <span>Change Day Type</span>
              </button>
            )}
            <div className="flex items-center justify-center w-12 h-12 mr-4">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Welcome to Your Disney Adventure!</h2>
              <p className="text-ink-light">Arrival day - let's get you settled in</p>
              <div className="mt-2">
                <WeatherHeader date={date} />
              </div>
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
                {tripDay.arrivalPlan?.transportMethod && (
                  <button
                    onClick={() => setShowTransportInfo(true)}
                    className="p-1 rounded-full hover:bg-surface-dark/20 transition-colors"
                    title="View transportation information"
                  >
                    <Info className="w-4 h-4 text-ink-light" />
                  </button>
                )}
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="space-y-4">
                    {/* Line 1: Flight/Drive Details (40%) + Flight/Drive Time (30%) + Travel Mode (30%) */}
                    <div className="grid grid-cols-10 gap-4">
                      <div className="col-span-10 md:col-span-4">
                        <div className="flex items-center justify-between mb-1 min-h-[20px]">
                          <label className="block text-xs font-medium text-ink">Flight/Drive Details</label>
                        </div>
                        <input
                          type="text"
                          value={tripDay.arrivalPlan?.flightDetails || ''}
                          onChange={(e) => updateDayData({
                            arrivalPlan: {
                              ...tripDay.arrivalPlan,
                              flightDetails: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                          placeholder={tripDay.arrivalPlan?.flightType === 'driving'
                            ? "Driving to resort, arriving around 14:30..."
                            : "Flight AA123, departing 08:30 from LAX..."}
                        />
                      </div>
                      <div className="col-span-10 md:col-span-3">
                        <div className="flex items-center justify-between mb-1 min-h-[20px]">
                          <label className="block text-xs font-medium text-ink">
                            {tripDay.arrivalPlan?.flightType === 'driving' ? 'Target Arrival' : 'Flight Time'}
                          </label>
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
                      <div className="col-span-10 md:col-span-3">
                        <div className="flex items-center justify-between mb-1 min-h-[20px]">
                          <label className="block text-xs font-medium text-ink">Travel Mode</label>
                        </div>
                        <select
                          value={tripDay.arrivalPlan?.flightType || 'domestic'}
                          onChange={(e) => updateDayData({
                            arrivalPlan: {
                              ...tripDay.arrivalPlan,
                              flightType: e.target.value as 'domestic' | 'international' | 'driving',
                              // Auto-set transportation when driving is selected
                              transportMethod: e.target.value === 'driving' ? 'car' : tripDay.arrivalPlan?.transportMethod
                            }
                          })}
                          className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                        >
                          <option value="domestic">Domestic Flight</option>
                          <option value="international">International Flight</option>
                          <option value="driving">Driving to Resort</option>
                        </select>
                      </div>
                    </div>

                    {/* Line 2: Transportation (60%) + Arrival at Resort Around (40%) */}
                    <div className="grid grid-cols-10 gap-4">
                      <div className="col-span-10 md:col-span-6">
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
                          disabled={tripDay.arrivalPlan?.flightType === 'driving'}
                          className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors disabled:bg-surface-dark/10 disabled:cursor-not-allowed"
                        >
                          <option value="">Choose...</option>
                          {tripDay.arrivalPlan?.flightType === 'driving' ? (
                            <option value="car">🚗 Personal Vehicle</option>
                          ) : (
                            <>
                              <option value="mears">🚌 Mears Connect</option>
                              <option value="mears-express">🚌 Mears Connect Express</option>
                              <option value="rideshare">🚙 Rideshare</option>
                              <option value="car">🚗 Rental Car</option>
                              <option value="taxi">🚕 Taxi</option>
                              <option value="minnie-van">🎭 Minnie Van</option>
                              <option value="private">🚐 Private Service</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="col-span-10 md:col-span-4">
                        <div className="flex items-center justify-between mb-1 min-h-[20px]">
                          <label className="block text-xs font-medium text-ink">
                            {tripDay.arrivalPlan?.flightType === 'driving' ? 'Arrive at Resort By' : 'Arrival at Resort Around'}
                          </label>
                        </div>
                        <div className="px-3 py-2 bg-surface/50 border border-surface-dark/50 rounded-lg text-ink text-sm">
                          {tripDay.arrivalPlan?.tapInTime && tripDay.arrivalPlan?.transportMethod
                            ? calculateResortArrival(tripDay.arrivalPlan.tapInTime, tripDay.arrivalPlan.transportMethod, tripDay.arrivalPlan?.flightType || 'domestic')
                            : 'Set details'
                          }
                        </div>
                      </div>
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
                <button
                  onClick={() => setShowCheckInInfo(true)}
                  className="p-1 rounded-full hover:bg-surface-dark/20 transition-colors"
                  title="View digital check-in information"
                >
                  <Info className="w-4 h-4 text-ink-light" />
                </button>
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
                        ? getHotelCheckInTime(trip.accommodation.hotelName)
                        : '15:00'
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
                  <Plus className="w-4 h-4 mr-1" />
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
                  <span className="text-4xl mb-4 block">🎯</span>
                  <p className="text-ink-light">Add some light activities for your arrival day!</p>
                  <p className="text-xs text-ink-light mt-2">Click "Add Activity" above to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Quick Info & Tips */}
      <div className="lg:col-span-4">
        <div className="bg-surface rounded-xl border border-surface-dark/30 p-5 h-full overflow-y-auto">
          <div className="space-y-4">

            {/* First Day Tips */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <h4 className="font-medium text-ink mb-3">💡 First Day Tips</h4>
              <div className="text-sm text-ink-light space-y-2">
                <p>• Take it slow - you have the whole vacation ahead</p>
                <p>• Download My Disney Experience app and link your confirmation</p>
                <p>• Explore your {trip.accommodation?.hotelName ? 'resort' : 'hotel'} - pools, dining, and transportation options</p>
                <p>• Use mobile ordering for dining - saves time in busy periods</p>
                <p>• Stay hydrated and pack layers - Florida weather can change quickly</p>
                {trip.accommodation?.hotelName && (() => {
                  const hotelData = allHotels.find((hotel: any) =>  
                    hotel.name.toLowerCase().includes(trip.accommodation!.hotelName!.toLowerCase()) ||
                    trip.accommodation!.hotelName!.toLowerCase().includes(hotel.name.toLowerCase())
                  );
                  return hotelData?.type !== 'disney' ? (
                    <p>• Book Lightning Lane Multi Pass up to 3 days in advance</p>
                  ) : null;
                })()}
                {tripDay.arrivalPlan?.transportMethod === 'car' && (
                  <p>• Take photos of parking location if driving</p>
                )}
              </div>

              {/* Resort Guest Benefits Subsection */}
              {trip.accommodation?.hotelName && (() => {
                const hotelData = allHotels.find((hotel: any) =>
                  hotel.name.toLowerCase().includes(trip.accommodation!.hotelName!.toLowerCase()) ||
                  trip.accommodation!.hotelName!.toLowerCase().includes(hotel.name.toLowerCase())
                );
                return hotelData?.type === 'disney' ? (
                  <div className="mt-4 pt-3 border-t border-blue-500/30">
                    <h5 className="font-medium text-ink mb-2 text-xs uppercase tracking-wide">🏰 Resort Guest Benefits</h5>
                    <div className="text-sm text-ink-light space-y-2">
                      <p>• Complete online check-in before arrival to save time</p>
                      <p>• Book Lightning Lane Multi Pass up to 7 days in advance</p>
                      <p>• Take advantage of FREE water park admission today</p>
                      <p>• Remember Early Park Access (30 minutes early)</p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Important Numbers */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h4 className="font-medium text-ink mb-3 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-blue-500" />
                Important Numbers
              </h4>
              <div className="space-y-2 text-sm text-ink-light">
                <div>General Guest Services: (407) 939-5277</div>
                <div>Dining Reservations: (407) 939-3463</div>
                <div>Lost & Found: (407) 824-4245</div>
                <div>Existing Reservations: (407) 934-7639</div>
                <div>Guest Relations: Available in My Disney Experience app</div>
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
                  <Camera className="w-5 h-5 mr-2 text-pink-500" />
                  Light First Day Activities
                </h3>
                <p className="text-sm text-ink-light mt-1">
                  Keep it simple today - you might be tired from travel. Focus on getting oriented and settling in.
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

              {/* Activity Categories - Vertical Layout */}
              <div className="space-y-6">

                {/* Column 1: Essential First Day */}
                <div className="rounded-lg p-4">
                  <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                    Essential First Day
                  </h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        onQuickAdd('break', undefined, 'Room Settling Time');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🧳</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Room Settling Time
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Unpack and get comfortable
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('dining', undefined, 'Welcome Dinner');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🍽️</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Welcome Dinner
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Celebrate your arrival
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('tours', undefined, 'Resort Exploration');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🏨</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Explore Your Resort
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Discover amenities and layout
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('break', undefined, 'Early Rest & Recovery');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🛌</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Early Rest & Recovery
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Recharge from travel
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('tours', undefined, 'Resort Map & Orientation');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🗺️</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Resort Map & Orientation
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Learn the best routes
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  </div>
                </div>

                {/* Column 2: Resort-Specific Features (Dynamic) */}
                {(() => {
                  const hotelData = trip.accommodation?.hotelName ?
                    allHotels.find((hotel: any) =>
                      hotel.name.toLowerCase().includes(trip.accommodation!.hotelName!.toLowerCase()) ||
                      trip.accommodation!.hotelName!.toLowerCase().includes(hotel.name.toLowerCase())
                    ) : null;

                  const suggestions = hotelData ? getHotelFeatureSuggestions(hotelData) : [];

                  if (suggestions.length === 0) return null;

                  return (
                    <div className="rounded-lg p-4">
                      <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                        <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                        Resort Features
                      </h4>
                      <div className="grid md:grid-cols-3 gap-3">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              onQuickAdd(suggestion.type as ActivityCategory, undefined, suggestion.name);
                              setShowAddActivityModal(false);
                            }}
                            className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                          >
                            <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">{suggestion.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                                {suggestion.name}
                              </div>
                              <div className="text-xs text-ink-light mt-1">
                                Resort amenity
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Column 3: Water Parks (Dynamic) */}
                {(() => {
                  const hotelData = trip.accommodation?.hotelName ?
                    allHotels.find((hotel: any) =>
                      hotel.name.toLowerCase().includes(trip.accommodation!.hotelName!.toLowerCase()) ||
                      trip.accommodation!.hotelName!.toLowerCase().includes(hotel.name.toLowerCase())
                    ) : null;

                  const showWaterParks = hotelData ? hasWaterParkAccess(hotelData) : true;

                  if (!showWaterParks) return null;

                  return (
                    <div className="rounded-lg p-4">
                      <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Water Parks Today
                      </h4>
                      <div className="grid md:grid-cols-3 gap-3">
                        <button
                          onClick={() => {
                            onQuickAdd('waterpark', undefined, 'Typhoon Lagoon Water Park');
                            setShowAddActivityModal(false);
                          }}
                          className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                        >
                          <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🌊</span>
                          <div className="flex-1">
                            <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                              Typhoon Lagoon
                            </div>
                            <div className="text-xs text-ink-light mt-1">
                              Tropical water park adventure
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                        <button
                          onClick={() => {
                            onQuickAdd('waterpark', undefined, 'Blizzard Beach Water Park');
                            setShowAddActivityModal(false);
                          }}
                          className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                        >
                          <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">❄️</span>
                          <div className="flex-1">
                            <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                              Blizzard Beach
                            </div>
                            <div className="text-xs text-ink-light mt-1">
                              Winter wonderland water park
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
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
                      <option value="attraction">Attraction</option>
                      <option value="dining">Dining</option>
                      <option value="break">Break</option>
                      <option value="tours">Tour</option>
                      <option value="waterpark">Water Park</option>
                      <option value="travel">Travel</option>
                    </select>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => {
                        if (customActivity.name.trim()) {
                          onQuickAdd(customActivity.type, undefined, customActivity.name);
                          setCustomActivity({ name: '', startTime: '', type: 'attraction' });
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

      {/* Arrival Timing Breakdown Modal */}
      {showTransportInfo && (() => {
        const breakdown = getArrivalTimingBreakdown(
          tripDay.arrivalPlan?.tapInTime || '',
          tripDay.arrivalPlan?.transportMethod || '',
          tripDay.arrivalPlan?.flightType || 'domestic'
        );

        return breakdown && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
                <h3 className="text-lg font-semibold text-ink flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  Arrival Timing Breakdown
                </h3>
                <button
                  onClick={() => setShowTransportInfo(false)}
                  className="p-1 rounded-lg hover:bg-surface-dark/10 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-ink-light" />
                </button>
              </div>

              <div className="p-4">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-ink">
                    {breakdown.totalHours > 0 ? `${breakdown.totalHours}h ` : ''}{breakdown.remainingMinutes}m
                  </div>
                  <div className="text-sm text-ink-light">
                    {tripDay.arrivalPlan?.flightType === 'driving' ? 'Direct drive to resort' : 'Total time from landing to resort'}
                  </div>
                </div>

                <div className="space-y-3">
                  {breakdown.airportProcessing > 0 && (
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-medium text-blue-900">Airport Processing</div>
                        <div className="text-sm text-blue-700">
                          {tripDay.arrivalPlan?.flightType === 'international'
                            ? 'Immigration, customs & baggage'
                            : 'Baggage claim & exit'}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-blue-900">
                        {breakdown.airportProcessing}m
                      </div>
                    </div>
                  )}

                  {breakdown.travelTime > 0 && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-medium text-green-900">Travel Time</div>
                        <div className="text-sm text-green-700">MCO Airport to Disney resort</div>
                      </div>
                      <div className="text-lg font-semibold text-green-900">
                        {breakdown.travelTime}m
                      </div>
                    </div>
                  )}

                  {breakdown.transportBuffer > 0 && (
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div>
                        <div className="font-medium text-orange-900">Transport Buffer</div>
                        <div className="text-sm text-orange-700">
                          {tripDay.arrivalPlan?.flightType === 'driving'
                            ? 'Parking & check-in'
                            : 'Pickup wait & logistics'}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-orange-900">
                        {breakdown.transportBuffer}m
                      </div>
                    </div>
                  )}
                </div>

                {tripDay.arrivalPlan?.flightType === 'international' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 International arrivals require additional time for customs and immigration processing
                    </p>
                  </div>
                )}

                {tripDay.arrivalPlan?.flightType === 'driving' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      🚗 Driving directly to resort - times shown are for parking and resort check-in
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end p-4 border-t border-surface-dark/20">
                <button
                  onClick={() => setShowTransportInfo(false)}
                  className="btn-primary"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Digital Check-in Info Modal */}
      {showCheckInInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
              <h3 className="text-lg font-semibold text-ink flex items-center">
                <Hotel className="w-5 h-5 mr-2 text-orange-500" />
                Digital Check-in Available
              </h3>
              <button
                onClick={() => setShowCheckInInfo(false)}
                className="p-1 rounded-lg hover:bg-surface-dark/10 transition-colors"
              >
                <XCircle className="w-5 h-5 text-ink-light" />
              </button>
            </div>

            <div className="p-4">
              <div className="text-center mb-4">
                <span className="text-4xl">📱</span>
                <div className="text-sm text-ink-light mt-2">Use the My Disney Experience app for a seamless check-in</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">•</span>
                  <span className="text-ink text-sm">Use My Disney Experience app for contactless check-in</span>
                </div>
                <div className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">•</span>
                  <span className="text-ink text-sm">Room assignment notifications sent to your phone</span>
                </div>
                <div className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">•</span>
                  <span className="text-ink text-sm">Early check-in subject to availability</span>
                </div>
                <div className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-0.5">•</span>
                  <span className="text-ink text-sm">Store luggage with Bell Services if room not ready</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-700">
                  💡 Digital check-in typically opens 60 days before your arrival date
                </p>
              </div>
            </div>

            <div className="flex justify-end p-4 border-t border-surface-dark/20">
              <button
                onClick={() => setShowCheckInInfo(false)}
                className="btn-primary"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </DndProvider>
  );
}