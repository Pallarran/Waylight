import { format, parseISO, differenceInDays, addDays, isValid } from 'date-fns';

export const formatDate = (date: string | Date, formatString = 'MMM d, yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatString) : '';
};

export const formatTime = (time: string): string => {
  // Convert 24hr to 12hr format with AM/PM
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  
  if (isNaN(hours) || isNaN(minutes) || hours > 23 || hours < 0 || minutes > 59 || minutes < 0) {
    return time; // Return original if invalid format
  }
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const getDaysBetween = (startDate: string, endDate: string): number => {
  return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
};

export const getTripDates = (startDate: string, numberOfDays: number): string[] => {
  const dates: string[] = [];
  const start = parseISO(startDate);
  
  for (let i = 0; i < numberOfDays; i++) {
    dates.push(format(addDays(start, i), 'yyyy-MM-dd'));
  }
  
  return dates;
};

export const getCountdownDays = (tripDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trip = parseISO(tripDate);
  trip.setHours(0, 0, 0, 0);
  
  const days = differenceInDays(trip, today);
  return Math.max(0, days);
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
};