import { Utensils, ShoppingBag, Music, Car, MapPin, Clock, DollarSign, Gift } from 'lucide-react';
import { TripDay, Trip, ActivityCategory } from '../../../types';
import { useTripStore } from '../../../stores';

interface DisneySpringsViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onQuickAdd: (type: ActivityCategory, attractionId?: string, customName?: string) => Promise<void>;
  onOpenDayTypeModal?: () => void;
}

export default function DisneySpringsView({ trip, tripDay, date, onQuickAdd, onOpenDayTypeModal }: DisneySpringsViewProps) {
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
      {/* Left Panel: Dining & Entertainment */}
      <div className="lg:col-span-6">
        <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center mb-6 pb-4 border-b border-surface-dark/20 relative">
            {onOpenDayTypeModal && (
              <button
                onClick={onOpenDayTypeModal}
                className="absolute top-0 right-0 flex items-center space-x-2 px-3 py-2 bg-surface/50 backdrop-blur-sm border border-surface-dark/30 rounded-lg text-ink-light hover:text-ink hover:bg-surface/70 transition-colors text-sm"
              >
                <span className="text-base">🛍️</span>
                <span>Change Day Type</span>
              </button>
            )}
            <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 text-orange-500 rounded-xl mr-4">
              <span className="text-2xl">🛍️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Disney Springs Adventure</h2>
              <p className="text-ink-light">Entertainment, dining, and shopping district</p>
            </div>
          </div>

          {/* Dining & Reservations */}
          <div className="space-y-6">
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-orange-500" />
                Dining & Reservations
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => onQuickAdd('dining', undefined, 'Disney Springs Restaurant')}
                  className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <span className="text-lg mr-3">🍽️</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink">Table Service Restaurant</div>
                    <div className="text-xs text-ink-light">Reservations recommended</div>
                  </div>
                </button>

                <div className="grid md:grid-cols-2 gap-3">
                  <button
                    onClick={() => onQuickAdd('dining', undefined, 'Marketplace Snacks')}
                    className="flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <span className="text-lg mr-3">🧁</span>
                    <div>
                      <div className="font-medium text-ink text-sm">Marketplace Treats</div>
                      <div className="text-xs text-ink-light">Gideon's, Joffrey's, etc.</div>
                    </div>
                  </button>

                  <button
                    onClick={() => onQuickAdd('dining', undefined, 'Food Trucks')}
                    className="flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <span className="text-lg mr-3">🚛</span>
                    <div>
                      <div className="font-medium text-ink text-sm">Food Trucks</div>
                      <div className="text-xs text-ink-light">West Side options</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Current dining reservations */}
              {tripDay.items?.filter(item => item.type === 'dining').length > 0 && (
                <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <h4 className="font-medium text-ink mb-2">Today's Dining</h4>
                  {tripDay.items.filter(item => item.type === 'dining').map(item => (
                    <div key={item.id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-ink">{item.name}</span>
                      {item.startTime && <span className="text-xs text-ink-light">{item.startTime}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Entertainment */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center">
                <Music className="w-5 h-5 mr-2 text-purple-500" />
                Live Entertainment & Events
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                <button
                  onClick={() => onQuickAdd('show', undefined, 'Street Performers')}
                  className="flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <Music className="w-4 h-4 mr-3 text-purple-500" />
                  <div>
                    <div className="text-sm font-medium text-ink">Street Performances</div>
                    <div className="text-xs text-ink-light">Check times at info</div>
                  </div>
                </button>

                <button
                  onClick={() => onQuickAdd('attraction', undefined, 'Seasonal Events')}
                  className="flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <span className="text-lg mr-3">🎪</span>
                  <div>
                    <div className="text-sm font-medium text-ink">Special Events</div>
                    <div className="text-xs text-ink-light">Check Disney Springs app</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Transportation & Parking */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h3 className="font-semibold text-ink mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-blue-500" />
                Getting There & Around
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-ink-light">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Free parking in all Disney Springs garages</span>
                </div>
                <div className="flex items-center text-ink-light">
                  <Car className="w-4 h-4 mr-2" />
                  <span>Consider Uber/Lyft if staying on-property</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Transportation Method</label>
                  <select className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea">
                    <option>Drive & Park</option>
                    <option>Resort Bus Transportation</option>
                    <option>Uber/Lyft</option>
                    <option>Disney Springs Resort Area Transportation</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Shopping & Budget */}
      <div className="lg:col-span-6">
        <div className="bg-surface rounded-xl border border-surface-dark/30 p-6 h-full overflow-y-auto">
          <h3 className="text-lg font-semibold text-ink mb-6 flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2 text-green-500" />
            Shopping & Budget Planning
          </h3>

          <div className="space-y-6">
            {/* Shopping Budget */}
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <h4 className="font-medium text-ink mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                Shopping Budget
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Total Budget</label>
                  <input
                    type="number"
                    placeholder="$200"
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Spent So Far</label>
                  <input
                    type="number"
                    placeholder="$0"
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea"
                  />
                </div>
              </div>
            </div>

            {/* Store Priorities */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h4 className="font-medium text-ink mb-3">🏪 Store Priority List</h4>
              <div className="space-y-3">
                <button
                  onClick={() => onQuickAdd('shopping', undefined, 'World of Disney')}
                  className="w-full flex items-center p-3 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                >
                  <span className="text-lg mr-3">🏰</span>
                  <div className="flex-1">
                    <div className="font-medium text-ink text-sm">World of Disney</div>
                    <div className="text-xs text-ink-light">Largest Disney store - everything!</div>
                  </div>
                </button>

                <div className="grid md:grid-cols-2 gap-2">
                  <button
                    onClick={() => onQuickAdd('shopping', undefined, 'UNIQLO Disney')}
                    className="flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <span className="mr-2 text-sm">👕</span>
                    <span className="text-xs text-ink">UNIQLO Disney</span>
                  </button>

                  <button
                    onClick={() => onQuickAdd('shopping', undefined, 'Disney Home')}
                    className="flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <span className="mr-2 text-sm">🏠</span>
                    <span className="text-xs text-ink">Disney Home</span>
                  </button>

                  <button
                    onClick={() => onQuickAdd('shopping', undefined, 'Disney Pin Traders')}
                    className="flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <span className="mr-2 text-sm">📌</span>
                    <span className="text-xs text-ink">Pin Traders</span>
                  </button>

                  <button
                    onClick={() => onQuickAdd('shopping', undefined, 'Other Stores')}
                    className="flex items-center p-2 bg-surface border border-surface-dark rounded-lg hover:bg-surface-dark/20 transition-colors text-left"
                  >
                    <span className="mr-2 text-sm">🛍️</span>
                    <span className="text-xs text-ink">Browse Others</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Gift Planning */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h4 className="font-medium text-ink mb-3 flex items-center">
                <Gift className="w-4 h-4 mr-2 text-pink-500" />
                Gift Planning
              </h4>
              <textarea
                placeholder="Who needs gifts? What are you looking for?&#10;&#10;• Mom - Disney jewelry&#10;• Kids - plush characters&#10;• Coworkers - pins or snacks"
                className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink text-sm focus:outline-none focus:border-sea resize-none"
                rows={6}
              />
            </div>

            {/* Shipping Options */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <h4 className="font-medium text-ink mb-3">📦 Shipping & Package Services</h4>
              <div className="text-sm text-ink-light space-y-1">
                <p>• Free resort delivery for purchases $50+</p>
                <p>• Ship home available at most stores</p>
                <p>• Consider package pickup services</p>
                <p>• Large items can be held until departure</p>
              </div>
            </div>

            {/* Today's Shopping List */}
            <div className="bg-surface-dark/20 rounded-lg p-4">
              <h4 className="font-medium text-ink mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                Today's Activities
              </h4>
              
              {tripDay.items && tripDay.items.length > 0 ? (
                <div className="space-y-2">
                  {tripDay.items.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-surface border border-surface-dark/50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-sm mr-2">
                          {item.type === 'dining' ? '🍽️' : 
                           item.type === 'shopping' ? '🛍️' : 
                           item.type === 'show' ? '🎵' : '✨'}
                        </span>
                        <span className="text-sm text-ink">{item.name}</span>
                      </div>
                      {item.startTime && (
                        <span className="text-xs text-ink-light">{item.startTime}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="text-3xl mb-2 block">🎯</span>
                  <p className="text-sm text-ink-light">Add dining and shopping plans!</p>
                </div>
              )}
            </div>

            {/* Pro Tips */}
            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
              <h4 className="font-medium text-ink mb-3">💡 Disney Springs Pro Tips</h4>
              <div className="text-sm text-ink-light space-y-1">
                <p>• Download the Disney Springs app for maps & deals</p>
                <p>• Check for seasonal events and pop-ups</p>
                <p>• Many stores offer exclusive merchandise</p>
                <p>• Parking is free but fills up on weekends</p>
                <p>• Some restaurants take walk-ups after 2pm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}