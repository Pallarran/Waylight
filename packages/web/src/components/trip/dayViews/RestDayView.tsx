import { Clock, Plus, Waves, X, GripVertical, Edit, Save, XCircle, MapPin, Car, Utensils, Sparkles } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TripDay, Trip, ActivityCategory } from '../../../types';

interface ResortActivity {
  name: string;
  description: string;
  emoji: string;
  category: string;
}

interface ScheduleItem {
  id: string;
  name: string;
  startTime?: string;
  notes?: string;
}
import { useTripStore } from '../../../stores';
import { useState } from 'react';
import { allHotels, getResortDiningByResortId } from '@waylight/shared';
import WeatherHeader from '../../weather/WeatherHeader';

interface RestDayViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function RestDayView({ trip, tripDay, onQuickAdd, onOpenDayTypeModal }: RestDayViewProps) {
  const { reorderItems, updateItem, deleteItem } = useTripStore();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showCustomActivityForm, setShowCustomActivityForm] = useState(false);
  const [customActivity, setCustomActivity] = useState({ name: '', startTime: '', type: 'attraction' as ActivityCategory });

  // Helper function to get resort-specific relaxation activities
  const getResortActivities = () => {
    const hotelName = trip.accommodation?.hotelName;
    if (!hotelName) {
      return getDefaultActivities();
    }

    const hotel = allHotels.find((h: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      h.name.toLowerCase().includes(hotelName.toLowerCase()) ||
      hotelName.toLowerCase().includes(h.name.toLowerCase())
    );

    if (!hotel) {
      return getDefaultActivities();
    }


    // Helper functions to check if hotel has specific amenities
    const hasPoolFeature = (feature: string) => {
      return hotel.features?.amenities?.pool?.[feature] === true;
    };
    const hasRecreationFeature = (feature: string) => {
      return hotel.features?.amenities?.recreation?.[feature] === true;
    };

    // Pool & Water Activities
    const poolActivities = [];
    if (hasPoolFeature('basic')) {
      poolActivities.push({ name: 'Pool Lounging', description: 'Relax by the pool with a good book', emoji: '🏊‍♀️', category: 'Pool & Water Activities' });
      poolActivities.push({ name: 'Pool Games', description: 'Fun water games with family', emoji: '🏐', category: 'Pool & Water Activities' });
    }
    if (hasPoolFeature('pool_bar')) {
      poolActivities.push({ name: 'Poolside Dining', description: 'Grab snacks and drinks by the pool', emoji: '🍹', category: 'Pool & Water Activities' });
    }
    if (hasPoolFeature('water_slides')) {
      poolActivities.push({ name: 'Water Slides', description: 'Enjoy the resort water slides', emoji: '🌊', category: 'Pool & Water Activities' });
    }
    if (hasPoolFeature('lazy_river')) {
      poolActivities.push({ name: 'Lazy River Float', description: 'Relax floating down the lazy river', emoji: '🏊', category: 'Pool & Water Activities' });
    }
    if (hasPoolFeature('hot_tub')) {
      poolActivities.push({ name: 'Hot Tub Relaxation', description: 'Soak in the resort hot tubs', emoji: '🛁', category: 'Pool & Water Activities' });
    }
    if (hasRecreationFeature('beach')) {
      poolActivities.push({ name: 'Beach Walk', description: 'Peaceful walk along the shore', emoji: '🏖️', category: 'Pool & Water Activities' });
      poolActivities.push({ name: 'Sand Castle Building', description: 'Creative fun for families', emoji: '🏰', category: 'Pool & Water Activities' });
      poolActivities.push({ name: 'Beach Chair Relaxation', description: 'Lounge on the beach', emoji: '🏝️', category: 'Pool & Water Activities' });
    }

    // Wellness & Relaxation
    const wellnessActivities = [];
    const hasSpaFeature = (feature: string) => {
      return hotel.features?.amenities?.spa?.[feature] === true;
    };

    if (hasSpaFeature('full_service')) {
      wellnessActivities.push({ name: 'Spa Treatment', description: 'Professional massage or facial', emoji: '💆‍♀️', category: 'Rest & Recharge' });
    }
    if (hasSpaFeature('couples_treatments')) {
      wellnessActivities.push({ name: 'Couples Spa', description: 'Relaxation time together', emoji: '💑', category: 'Rest & Recharge' });
      wellnessActivities.push({ name: 'Spa Day Package', description: 'Full day of pampering', emoji: '✨', category: 'Rest & Recharge' });
    }
    if (hasSpaFeature('fitness_center')) {
      wellnessActivities.push({ name: 'Light Workout', description: 'Gentle exercise to stay active', emoji: '🧘‍♀️', category: 'Rest & Recharge' });
      wellnessActivities.push({ name: 'Family Yoga', description: 'Stretching session together', emoji: '🤸‍♀️', category: 'Rest & Recharge' });
      wellnessActivities.push({ name: 'Morning Jog', description: 'Start the day with light exercise', emoji: '🏃‍♀️', category: 'Rest & Recharge' });
    }
    if (hasRecreationFeature('golf')) {
      wellnessActivities.push({ name: 'Golf Round', description: 'Play a round at the resort course', emoji: '⛳', category: 'Resort Exploration' });
      wellnessActivities.push({ name: 'Golf Lessons', description: 'Learn or improve your swing', emoji: '🏌️‍♂️', category: 'Resort Exploration' });
      wellnessActivities.push({ name: 'Mini Golf', description: 'Fun family mini golf', emoji: '🏌️', category: 'Social & Group' });
    }
    // Always available wellness options
    wellnessActivities.push({ name: 'Meditation Time', description: 'Find peace in quiet areas', emoji: '🧘‍♂️', category: 'Rest & Recharge' });

    // Dining & Food Experiences
    const diningActivities = [];
    const hasDiningFeature = (feature: string) => {
      return hotel.features?.amenities?.dining?.[feature] === true;
    };

    if (hasDiningFeature('table_service')) {
      diningActivities.push({ name: 'Resort Restaurant', description: 'Try signature dishes', emoji: '🍽️', category: 'Dining & Food' });
      diningActivities.push({ name: 'Family Dining', description: 'Relaxed meal together', emoji: '👨‍👩‍👧‍👦', category: 'Dining & Food' });
    }
    if (hasDiningFeature('signature_dining')) {
      diningActivities.push({ name: 'Fine Dining Experience', description: 'Upscale restaurant experience', emoji: '🥂', category: 'Dining & Food' });
    }
    if (hasDiningFeature('character_dining')) {
      diningActivities.push({ name: 'Character Meal', description: 'Dine with Disney characters', emoji: '🐭', category: 'Dining & Food' });
    }
    if (hasDiningFeature('quick_service')) {
      diningActivities.push({ name: 'Food Court Exploration', description: 'Try different quick options', emoji: '🥪', category: 'Dining & Food' });
      diningActivities.push({ name: 'Grab & Go Breakfast', description: 'Quick breakfast on the move', emoji: '🥐', category: 'Dining & Food' });
    }
    if (hasDiningFeature('pool_bar')) {
      diningActivities.push({ name: 'Pool Bar Snacks', description: 'Light bites by the pool', emoji: '🍹', category: 'Dining & Food' });
    }
    if (hasDiningFeature('room_service')) {
      diningActivities.push({ name: 'Room Service Treat', description: 'Enjoy breakfast in bed', emoji: '☕', category: 'Dining & Food' });
    }
    // Always available options
    diningActivities.push({ name: 'Snack Hunt', description: 'Discover resort snack spots', emoji: '🍿', category: 'Dining & Food' });
    diningActivities.push({ name: 'Picnic Planning', description: 'Prepare food for outdoor enjoyment', emoji: '🧺', category: 'Dining & Food' });

    // Resort Exploration & Entertainment
    const explorationActivities = [];
    if (hasRecreationFeature('marina')) {
      explorationActivities.push({ name: 'Marina Stroll', description: 'Walk by the waterfront', emoji: '⛵', category: 'Resort Exploration' });
      explorationActivities.push({ name: 'Boat Watching', description: 'Relax and watch the boats', emoji: '🛥️', category: 'Resort Exploration' });
      explorationActivities.push({ name: 'Watercraft Rental', description: 'Rent boats or water equipment', emoji: '🚤', category: 'Resort Exploration' });
    }
    const hasEntertainmentFeature = (feature: string) => {
      return hotel.features?.amenities?.entertainment?.[feature] === true;
    };
    if (hasEntertainmentFeature('live_music')) {
      explorationActivities.push({ name: 'Resort Entertainment', description: 'Enjoy live shows or music', emoji: '🎭', category: 'Social & Group' });
      explorationActivities.push({ name: 'Live Music Lounge', description: 'Evening entertainment', emoji: '🎵', category: 'Social & Group' });
    }
    // Always available exploration
    explorationActivities.push({ name: 'Resort Photo Walk', description: 'Capture beautiful resort spots', emoji: '📸', category: 'Resort Exploration' });
    explorationActivities.push({ name: 'Grounds Tour', description: 'Discover hidden resort gems', emoji: '🚶‍♀️', category: 'Resort Exploration' });
    explorationActivities.push({ name: 'Gift Shop Browse', description: 'Look for vacation souvenirs', emoji: '🛍️', category: 'Resort Exploration' });
    explorationActivities.push({ name: 'Architecture Appreciation', description: 'Admire resort design and theming', emoji: '🏰', category: 'Resort Exploration' });
    explorationActivities.push({ name: 'Sunset Viewing', description: 'Find the best sunset spots', emoji: '🌅', category: 'Resort Exploration' });

    // Group & Family Activities
    const groupActivities = [
      { name: 'Family Game Time', description: 'Board games or card games', emoji: '🎲', category: 'Social & Group' },
      { name: 'Movie Marathon', description: 'Disney movies in your room', emoji: '🍿', category: 'Social & Group' },
      { name: 'Balcony Hangout', description: 'Relax on room balcony together', emoji: '🌅', category: 'Social & Group' },
      { name: 'Story Sharing', description: 'Share vacation memories', emoji: '💭', category: 'Social & Group' },
      { name: 'Planning Session', description: 'Plan upcoming park days', emoji: '📋', category: 'Social & Group' },
      { name: 'Trivia Night', description: 'Disney trivia competition', emoji: '🧠', category: 'Social & Group' },
      { name: 'Charades', description: 'Act out Disney characters', emoji: '🎭', category: 'Social & Group' }
    ];

    // Individual Rest & Recharge
    const restActivities = [
      { name: 'Power Nap', description: 'Recharge with a short nap', emoji: '💤', category: 'Rest & Recharge' },
      { name: 'Reading Time', description: 'Quiet time with a book', emoji: '📚', category: 'Rest & Recharge' },
      { name: 'Journaling', description: 'Write about your experiences', emoji: '📝', category: 'Rest & Recharge' },
      { name: 'Music & Chill', description: 'Listen to favorite playlists', emoji: '🎵', category: 'Rest & Recharge' },
      { name: 'Photo Editing', description: 'Organize vacation photos', emoji: '📱', category: 'Rest & Recharge' }
    ];

    // Collect all activities and organize by their assigned categories
    const allActivities = [
      ...poolActivities,
      ...wellnessActivities,
      ...diningActivities,
      ...explorationActivities,
      ...groupActivities,
      ...restActivities
    ];

    // Group activities by their category
    const categorizedActivities: Record<string, ResortActivity[]> = {};
    allActivities.forEach(activity => {
      if (!categorizedActivities[activity.category]) {
        categorizedActivities[activity.category] = [];
      }
      categorizedActivities[activity.category]?.push(activity);
    });

    // Return activities organized by the 5 main categories with emojis
    return {
      '🏊‍♀️ Pool & Water Activities': categorizedActivities['Pool & Water Activities'] || [],
      '🍽️ Dining & Food': categorizedActivities['Dining & Food'] || [],
      '🚶‍♀️ Resort Exploration': categorizedActivities['Resort Exploration'] || [],
      '👥 Social & Group': categorizedActivities['Social & Group'] || [],
      '😴 Rest & Recharge': categorizedActivities['Rest & Recharge'] || []
    };
  };

  const getDefaultActivities = () => {
    return {
      '🏊‍♀️ Pool & Water Activities': [
        { name: 'Pool Lounging', description: 'Relax by the pool with a good book', emoji: '🏊‍♀️', category: 'Pool & Water Activities' },
        { name: 'Pool Games', description: 'Fun water games with family', emoji: '🏐', category: 'Pool & Water Activities' }
      ],
      '🍽️ Dining & Food': [
        { name: 'Leisurely Meal', description: 'No rush dining experience', emoji: '🍽️', category: 'Dining & Food' },
        { name: 'Room Service Treat', description: 'Enjoy breakfast in bed', emoji: '☕', category: 'Dining & Food' }
      ],
      '🚶‍♀️ Resort Exploration': [
        { name: 'Resort Photo Walk', description: 'Capture beautiful resort spots', emoji: '📸', category: 'Resort Exploration' },
        { name: 'Grounds Tour', description: 'Discover hidden resort gems', emoji: '🚶‍♀️', category: 'Resort Exploration' }
      ],
      '👥 Social & Group': [
        { name: 'Family Game Time', description: 'Board games or card games', emoji: '🎲', category: 'Social & Group' },
        { name: 'Movie Marathon', description: 'Disney movies in your room', emoji: '🍿', category: 'Social & Group' }
      ],
      '😴 Rest & Recharge': [
        { name: 'Power Nap', description: 'Recharge with a short nap', emoji: '💤', category: 'Rest & Recharge' },
        { name: 'Reading Time', description: 'Quiet time with a book', emoji: '📚', category: 'Rest & Recharge' },
        { name: 'Spa Treatment', description: 'Professional massage or facial', emoji: '💆‍♀️', category: 'Rest & Recharge' },
        { name: 'Meditation Time', description: 'Find peace in quiet areas', emoji: '🧘‍♂️', category: 'Rest & Recharge' }
      ]
    };
  };

  // Helper function to get resort summary for display
  const getResortSummary = () => {
    const hotelName = trip.accommodation?.hotelName;
    if (!hotelName) {
      return null;
    }

    const hotel = allHotels.find((h: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      h.name.toLowerCase().includes(hotelName.toLowerCase()) ||
      hotelName.toLowerCase().includes(h.name.toLowerCase())
    );

    if (!hotel) {
      return null;
    }

    const summary = [];

    // Helper functions for granular amenity checking
    const hasPoolFeature = (feature: string) => {
      return hotel.features?.amenities?.pool?.[feature] === true;
    };
    const hasSpaFeature = (feature: string) => {
      return hotel.features?.amenities?.spa?.[feature] === true;
    };
    const hasDiningFeature = (feature: string) => {
      return hotel.features?.amenities?.dining?.[feature] === true;
    };
    const hasRecreationFeature = (feature: string) => {
      return hotel.features?.amenities?.recreation?.[feature] === true;
    };

    // Pool & Recreation
    if (hasPoolFeature('basic')) {
      const poolDetails = ['Pool: 07:00 - 23:00'];

      if (hasPoolFeature('water_slides')) poolDetails.push('Water slides available');
      if (hasPoolFeature('lazy_river')) poolDetails.push('Lazy river available');
      if (hasPoolFeature('hot_tub')) poolDetails.push('Hot tub available');
      if (hasPoolFeature('pool_bar')) poolDetails.push('Pool bar service');
      if (hasRecreationFeature('beach')) poolDetails.push('Beach access available');

      if (poolDetails.length === 1) poolDetails.push('Pool area available');

      summary.push({
        icon: Waves,
        title: 'Pool & Recreation',
        details: poolDetails
      });
    }

    // Dining Options
    if (hasDiningFeature('table_service') || hasDiningFeature('quick_service')) {
      const diningDetails = [];

      if (hasDiningFeature('table_service')) diningDetails.push('Resort restaurant available');
      if (hasDiningFeature('signature_dining')) diningDetails.push('Signature dining available');
      if (hasDiningFeature('character_dining')) diningDetails.push('Character dining available');
      if (hasDiningFeature('quick_service')) diningDetails.push('Quick service available');
      if (hasDiningFeature('pool_bar')) diningDetails.push('Pool bar service');
      if (hasDiningFeature('room_service')) diningDetails.push('Room service available');

      if (diningDetails.length === 0) diningDetails.push('Dining options available');

      summary.push({
        icon: Utensils,
        title: 'Dining Options',
        details: diningDetails
      });
    }

    // Wellness & Amenities
    const wellnessDetails = [];
    if (hasSpaFeature('full_service')) wellnessDetails.push('Spa services (advance booking)');
    if (hasSpaFeature('couples_treatments')) wellnessDetails.push('Couples treatments available');
    if (hasSpaFeature('fitness_center')) wellnessDetails.push('Fitness center: 05:00 - 22:00');
    if (hasSpaFeature('sauna')) wellnessDetails.push('Sauna available');
    if (hasRecreationFeature('golf')) wellnessDetails.push('Golf course access');
    if (wellnessDetails.length === 0) wellnessDetails.push('Wellness amenities available');

    summary.push({
      icon: Sparkles,
      title: 'Wellness & Amenities',
      details: wellnessDetails
    });

    return summary;
  };

  // Enhanced DraggableScheduleItem component matching check-in/out pattern
  const DraggableScheduleItem = ({ item, index }: { item: ScheduleItem; index: number }) => {
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
          handleMoveItem(draggedItem.index, index);
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

    const handleDelete = async () => {
      if (confirm('Are you sure you want to delete this activity?')) {
        try {
          await deleteItem(trip.id, tripDay.id, item.id);
        } catch (error) {
          console.error('Failed to delete item:', error);
        }
      }
    };

    return (
      <div
        ref={(node) => {
          drag(drop(node));
        }}
        className={`group relative bg-surface border transition-all duration-200 rounded-lg ${
          isDragging
            ? 'opacity-50 scale-95 border-teal-500/50 shadow-lg'
            : isEditingThis
            ? 'border-teal-500 shadow-sm'
            : 'border-surface-dark/30 hover:border-surface-dark/50 hover:shadow-sm'
        }`}
      >
        {isEditingThis ? (
          // Editing mode
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Activity Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-dark/20 border border-surface-dark/30 rounded-lg text-ink text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Start Time (Optional)</label>
                <input
                  type="time"
                  value={editData.startTime}
                  onChange={(e) => setEditData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-dark/20 border border-surface-dark/30 rounded-lg text-ink text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Notes (Optional)</label>
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 bg-surface-dark/20 border border-surface-dark/30 rounded-lg text-ink text-sm focus:outline-none focus:border-teal-500 resize-none"
                rows={2}
                placeholder="Any special notes or preferences for this activity..."
              />
            </div>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center px-3 py-2 text-sm text-ink-light hover:text-ink transition-colors"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editData.name.trim()}
                className="flex items-center px-3 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white text-sm rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </button>
            </div>
          </div>
        ) : (
          // Display mode
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex items-center mr-3">
                <GripVertical className="w-4 h-4 text-ink-light cursor-move" />
                <span className="text-lg ml-2">🏖️</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-ink truncate">{item.name}</div>
                  {!editingItem && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={handleEdit}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-dark/20 transition-all"
                      >
                        <Edit className="w-4 h-4 text-ink-light hover:text-teal-500" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 transition-all"
                      >
                        <XCircle className="w-4 h-4 text-ink-light hover:text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
                {item.startTime && (
                  <div className="text-xs text-teal-600 font-medium mt-1">
                    Around {item.startTime}
                  </div>
                )}
                {item.notes && (
                  <div className="text-xs text-ink-light mt-1 line-clamp-2">
                    {item.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleMoveItem = (fromIndex: number, toIndex: number) => {
    // Call reorderItems with the correct parameters (indices, not the full array)
    reorderItems(trip.id, tripDay.id, fromIndex, toIndex);
  };

  // Get hotel-specific information
  const getHotelInfo = () => {
    const hotelName = trip.accommodation?.hotelName;
    if (!hotelName) return null;

    return allHotels.find((h: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
      h.name.toLowerCase().includes(hotelName.toLowerCase()) ||
      hotelName.toLowerCase().includes(h.name.toLowerCase())
    );
  };

  const hotelInfo = getHotelInfo();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Panel: Core Rest Day Planning */}
        <div className="lg:col-span-8">
          <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center mb-6 py-4 px-4 border-b border-surface-dark/20 relative bg-gradient-to-r from-sea-light/60 to-sea/60 rounded-lg min-h-[120px]">
              {onOpenDayTypeModal && (
                <button
                  onClick={onOpenDayTypeModal}
                  className="absolute top-3 right-3 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
                >
                  <span className="text-base">🏖️</span>
                  <span>Change Day Type</span>
                </button>
              )}
              <div className="flex items-center justify-center w-12 h-12 mr-4">
                <span className="text-2xl">🏖️</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink">Rest Day - Take It Easy</h2>
                <p className="text-ink-light">Relax and recharge at your own pace</p>
                <div className="mt-2">
                  <WeatherHeader date={date} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Your Resort Today */}
              {(() => {
                const resortSummary = getResortSummary();
                if (!resortSummary) return null;

                const hotelName = trip.accommodation?.hotelName;
                const displayName = hotelName
                  ? hotelName.replace(/^Disney's\s+/i, '').replace(/^Universal's\s+/i, '').replace(/^Universal\s+/i, '')
                  : 'Your Resort';

                return (
                  <div className="bg-gradient-to-r from-sea/10 to-sea-light/10 rounded-lg p-4 border border-sea/20">
                    <h3 className="text-base font-medium text-ink mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-sea" />
                      Today at the {displayName}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-ink-light">
                      {resortSummary.slice(0, 3).map((section, index) => {
                        const IconComponent = section.icon;
                        const mainDetail = section.details[0] || `${section.title} available`;
                        return (
                          <div key={index} className="flex items-center">
                            <IconComponent className="w-3 h-3 mr-1 text-sea" />
                            <span>{mainDetail.replace('• ', '')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Today's Flexible Schedule */}
              <div className="bg-surface-dark/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-ink flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-500" />
                    Today's Flexible Schedule
                  </h3>
                  <button
                    onClick={() => setShowActivityModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
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
                    <span className="text-5xl mb-4 block">🛋️</span>
                    <p className="text-ink-light text-lg">No plans yet - and that's perfectly okay!</p>
                    <p className="text-ink-light/70 mt-2">Add activities above only if you feel like it</p>
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
            {/* Rest Philosophy - Now at top */}
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
              <h4 className="font-semibold text-ink mb-3">🏖️ Rest Day Philosophy</h4>
              <div className="text-sm text-ink-light space-y-1">
                <p>• Listen to your body's needs</p>
                <p>• Quality over quantity today</p>
                <p>• Recharge for future adventures</p>
                <p>• Enjoy the resort you're paying for!</p>
                <p>• No guilt about doing "nothing"</p>
              </div>
            </div>

            {/* Enhanced Resort Amenities */}
            {hotelInfo && (() => {
              const diningOptions = hotelInfo.diningOptions ? getResortDiningByResortId(hotelInfo.id) : [];

              return (
                <div className="bg-surface-dark/10 rounded-xl p-4">
                  <h4 className="font-semibold text-ink mb-3 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                    Resort Amenities
                  </h4>
                  <div className="space-y-4">

                    {/* Dining Options */}
                    {diningOptions.length > 0 && (
                      <div>
                        <div className="flex items-center mb-2">
                          <Utensils className="w-3 h-3 mr-1 text-orange-500" />
                          <span className="font-medium text-ink text-sm">Dining Options</span>
                        </div>
                        <div className="text-xs text-ink-light space-y-1 ml-4">
                          {(() => {
                            // Sort restaurants by type: table service first, then quick service, then lounge, then others
                            const sortedDining = [...diningOptions].sort((a, b) => {
                              const typeOrder: Record<string, number> = { 'table_service': 1, 'quick_service': 2, 'lounge': 3 };
                              const aOrder = typeOrder[a.type as string] || 4;
                              const bOrder = typeOrder[b.type as string] || 4;
                              return aOrder - bOrder;
                            });

                            return sortedDining.map((restaurant, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span>{restaurant.name}</span>
                                <span className="text-teal-600">
                                  {restaurant.type === 'table_service' ? 'Table Service' :
                                   restaurant.type === 'quick_service' ? 'Quick Service' :
                                   restaurant.type === 'lounge' ? 'Lounge' : restaurant.serviceType}
                                </span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Pool & Recreation */}
                    {hotelInfo.features?.amenities?.pool?.basic && (
                      <div>
                        <div className="flex items-center mb-2">
                          <Waves className="w-3 h-3 mr-1 text-blue-500" />
                          <span className="font-medium text-ink text-sm">Pool & Recreation</span>
                        </div>
                        <div className="text-xs text-ink-light space-y-1 ml-4">
                          <p>• Pool: 07:00 - 23:00</p>
                          {hotelInfo.features.amenities.pool.water_slides && <p>• Water slides available</p>}
                          {hotelInfo.features.amenities.pool.lazy_river && <p>• Lazy river available</p>}
                          {hotelInfo.features.amenities.pool.hot_tub && <p>• Hot tubs available</p>}
                          {hotelInfo.features.amenities.pool.pool_bar && <p>• Poolside bar service</p>}
                          {hotelInfo.features?.amenities?.recreation?.beach && <p>• Beach access available</p>}
                          {hotelInfo.features?.amenities?.recreation?.golf && <p>• Golf course on property</p>}
                        </div>
                      </div>
                    )}

                    {/* Spa & Wellness */}
                    {hotelInfo.features?.amenities?.spa?.full_service && (
                      <div>
                        <div className="flex items-center mb-2">
                          <Sparkles className="w-3 h-3 mr-1 text-purple-500" />
                          <span className="font-medium text-ink text-sm">Spa & Wellness</span>
                        </div>
                        <div className="text-xs text-ink-light space-y-1 ml-4">
                          <p>• Full-service spa (book in advance)</p>
                          {hotelInfo.features.amenities.spa.couples_treatments && <p>• Couples treatments available</p>}
                          {hotelInfo.features.amenities.spa.fitness_center && <p>• Fitness center access</p>}
                          {hotelInfo.features.amenities.spa.sauna && <p>• Sauna facilities</p>}
                          {hotelInfo.features.amenities.spa.steam_room && <p>• Steam room available</p>}
                        </div>
                      </div>
                    )}

                    {/* Transportation */}
                    <div>
                      <div className="flex items-center mb-2">
                        <Car className="w-3 h-3 mr-1 text-green-500" />
                        <span className="font-medium text-ink text-sm">Transportation</span>
                      </div>
                      <div className="text-xs text-ink-light space-y-1 ml-4">
                        {hotelInfo.features?.transportation?.monorail && <p>• Monorail to parks</p>}
                        {hotelInfo.features?.transportation?.boat && <p>• Boat transportation</p>}
                        {hotelInfo.features?.transportation?.skyliner && <p>• Disney Skyliner</p>}
                        {hotelInfo.features?.transportation?.bus && <p>• Complimentary bus service</p>}
                        {hotelInfo.features?.transportation?.walking && <p>• Walking distance to parks</p>}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </div>
    </div>

      {/* Enhanced Resort Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-surface-dark/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-dark/20 bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-green-500/10">
              <div>
                <h3 className="text-xl font-semibold text-ink flex items-center">
                  <Waves className="w-5 h-5 mr-2 text-teal-500" />
                  Resort Activities & Relaxation
                </h3>
                <p className="text-sm text-ink-light mt-1">
                  Activities tailored to {trip.accommodation?.hotelName || 'your resort'}
                </p>
              </div>
              <button
                onClick={() => setShowActivityModal(false)}
                className="p-2 rounded-lg hover:bg-surface-dark/20 transition-colors"
              >
                <X className="w-5 h-5 text-ink-light" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">



                {Object.entries(getResortActivities()).map(([categoryName, activities]) => {
                  if (activities.length === 0) return null;

                  return (
                    <div key={categoryName}>
                      <h4 className="text-lg font-medium text-ink mb-3 flex items-center">
                        <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                        {categoryName}
                      </h4>
                      <div className="grid md:grid-cols-3 gap-3">
                        {activities.map((activity, index) => (
                          <button
                            key={index}
                            onClick={async () => {
                              await onQuickAdd('attraction', undefined, activity.name);
                              setShowActivityModal(false);
                            }}
                            className="flex items-start p-4 bg-surface-dark/10 hover:bg-surface-dark/20 rounded-lg border border-surface-dark/20 transition-colors text-left group"
                          >
                            <span className="text-2xl mr-3 group-hover:scale-110 transition-transform">
                              {activity.emoji}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-ink group-hover:text-teal-600 transition-colors">
                                {activity.name}
                              </div>
                              <div className="text-xs text-ink-light mt-1">
                                {activity.description}
                              </div>
                            </div>
                            <Plus className="w-4 h-4 text-ink-light group-hover:text-teal-500 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

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
                          setShowActivityModal(false);
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
                onClick={() => setShowActivityModal(false)}
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
} // Updated modal functionality