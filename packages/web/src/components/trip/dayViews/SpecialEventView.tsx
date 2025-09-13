import { Calendar, Clock, Star, Camera, Utensils, Shirt, MapPin, Ticket } from 'lucide-react';
import { TripDay, Trip, ActivityCategory } from '../../../types';
import { useTripStore } from '../../../stores';

interface SpecialEventViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function SpecialEventView({ trip, tripDay, date, onQuickAdd, onOpenDayTypeModal }: SpecialEventViewProps) {
  const { updateDay } = useTripStore();

  // Find the main special event from the day's items
  const mainEvent = tripDay.items?.find(item => 
    item.type === 'special_events' || 
    item.eventType ||
    item.name.toLowerCase().includes('party') ||
    item.name.toLowerCase().includes('tour')
  ) || { name: 'Special Event', startTime: '19:00' };

  const updateDayData = async (updates: Partial<TripDay>) => {
    try {
      await updateDay(trip.id, tripDay.id, updates);
    } catch (error) {
      console.error('Failed to update day:', error);
    }
  };

  return (
    <div className="lg:col-span-12 max-w-6xl mx-auto">
      <div className="bg-surface rounded-xl border border-surface-dark/30 overflow-hidden">
        {/* Hero Section - Event Header */}
        <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 p-8 text-center border-b border-surface-dark/20 relative">
          {onOpenDayTypeModal && (
            <button
              onClick={onOpenDayTypeModal}
              className="absolute top-4 right-4 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
            >
              <span className="text-base">🎉</span>
              <span>Change Day Type</span>
            </button>
          )}
          <div className="mb-4">
            <span className="text-6xl">🎉</span>
          </div>
          <h2 className="text-3xl font-bold text-ink mb-2">{mainEvent.name}</h2>
          <p className="text-ink-light text-lg">
            {mainEvent.startTime && `Event starts at ${mainEvent.startTime}`}
          </p>
          <div className="mt-4 inline-flex items-center bg-surface/50 backdrop-blur-sm px-4 py-2 rounded-full border border-surface-dark/30">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            <span className="text-sm text-ink">Special Event Day</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Event Essentials */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 mb-6 border border-purple-500/20">
            <h3 className="text-xl font-semibold text-ink mb-4 flex items-center">
              <Ticket className="w-5 h-5 mr-2 text-purple-500" />
              Event Essentials
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-surface/50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  <span className="font-medium text-ink">Event Time</span>
                </div>
                <input
                  type="time"
                  value={mainEvent.startTime || ''}
                  className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                />
              </div>
              <div className="bg-surface/50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Shirt className="w-4 h-4 mr-2 text-green-500" />
                  <span className="font-medium text-ink">Dress Code</span>
                </div>
                <input
                  type="text"
                  placeholder="Costume encouraged, etc."
                  className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                />
              </div>
              <div className="bg-surface/50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <MapPin className="w-4 h-4 mr-2 text-red-500" />
                  <span className="font-medium text-ink">Entry Point</span>
                </div>
                <input
                  type="text"
                  placeholder="Main entrance, special gate..."
                  className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                />
              </div>
            </div>
          </div>

          {/* Timeline Tabs */}
          <div className="mb-6">
            <div className="border-b border-surface-dark/30">
              <nav className="-mb-px flex space-x-8">
                <button className="border-b-2 border-purple-500 py-2 px-1 text-sm font-medium text-purple-500">
                  Before Event
                </button>
                <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-ink-light hover:text-ink hover:border-ink-light">
                  During Event
                </button>
                <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-ink-light hover:text-ink hover:border-ink-light">
                  After Event
                </button>
              </nav>
            </div>
          </div>

          {/* Timeline Content - Before Event */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Pre-Event Activities */}
            <div className="bg-surface-dark/20 rounded-xl p-4">
              <h4 className="font-semibold text-ink mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                Pre-Event Preparation
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => onQuickAdd('dining', undefined, 'Pre-Event Dinner')}
                  className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <Utensils className="w-4 h-4 mr-3 text-orange-500" />
                  <div>
                    <div className="text-sm font-medium text-ink">Pre-Event Dining</div>
                    <div className="text-xs text-ink-light">Light meal before festivities</div>
                  </div>
                </button>
                
                <button
                  onClick={() => onQuickAdd('break', undefined, 'Costume Prep')}
                  className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <Shirt className="w-4 h-4 mr-3 text-green-500" />
                  <div>
                    <div className="text-sm font-medium text-ink">Costume & Prep Time</div>
                    <div className="text-xs text-ink-light">Get ready for the event</div>
                  </div>
                </button>

