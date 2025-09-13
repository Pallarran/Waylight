import { Clock, MapPin, Plus, Waves, Sun, Utensils, ShoppingBag } from 'lucide-react';
import { TripDay, Trip, ActivityCategory } from '../../../types';
import { useTripStore } from '../../../stores';

interface RestDayViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function RestDayView({ trip, tripDay, date, onQuickAdd, onOpenDayTypeModal }: RestDayViewProps) {
  const { updateDay } = useTripStore();

  const handleDayNoteUpdate = async (notes: string) => {
    try {
      await updateDay(trip.id, tripDay.id, { notes });
    } catch (error) {
      console.error('Failed to update day notes:', error);
    }
  };

  return (
    <div className="lg:col-span-12 max-w-4xl mx-auto">
      <div className="bg-surface rounded-xl border border-surface-dark/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-green-500/20 p-8 text-center border-b border-surface-dark/20 relative">
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

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Day Notes */}
          <div className="bg-surface-dark/20 rounded-lg p-4">
            <label className="block text-sm font-medium text-ink mb-2">Today's Mindset & Notes</label>
            <textarea
              value={tripDay.notes || ''}
              onChange={(e) => handleDayNoteUpdate(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors resize-none"
              placeholder="How are you feeling today? Any special plans or things you want to remember..."
              rows={3}
            />
          </div>

          {/* Hotel Amenities */}
          <div className="bg-surface-dark/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-ink mb-4 flex items-center">
              <Waves className="w-5 h-5 mr-2 text-teal-500" />
              Hotel Amenities & Relaxation
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => onQuickAdd('break', undefined, 'Pool Time')}
                className="flex items-center p-4 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
              >
                <span className="text-2xl mr-3">🏊‍♀️</span>
                <div>
                  <div className="font-medium text-ink">Pool Time</div>
                  <div className="text-xs text-ink-light">Swim, float, relax poolside</div>
                </div>
              </button>

              <button
                onClick={() => onQuickAdd('break', undefined, 'Spa Treatment')}
                className="flex items-center p-4 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
              >
                <span className="text-2xl mr-3">💆‍♀️</span>
                <div>
                  <div className="font-medium text-ink">Spa Time</div>
                  <div className="text-xs text-ink-light">Massage, treatments, wellness</div>
                </div>
              </button>

              <button
                onClick={() => onQuickAdd('break', undefined, 'Resort Exploration')}
                className="flex items-center p-4 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
              >
                <span className="text-2xl mr-3">🚶‍♀️</span>
                <div>
                  <div className="font-medium text-ink">Resort Walk</div>
                  <div className="text-xs text-ink-light">Explore your resort, take photos</div>
                </div>
              </button>

              <button
                onClick={() => onQuickAdd('break', undefined, 'Nap Time')}
                className="flex items-center p-4 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
              >
                <span className="text-2xl mr-3">😴</span>
                <div>
                  <div className="font-medium text-ink">Rest & Recharge</div>
                  <div className="text-xs text-ink-light">Power nap, room relaxation</div>
                </div>
              </button>
            </div>
          </div>

          {/* Optional Low-Key Activities */}
          <div className="bg-surface-dark/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-ink mb-4 flex items-center">
              <Sun className="w-5 h-5 mr-2 text-yellow-500" />
              Optional Low-Pressure Activities
            </h3>
            <p className="text-sm text-ink-light mb-4">
              Only if you feel like it - no pressure! These are here if you want some gentle activities.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => onQuickAdd('dining', undefined, 'Casual Dining')}
                className="flex items-center p-4 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
              >
                <Utensils className="w-5 h-5 mr-3 text-orange-500" />
                <div>
                  <div className="font-medium text-ink">Leisurely Meal</div>
                  <div className="text-xs text-ink-light">No rush, enjoy the experience</div>
                </div>
              </button>

              <button
                onClick={() => onQuickAdd('shopping', undefined, 'Resort Shopping')}
                className="flex items-center p-4 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
              >
                <ShoppingBag className="w-5 h-5 mr-3 text-purple-500" />
                <div>
                  <div className="font-medium text-ink">Light Shopping</div>
                  <div className="text-xs text-ink-light">Browse resort shops, no agenda</div>
                </div>
              </button>
            </div>
          </div>

          {/* Current Schedule */}
          <div className="bg-surface-dark/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-ink mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Today's Flexible Schedule
            </h3>
            
            {tripDay.items && tripDay.items.length > 0 ? (
              <div className="space-y-3">
                {tripDay.items.map((item, index) => (
                  <div key={item.id} className="flex items-center p-3 bg-surface border border-surface-dark/50 rounded-lg">
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

          {/* Wellness Reminders */}
          <div className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-teal-500/10 rounded-xl p-6 border border-green-500/20">
            <h3 className="text-lg font-semibold text-ink mb-4">💚 Wellness Reminders</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-ink-light">
                <span className="mr-2">💧</span>
                Stay hydrated - especially by the pool
              </div>
              <div className="flex items-center text-ink-light">
                <span className="mr-2">🧴</span>
                Don't forget sunscreen if going outside
              </div>
              <div className="flex items-center text-ink-light">
                <span className="mr-2">🦶</span>
                Give your feet a break from walking
              </div>
              <div className="flex items-center text-ink-light">
                <span className="mr-2">📱</span>
                Maybe put the phone down for a while
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}