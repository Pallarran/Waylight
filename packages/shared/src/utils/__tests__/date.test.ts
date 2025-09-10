import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatTime,
  getDaysBetween,
  getTripDates,
  getCountdownDays,
  formatDuration,
} from '../date';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format ISO string date with default format', () => {
      const result = formatDate('2024-06-15');
      expect(result).toBe('Jun 15, 2024');
    });

    it('should format Date object with default format', () => {
      const date = new Date(2024, 5, 15); // Month is 0-indexed
      const result = formatDate(date);
      expect(result).toBe('Jun 15, 2024');
    });

    it('should format date with custom format', () => {
      const result = formatDate('2024-06-15', 'yyyy-MM-dd');
      expect(result).toBe('2024-06-15');
    });

    it('should format date with different custom format', () => {
      const result = formatDate('2024-06-15', 'MMMM do, yyyy');
      expect(result).toBe('June 15th, 2024');
    });

    it('should return empty string for invalid date', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('');
    });

    it('should handle edge cases gracefully', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate('2024-13-40')).toBe(''); // Invalid month/day
    });
  });

  describe('formatTime', () => {
    it('should format morning time', () => {
      const result = formatTime('09:30');
      expect(result).toBe('9:30 AM');
    });

    it('should format afternoon time', () => {
      const result = formatTime('14:45');
      expect(result).toBe('2:45 PM');
    });

    it('should format midnight', () => {
      const result = formatTime('00:00');
      expect(result).toBe('12:00 AM');
    });

    it('should format noon', () => {
      const result = formatTime('12:00');
      expect(result).toBe('12:00 PM');
    });

    it('should format 11 PM', () => {
      const result = formatTime('23:59');
      expect(result).toBe('11:59 PM');
    });

    it('should handle single digit hours', () => {
      const result = formatTime('01:15');
      expect(result).toBe('1:15 AM');
    });

    it('should pad minutes correctly', () => {
      const result = formatTime('15:05');
      expect(result).toBe('3:05 PM');
    });

    it('should return original string for invalid format', () => {
      expect(formatTime('25:00')).toBe('25:00'); // Invalid hour should return original
      expect(formatTime('invalid')).toBe('invalid');
      expect(formatTime('12:60')).toBe('12:60'); // Invalid minute should return original
      expect(formatTime('')).toBe('');
    });
  });

  describe('getDaysBetween', () => {
    it('should calculate days for single day trip', () => {
      const result = getDaysBetween('2024-06-15', '2024-06-15');
      expect(result).toBe(1);
    });

    it('should calculate days for multi-day trip', () => {
      const result = getDaysBetween('2024-06-15', '2024-06-18');
      expect(result).toBe(4); // 15th, 16th, 17th, 18th
    });

    it('should calculate days across month boundary', () => {
      const result = getDaysBetween('2024-06-30', '2024-07-02');
      expect(result).toBe(3); // 30th, 1st, 2nd
    });

    it('should calculate days across year boundary', () => {
      const result = getDaysBetween('2024-12-31', '2025-01-02');
      expect(result).toBe(3); // 31st, 1st, 2nd
    });

    it('should handle leap year correctly', () => {
      const result = getDaysBetween('2024-02-28', '2024-03-01');
      expect(result).toBe(3); // 28th, 29th (leap day), 1st
    });
  });

  describe('getTripDates', () => {
    it('should generate single date', () => {
      const result = getTripDates('2024-06-15', 1);
      expect(result).toEqual(['2024-06-15']);
    });

    it('should generate multiple consecutive dates', () => {
      const result = getTripDates('2024-06-15', 3);
      expect(result).toEqual(['2024-06-15', '2024-06-16', '2024-06-17']);
    });

    it('should handle month boundary', () => {
      const result = getTripDates('2024-06-30', 3);
      expect(result).toEqual(['2024-06-30', '2024-07-01', '2024-07-02']);
    });

    it('should handle year boundary', () => {
      const result = getTripDates('2024-12-31', 2);
      expect(result).toEqual(['2024-12-31', '2025-01-01']);
    });

    it('should handle leap year', () => {
      const result = getTripDates('2024-02-28', 3);
      expect(result).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
    });

    it('should handle zero days gracefully', () => {
      const result = getTripDates('2024-06-15', 0);
      expect(result).toEqual([]);
    });

    it('should generate longer sequences', () => {
      const result = getTripDates('2024-06-15', 7);
      expect(result).toEqual([
        '2024-06-15',
        '2024-06-16',
        '2024-06-17',
        '2024-06-18',
        '2024-06-19',
        '2024-06-20',
        '2024-06-21'
      ]);
    });
  });

  describe('getCountdownDays', () => {
    let originalDate: any;

    beforeEach(() => {
      // Mock today's date to 2024-06-01
      originalDate = Date;
      const mockDate = new Date(2024, 5, 1); // June 1, 2024
      vi.spyOn(global, 'Date').mockImplementation((...args) => {
        if (args.length === 0) {
          return mockDate;
        }
        return new originalDate(...args);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should calculate days until future trip', () => {
      const result = getCountdownDays('2024-06-15');
      expect(result).toBe(14); // June 1 to June 15 = 14 days
    });

    it('should return 0 for today', () => {
      const result = getCountdownDays('2024-06-01');
      expect(result).toBe(0);
    });

    it('should return 0 for past dates', () => {
      const result = getCountdownDays('2024-05-15');
      expect(result).toBe(0);
    });

    it('should calculate days across month boundaries', () => {
      const result = getCountdownDays('2024-07-05');
      expect(result).toBe(34); // June 1 to July 5
    });

    it('should handle year boundaries', () => {
      const result = getCountdownDays('2025-01-01');
      expect(result).toBe(214); // June 1, 2024 to January 1, 2025
    });
  });

  describe('formatDuration', () => {
    it('should format minutes less than an hour', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(45)).toBe('45 min');
      expect(formatDuration(1)).toBe('1 min');
      expect(formatDuration(59)).toBe('59 min');
    });

    it('should format exact hours', () => {
      expect(formatDuration(60)).toBe('1 hr');
      expect(formatDuration(120)).toBe('2 hr');
      expect(formatDuration(180)).toBe('3 hr');
    });

    it('should format hours with minutes', () => {
      expect(formatDuration(90)).toBe('1 hr 30 min');
      expect(formatDuration(135)).toBe('2 hr 15 min');
      expect(formatDuration(185)).toBe('3 hr 5 min');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0 min');
    });

    it('should handle large durations', () => {
      expect(formatDuration(1440)).toBe('24 hr'); // 1 day
      expect(formatDuration(1500)).toBe('25 hr'); // 1 day + 1 hour
      expect(formatDuration(1530)).toBe('25 hr 30 min'); // 1 day + 1.5 hours
    });

    it('should handle edge cases', () => {
      expect(formatDuration(61)).toBe('1 hr 1 min');
      expect(formatDuration(119)).toBe('1 hr 59 min');
      expect(formatDuration(121)).toBe('2 hr 1 min');
    });
  });

  describe('Date Edge Cases', () => {
    it('should handle different time zones consistently', () => {
      // Test that our date functions work consistently regardless of timezone
      const date1 = formatDate('2024-06-15T00:00:00Z');
      const date2 = formatDate('2024-06-15T23:59:59Z');
      
      // Both should format to the same date (different times don't affect date formatting)
      expect(date1).toBe('Jun 15, 2024');
      expect(date2).toBe('Jun 15, 2024');
    });

    it('should handle daylight saving time transitions', () => {
      // Test dates around DST transitions
      const springForward = getTripDates('2024-03-10', 2); // DST starts
      const fallBack = getTripDates('2024-11-03', 2); // DST ends
      
      expect(springForward).toEqual(['2024-03-10', '2024-03-11']);
      expect(fallBack).toEqual(['2024-11-03', '2024-11-04']);
    });

    it('should handle various date input formats', () => {
      const isoString = formatDate('2024-06-15T10:30:00.000Z');
      const dateObject = formatDate(new Date(2024, 5, 15)); // June 15
      
      expect(isoString).toBe('Jun 15, 2024');
      expect(dateObject).toBe('Jun 15, 2024');
    });
  });
});