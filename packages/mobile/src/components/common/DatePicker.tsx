import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: string) => void;
  selectedDate?: string;
  title?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  initialViewDate?: Date;
}

interface CalendarDay {
  date: number;
  dateString: string;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
}

export default function DatePicker({
  visible,
  onClose,
  onDateSelect,
  selectedDate,
  title = 'Select Date',
  minimumDate,
  maximumDate,
  initialViewDate,
}: DatePickerProps) {
  const today = new Date();
  const viewDate = initialViewDate || today;
  const [currentMonth, setCurrentMonth] = useState(viewDate.getMonth());
  const [currentYear, setCurrentYear] = useState(viewDate.getFullYear());

  // Reset to initial view date when modal opens
  React.useEffect(() => {
    if (visible) {
      const resetDate = initialViewDate || today;
      setCurrentMonth(resetDate.getMonth());
      setCurrentYear(resetDate.getFullYear());
    }
  }, [visible, initialViewDate]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number): CalendarDay[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday

    const days: CalendarDay[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();
      const date = prevMonthDays - (startDay - 1 - i);
      const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      
      days.push({
        date,
        dateString,
        isCurrentMonth: false,
        isSelected: selectedDate === dateString,
        isToday: false,
        isDisabled: isDateDisabled(new Date(prevYear, prevMonth, date)),
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDate = new Date(year, month, day);
      const isToday = 
        day === today.getDate() && 
        month === today.getMonth() && 
        year === today.getFullYear();

      days.push({
        date: day,
        dateString,
        isCurrentMonth: true,
        isSelected: selectedDate === dateString,
        isToday,
        isDisabled: isDateDisabled(currentDate),
      });
    }

    // Add days from next month to fill the calendar grid
    const remainingCells = 42 - days.length; // 6 rows × 7 days = 42 cells
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    for (let day = 1; day <= remainingCells; day++) {
      const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      days.push({
        date: day,
        dateString,
        isCurrentMonth: false,
        isSelected: selectedDate === dateString,
        isToday: false,
        isDisabled: isDateDisabled(new Date(nextYear, nextMonth, day)),
      });
    }

    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    if (minimumDate && date < minimumDate) return true;
    if (maximumDate && date > maximumDate) return true;
    return false;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleDateSelect = (day: CalendarDay) => {
    if (day.isDisabled) return;
    console.log('Date selected:', day.dateString);
    onDateSelect(day.dateString);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    const date = new Date(selectedDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const days = getDaysInMonth(currentMonth, currentYear);

  console.log('DatePicker rendering with visible:', visible);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity 
            onPress={() => {
              if (selectedDate) {
                console.log('Done pressed with selectedDate:', selectedDate);
                onDateSelect(selectedDate);
                onClose();
              }
            }}
            disabled={!selectedDate}
          >
            <Text style={[
              styles.doneButton,
              !selectedDate && styles.doneButtonDisabled
            ]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {selectedDate && (
          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateText}>{formatSelectedDate()}</Text>
          </View>
        )}

        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            onPress={() => navigateMonth('prev')}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={24} color="#0EA5A8" />
          </TouchableOpacity>
          
          <Text style={styles.monthYear}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          
          <TouchableOpacity 
            onPress={() => navigateMonth('next')}
            style={styles.navButton}
          >
            <Ionicons name="chevron-forward" size={24} color="#0EA5A8" />
          </TouchableOpacity>
        </View>

        <View style={styles.daysHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={styles.dayHeaderText}>{day}</Text>
          ))}
        </View>

        <ScrollView style={styles.calendarContainer}>
          <View style={styles.calendar}>
            {Array.from({ length: 6 }, (_, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
                  <TouchableOpacity
                    key={`${weekIndex}-${dayIndex}`}
                    onPress={() => handleDateSelect(day)}
                    disabled={day.isDisabled}
                    style={[
                      styles.dayButton,
                      day.isSelected && styles.selectedDay,
                      day.isToday && !day.isSelected && styles.todayDay,
                      day.isDisabled && styles.disabledDay,
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      !day.isCurrentMonth && styles.otherMonthText,
                      day.isSelected && styles.selectedDayText,
                      day.isToday && !day.isSelected && styles.todayText,
                      day.isDisabled && styles.disabledDayText,
                    ]}>
                      {day.date}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748B',
  },
  doneButton: {
    fontSize: 16,
    color: '#0EA5A8',
    fontWeight: '600',
  },
  doneButtonDisabled: {
    color: '#CBD5E1',
  },
  selectedDateContainer: {
    padding: 16,
    backgroundColor: '#F0FDFA',
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  selectedDateText: {
    fontSize: 16,
    color: '#0EA5A8',
    fontWeight: '500',
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
  },
  daysHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  calendarContainer: {
    flex: 1,
  },
  calendar: {
    paddingHorizontal: 16,
  },
  week: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayButton: {
    flex: 1,
    minHeight: 44,
    minWidth: 44,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  selectedDay: {
    backgroundColor: '#0EA5A8',
  },
  todayDay: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#0EA5A8',
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  otherMonthText: {
    color: '#CBD5E1',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  todayText: {
    color: '#0EA5A8',
    fontWeight: '600',
  },
  disabledDayText: {
    color: '#CBD5E1',
  },
});