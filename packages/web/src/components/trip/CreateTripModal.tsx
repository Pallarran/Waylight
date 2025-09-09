import { useState } from 'react';
import { X, Calendar, MapPin } from 'lucide-react';
import { useTripStore } from '../../stores';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTripModal({ isOpen, onClose }: CreateTripModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { createNewTrip } = useTripStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;

    setIsLoading(true);
    try {
      await createNewTrip(name.trim(), startDate, endDate);
      
      // Reset form and close modal
      setName('');
      setStartDate('');
      setEndDate('');
      onClose();
    } catch (error) {
      console.error('Failed to create trip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidDateRange = startDate && endDate && new Date(startDate) <= new Date(endDate);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-strong max-w-md w-full p-6 animate-scale">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-ink">Create New Trip</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-dark/50 transition-colors"
          >
            <X className="w-5 h-5 text-ink-light" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="tripName" className="block text-sm font-medium text-ink mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Trip Name
            </label>
            <input
              id="tripName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Disney World Adventure"
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-ink mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-ink mb-2">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                className="input"
                required
              />
            </div>
          </div>

          {startDate && endDate && !isValidDateRange && (
            <p className="text-red-500 text-sm">End date must be after start date</p>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !isValidDateRange || isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}