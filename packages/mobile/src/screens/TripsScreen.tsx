import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTripStore } from '../stores/useTripStore';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import DatePicker from '../components/common/DatePicker';
import { Icons, iconProps } from '../components/common/Icons';
import type { Trip } from '@waylight/shared';

interface TripsScreenProps {
  navigation: any;
}

export default function TripsScreen({ navigation }: TripsScreenProps) {
  const {
    trips,
    activeTrip,
    isLoading,
    error,
    loadTrips,
    createNewTrip,
    deleteTripById,
    setActiveTrip,
  } = useTripStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleCreateTrip = async () => {
    if (!tripName || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    try {
      await createNewTrip(tripName, startDate, endDate);
      setShowCreateModal(false);
      setTripName('');
      setStartDate('');
      setEndDate('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create trip');
    }
  };

  const handleStartDateSelect = (date: string) => {
    setStartDate(date);
    if (endDate && new Date(date) >= new Date(endDate)) {
      setEndDate('');
    }
    setShowStartDatePicker(false);
  };

  const handleEndDateSelect = (date: string) => {
    setEndDate(date);
    setShowEndDatePicker(false);
  };

  const formatDateForDisplay = (date: string) => {
    if (!date) return '';
    const dateObj = new Date(date + 'T00:00:00');
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeleteTrip = (tripId: string, tripName: string) => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${tripName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTripById(tripId),
        },
      ]
    );
  };

  const formatDate = (date: string | Date) => {
    // Handle both string and Date objects properly
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderTripCard = ({ item }: { item: Trip }) => {
    const isActive = activeTrip?.id === item.id;
    
    return (
      <Card 
        style={[
          styles.tripCard, 
          isActive && styles.tripCardActive
        ]} 
        pressable 
        onPress={() => {
          setActiveTrip(item.id);
          navigation.navigate('TripDetail', { tripId: item.id });
        }}
      >
        <View style={styles.tripHeader}>
          <View style={styles.tripInfo}>
            <View style={styles.tripTitleRow}>
              <Text style={[styles.tripName, isActive && styles.tripNameActive]}>
                {item.name}
              </Text>
              {isActive && (
                <View style={styles.activeIndicator}>
                  <Icons.Check size={18} color="#4ECDC4" strokeWidth={2} />
                  <Text style={styles.activeText}>Planning</Text>
                </View>
              )}
            </View>
            <Text style={styles.tripDates}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
            <Text style={styles.tripDetails}>
              {item.days.length} days • {item.days.reduce((total, day) => total + day.items.length, 0)} attractions
            </Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteTrip(item.id, item.name);
            }}
            style={styles.deleteButton}
          >
            <Icons.Trash2 size={20} color="#EF4444" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icons.Compass size={64} color="#4ECDC4" strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>Let's light the way</Text>
      <Text style={styles.emptySubtitle}>
        Add your first park day and start planning your magical adventure
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <Button
          title="New Trip"
          onPress={() => setShowCreateModal(true)}
          size="sm"
          style={styles.newTripButton}
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={trips}
        renderItem={renderTripCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshing={isLoading}
        onRefresh={loadTrips}
      />

      {/* Create Trip Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Trip</Text>
            <TouchableOpacity onPress={handleCreateTrip}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Trip Name</Text>
              <TextInput
                style={styles.input}
                value={tripName}
                onChangeText={setTripName}
                placeholder="Disney World Adventure"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  console.log('Start date picker pressed');
                  console.log('Current showStartDatePicker state:', showStartDatePicker);
                  setShowStartDatePicker(true);
                  console.log('Setting showStartDatePicker to true');
                }}
              >
                <Text style={[
                  styles.dateInputText,
                  !startDate && styles.dateInputPlaceholder
                ]}>
                  {startDate ? formatDateForDisplay(startDate) : 'Select start date'}
                </Text>
                <Icons.Calendar size={20} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
                disabled={!startDate}
              >
                <Text style={[
                  styles.dateInputText,
                  !endDate && styles.dateInputPlaceholder,
                  !startDate && styles.dateInputDisabled
                ]}>
                  {endDate ? formatDateForDisplay(endDate) : !startDate ? 'Select start date first' : 'Select end date'}
                </Text>
                <Icons.Calendar size={20} color={!startDate ? '#CBD5E1' : '#64748B'} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Pickers inside the modal */}
          <DatePicker
            visible={showStartDatePicker}
            onClose={() => {
              console.log('Start DatePicker onClose called');
              setShowStartDatePicker(false);
            }}
            onDateSelect={handleStartDateSelect}
            selectedDate={startDate}
            title="Select Start Date"
            minimumDate={new Date()}
          />

          <DatePicker
            visible={showEndDatePicker}
            onClose={() => setShowEndDatePicker(false)}
            onDateSelect={handleEndDateSelect}
            selectedDate={endDate}
            title="Select End Date"
            minimumDate={startDate ? new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000) : new Date()}
            initialViewDate={startDate ? new Date(startDate + 'T00:00:00') : undefined}
          />
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  newTripButton: {
    paddingHorizontal: 16,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  tripCard: {
    marginBottom: 12,
    padding: 16,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  tripDates: {
    fontSize: 14,
    color: '#0EA5A8',
    marginBottom: 4,
  },
  tripDetails: {
    fontSize: 12,
    color: '#64748B',
  },
  deleteButton: {
    padding: 8,
    marginTop: -8,
    marginRight: -8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  cancelButton: {
    fontSize: 16,
    color: '#64748B',
  },
  saveButton: {
    fontSize: 16,
    color: '#0EA5A8',
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  dateInputText: {
    fontSize: 16,
    color: '#0F172A',
  },
  dateInputPlaceholder: {
    color: '#94A3B8',
  },
  dateInputDisabled: {
    color: '#CBD5E1',
  },
  tripCardActive: {
    borderWidth: 2,
    borderColor: '#0EA5A8',
    backgroundColor: '#F0FDFA',
  },
  tripTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tripNameActive: {
    color: '#0EA5A8',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5A8',
  },
});