/* eslint-disable @typescript-eslint/no-explicit-any */
import { Plane, Clock, Camera, Luggage, Plus, XCircle, GripVertical, Save, Edit, Info } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TripDay, Trip, ActivityCategory } from '../../../types';
import { useTripStore } from '../../../stores';
import { useState } from 'react';
import { allHotels } from '@waylight/shared';
import { getCategoryIcon } from '../../../data/activityCategories';
import WeatherHeader from '../../weather/WeatherHeader';

interface CheckOutDayViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function CheckOutDayView({ trip, tripDay, date, onQuickAdd, onOpenDayTypeModal }: CheckOutDayViewProps) {
  const { updateDay, deleteItem, updateItem, reorderItems } = useTripStore();
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showTimingBreakdown, setShowTimingBreakdown] = useState(false);
  const [showCustomActivityForm, setShowCustomActivityForm] = useState(false);
  const [customActivity, setCustomActivity] = useState({ name: '', startTime: '', type: 'attraction' as ActivityCategory });

  const updateDayData = async (updates: Partial<TripDay>) => {
    try {
      await updateDay(trip.id, tripDay.id, updates);
    } catch (error) {
      console.error('Failed to update day:', error);
    }
  };

  // Helper function to get hotel-specific check-out time
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getHotelCheckOutTime = (_hotelName: string) => {
    // All Disney resort hotels have the same 11:00 check-out time as of 2025
    // This includes all tiers: Value, Moderate, Deluxe, and DVC (Deluxe Villa)
    return '11:00';
  };

  // Helper function to get specific activity icons based on name, with fallback to category icon
  const getActivityIcon = (activityName: string, categoryType: string): string => {
    // Map specific activity names to their modal icons
    const specificIconMap: { [key: string]: string } = {
      'Last-minute Souvenirs': '🛍️',
      'Last-minute Shopping': '🛍️',
      'Final Character Meal': '🍽️',
      'Farewell Character Breakfast': '🍽️',
      'Final Photo Opportunities': '📸',
      'Resort Photo Session': '📸',
      'One Final Attraction': '🎢',
      'One Last Ride': '🎢',
      'Pack Final Items': '🧳',
      'Room Final Check': '🔍',
      'Hotel Check-out Process': '🏨',
      'Transportation Coordination': '🚌',
      'Farewell Resort Tour': '🗺️',
      'Final Savanna Viewing': '🦁',
      'Jambo House Farewell Walk': '🗺️',
      'Grand Lobby Farewell Photos': '📸',
      'Victorian Garden Final Stroll': '🌹',
      'Beach Resort Final Walk': '🏖️',
      'Lava Pool Farewell Swim': '🌋',
      'Last Monorail Loop': '🚝',
      'Bay Lake Tower Views': '🏢',
      'Final Geyser Viewing': '💦',
      'Wilderness Lodge Architecture Tour': '🏕️',
      'Stormalong Bay Goodbye': '🏊',
      'BoardWalk Farewell Stroll': '🎪',
      'Skyliner Farewell Ride': '🚠',
      'Riviera Resort Rooftop Views': '🌅',
      'Farewell Monorail Resort Tour': '🚝',
      'Final Skyliner Views': '🚠',
      'Beach Farewell Walk': '🏖️',
      'Pool Area Final Visit': '🏊',
      'Resort Grounds Final Walk': '🗺️',
      'Lobby Farewell Photos': '📸',
      'Memory Recording Session': '🎙️',
      'PhotoPass Download': '📱',
      'Final Resort Dining': '🍽️',
    };

    // Return specific icon if found, otherwise fall back to category icon
    return specificIconMap[activityName] || getCategoryIcon(categoryType);
  };

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    reorderItems(trip.id, tripDay.id, dragIndex, hoverIndex);
  };

  // Helper function to get hotel-specific farewell activities
  const getHotelFarewellSuggestions = (hotelData: any) => {
    const suggestions = [];

    // Resort-specific farewell activities based on signature features
    if (hotelData?.id === 'animal-kingdom-lodge') {
      suggestions.push({ name: 'Final Savanna Viewing', type: 'attraction', icon: '🦁' });
      suggestions.push({ name: 'Jambo House Farewell Walk', type: 'tours', icon: '🗺️' });
    }

    if (hotelData?.id === 'grand-floridian') {
      suggestions.push({ name: 'Grand Lobby Farewell Photos', type: 'attraction', icon: '📸' });
      suggestions.push({ name: 'Victorian Garden Final Stroll', type: 'tours', icon: '🌹' });
    }

    if (hotelData?.id === 'polynesian' || hotelData?.id === 'polynesian-villas') {
      suggestions.push({ name: 'Beach Resort Final Walk', type: 'tours', icon: '🏖️' });
      suggestions.push({ name: 'Lava Pool Farewell Swim', type: 'break', icon: '🌋' });
    }

    if (hotelData?.id === 'contemporary') {
      suggestions.push({ name: 'Last Monorail Loop', type: 'tours', icon: '🚝' });
      suggestions.push({ name: 'Bay Lake Tower Views', type: 'attraction', icon: '🏢' });
    }

    if (hotelData?.id === 'wilderness-lodge') {
      suggestions.push({ name: 'Final Geyser Viewing', type: 'attraction', icon: '💦' });
      suggestions.push({ name: 'Wilderness Lodge Architecture Tour', type: 'tours', icon: '🏕️' });
    }

    if (hotelData?.id === 'beach-club' || hotelData?.id === 'yacht-club') {
      suggestions.push({ name: 'Stormalong Bay Goodbye', type: 'break', icon: '🏊' });
      suggestions.push({ name: 'BoardWalk Farewell Stroll', type: 'tours', icon: '🎪' });
    }

    if (hotelData?.id === 'riviera') {
      suggestions.push({ name: 'Skyliner Farewell Ride', type: 'tours', icon: '🚠' });
      suggestions.push({ name: 'Riviera Resort Rooftop Views', type: 'attraction', icon: '🌅' });
    }

    // Transportation-based activities
    if (hotelData?.features?.transportation?.monorail) {
      suggestions.push({ name: 'Farewell Monorail Resort Tour', type: 'tours', icon: '🚝' });
    }

    if (hotelData?.features?.transportation?.skyliner) {
      suggestions.push({ name: 'Final Skyliner Views', type: 'tours', icon: '🚠' });
    }

    // Resort feature-based activities
    if (hotelData?.features?.amenities?.beach) {
      suggestions.push({ name: 'Beach Farewell Walk', type: 'break', icon: '🏖️' });
    }

    if (hotelData?.features?.amenities?.pool && !suggestions.some(s => s.name.includes('Pool'))) {
      suggestions.push({ name: 'Pool Area Final Visit', type: 'break', icon: '🏊' });
    }

    // Always add generic farewell activities if we have space
    if (suggestions.length < 3) {
      suggestions.push({ name: 'Resort Grounds Final Walk', type: 'tours', icon: '🗺️' });
    }

    if (suggestions.length < 3) {
      suggestions.push({ name: 'Lobby Farewell Photos', type: 'attraction', icon: '📸' });
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  // Helper function to calculate recommended departure time from resort
  const calculateDepartureTime = (flightTime: string, transportMethod: string, flightType: string = 'domestic') => {
    if (!flightTime || !transportMethod) return '';

    const flight = new Date(`1970-01-01T${flightTime}:00`);

    // Base buffer based on travel mode
    let airportBuffer = 0;
    let travelTime = 0;

    if (flightType === 'driving') {
      airportBuffer = 0; // No airport time needed for driving
      travelTime = 0; // No travel to airport needed
    } else {
      // Airport arrival buffer based on flight type (TSA recommendations)
      if (flightType === 'international') {
        airportBuffer = 180; // 3 hours for international flights
      } else {
        airportBuffer = 120; // 2 hours for domestic flights
      }
      // Travel time from Disney to MCO (approximately 30 minutes)
      travelTime = 30;
    }

    // Transportation-specific buffer
    let transportBuffer = 0;
    switch (transportMethod) {
      case 'car':
        if (flightType === 'driving') {
          transportBuffer = 90; // Packing, loading, checkout buffer for driving home
        } else {
          transportBuffer = 60; // Car return/parking + shuttle for flights
        }
        break;
      case 'rideshare':
        transportBuffer = 30; // Wait time + surge possibility
        break;
      case 'bus':
        transportBuffer = 90; // Schedule dependency + multiple stops
        break;
      case 'mears':
        transportBuffer = 60; // Wait time + multiple stops
        break;
      case 'mears-express':
        transportBuffer = 45; // Direct service, less wait time
        break;
      case 'taxi':
        transportBuffer = 30; // Wait time
        break;
      case 'minnie-van':
        transportBuffer = 15; // Premium service, minimal wait
        break;
      case 'private':
        transportBuffer = 15; // Premium service, minimal wait
        break;
      default:
        transportBuffer = 60; // Default safe buffer
    }

    const totalBufferMinutes = airportBuffer + travelTime + transportBuffer;
    const departure = new Date(flight.getTime() - (totalBufferMinutes * 60000));
    return departure.toTimeString().slice(0, 5);
  };

  // Helper function to get timing breakdown for display
  const getTimingBreakdown = (flightTime: string, transportMethod: string, flightType: string = 'domestic') => {
    if (!flightTime || !transportMethod) return null;

    let airportBuffer = 0;
    let travelTime = 0;
    let transportBuffer = 0;

    if (flightType === 'driving') {
      airportBuffer = 0; // No airport time needed for driving
      travelTime = 0; // No travel to airport needed
    } else {
      // Airport arrival buffer based on flight type
      if (flightType === 'international') {
        airportBuffer = 180;
      } else {
        airportBuffer = 120;
      }
      travelTime = 30;
    }

    switch (transportMethod) {
      case 'car':
        if (flightType === 'driving') {
          transportBuffer = 90; // Packing, loading, checkout buffer for driving home
        } else {
          transportBuffer = 60; // Car return/parking + shuttle for flights
        }
        break;
      case 'rideshare':
        transportBuffer = 30;
        break;
      case 'bus':
        transportBuffer = 90;
        break;
      case 'mears':
        transportBuffer = 60;
        break;
      case 'mears-express':
        transportBuffer = 45;
        break;
      case 'taxi':
        transportBuffer = 30;
        break;
      case 'minnie-van':
        transportBuffer = 15;
        break;
      case 'private':
        transportBuffer = 15;
        break;
      default:
        transportBuffer = 60;
    }

    const total = airportBuffer + travelTime + transportBuffer;

    return {
      airportBuffer,
      travelTime,
      transportBuffer,
      total,
      totalHours: Math.floor(total / 60),
      totalMinutes: total % 60
    };
  };

  // Helper function to get transportation-specific tips with flight type context
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getTransportationTips = (transportMethod: string, flightType: string = 'domestic') => {
    const baseTips = [];

    switch (transportMethod) {
      case 'car':
        if (flightType === 'driving') {
          baseTips.push(
            '• Pack car systematically and check all belongings',
            '• Plan rest stops every 2-3 hours for long drives',
            '• Check traffic conditions and weather forecasts',
            '• Have snacks, water, and entertainment ready'
          );
        } else {
          baseTips.push(
            '• Fill up gas tank before returning rental',
            '• Take photos of car condition before return',
            '• Allow extra time for rental car shuttle to terminal'
          );
        }
        break;
      case 'rideshare':
        baseTips.push(
          '• Request ride 15-20 minutes before needed departure',
          '• Have backup transportation ready during busy times',
          '• Confirm pickup location with driver'
        );
        break;
      case 'bus':
        baseTips.push(
          '• Check resort transportation schedules in advance',
          '• Allow extra time for potential delays',
          '• Confirm pickup location at your resort'
        );
        break;
      case 'mears':
        baseTips.push(
          '• Book return trip when you arrive at resort',
          '• Confirm pickup time 24 hours in advance',
          '• Have confirmation number readily available'
        );
        break;
      case 'mears-express':
        baseTips.push(
          '• Express service with fewer stops than regular Mears',
          '• Book return trip when you arrive at resort',
          '• Confirm pickup time 24 hours in advance'
        );
        break;
      case 'taxi':
        baseTips.push(
          '• Request taxi 30 minutes before needed departure',
          '• Have cash ready for payment and tip',
          '• Confirm pickup location with dispatcher'
        );
        break;
      case 'minnie-van':
        baseTips.push(
          '• Request via Lyft app 20-30 minutes in advance',
          '• Premium service with minimal wait time',
          '• Direct service to your terminal'
        );
        break;
      case 'private':
        baseTips.push(
          '• Confirm pickup time with service provider',
          '• Premium door-to-door service',
          '• Track vehicle arrival via app/service'
        );
        break;
      default:
        baseTips.push(
          '• Confirm transportation arrangements day before',
          '• Allow extra buffer time for unexpected delays',
          '• Have backup plan ready'
        );
    }

    // Add travel mode-specific tips
    if (flightType === 'international') {
      baseTips.push('• Arrive at airport 3 hours early for international flights');
      baseTips.push('• Have passport and international documents ready');
    } else if (flightType === 'domestic') {
      baseTips.push('• Arrive at airport 2 hours early for domestic flights');
      baseTips.push('• Have REAL ID compliant identification ready');
    } else if (flightType === 'driving') {
      baseTips.push('• Take frequent breaks every 2-3 hours');
      baseTips.push('• Check your route and have offline maps ready');
      baseTips.push('• Keep emergency supplies and phone charger accessible');
    }

    return baseTips;
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editData.startTime}
                    onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSave}
                    className="flex items-center px-3 py-2 bg-sea text-white text-sm rounded-lg hover:bg-sea/90 transition-colors mr-2"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-2 text-ink-light text-sm rounded-lg hover:bg-surface-dark transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {editData.notes !== undefined && (
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Notes</label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-dark border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea resize-none"
                    rows={2}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-ink text-sm">{item.name}</h4>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                  <button
                    onClick={handleEdit}
                    disabled={editingItem !== null && editingItem !== item.id}
                    className="p-1 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded transition-colors disabled:opacity-50"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteItem(trip.id, tripDay.id, item.id)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {item.startTime && (
                <p className="text-xs text-ink-light">{item.startTime}</p>
              )}
              {item.notes && (
                <p className="text-xs text-ink-light mt-1">{item.notes}</p>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
      {/* Left Panel: Departure Planning */}
      <div className="lg:col-span-8">
        <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center mb-6 py-4 px-4 border-b border-surface-dark/20 relative bg-gradient-to-r from-sea-light/60 to-sea/60 rounded-lg min-h-[120px]">
            {onOpenDayTypeModal && (
              <button
                onClick={onOpenDayTypeModal}
                className="absolute top-3 right-3 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
              >
                <span className="text-base">✈️</span>
                <span>Change Day Type</span>
              </button>
            )}
            <div className="flex items-center justify-center w-12 h-12 mr-4">
              <span className="text-2xl">✈️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Farewell to the Magic</h2>
              <p className="text-ink-light">Departure day - let's wrap up your adventure smoothly</p>
              <div className="mt-2">
                <WeatherHeader date={date} />
              </div>
            </div>
          </div>

          {/* Departure Logistics */}
          <div className="space-y-6">
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink flex items-center">
                  <Plane className="w-5 h-5 mr-2 text-blue-500" />
                  Departure Details
                </h3>
                {tripDay.arrivalPlan?.transportMethod && tripDay.arrivalPlan?.departureTime && (
                  <button
                    onClick={() => setShowTimingBreakdown(true)}
                    className="p-1 rounded-full hover:bg-surface-dark/20 transition-colors"
                    title="View timing breakdown"
                  >
                    <Info className="w-4 h-4 text-ink-light" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {/* Line 1: Flight/Drive Details (40%) + Departure Time (30%) + Travel Mode (30%) */}
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
                        ? "Driving home, departing at 14:30..."
                        : "Flight AA123, departing 14:30 from LAX..."}
                    />
                  </div>
                  <div className="col-span-10 md:col-span-3">
                    <div className="flex items-center justify-between mb-1 min-h-[20px]">
                      <label className="block text-xs font-medium text-ink">
                        {tripDay.arrivalPlan?.flightType === 'driving' ? 'Target Departure' : 'Departure Time'}
                      </label>
                    </div>
                    <input
                      type="time"
                      value={tripDay.arrivalPlan?.departureTime || ''}
                      onChange={(e) => updateDayData({
                        arrivalPlan: {
                          ...tripDay.arrivalPlan,
                          departureTime: e.target.value
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
                      <option value="driving">Driving Home</option>
                    </select>
                  </div>
                </div>

                {/* Line 2: Transportation (60%) + Leave Resort By (40%) */}
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
                        {tripDay.arrivalPlan?.flightType === 'driving' ? 'Start Drive By' : 'Leave Resort By'}
                      </label>
                    </div>
                    <div className="px-3 py-2 bg-surface/50 border border-surface-dark/50 rounded-lg text-ink text-sm">
                      {tripDay.arrivalPlan?.departureTime && tripDay.arrivalPlan?.transportMethod
                        ? calculateDepartureTime(tripDay.arrivalPlan.departureTime, tripDay.arrivalPlan.transportMethod, tripDay.arrivalPlan?.flightType || 'domestic')
                        : 'Set details'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel Check-out */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center">
                <Luggage className="w-5 h-5 mr-2 text-purple-500" />
                Hotel Check-out
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Check-out Time</label>
                  <div className="px-3 py-2 bg-surface/50 border border-surface-dark/50 rounded-lg text-ink text-sm">
                    {trip.accommodation?.hotelName
                      ? getHotelCheckOutTime(trip.accommodation.hotelName)
                      : '11:00'
                    } AM
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Luggage Storage</label>
                  <select className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors">
                    <option>Bell Services Hold</option>
                    <option>Car/Room Until Departure</option>
                    <option>Carry With Us</option>
                  </select>
                </div>
              </div>
            </div>


            {/* Today's Schedule */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  Final Day Schedule
                </h3>
                <button
                  onClick={() => setShowAddActivityModal(true)}
                  className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Final Activity
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
                  <span className="text-4xl mb-4 block">🎭</span>
                  <p className="text-ink-light">Add some final activities to cap off your trip!</p>
                  <p className="text-xs text-ink-light mt-2">Click "Add Final Activity" above to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Tips & Essentials */}
      <div className="lg:col-span-4">
        <div className="bg-surface rounded-xl border border-surface-dark/30 p-5 h-full overflow-y-auto">
          <div className="space-y-4">

            {/* Final Day Tips */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <h4 className="font-medium text-ink mb-3">💡 Final Day Tips</h4>
              <div className="text-sm text-ink-light space-y-2">
                <p>• Allow extra time for unexpected delays</p>
                <p>• Download My Disney Experience photos before leaving</p>
                <p>• Pack chargers and essentials in carry-on</p>
                <p>• Keep important documents accessible</p>
                <p>• Do a final room sweep before check-out</p>
                <p>• Take one last family photo at the resort</p>
                {tripDay.arrivalPlan?.transportMethod === 'car' && (
                  <p>• Remember your parking location for departure</p>
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
                      <p>• Online check-out available via My Disney Experience app</p>
                      <p>• Complimentary bell services for luggage storage</p>
                      <p>• Resort transportation to airport/transportation hubs</p>
                      <p>• PhotoPass download at hotel business centers</p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

          </div>
        </div>
      </div>
    </div>

      {/* Add Final Activity Modal */}
      {showAddActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-surface-dark/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-dark/20 bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-green-500/10">
              <div>
                <h3 className="text-xl font-semibold text-ink flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-pink-500" />
                  Final Day Activities
                </h3>
                <p className="text-sm text-ink-light mt-1">
                  Make your last day magical while keeping departure time in mind.
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

                {/* Column 1: Essential Departure Tasks */}
                <div className="rounded-lg p-4">
                  <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                    Essential Departure Tasks
                  </h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        onQuickAdd('travel', undefined, 'Pack Final Items');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🧳</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Pack Final Items
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Double check nothing is left behind
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('travel', undefined, 'Room Final Check');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🔍</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Room Final Check
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Inspect all drawers and corners
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('travel', undefined, 'Hotel Check-out Process');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🏨</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Hotel Check-out
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Complete checkout process
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('travel', undefined, 'Transportation Coordination');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🚌</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Transportation Setup
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Coordinate departure transport
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  </div>
                </div>

                {/* Column 2: Memory Making */}
                <div className="rounded-lg p-4">
                  <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                    Memory Making
                  </h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        onQuickAdd('attraction', undefined, 'Final Photo Opportunities');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📸</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Final Photos
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Capture last magical moments
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('attraction', undefined, 'Memory Recording Session');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🎙️</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Record Memories
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Voice notes about the trip
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('attraction', undefined, 'PhotoPass Download');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">📱</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Download Photos
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Save your PhotoPass pictures
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                    <button
                      onClick={() => {
                        onQuickAdd('shopping', undefined, 'Last-minute Shopping');
                        setShowAddActivityModal(false);
                      }}
                      className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                    >
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🛍️</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                          Final Souvenirs
                        </div>
                        <div className="text-xs text-ink-light mt-1">
                          Last chance for gifts
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  </div>
                </div>

                {/* Column 3: Resort-Specific Farewell (Dynamic) */}
                {(() => {
                  const hotelData = trip.accommodation?.hotelName ?
                    allHotels.find(hotel =>
                      hotel.name.toLowerCase().includes(trip.accommodation!.hotelName!.toLowerCase()) ||
                      trip.accommodation!.hotelName!.toLowerCase().includes(hotel.name.toLowerCase())
                    ) : null;

                  const suggestions = hotelData ? getHotelFarewellSuggestions(hotelData) : [];

                  if (suggestions.length === 0) {
                    // Fallback static activities if no hotel-specific ones
                    return (
                      <div className="rounded-lg p-4">
                        <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Farewell Experiences
                        </h4>
                        <div className="grid md:grid-cols-3 gap-3">
                          <button
                            onClick={() => {
                              onQuickAdd('dining', undefined, 'Final Resort Dining');
                              setShowAddActivityModal(false);
                            }}
                            className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                          >
                            <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🍽️</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                                Final Meal
                              </div>
                              <div className="text-xs text-ink-light mt-1">
                                Last dining experience
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                          <button
                            onClick={() => {
                              onQuickAdd('attraction', undefined, 'One Final Attraction');
                              setShowAddActivityModal(false);
                            }}
                            className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                          >
                            <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🎢</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                                One Last Ride
                              </div>
                              <div className="text-xs text-ink-light mt-1">
                                Final attraction experience
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                          <button
                            onClick={() => {
                              onQuickAdd('attraction', undefined, 'Resort Grounds Final Walk');
                              setShowAddActivityModal(false);
                            }}
                            className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                          >
                            <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">🚶</span>
                            <div className="flex-1">
                              <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                                Resort Farewell Tour
                              </div>
                              <div className="text-xs text-ink-light mt-1">
                                Walk through favorite spots
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="rounded-lg p-4">
                      <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Resort Farewell
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
                                Resort farewell activity
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

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
                      <option value="show">Show</option>
                      <option value="meet_greet">Meet & Greet</option>
                      <option value="tours">Tour</option>
                      <option value="shopping">Shopping</option>
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

      {/* Timing Breakdown Modal */}
      {showTimingBreakdown && (() => {
        const breakdown = getTimingBreakdown(
          tripDay.arrivalPlan?.departureTime || '',
          tripDay.arrivalPlan?.transportMethod || '',
          tripDay.arrivalPlan?.flightType || 'domestic'
        );

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b border-surface-dark/20">
                <h3 className="text-lg font-semibold text-ink flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  Timing Breakdown
                </h3>
                <button
                  onClick={() => setShowTimingBreakdown(false)}
                  className="p-1 rounded-lg hover:bg-surface-dark/10 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-ink-light" />
                </button>
              </div>

              {breakdown && (
                <div className="p-4">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-ink">
                      {breakdown.totalHours}h {breakdown.totalMinutes}m
                    </div>
                    <div className="text-sm text-ink-light">Total time needed before flight</div>
                  </div>

                  <div className="space-y-3">
                    {breakdown.airportBuffer > 0 && (
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                          <div className="font-medium text-blue-900">Airport Security Time</div>
                          <div className="text-sm text-blue-700">
                            {tripDay.arrivalPlan?.flightType === 'international' ? 'TSA + Immigration' : 'TSA Security'}
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-blue-900">
                          {Math.floor(breakdown.airportBuffer / 60)}h {breakdown.airportBuffer % 60}m
                        </div>
                      </div>
                    )}

                    {breakdown.travelTime > 0 && (
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-green-900">Travel Time</div>
                          <div className="text-sm text-green-700">Disney to MCO Airport</div>
                        </div>
                        <div className="text-lg font-semibold text-green-900">
                          {breakdown.travelTime}m
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div>
                        <div className="font-medium text-orange-900">
                          {tripDay.arrivalPlan?.flightType === 'driving' ? 'Preparation Buffer' : 'Transport Buffer'}
                        </div>
                        <div className="text-sm text-orange-700">
                          {tripDay.arrivalPlan?.flightType === 'driving'
                            ? 'Packing, loading & checkout'
                            : 'Wait time & logistics'}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-orange-900">
                        {breakdown.transportBuffer}m
                      </div>
                    </div>
                  </div>

                  {tripDay.arrivalPlan?.flightType === 'international' && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        💡 International flights require extra time for customs and immigration processing
                      </p>
                    </div>
                  )}

                  {tripDay.arrivalPlan?.flightType === 'driving' && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        🚗 Driving home - buffer includes packing time, loading car, and final checkout preparations
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end p-4 border-t border-surface-dark/20">
                <button
                  onClick={() => setShowTimingBreakdown(false)}
                  className="btn-primary"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </DndProvider>
  );
}