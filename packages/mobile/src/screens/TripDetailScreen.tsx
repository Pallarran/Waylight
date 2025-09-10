import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  withTiming 
} from 'react-native-reanimated';
import { useTripStore } from '../stores/useTripStore';
import { useAttractionStore } from '../stores/useAttractionStore';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import type { Trip, TripDay, ItineraryItem, Park, Attraction } from '@waylight/shared';
import { getParks, getAttractions } from '@waylight/shared';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const LONG_PRESS_DURATION = 500;

interface TripDetailScreenProps {
  route: {
    params: {
      tripId: string;
    };
  };
  navigation: any;
}

export default function TripDetailScreen({ route, navigation }: TripDetailScreenProps) {
  const { tripId } = route.params;
  const {
    trips,
    activeTrip,
    addDay,
    updateDay,
    deleteDay,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
  } = useTripStore();
  const { getAttractionById } = useAttractionStore();

  const trip = trips.find(t => t.id === tripId);
  const [selectedDay, setSelectedDay] = useState<TripDay | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showAddDay, setShowAddDay] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [newDayDate, setNewDayDate] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [showParkPicker, setShowParkPicker] = useState(false);
  const [showAttractionPicker, setShowAttractionPicker] = useState(false);
  const [selectedDayForPark, setSelectedDayForPark] = useState<TripDay | null>(null);
  const [availableParks, setAvailableParks] = useState<Park[]>([]);
  const [dayAttractions, setDayAttractions] = useState<Attraction[]>([]);

  useEffect(() => {
    if (!trip) {
      navigation.goBack();
    }
  }, [trip, navigation]);

  useEffect(() => {
    // Load available parks
    const parks = getParks();
    setAvailableParks(parks);
  }, []);

  useEffect(() => {
    // Load attractions for selected day's park
    if (selectedDay?.parkId) {
      const loadAttractions = async () => {
        try {
          const allAttractions = getAttractions();
          const parkAttractions = allAttractions.filter(a => a.parkId === selectedDay.parkId);
          setDayAttractions(parkAttractions);
        } catch (error) {
          console.error('Error loading attractions:', error);
          setDayAttractions([]);
        }
      };
      loadAttractions();
    } else {
      setDayAttractions([]);
    }
  }, [selectedDay]);

  if (!trip) return null;

  const handleDayPress = (day: TripDay) => {
    setSelectedDay(selectedDay?.id === day.id ? null : day);
  };

  const handleAddDay = async () => {
    if (!newDayDate) {
      Alert.alert('Error', 'Please enter a date');
      return;
    }

    try {
      await addDay(tripId, newDayDate);
      setShowAddDay(false);
      setNewDayDate('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add day');
    }
  };

  const handleDeleteDay = (dayId: string) => {
    Alert.alert(
      'Delete Day',
      'Are you sure you want to delete this day and all its items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDay(tripId, dayId);
            setEditMode(false);
          },
        },
      ]
    );
  };

  const handleLongPressDay = (day: TripDay) => {
    if (!editMode) {
      setEditMode(true);
      setSelectedDay(day);
    }
  };

  const exitEditMode = () => {
    setEditMode(false);
    setSelectedDay(null);
  };

  const handleSelectPark = (day: TripDay) => {
    setSelectedDayForPark(day);
    setShowParkPicker(true);
  };

  const handleParkSelection = async (parkId: string) => {
    if (!selectedDayForPark) return;
    
    try {
      await updateDay(tripId, selectedDayForPark.id, { parkId });
      setShowParkPicker(false);
      setSelectedDayForPark(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update park');
    }
  };

  const handleAddAttraction = () => {
    if (!selectedDay?.parkId) {
      Alert.alert('Select Park First', 'Please select a park for this day before adding attractions.');
      return;
    }
    setShowAttractionPicker(true);
  };

  const handleAttractionSelection = async (attraction: Attraction) => {
    if (!selectedDay) return;
    
    try {
      await addItem(tripId, selectedDay.id, {
        attractionId: attraction.id,
        name: attraction.name,
        estimatedDuration: attraction.duration || 60,
        notes: '',
      });
      setShowAttractionPicker(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add attraction');
    }
  };

  const getParkName = (parkId: string) => {
    const park = availableParks.find(p => p.id === parkId);
    return park ? park.name : parkId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleEditItem = (item: ItineraryItem) => {
    setEditingItem(item);
    setItemNotes(item.notes || '');
    setShowEditItem(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !selectedDay) return;

    try {
      await updateItem(tripId, selectedDay.id, editingItem.id, {
        notes: itemNotes,
      });
      setShowEditItem(false);
      setEditingItem(null);
      setItemNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleDeleteItem = (dayId: string, itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from your itinerary?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteItem(tripId, dayId, itemId),
        },
      ]
    );
  };

  const formatDate = (date: Date | string) => {
    // Handle both string and Date objects properly
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const renderDayCard = (day: TripDay) => {
    const isSelected = selectedDay?.id === day.id;
    const isInEditMode = editMode && isSelected;
    
    // Long press gesture for edit mode
    const longPressGesture = Gesture.LongPress()
      .minDuration(LONG_PRESS_DURATION)
      .onStart(() => {
        runOnJS(handleLongPressDay)(day);
      });

    return (
      <View style={styles.dayCardContainer} key={day.id}>
        <GestureDetector gesture={longPressGesture}>
          <Card 
            style={[
              styles.dayCard, 
              isSelected && styles.selectedDayCard,
              isInEditMode && styles.editModeCard
            ]}
            pressable
            onPress={() => handleDayPress(day)}
          >
            <View style={styles.dayHeader}>
              <View style={styles.dayInfo}>
                <Text style={[styles.dayDate, isInEditMode && styles.editModeText]}>
                  {formatDate(day.date)}
                </Text>
                <View style={styles.dayMetaRow}>
                  <Text style={styles.dayMeta}>
                    {day.items.length} attractions
                  </Text>
                  {day.parkId ? (
                    <TouchableOpacity 
                      onPress={() => handleSelectPark(day)}
                      style={styles.parkChip}
                    >
                      <Ionicons name="location" size={12} color="#0EA5A8" />
                      <Text style={styles.parkChipText}>{getParkName(day.parkId)}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => handleSelectPark(day)}
                      style={styles.selectParkChip}
                    >
                      <Ionicons name="add" size={12} color="#64748B" />
                      <Text style={styles.selectParkText}>Select Park</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {isInEditMode && (
                <TouchableOpacity
                  onPress={() => handleDeleteDay(day.id)}
                  style={styles.dayDeleteButton}
                >
                  <Ionicons name="trash" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        </GestureDetector>

        {isSelected && (
          <View style={styles.itemsList}>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsHeaderText}>Attractions</Text>
              <TouchableOpacity 
                onPress={handleAddAttraction}
                style={styles.addAttractionButton}
              >
                <Ionicons name="add" size={16} color="#0EA5A8" />
                <Text style={styles.addAttractionText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            {day.items.map((item, index) => {
              const attraction = getAttractionById(item.attractionId);
              return (
                <ItineraryItemCard
                  key={item.id}
                  item={item}
                  attraction={attraction}
                  dayId={day.id}
                  index={index}
                  totalItems={day.items.length}
                  onEdit={() => handleEditItem(item)}
                  onDelete={() => handleDeleteItem(day.id, item.id)}
                  onReorder={(fromIndex, toIndex) => reorderItems(tripId, day.id, fromIndex, toIndex)}
                />
              );
            })}
            {day.items.length === 0 && (
              <View style={styles.emptyItems}>
                <Text style={styles.emptyItemsText}>No attractions planned yet</Text>
                <Text style={styles.emptyItemsSubtext}>Tap "Add" to include attractions for this day</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{trip.name}</Text>
            {!editMode && trip.days.length === 0 && (
              <Text style={styles.subtleHint}>Tap + to add your first day</Text>
            )}
            {!editMode && trip.days.length > 0 && (
              <Text style={styles.subtleHint}>Tap days to expand • Long press to edit</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => setShowAddDay(true)}>
            <Ionicons name="add" size={24} color="#0EA5A8" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.tripInfo}>
            <Text style={styles.tripDates}>
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </Text>
            <Text style={styles.tripStats}>
              {trip.days.length} days • {trip.days.reduce((total, day) => total + day.items.length, 0)} attractions
            </Text>
          </View>

          {editMode && (
            <View style={styles.editModeHeader}>
              <View style={styles.editModeInfo}>
                <Ionicons name="create-outline" size={20} color="#EF4444" />
                <Text style={styles.editModeText}>Edit Mode - Tap to delete days</Text>
              </View>
              <TouchableOpacity onPress={exitEditMode} style={styles.exitEditButton}>
                <Text style={styles.exitEditText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          

          {trip.days.map(day => renderDayCard(day))}
        </ScrollView>

        {/* Add Day Modal */}
        <Modal
          visible={showAddDay}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddDay(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddDay(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Day</Text>
              <TouchableOpacity onPress={handleAddDay}>
                <Text style={styles.saveButton}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={newDayDate}
                  onChangeText={setNewDayDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Edit Item Modal */}
        <Modal
          visible={showEditItem}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditItem(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditItem(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <TouchableOpacity onPress={handleUpdateItem}>
                <Text style={styles.saveButton}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={itemNotes}
                  onChangeText={setItemNotes}
                  placeholder="Add notes about this attraction..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => {
                    if (editingItem && selectedDay) {
                      handleDeleteItem(selectedDay.id, editingItem.id);
                      setShowEditItem(false);
                      setEditingItem(null);
                    }
                  }}
                  style={styles.deleteItemButton}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.deleteItemText}>Remove from trip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Park Picker Modal */}
        <Modal
          visible={showParkPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowParkPicker(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowParkPicker(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Park</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.modalContent}>
              {availableParks.map((park) => (
                <TouchableOpacity
                  key={park.id}
                  onPress={() => handleParkSelection(park.id)}
                  style={styles.parkOption}
                >
                  <View style={styles.parkOptionContent}>
                    <Ionicons name="location" size={20} color="#0EA5A8" />
                    <View style={styles.parkOptionText}>
                      <Text style={styles.parkOptionName}>{park.name}</Text>
                      <Text style={styles.parkOptionDescription}>{park.description}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Attraction Picker Modal */}
        <Modal
          visible={showAttractionPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAttractionPicker(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAttractionPicker(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Attraction</Text>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedDay?.parkId && (
                <View style={styles.parkHeader}>
                  <Ionicons name="location" size={16} color="#0EA5A8" />
                  <Text style={styles.parkHeaderText}>{getParkName(selectedDay.parkId)}</Text>
                </View>
              )}
              
              {dayAttractions.map((attraction) => {
                const isAlreadyAdded = selectedDay?.items.some(item => item.attractionId === attraction.id);
                return (
                  <TouchableOpacity
                    key={attraction.id}
                    onPress={() => !isAlreadyAdded && handleAttractionSelection(attraction)}
                    style={[
                      styles.attractionOption,
                      isAlreadyAdded && styles.attractionOptionDisabled
                    ]}
                    disabled={isAlreadyAdded}
                  >
                    <View style={styles.attractionOptionContent}>
                      <View style={styles.attractionInfo}>
                        <Text style={[
                          styles.attractionName,
                          isAlreadyAdded && styles.attractionNameDisabled
                        ]}>
                          {attraction.name}
                        </Text>
                        <Text style={[
                          styles.attractionDescription,
                          isAlreadyAdded && styles.attractionDescriptionDisabled
                        ]}>
                          {attraction.description}
                        </Text>
                        <View style={styles.attractionMeta}>
                          <View style={styles.durationBadge}>
                            <Ionicons name="time-outline" size={12} color={isAlreadyAdded ? "#94A3B8" : "#64748B"} />
                            <Text style={[
                              styles.durationText,
                              isAlreadyAdded && styles.durationTextDisabled
                            ]}>
                              {attraction.duration || 60}min
                            </Text>
                          </View>
                        </View>
                      </View>
                      {isAlreadyAdded ? (
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      ) : (
                        <Ionicons name="add-circle-outline" size={20} color="#0EA5A8" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
              
              {dayAttractions.length === 0 && selectedDay?.parkId && (
                <View style={styles.emptyAttractions}>
                  <Text style={styles.emptyAttractionsText}>No attractions available</Text>
                  <Text style={styles.emptyAttractionsSubtext}>Check the Attractions tab for more options</Text>
                </View>
              )}
              
              {!selectedDay?.parkId && (
                <View style={styles.noParkSelected}>
                  <Text style={styles.noParkText}>Please select a park first</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// Separate component for itinerary items with drag/drop
interface ItineraryItemCardProps {
  item: ItineraryItem;
  attraction: any;
  dayId: string;
  index: number;
  totalItems: number;
  onEdit: () => void;
  onDelete: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

function ItineraryItemCard({ 
  item, 
  attraction, 
  index, 
  totalItems, 
  onEdit, 
  onDelete, 
  onReorder 
}: ItineraryItemCardProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Card style={styles.itemCard} pressable onPress={onEdit}>
      <View style={styles.itemContent}>
        <View style={styles.itemHandle}>
          <Ionicons name="reorder-two" size={16} color="#94A3B8" />
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {attraction && (
            <Text style={styles.itemLocation}>{attraction.location}</Text>
          )}
          <View style={styles.itemMeta}>
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={12} color="#64748B" />
              <Text style={styles.durationText}>
                {formatDuration(item.estimatedDuration)}
              </Text>
            </View>
          </View>
          {item.notes && (
            <Text style={styles.itemNotes} numberOfLines={2}>{item.notes}</Text>
          )}
        </View>

        <TouchableOpacity onPress={onEdit} style={styles.itemEditButton}>
          <Ionicons name="ellipsis-horizontal" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>
    </Card>
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
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtleHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tripInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tripDates: {
    fontSize: 16,
    color: '#0EA5A8',
    fontWeight: '500',
    marginBottom: 4,
  },
  tripStats: {
    fontSize: 14,
    color: '#64748B',
  },
  editModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  editModeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editModeText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  exitEditButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exitEditText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dayCardContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
    position: 'relative',
  },
  actionBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  dayCard: {
    padding: 16,
  },
  selectedDayCard: {
    borderColor: '#0EA5A8',
    borderWidth: 2,
  },
  editModeCard: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayInfo: {
    flex: 1,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  dayMeta: {
    fontSize: 14,
    color: '#64748B',
  },
  dayMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  parkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0EA5A8',
    gap: 4,
  },
  parkChipText: {
    fontSize: 12,
    color: '#0EA5A8',
    fontWeight: '600',
  },
  selectParkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  selectParkText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  dayDeleteButton: {
    padding: 4,
    marginTop: -4,
    marginRight: -4,
  },
  itemsList: {
    marginTop: 8,
    paddingLeft: 16,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  itemsHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  addAttractionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  addAttractionText: {
    fontSize: 12,
    color: '#0EA5A8',
    fontWeight: '600',
  },
  itemCard: {
    marginBottom: 8,
    backgroundColor: '#FEFEFE',
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5A8',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  itemHandle: {
    paddingRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  itemLocation: {
    fontSize: 12,
    color: '#0EA5A8',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  durationText: {
    fontSize: 11,
    color: '#64748B',
  },
  itemNotes: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  itemEditButton: {
    padding: 4,
    marginLeft: 8,
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyItemsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  emptyItemsSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
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
  modalActions: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  deleteItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  deleteItemText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  headerSpacer: {
    width: 50,
  },
  parkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  parkOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  parkOptionText: {
    flex: 1,
  },
  parkOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  parkOptionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
  parkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F0FDFA',
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  parkHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5A8',
  },
  attractionOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  attractionOptionDisabled: {
    opacity: 0.6,
  },
  attractionOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attractionInfo: {
    flex: 1,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  attractionNameDisabled: {
    color: '#94A3B8',
  },
  attractionDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 18,
  },
  attractionDescriptionDisabled: {
    color: '#CBD5E1',
  },
  attractionMeta: {
    flexDirection: 'row',
  },
  durationTextDisabled: {
    color: '#CBD5E1',
  },
  emptyAttractions: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyAttractionsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  emptyAttractionsSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  noParkSelected: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  noParkText: {
    fontSize: 16,
    color: '#64748B',
  },
});