import type { TripDay, CheatSheetData, ItineraryItem } from '../types';

export const extractCheatSheetData = (tripDay: TripDay): CheatSheetData => {
  const items = tripDay.items || [];
  
  // Extract different types of activities
  const diningReservations = items.filter(item => item.type === 'dining');
  const characterMeets = items.filter(item => item.type === 'meet_greet');
  const shows = items.filter(item => item.type === 'show');
  const ropeDropPlan = items.filter(item => item.isRopeDropTarget || 
    (item.startTime && item.startTime <= '09:30')).sort((a, b) => 
    (a.startTime || '').localeCompare(b.startTime || ''));

  // Generate timeline events
  const timelineEvents = [
    ...(tripDay.arrivalPlan?.departureTime ? [{
      time: tripDay.arrivalPlan.departureTime,
      activity: `Leave ${tripDay.arrivalPlan.transportMethod || 'hotel'}`,
      type: 'arrival' as const
    }] : []),
    ...(tripDay.arrivalPlan?.securityTime ? [{
      time: tripDay.arrivalPlan.securityTime,
      activity: 'At security',
      type: 'arrival' as const
    }] : []),
    ...(tripDay.arrivalPlan?.tapInTime ? [{
      time: tripDay.arrivalPlan.tapInTime,
      activity: 'Tap in to park',
      type: 'arrival' as const
    }] : []),
    ...ropeDropPlan.map(item => ({
      time: item.startTime || '',
      activity: item.name,
      type: 'rope-drop' as const
    })),
    ...diningReservations.map(item => ({
      time: item.startTime || '',
      activity: `${item.name} (${item.confirmationNumber || item.reservationNumber || ''})`,
      type: 'dining' as const
    })),
    ...shows.map(item => ({
      time: item.startTime || '',
      activity: item.name,
      type: 'show' as const
    })),
    ...characterMeets.map(item => ({
      time: item.startTime || '',
      activity: `${item.name} - ${item.characters?.join(', ') || 'Characters'}`,
      type: 'character' as const
    }))
  ].sort((a, b) => a.time.localeCompare(b.time));

  return {
    tripDay,
    diningReservations,
    characterMeets,
    shows,
    ropeDropPlan,
    timelineEvents
  };
};

export const formatTimelineForPrint = (timelineEvents: CheatSheetData['timelineEvents']) => {
  return timelineEvents.map(event => ({
    ...event,
    formattedTime: formatTime(event.time)
  }));
};

export const formatTime = (time: string): string => {
  if (!time) return '';

  try {
    const parts = time.split(':').map(Number);
    if (parts.length !== 2) return time;

    const [hours, minutes] = parts;
    if (hours === undefined || minutes === undefined) return time;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch {
    return time;
  }
};

export const generateMorningRopeDropPlan = (items: ItineraryItem[]): string[] => {
  const ropeDropItems = items
    .filter(item => item.isRopeDropTarget || (item.startTime && item.startTime <= '09:30'))
    .sort((a, b) => (a.priorityLevel || 99) - (b.priorityLevel || 99))
    .slice(0, 6); // First 6 items for rope drop

  return ropeDropItems.map((item, index) => {
    const time = item.startTime ? formatTime(item.startTime) : `${index === 0 ? 'EE/8:00' : `${8 + Math.floor(index / 2)}:${(index % 2) * 30}`}`;
    const action = index === 0 ? 'Headliner in open area' : 
                  index === 1 ? 'Second priority nearby' :
                  index === 2 ? 'Third priority / snack' :
                  index === 3 ? `Switch to LL window #${index - 2}` :
                  index === 4 ? 'Frequent short waits / characters' :
                  'Mobile order placed for lunch?';
    
    return `${time}: ${item.name} - ${action}`;
  });
};

export const getTransportationIcon = (method: string): string => {
  switch (method) {
    case 'car': return '🚗';
    case 'monorail': return '🚝';
    case 'bus': return '🚌';
    case 'boat': return '⛵';
    case 'rideshare': return '🚙';
    case 'walk': return '🚶';
    default: return '🚗';
  }
};