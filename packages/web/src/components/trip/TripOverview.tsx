import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Edit, Save, XCircle, Plus, Users, Hotel, MapPin, Calendar, FileText, GripVertical, X } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTripStore } from '../../stores';
import { getHotelOptions, getHotelById, getRoomsForHotel, type RoomType } from '@waylight/shared';
import type { Trip, TravelingPartyMember, AccommodationDetails } from '@waylight/shared';

interface TripOverviewProps {
  trip: Trip;
}

interface DraggablePartyMemberProps {
  member: TravelingPartyMember;
  index: number;
  updatePartyMember: (id: string, updates: Partial<TravelingPartyMember>) => void;
  removePartyMember: (id: string) => void;
  movePartyMember: (dragIndex: number, hoverIndex: number) => void;
  guestTypeOptions: string[];
}

const DraggablePartyMember = ({
  member,
  index,
  updatePartyMember,
  removePartyMember,
  movePartyMember,
  guestTypeOptions
}: DraggablePartyMemberProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'party-member',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'party-member',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        movePartyMember(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`p-4 bg-surface-dark/50 rounded-lg transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="space-y-3 mb-3">
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-ink-light cursor-grab active:cursor-grabbing flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs font-medium text-ink mb-1">Name</label>
            <input
              type="text"
              value={member.name}
              onChange={(e) => updatePartyMember(member.id, { name: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm focus:outline-none focus:border-sea"
              placeholder="Name"
            />
          </div>
          <button
            onClick={() => removePartyMember(member.id)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Guest Type</label>
            <select
              value={member.guestType || ''}
              onChange={(e) => updatePartyMember(member.id, { guestType: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm focus:outline-none focus:border-sea"
            >
              <option value="">Select...</option>
              {guestTypeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Show age and height only for children */}
          {member.guestType === 'Child' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Age</label>
                <input
                  type="number"
                  value={member.age || ''}
                  onChange={(e) => updatePartyMember(member.id, { age: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm focus:outline-none focus:border-sea"
                  placeholder="Age"
                  min="0"
                  max="17"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Height (inches)</label>
                <input
                  type="text"
                  value={member.height || ''}
                  onChange={(e) => updatePartyMember(member.id, { height: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm focus:outline-none focus:border-sea"
                  placeholder="e.g. 48"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-ink mb-1">Special Needs</label>
        <input
          type="text"
          value={member.specialNeeds || ''}
          onChange={(e) => updatePartyMember(member.id, { specialNeeds: e.target.value })}
          className="w-full px-3 py-2 bg-surface border border-surface-dark rounded text-ink text-sm focus:outline-none focus:border-sea"
          placeholder="Accessibility needs, dietary restrictions, etc."
        />
      </div>
    </div>
  );
};

export default function TripOverview({ trip }: TripOverviewProps) {
  const [isEditingAccommodation, setIsEditingAccommodation] = useState(false);
  const [isEditingParty, setIsEditingParty] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [accommodationData, setAccommodationData] = useState<AccommodationDetails>(
    trip.accommodation || {}
  );
  const [partyData, setPartyData] = useState<TravelingPartyMember[]>(
    trip.travelingParty || []
  );
  const [notesData, setNotesData] = useState(trip.notes || '');
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [availableRooms, setAvailableRooms] = useState<RoomType[]>([]);
  const [isHandlingHotelSelection, setIsHandlingHotelSelection] = useState(false);

  // Helper function to clean hotel names for display
  const getDisplayHotelName = (hotelName: string) => {
    return hotelName
      .replace(/^Disney's\s+/i, '')
      .replace(/^Universal's\s+/i, '')
      .replace(/^Universal\s+/i, '');
  };

  const hotelOptions = getHotelOptions();
  const { updateTrip } = useTripStore();

  // Parse dates for potential future use
  // const startDate = new Date(trip.startDate + 'T00:00:00');
  // const endDate = new Date(trip.endDate + 'T00:00:00');

  // Update available rooms when hotel selection changes
  useEffect(() => {
    if (selectedHotelId && selectedHotelId !== 'custom') {
      const rooms = getRoomsForHotel(selectedHotelId);
      setAvailableRooms(rooms);
    } else {
      setAvailableRooms([]);
    }
  }, [selectedHotelId]);

  // Initialize hotel selection from existing accommodation data
  useEffect(() => {
    // Don't run initialization if we're currently handling a hotel selection
    if (isHandlingHotelSelection) return;

    if (accommodationData.hotelName) {
      // Try to find hotel by name in our database
      const allOptions = hotelOptions.flatMap(group => group.options);
      const matchedHotel = allOptions.find(hotel => hotel.label === accommodationData.hotelName);
      if (matchedHotel) {
        setSelectedHotelId(matchedHotel.value);
      } else {
        setSelectedHotelId('custom');
      }
    }
  }, [accommodationData.hotelName, hotelOptions, isHandlingHotelSelection]);

  const handleHotelSelection = (hotelId: string) => {
    setIsHandlingHotelSelection(true);
    setSelectedHotelId(hotelId);

    if (hotelId === 'custom') {
      // Clear hotel-specific data for custom entry
      setAccommodationData(prev => ({
        ...prev,
        hotelName: '',
        address: '',
        roomType: ''
      }));
    } else {
      const hotel = getHotelById(hotelId);
      if (hotel) {
        // Auto-populate hotel name and address (store original name, not cleaned)
        setAccommodationData(prev => ({
          ...prev,
          hotelName: hotel.name, // Store original name with prefix
          address: hotel.address,
          roomType: '' // Reset room type when changing hotels
        }));
      }
    }

    // Reset the flag after a brief delay to allow state updates to complete
    setTimeout(() => setIsHandlingHotelSelection(false), 0);
  };

  const handleCheckInDateChange = (date: string) => {
    setAccommodationData(prev => ({ ...prev, checkInDate: date }));
    
    // If check-out date is before or same as check-in date, set it to the day after
    if (accommodationData.checkOutDate && accommodationData.checkOutDate <= date) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setAccommodationData(prev => ({ 
        ...prev, 
        checkOutDate: nextDay.toISOString().split('T')[0] 
      }));
    }
  };

  const handleSaveAccommodation = async () => {
    try {
      await updateTrip(trip.id, { accommodation: accommodationData });
      setIsEditingAccommodation(false);
    } catch (error) {
      console.error('Failed to update accommodation:', error);
    }
  };

  const handleCancelAccommodation = () => {
    setAccommodationData(trip.accommodation || {});
    setIsEditingAccommodation(false);
  };

  const handleSaveParty = async () => {
    try {
      await updateTrip(trip.id, { travelingParty: partyData });
      setIsEditingParty(false);
    } catch (error) {
      console.error('Failed to update traveling party:', error);
    }
  };

  const handleCancelParty = () => {
    setPartyData(trip.travelingParty || []);
    setIsEditingParty(false);
  };

  const handleSaveNotes = async () => {
    try {
      await updateTrip(trip.id, { notes: notesData });
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const handleCancelNotes = () => {
    setNotesData(trip.notes || '');
    setIsEditingNotes(false);
  };

  const addPartyMember = () => {
    const newMember: TravelingPartyMember = {
      id: Date.now().toString(),
      name: '',
      age: undefined,
      height: undefined,
      guestType: '',
      specialNeeds: ''
    };
    setPartyData([...partyData, newMember]);
  };

  const updatePartyMember = (id: string, updates: Partial<TravelingPartyMember>) => {
    setPartyData(partyData.map(member => 
      member.id === id ? { ...member, ...updates } : member
    ));
  };

  const removePartyMember = (id: string) => {
    setPartyData(partyData.filter(member => member.id !== id));
  };

  const movePartyMember = (dragIndex: number, hoverIndex: number) => {
    const draggedMember = partyData[dragIndex];
    if (!draggedMember) return;

    const newPartyData = [...partyData];
    newPartyData.splice(dragIndex, 1);
    newPartyData.splice(hoverIndex, 0, draggedMember);
    setPartyData(newPartyData);
  };

  const guestTypeOptions = [
    'Trip Planner',
    'Spouse/Partner',
    'Child',
    'Parent',
    'Sibling',
    'Friend',
    'Extended Family',
    'Other'
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Accommodation and Traveling Party - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accommodation Details */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Hotel className="w-5 h-5 text-sea mr-2" />
                <h3 className="text-lg font-semibold text-ink">Accommodation</h3>
              </div>
              {!isEditingAccommodation && (
                <button
                  onClick={() => setIsEditingAccommodation(true)}
                  className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditingAccommodation ? (
              <div className="space-y-4">
                {/* Hotel Selection */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Hotel</label>
                  <select
                    value={selectedHotelId}
                    onChange={(e) => handleHotelSelection(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                  >
                    <option value="">Select a hotel...</option>
                    {hotelOptions.map(group => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map(hotel => (
                          <option key={hotel.value} value={hotel.value}>
                            {getDisplayHotelName(hotel.label)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="custom">Other/Custom Hotel</option>
                  </select>
                </div>

                {/* Custom Hotel Name (only shown for custom selection) */}
                {selectedHotelId === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Hotel Name</label>
                    <input
                      type="text"
                      value={accommodationData.hotelName || ''}
                      onChange={(e) => setAccommodationData({ ...accommodationData, hotelName: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                      placeholder="Enter hotel name"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Room Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Room Type</label>
                    {availableRooms.length > 0 ? (
                      <select
                        value={accommodationData.roomType || ''}
                        onChange={(e) => setAccommodationData({ ...accommodationData, roomType: e.target.value })}
                        className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                      >
                        <option value="">Select room type...</option>
                        {availableRooms.map(room => (
                          <option key={room.id} value={room.name}>
                            {room.name} (Sleeps {room.sleeps})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={accommodationData.roomType || ''}
                        onChange={(e) => setAccommodationData({ ...accommodationData, roomType: e.target.value })}
                        className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                        placeholder="e.g., Standard Room, Suite"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Confirmation Number</label>
                    <input
                      type="text"
                      value={accommodationData.confirmationNumber || ''}
                      onChange={(e) => setAccommodationData({ ...accommodationData, confirmationNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                      placeholder="Reservation confirmation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Check-in Date</label>
                    <input
                      type="date"
                      value={accommodationData.checkInDate || ''}
                      onChange={(e) => handleCheckInDateChange(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Check-out Date</label>
                    <input
                      type="date"
                      value={accommodationData.checkOutDate || ''}
                      onChange={(e) => setAccommodationData({ ...accommodationData, checkOutDate: e.target.value })}
                      min={accommodationData.checkInDate ? new Date(new Date(accommodationData.checkInDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                      className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                    />
                  </div>
                </div>

                {/* Address (auto-populated or manual for custom) */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Address</label>
                  <input
                    type="text"
                    value={accommodationData.address || ''}
                    onChange={(e) => setAccommodationData({ ...accommodationData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                    placeholder="Hotel address"
                    readOnly={selectedHotelId !== 'custom' && selectedHotelId !== ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Notes</label>
                  <textarea
                    value={accommodationData.notes || ''}
                    onChange={(e) => setAccommodationData({ ...accommodationData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                    placeholder="Special requests, amenities, etc."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSaveAccommodation}
                    className="btn-primary flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelAccommodation}
                    className="btn-secondary flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {trip.accommodation?.hotelName ? (
                  <div className="space-y-4">
                    {/* Hotel Header */}
                    <div className="border-l-4 border-sea/50 pl-4 bg-gradient-to-r from-sea/5 to-transparent p-4 rounded-r-lg">
                      <h4 className="font-semibold text-ink text-lg">{getDisplayHotelName(trip.accommodation.hotelName)}</h4>
                      {trip.accommodation.roomType && (
                        <div className="flex items-center mt-2">
                          <Hotel className="w-4 h-4 text-sea mr-2" />
                          <p className="text-sm text-ink-light font-medium">{trip.accommodation.roomType}</p>
                        </div>
                      )}
                    </div>

                    {/* Check-in/Check-out Dates */}
                    {trip.accommodation.checkInDate && trip.accommodation.checkOutDate && (
                      <div className="bg-surface-dark/30 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                              <Calendar className="w-4 h-4 text-glow mr-2" />
                              <span className="text-sm font-medium text-ink-light">Check-in</span>
                            </div>
                            <p className="text-ink font-semibold">
                              {format(new Date(trip.accommodation.checkInDate + 'T00:00:00'), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-ink-light">
                              {format(new Date(trip.accommodation.checkInDate + 'T00:00:00'), 'EEEE')}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                              <Calendar className="w-4 h-4 text-glow mr-2" />
                              <span className="text-sm font-medium text-ink-light">Check-out</span>
                            </div>
                            <p className="text-ink font-semibold">
                              {format(new Date(trip.accommodation.checkOutDate + 'T00:00:00'), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-ink-light">
                              {format(new Date(trip.accommodation.checkOutDate + 'T00:00:00'), 'EEEE')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Details */}
                    <div className="space-y-3">
                      {trip.accommodation.confirmationNumber && (
                        <div className="flex items-center p-3 bg-glow/5 rounded-lg border border-glow/20">
                          <div className="w-2 h-2 bg-glow rounded-full mr-3"></div>
                          <div>
                            <span className="text-xs font-medium text-ink-light uppercase tracking-wider">Confirmation</span>
                            <p className="text-sm text-ink font-mono">{trip.accommodation.confirmationNumber}</p>
                          </div>
                        </div>
                      )}
                      
                      {trip.accommodation.address && (
                        <div className="flex items-start p-3 bg-surface-dark/20 rounded-lg">
                          <MapPin className="w-4 h-4 text-sea mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-medium text-ink-light uppercase tracking-wider">Address</span>
                            <p className="text-sm text-ink mt-1">{trip.accommodation.address}</p>
                          </div>
                        </div>
                      )}
                      
                      {trip.accommodation.notes && (
                        <div className="p-4 bg-surface-dark/40 rounded-lg border-l-2 border-ink-light/20">
                          <div className="flex items-center mb-2">
                            <FileText className="w-4 h-4 text-ink-light mr-2" />
                            <span className="text-xs font-medium text-ink-light uppercase tracking-wider">Notes</span>
                          </div>
                          <p className="text-sm text-ink-light leading-relaxed">{trip.accommodation.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-surface-dark rounded-lg">
                    <Hotel className="w-12 h-12 text-ink-light mx-auto mb-3" />
                    <p className="text-ink-light">No accommodation details added yet</p>
                    <p className="text-xs text-ink-light mt-1">Click the edit button to add your hotel information</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Traveling Party */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-sea mr-2" />
                <h3 className="text-lg font-semibold text-ink">Traveling Party</h3>
              </div>
              {!isEditingParty && (
                <button
                  onClick={() => setIsEditingParty(true)}
                  className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditingParty ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {partyData.map((member, index) => (
                    <DraggablePartyMember
                      key={member.id}
                      member={member}
                      index={index}
                      updatePartyMember={updatePartyMember}
                      removePartyMember={removePartyMember}
                      movePartyMember={movePartyMember}
                      guestTypeOptions={guestTypeOptions}
                    />
                  ))}
                </div>

                <button
                  onClick={addPartyMember}
                  className="w-full p-3 border-2 border-dashed border-surface-dark text-ink-light hover:text-ink hover:border-sea/50 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Traveler
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSaveParty}
                    className="btn-primary flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelParty}
                    className="btn-secondary flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {trip.travelingParty && trip.travelingParty.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {trip.travelingParty.map((member) => {
                      const isPlanner = member.guestType === 'Trip Planner';
                      return (
                        <div 
                          key={member.id} 
                          className={`p-4 rounded-lg ${
                            isPlanner 
                              ? 'bg-sea/10 border border-sea/20' 
                              : 'bg-surface-dark/50'
                          }`}
                        >
                          <div className="mb-2">
                            <h4 className={`font-medium ${isPlanner ? 'text-sea' : 'text-ink'}`}>
                              {member.name}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-ink-light">
                            {isPlanner && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sea/20 text-sea">
                                Planner
                              </span>
                            )}
                            {member.guestType && !isPlanner && <span>{member.guestType}</span>}
                            {member.guestType === 'Child' && (
                              <div className="flex items-center space-x-3">
                                {member.age && <span>Age {member.age}</span>}
                                {member.height && <span>{member.height}"</span>}
                              </div>
                            )}
                          </div>
                          {member.specialNeeds && (
                            <p className="text-sm text-ink-light mt-2">{member.specialNeeds}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-ink-light">No travelers added yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trip Notes */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-sea mr-2" />
              <h3 className="text-lg font-semibold text-ink">Trip Notes</h3>
            </div>
            {!isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="p-2 text-ink-light hover:text-ink hover:bg-surface-dark/50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-4">
              <textarea
                value={notesData}
                onChange={(e) => setNotesData(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-dark rounded-lg text-ink focus:outline-none focus:border-sea"
                placeholder="General notes about your trip..."
                rows={6}
              />
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSaveNotes}
                  className="btn-primary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={handleCancelNotes}
                  className="btn-secondary flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {trip.notes ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-ink-light whitespace-pre-wrap">{trip.notes}</p>
                </div>
              ) : (
                <p className="text-ink-light">No notes added yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}