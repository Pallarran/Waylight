import { Clock, MapPin, Plus, Waves, Sun, Utensils, ShoppingBag, X, GripVertical } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TripDay, Trip, ActivityCategory } from '../../../types';
import { useTripStore } from '../../../stores';
import { useState } from 'react';
import { getHotelById, allHotels, type HotelData } from '@waylight/shared';

interface RestDayViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function RestDayView({ trip, tripDay, date, onQuickAdd, onOpenDayTypeModal }: RestDayViewProps) {
  const { reorderItems } = useTripStore();
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Helper function to get resort-specific relaxation activities
  const getResortActivities = () => {
    const hotelName = trip.accommodation?.hotelName;
    if (!hotelName) {
      return getDefaultActivities();
    }

    const hotel = allHotels.find(h =>
      h.name.toLowerCase().includes(hotelName.toLowerCase()) ||
      hotelName.toLowerCase().includes(h.name.toLowerCase())
    );

    if (!hotel) {
      return getDefaultActivities();
    }

    const activities = [];

    // Helper function to check if hotel has a feature
    const hasFeature = (feature: string) => {
      return hotel.features && Array.isArray(hotel.features) && hotel.features.includes(feature);
    };

    // Pool & Water Activities
    const poolActivities = [];
    if (hasFeature('Pool')) {
      poolActivities.push({ name: 'Pool Lounging', description: 'Relax by the pool with a good book', emoji: '🏊‍♀️', category: 'Pool & Water' });
      poolActivities.push({ name: 'Pool Games', description: 'Fun water games with family', emoji: '🏐', category: 'Pool & Water' });
    }
    if (hasFeature('Water Features')) {
      poolActivities.push({ name: 'Water Slides', description: 'Enjoy lazy river and slides', emoji: '🌊', category: 'Pool & Water' });
      poolActivities.push({ name: 'Hot Tub Relaxation', description: 'Soak in hot tubs and spas', emoji: '🛁', category: 'Pool & Water' });
    }
    if (hasFeature('Beach')) {
      poolActivities.push({ name: 'Beach Walk', description: 'Peaceful walk along the shore', emoji: '🏖️', category: 'Pool & Water' });
      poolActivities.push({ name: 'Sand Castle Building', description: 'Creative fun for families', emoji: '🏰', category: 'Pool & Water' });
    }

    // Wellness & Relaxation
    const wellnessActivities = [];
    if (hasFeature('Spa')) {
      wellnessActivities.push({ name: 'Spa Treatment', description: 'Professional massage or facial', emoji: '💆‍♀️', category: 'Wellness & Relaxation' });
      wellnessActivities.push({ name: 'Couples Spa', description: 'Relaxation time together', emoji: '💑', category: 'Wellness & Relaxation' });
    }
    if (hasFeature('Fitness Center')) {
      wellnessActivities.push({ name: 'Light Workout', description: 'Gentle exercise to stay active', emoji: '🧘‍♀️', category: 'Wellness & Relaxation' });
      wellnessActivities.push({ name: 'Family Yoga', description: 'Stretching session together', emoji: '🤸‍♀️', category: 'Wellness & Relaxation' });
    }
    // Always available wellness options
    wellnessActivities.push({ name: 'Meditation Time', description: 'Find peace in quiet areas', emoji: '🧘‍♂️', category: 'Wellness & Relaxation' });

    // Dining & Food Experiences
    const diningActivities = [];
    if (hasFeature('Dining')) {
      diningActivities.push({ name: 'Resort Restaurant', description: 'Try signature dishes', emoji: '🍽️', category: 'Dining & Food' });
      diningActivities.push({ name: 'Family Dining', description: 'Relaxed meal together', emoji: '👨‍👩‍👧‍👦', category: 'Dining & Food' });
    }
    if (hasFeature('Quick Service')) {
      diningActivities.push({ name: 'Pool Bar Snacks', description: 'Light bites by the pool', emoji: '🍹', category: 'Dining & Food' });
      diningActivities.push({ name: 'Food Court Exploration', description: 'Try different quick options', emoji: '🥪', category: 'Dining & Food' });
    }
    // Always available options
    diningActivities.push({ name: 'Room Service Treat', description: 'Enjoy breakfast in bed', emoji: '☕', category: 'Dining & Food' });
    diningActivities.push({ name: 'Snack Hunt', description: 'Discover resort snack spots', emoji: '🍿', category: 'Dining & Food' });

    // Resort Exploration & Entertainment
    const explorationActivities = [];
    if (hasFeature('Marina')) {
      explorationActivities.push({ name: 'Marina Stroll', description: 'Walk by the waterfront', emoji: '⛵', category: 'Resort Exploration' });
      explorationActivities.push({ name: 'Boat Watching', description: 'Relax and watch the boats', emoji: '🛥️', category: 'Resort Exploration' });
    }
    if (hasFeature('Entertainment')) {
      explorationActivities.push({ name: 'Resort Entertainment', description: 'Enjoy live shows or music', emoji: '🎭', category: 'Resort Exploration' });
    }
    // Always available exploration
    explorationActivities.push({ name: 'Resort Photo Walk', description: 'Capture beautiful resort spots', emoji: '📸', category: 'Resort Exploration' });
    explorationActivities.push({ name: 'Grounds Tour', description: 'Discover hidden resort gems', emoji: '🚶‍♀️', category: 'Resort Exploration' });
    explorationActivities.push({ name: 'Gift Shop Browse', description: 'Look for vacation souvenirs', emoji: '🛍️', category: 'Resort Exploration' });

    // Group & Family Activities
    const groupActivities = [
      { name: 'Family Game Time', description: 'Board games or card games', emoji: '🎲', category: 'Group Activities' },
      { name: 'Movie Marathon', description: 'Disney movies in your room', emoji: '🍿', category: 'Group Activities' },
      { name: 'Balcony Hangout', description: 'Relax on room balcony together', emoji: '🌅', category: 'Group Activities' },
      { name: 'Story Sharing', description: 'Share vacation memories', emoji: '💭', category: 'Group Activities' },
      { name: 'Planning Session', description: 'Plan upcoming park days', emoji: '📋', category: 'Group Activities' }
    ];

    // Individual Rest & Recharge
    const restActivities = [
      { name: 'Power Nap', description: 'Recharge with a short nap', emoji: '💤', category: 'Rest & Recharge' },
      { name: 'Reading Time', description: 'Quiet time with a book', emoji: '📚', category: 'Rest & Recharge' },
      { name: 'Journaling', description: 'Write about your experiences', emoji: '📝', category: 'Rest & Recharge' },
      { name: 'Music & Chill', description: 'Listen to favorite playlists', emoji: '🎵', category: 'Rest & Recharge' },
      { name: 'Photo Editing', description: 'Organize vacation photos', emoji: '📱', category: 'Rest & Recharge' }
    ];

    return {
      'Pool & Water': poolActivities,
      'Wellness & Relaxation': wellnessActivities,
      'Dining & Food': diningActivities,
      'Resort Exploration': explorationActivities,
      'Group Activities': groupActivities,
      'Rest & Recharge': restActivities
    };
  };

