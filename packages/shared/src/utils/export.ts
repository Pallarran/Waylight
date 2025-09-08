import type { Trip, Attraction, Park } from '../types';
import { formatDate, formatTime, formatDuration } from './date';

interface ExportData {
  trip: Trip;
  parks: Park[];
  attractions: Attraction[];
}

export const exportToText = (data: ExportData, includeNotes = true, includeTips = false): string => {
  const { trip, parks, attractions } = data;
  const lines: string[] = [];
  
  // Header
  lines.push(`🎢 ${trip.name}`);
  lines.push(`${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`);
  lines.push('═'.repeat(40));
  lines.push('');
  
  // Each day
  trip.days.forEach((day, dayIndex) => {
    const park = parks.find(p => p.id === day.parkId);
    lines.push(`Day ${dayIndex + 1}: ${formatDate(day.date, 'EEEE, MMM d')}`);
    lines.push(`📍 ${park?.name || 'Unknown Park'}`);
    if (includeNotes && day.notes) {
      lines.push(`Notes: ${day.notes}`);
    }
    lines.push('─'.repeat(30));
    
    // Itinerary items
    const sortedItems = [...day.items].sort((a, b) => a.order - b.order);
    sortedItems.forEach((item, index) => {
      const attraction = attractions.find(a => a.id === item.attractionId);
      if (!attraction) return;
      
      const checkmark = item.completed ? '✓' : '○';
      const timeStr = item.timeSlot ? `${formatTime(item.timeSlot)} - ` : '';
      const duration = formatDuration(item.duration || attraction.duration);
      
      lines.push(`${checkmark} ${index + 1}. ${timeStr}${attraction.name} (${duration})`);
      
      if (includeNotes && item.notes) {
        lines.push(`   Note: ${item.notes}`);
      }
      
      if (includeTips && attraction.tips.length > 0) {
        const topTip = attraction.tips
          .sort((a, b) => b.priority - a.priority)[0];
        if (topTip) {
          lines.push(`   💡 ${topTip.content}`);
        }
      }
    });
    
    lines.push('');
  });
  
  // Footer
  lines.push('─'.repeat(40));
  lines.push('Created with Waylight ✨');
  lines.push(`Exported on ${formatDate(new Date())}`);
  
  return lines.join('\n');
};

export const exportToJSON = (data: ExportData): string => {
  return JSON.stringify(data, null, 2);
};

export const generateShareText = (trip: Trip, park?: Park): string => {
  const days = trip.days.length;
  const totalAttractions = trip.days.reduce((sum, day) => sum + day.items.length, 0);
  
  if (park) {
    const dayWithPark = trip.days.find(d => d.parkId === park.id);
    const attractionCount = dayWithPark?.items.length || 0;
    return `Check out my ${park.name} plan for ${formatDate(dayWithPark?.date || trip.startDate)}! ${attractionCount} attractions planned. Created with Waylight 🎢`;
  }
  
  return `My ${days}-day theme park trip starts ${formatDate(trip.startDate)}! ${totalAttractions} attractions planned across ${days} parks. Created with Waylight 🎢`;
};