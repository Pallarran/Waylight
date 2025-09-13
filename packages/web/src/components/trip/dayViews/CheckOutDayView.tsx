import { Plane, Car, Clock, ShoppingBag, Camera, Utensils, Luggage, CheckCircle } from 'lucide-react';
import { TripDay, Trip, ActivityCategory } from '../../../types';
import { useTripStore } from '../../../stores';

interface CheckOutDayViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function CheckOutDayView({ trip, tripDay, date, onQuickAdd, onOpenDayTypeModal }: CheckOutDayViewProps) {
  const { updateDay } = useTripStore();

  const updateDayData = async (updates: Partial<TripDay>) => {
    try {
      await updateDay(trip.id, tripDay.id, updates);
    } catch (error) {
      console.error('Failed to update day:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
      {/* Left Panel: Departure Planning */}
      <div className="lg:col-span-8">
        <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center mb-6 pb-4 border-b border-surface-dark/20 relative">
            {onOpenDayTypeModal && (
              <button
                onClick={onOpenDayTypeModal}
                className="absolute top-0 right-0 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
              >
                <span className="text-base">✈️</span>
                <span>Change Day Type</span>
              </button>
            )}
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 text-blue-500 rounded-xl mr-4">
              <span className="text-2xl">✈️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Farewell to the Magic</h2>
              <p className="text-ink-light">Departure day - let's wrap up your adventure smoothly</p>
            </div>
          </div>

          {/* Departure Logistics */}
          <div className="space-y-6">
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center">
                <Plane className="w-5 h-5 mr-2 text-blue-500" />
                Departure Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Flight/Drive Time</label>
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
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Leave Resort By</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                    placeholder="Calculate 2-3 hours before flight"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-medium text-ink mb-1">Transportation Method</label>
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
                  <option value="">Choose transportation...</option>
                  <option value="car">🚗 Drive Personal/Rental Car</option>
                  <option value="rideshare">🚙 Uber/Lyft to Airport</option>
                  <option value="bus">🚌 Resort Transportation to Airport</option>
                </select>
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
                  <input
                    type="time"
                    defaultValue="11:00"
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea focus:ring-1 focus:ring-sea/20 transition-colors"
                  />
                  <p className="text-xs text-ink-light mt-1">Standard check-out is 11:00 AM</p>
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

            {/* Final Activities */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-pink-500" />
                Final Activities & Memories
              </h3>
              <p className="text-sm text-ink-light mb-4">
                Make the most of your last few hours - but keep departure time in mind!
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <button
                  onClick={() => onQuickAdd('shopping', undefined, 'Last-minute Souvenirs')}
                  className="flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <ShoppingBag className="w-4 h-4 mr-3 text-purple-500" />
                  <span className="text-sm text-ink">Last-minute Shopping</span>
                </button>
                <button
                  onClick={() => onQuickAdd('dining', undefined, 'Farewell Character Breakfast')}
                  className="flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <Utensils className="w-4 h-4 mr-3 text-orange-500" />
                  <span className="text-sm text-ink">Final Character Meal</span>
                </button>
                <button
                  onClick={() => onQuickAdd('attraction', undefined, 'Resort Photo Session')}
                  className="flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <Camera className="w-4 h-4 mr-3 text-pink-500" />
                  <span className="text-sm text-ink">Final Photo Opportunities</span>
                </button>
                <button
                  onClick={() => onQuickAdd('attraction', undefined, 'One Last Ride')}
                  className="flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <span className="mr-3 text-lg">🎢</span>
                  <span className="text-sm text-ink">One Final Attraction</span>
                </button>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                Final Day Schedule
              </h3>
              
              {tripDay.items && tripDay.items.length > 0 ? (
                <div className="space-y-3">
                  {tripDay.items.map((item, index) => (
                    <div key={item.id} className="flex items-center p-3 bg-surface border border-surface-dark/50 rounded-lg">
                      <span className="text-lg mr-3">⭐</span>
                      <div className="flex-1">
                        <div className="font-medium text-ink">{item.name}</div>
                        {item.startTime && (
                          <div className="text-xs text-ink-light">{item.startTime}</div>
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
                  <span className="text-4xl mb-4 block">🎭</span>
                  <p className="text-ink-light">Add some final activities to cap off your trip!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Final Activities & Memories */}
      <div className="lg:col-span-4">
        <div className="bg-surface rounded-xl border border-surface-dark/30 p-5 h-full overflow-y-auto">
          <h3 className="text-lg font-semibold text-ink mb-4">Departure Day Essentials</h3>
          
          <div className="space-y-4">
            {/* Departure Checklist */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <h4 className="font-medium text-ink mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                Departure Checklist
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-ink-light">
                  <input type="checkbox" className="mr-2 text-blue-500" />
                  Pack all belongings
                </div>
                <div className="flex items-center text-ink-light">
                  <input type="checkbox" className="mr-2 text-blue-500" />
                  Check hotel room & bathroom
                </div>
                <div className="flex items-center text-ink-light">
                  <input type="checkbox" className="mr-2 text-blue-500" />
                  Review final bill at checkout
                </div>
                <div className="flex items-center text-ink-light">
                  <input type="checkbox" className="mr-2 text-blue-500" />
                  Return any rental items
                </div>
                <div className="flex items-center text-ink-light">
                  <input type="checkbox" className="mr-2 text-blue-500" />
                  Take final photos
                </div>
                <div className="flex items-center text-ink-light">
                  <input type="checkbox" className="mr-2 text-blue-500" />
                  Download Disney app photos
                </div>
              </div>
            </div>

            {/* Souvenir Checklist */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h4 className="font-medium text-ink mb-3 flex items-center">
                <ShoppingBag className="w-4 h-4 mr-2 text-purple-500" />
                Souvenir Checklist
              </h4>
              <div className="text-sm text-ink-light space-y-1">
                <p>• Did everyone get something special?</p>
                <p>• Any forgotten gifts for family/friends?</p>
                <p>• Check gift cards - any balance left?</p>
                <p>• Consider shipping large items</p>
              </div>
            </div>

            {/* Memory Capture */}
            <div className="bg-pink-500/10 rounded-lg p-4 border border-pink-500/20">
              <h4 className="font-medium text-ink mb-3 flex items-center">
                <Camera className="w-4 h-4 mr-2 text-pink-500" />
                Capture the Memories
              </h4>
              <div className="text-sm text-ink-light space-y-2">
                <p>• Take one last family photo</p>
                <p>• Record a voice memo of highlights</p>
                <p>• Quick video message to future you</p>
                <p>• Download all PhotoPass photos</p>
              </div>
            </div>

            {/* Travel Tips */}
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <h4 className="font-medium text-ink mb-3">💡 Travel Home Tips</h4>
              <div className="text-sm text-ink-light space-y-2">
                <p>• Allow extra time for traffic/crowds</p>
                <p>• Check in for flights 24hrs early</p>
                <p>• Pack snacks for the journey</p>
                <p>• Charge devices for travel entertainment</p>
                <p>• Keep important docs accessible</p>
              </div>
            </div>

            {/* Reflection */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
              <h4 className="font-medium text-ink mb-3">✨ Trip Reflection</h4>
              <textarea
                placeholder="What was the best part of your trip? What would you do differently next time?"
                className="w-full px-3 py-2 bg-surface/50 border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}