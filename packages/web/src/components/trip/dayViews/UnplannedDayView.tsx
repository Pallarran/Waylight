import { Calendar, MapPin, Plus, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Trip, TripDay } from '../../../types';

interface UnplannedDayViewProps {
  trip: Trip;
  tripDay: TripDay;
  date: Date;
  onOpenDayTypeModal: () => void;
}

export default function UnplannedDayView({
  trip,
  tripDay,
  date,
  onOpenDayTypeModal
}: UnplannedDayViewProps) {
  const dayNumber = trip.days.findIndex(d => d.id === tripDay.id) + 1;

  return (
    <div className="min-h-[500px] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-3xl font-bold text-ink mb-2">
            {format(date, 'EEEE, MMMM d')}
          </h2>
          <div className="text-ink-light">
            Day {dayNumber} • Unplanned
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p className="text-lg text-ink-light mb-4">
            This day is ready for planning! Choose what type of day you'd like to have.
          </p>
          <p className="text-ink-light">
            You can always change your mind later and switch between different day types.
          </p>
        </div>

        {/* Start Planning Button */}
        <button
          onClick={onOpenDayTypeModal}
          className="btn-primary btn-lg flex items-center gap-3 mx-auto mb-8"
        >
          <Star className="w-5 h-5" />
          Start Planning This Day
        </button>

        {/* Quick Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="p-4 bg-surface rounded-lg border border-surface-dark/30">
            <div className="text-2xl mb-2">🎢</div>
            <div className="text-sm font-medium text-ink">Theme Park</div>
            <div className="text-xs text-ink-light">Full day adventure</div>
          </div>

          <div className="p-4 bg-surface rounded-lg border border-surface-dark/30">
            <div className="text-2xl mb-2">🏖️</div>
            <div className="text-sm font-medium text-ink">Rest Day</div>
            <div className="text-xs text-ink-light">Relax and recharge</div>
          </div>

          <div className="p-4 bg-surface rounded-lg border border-surface-dark/30">
            <div className="text-2xl mb-2">🛍️</div>
            <div className="text-sm font-medium text-ink">Disney Springs</div>
            <div className="text-xs text-ink-light">Shopping & dining</div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center gap-2 text-blue-700 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Click "Start Planning" to see all available day types and options</span>
          </div>
        </div>
      </div>
    </div>
  );
}