  const getDefaultActivities = () => {
    return {
      'Pool & Water': [
        { name: 'Pool Lounging', description: 'Relax by the pool with a good book', emoji: '🏊‍♀️', category: 'Pool & Water' },
        { name: 'Pool Games', description: 'Fun water games with family', emoji: '🏐', category: 'Pool & Water' }
      ],
      'Wellness & Relaxation': [
        { name: 'Spa Treatment', description: 'Professional massage or facial', emoji: '💆‍♀️', category: 'Wellness & Relaxation' },
        { name: 'Meditation Time', description: 'Find peace in quiet areas', emoji: '🧘‍♂️', category: 'Wellness & Relaxation' }
      ],
      'Dining & Food': [
        { name: 'Leisurely Meal', description: 'No rush dining experience', emoji: '🍽️', category: 'Dining & Food' },
        { name: 'Room Service Treat', description: 'Enjoy breakfast in bed', emoji: '☕', category: 'Dining & Food' }
      ],
      'Resort Exploration': [
        { name: 'Resort Photo Walk', description: 'Capture beautiful resort spots', emoji: '📸', category: 'Resort Exploration' },
        { name: 'Grounds Tour', description: 'Discover hidden resort gems', emoji: '🚶‍♀️', category: 'Resort Exploration' }
      ],
      'Group Activities': [
        { name: 'Family Game Time', description: 'Board games or card games', emoji: '🎲', category: 'Group Activities' },
        { name: 'Movie Marathon', description: 'Disney movies in your room', emoji: '🍿', category: 'Group Activities' }
      ],
      'Rest & Recharge': [
        { name: 'Power Nap', description: 'Recharge with a short nap', emoji: '💤', category: 'Rest & Recharge' },
        { name: 'Reading Time', description: 'Quiet time with a book', emoji: '📚', category: 'Rest & Recharge' }
      ]
    };
  };

  // Drag and Drop Components
  interface DraggableItemProps {
    item: any;
    index: number;
    moveItem: (fromIndex: number, toIndex: number) => void;
  }