                <button
                  onClick={() => onQuickAdd('attraction', undefined, 'Early Arrival')}
                  className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <Clock className="w-4 h-4 mr-3 text-purple-500" />
                  <div>
                    <div className="text-sm font-medium text-ink">Arrive Early</div>
                    <div className="text-xs text-ink-light">Get good spots & atmosphere</div>
                  </div>
                </button>
              </div>
            </div>

            {/* During Event Priorities */}
            <div className="bg-surface-dark/20 rounded-xl p-4">
              <h4 className="font-semibold text-ink mb-4 flex items-center">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                Event Highlights
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => onQuickAdd('attraction', undefined, 'Exclusive Attraction')}
                  className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <span className="text-lg mr-3">🎢</span>
                  <div>
                    <div className="text-sm font-medium text-ink">Priority Attractions</div>
                    <div className="text-xs text-ink-light">Event-exclusive experiences</div>
                  </div>
                </button>

                <button
                  onClick={() => onQuickAdd('meet_greet', undefined, 'Special Characters')}
                  className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <span className="text-lg mr-3">🐭</span>
                  <div>
                    <div className="text-sm font-medium text-ink">Character Meets</div>
                    <div className="text-xs text-ink-light">Event-exclusive characters</div>
                  </div>
                </button>

                <button
                  onClick={() => onQuickAdd('show', undefined, 'Special Entertainment')}
                  className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <span className="text-lg mr-3">🎭</span>
                  <div>
                    <div className="text-sm font-medium text-ink">Special Shows</div>
                    <div className="text-xs text-ink-light">Unique entertainment</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Photo Opportunities */}
            <div className="bg-surface-dark/20 rounded-xl p-4">
              <h4 className="font-semibold text-ink mb-4 flex items-center">
                <Camera className="w-4 h-4 mr-2 text-pink-500" />
                Photo Opportunities
              </h4>
              <div className="space-y-3">
                <button
                  onClick={() => onQuickAdd('attraction', undefined, 'PhotoPass Opportunities')}
                  className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <Camera className="w-4 h-4 mr-3 text-pink-500" />
                  <div>
                    <div className="text-sm font-medium text-ink">PhotoPass Spots</div>
                    <div className="text-xs text-ink-light">Event-themed photo ops</div>
                  </div>
                </button>

                <div className="bg-surface border border-surface-dark rounded-lg p-3">
                  <div className="text-sm font-medium text-ink mb-2">Photo Wishlist</div>
                  <textarea
                    placeholder="Family in costumes by castle, character interactions, special decorations..."
                    className="w-full px-2 py-1 bg-surface-dark border border-surface-dark rounded text-xs text-ink focus:outline-none focus:border-sea resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Event Schedule */}
          <div className="bg-surface-dark/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-ink mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Today's Event Schedule
            </h3>
            
            {tripDay.items && tripDay.items.length > 0 ? (
              <div className="space-y-3">
                {tripDay.items.map((item, index) => (
                  <div key={item.id} className="flex items-start p-4 bg-surface border border-surface-dark/50 rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 text-purple-500 rounded-lg mr-3 text-sm font-medium">
                      {item.startTime || `${index + 1}`}
                    </div>
                    <div className="flex-1">
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
                    </div>
                    {item.type === 'special_events' && (
                      <div className="bg-pink-500/20 text-pink-500 px-2 py-1 rounded-full text-xs font-medium">
                        Main Event
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-5xl mb-4 block">🎪</span>
                <p className="text-ink-light text-lg">Add your special event and related activities!</p>
                <button
                  onClick={() => onQuickAdd('special_events', undefined, 'Main Special Event')}
                  className="mt-4 btn-primary"
                >
                  Add Main Event
                </button>
              </div>
            )}
          </div>

          {/* Event Tips */}
          <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20">
            <h3 className="text-lg font-semibold text-ink mb-4">💡 Event Day Pro Tips</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-ink-light">
              <div className="space-y-2">
                <p>• Arrive early for the best spots and atmosphere</p>
                <p>• Bring layers - events can run late and get cool</p>
                <p>• Charge your phone for photos and videos</p>
                <p>• Stay hydrated throughout the event</p>
              </div>
              <div className="space-y-2">
                <p>• Check event-specific rules and guidelines</p>
                <p>• Plan lighter meals - you'll be busy!</p>
                <p>• Download all PhotoPass photos the next day</p>
                <p>• Enjoy the unique atmosphere - it's special!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}