  const DraggableItem = ({ item, index, moveItem }: DraggableItemProps) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'ACTIVITY_ITEM',
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'ACTIVITY_ITEM',
      hover: (draggedItem: { index: number }) => {
        if (draggedItem.index !== index) {
          moveItem(draggedItem.index, index);
          draggedItem.index = index;
        }
      },
    });

    return (
      <div
        ref={(node) => drag(drop(node))}
        className={`flex items-center p-3 bg-surface border border-surface-dark/50 rounded-lg cursor-move transition-all ${
          isDragging ? 'opacity-50 scale-95' : 'hover:shadow-sm'
        }`}
      >
        <GripVertical className="w-4 h-4 text-ink-light mr-2 flex-shrink-0" />
        <span className="text-lg mr-3">✨</span>
        <div className="flex-1">
          <div className="font-medium text-ink">{item.name}</div>
          {item.startTime && (
            <div className="text-xs text-ink-light">Around {item.startTime}</div>
          )}
          {item.notes && (
            <div className="text-xs text-ink-light mt-1">{item.notes}</div>
          )}
        </div>
      </div>
    );
  };

  const handleMoveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...(tripDay.items || [])];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);

    reorderItems(trip.id, tripDay.id, newItems);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Panel: Core Rest Day Planning */}
        <div className="md:col-span-8">
          <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-green-500/20 p-6 rounded-lg mb-6 text-center relative -mx-6 -mt-6">
              {onOpenDayTypeModal && (
                <button
                  onClick={onOpenDayTypeModal}
                  className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
                >
                  <span className="text-base">🏖️</span>
                  <span>Change Day Type</span>
                </button>
              )}
              <div className="mb-4">
                <span className="text-6xl">🏖️</span>
              </div>
              <h2 className="text-2xl font-semibold text-ink mb-2">Rest Day - Take It Easy!</h2>
              <p className="text-ink-light max-w-2xl mx-auto">
                Today is all about relaxation and recharging. No rush, no pressure - just enjoy the moment and listen to your body.
              </p>
            </div>

            <div className="space-y-6">
            {/* Resort Activities */}
            <div className="bg-surface-dark/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-ink mb-4 flex items-center">
                <Waves className="w-5 h-5 mr-2 text-teal-500" />
                Resort Activities & Relaxation
              </h3>
              <p className="text-sm text-ink-light mb-4">
                Perfect activities for recharging between park days. These suggestions are tailored to your resort's amenities.
              </p>
              <div className="text-center">
                <button
                  onClick={() => setShowActivityModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Browse Rest Activities
                </button>
              </div>
            </div>

            {/* Today's Flexible Schedule */}
            <div className="bg-surface-dark/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-ink flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  Today's Flexible Schedule
                </h3>
                <button
                  onClick={() => setShowActivityModal(true)}
                  className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Activity
                </button>
              </div>
            
            {tripDay.items && tripDay.items.length > 0 ? (
              <div className="space-y-3">
                {tripDay.items.map((item, index) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    index={index}
                    moveItem={handleMoveItem}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">🛋️</span>
                <p className="text-ink-light">No plans yet - and that's perfectly okay!</p>
                <p className="text-xs text-ink-light/70 mt-2">Add activities above only if you feel like it</p>
              </div>
            )}
            </div>
          </div>
        </div>

      {/* Right Panel: Tips & Quick Actions */}
      <div className="md:col-span-4">
        <div className="bg-surface rounded-xl border border-surface-dark/30 p-5 h-full overflow-y-auto">
          <div className="space-y-4">

            {/* Rest Day Philosophy */}
            <div className="bg-teal-500/10 rounded-lg p-4 border border-teal-500/20">
              <h4 className="font-medium text-ink mb-3">🏖️ Rest Day Philosophy </h4>
              <div className="text-sm text-ink-light space-y-2">
                <p>• Rest days help you fully enjoy your vacation</p>
                <p>• Recharge for upcoming park days</p>
                <p>• Discover your resort's hidden gems</p>
                <p>• Quality time with family and friends</p>
                <p>• No pressure, no schedule - just relax!</p>
              </div>
            </div>

            {/* Group Recharge Tips */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <h4 className="font-medium text-ink mb-3">👨‍👩‍👧‍👦 Group Recharge Activities</h4>
              <div className="text-sm text-ink-light space-y-2">
                <p>• Pool games and water activities</p>
                <p>• Casual resort dining without reservations</p>
                <p>• Explore resort walking trails together</p>
                <p>• Board games or card games by the pool</p>
                <p>• Family movie time in your room</p>
              </div>
            </div>

            {/* Resort Quick Info */}
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <h4 className="font-medium text-ink mb-3">🏨 Resort Quick Info</h4>
              <div className="text-sm text-ink-light space-y-2">
                {trip.accommodation?.hotelName && (
                  <p>• Resort: {trip.accommodation.hotelName}</p>
                )}
                <p>• Pool hours typically 7:00 AM - 11:00 PM</p>
                <p>• Food courts open early to late</p>
                <p>• Transportation runs every 15-20 minutes</p>
                <p>• Resort activities vary by location</p>
              </div>
            </div>

            {/* Weather-Appropriate Activities */}
            <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
              <h4 className="font-medium text-ink mb-3">🌤️ Weather Backup Plans</h4>
              <div className="text-sm text-ink-light space-y-2">
                <p><strong>Sunny Day:</strong> Pool, outdoor exploration</p>
                <p><strong>Rainy Day:</strong> Resort tours, indoor dining</p>
                <p><strong>Hot Day:</strong> Air-conditioned spaces, pools</p>
                <p><strong>Cooler Day:</strong> Walking trails, hot tubs</p>
              </div>
            </div>

          </div>
        </div>
      </div>
      </div>

      {/* Resort Activity Modal */}
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
                      <div className="grid md:grid-cols-2 gap-3">
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
      </div>
    </DndProvider>
  );
}