import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAttractionStore } from '../stores/useAttractionStore';
import { useTripStore } from '../stores/useTripStore';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import VirtualizedList from '../components/optimized/VirtualizedList';
import { Ionicons } from '@expo/vector-icons';
import { Icons } from '../components/common/Icons';
import type { Attraction } from '@waylight/shared';

export default function AttractionsScreen() {
  const {
    filteredAttractions,
    selectedAttraction,
    searchQuery,
    selectedPark,
    isLoading,
    loadAttractions,
    searchAttractions,
    filterByPark,
    setSelectedAttraction,
    clearSearch,
  } = useAttractionStore();

  const { activeTrip, addItem } = useTripStore();
  
  const [showDetail, setShowDetail] = useState(false);
  const [showAddToTrip, setShowAddToTrip] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [intensityFilter, setIntensityFilter] = useState<string | null>(null);
  const [parkFilter, setParkFilter] = useState<string | null>(null);

  useEffect(() => {
    loadAttractions();
  }, [loadAttractions]);

  const handleAttractionPress = (attraction: Attraction) => {
    setSelectedAttraction(attraction);
    setShowDetail(true);
  };

  const handleAddToTrip = async (dayId: string) => {
    if (!selectedAttraction || !activeTrip) return;
    
    try {
      await addItem(activeTrip.id, dayId, {
        attractionId: selectedAttraction.id,
        name: selectedAttraction.name,
        type: 'attraction',
        estimatedDuration: selectedAttraction.duration,
        notes: '',
      });
      setShowAddToTrip(false);
      setShowDetail(false);
    } catch (error) {
      // Handle error
      console.error('Failed to add attraction to trip:', error);
    }
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setIntensityFilter(null);
    setParkFilter(null);
    setShowFilterModal(false);
  };

  // Filter attractions based on both park and intensity
  const filteredByAll = useMemo(() => {
    let filtered = filteredAttractions;
    
    // Apply park filter
    if (parkFilter) {
      filtered = filtered.filter(attraction => attraction.parkId === parkFilter);
    }
    
    // Apply intensity filter
    if (intensityFilter) {
      if (intensityFilter === 'family') {
        filtered = filtered.filter(attraction => attraction.intensity === 'low');
      } else if (intensityFilter === 'thrill') {
        filtered = filtered.filter(attraction => 
          attraction.intensity === 'high' || attraction.intensity === 'moderate'
        );
      }
    }
    
    return filtered;
  }, [filteredAttractions, intensityFilter, parkFilter]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const renderAttractionCard = useCallback(({ item }: { item: Attraction }) => (
    <Card style={styles.attractionCard} pressable onPress={() => handleAttractionPress(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.attractionName}>{item.name}</Text>
        <Text style={styles.attractionLocation}>{item.location}</Text>
        <Text style={styles.attractionDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.attractionMeta}>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={12} color="#64748B" />
            <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
          </View>
          {item.heightRequirement && (
            <View style={styles.heightBadge}>
              <Ionicons name="resize-outline" size={12} color="#64748B" />
              <Text style={styles.heightText}>{item.heightRequirement}"</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  ), []);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icons.Sparkles size={64} color="#4ECDC4" strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>Your path awaits</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search filters to discover new adventures
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search attractions..."
            value={searchQuery}
            onChangeText={searchAttractions}
            placeholderTextColor="#94A3B8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, (intensityFilter || parkFilter) && styles.filterButtonActive]}
          onPress={handleFilterPress}
        >
          <Ionicons name="filter-outline" size={20} color={(intensityFilter || parkFilter) ? '#FFFFFF' : '#64748B'} />
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredByAll.length} attractions
          {(intensityFilter || parkFilter) && (
            <Text style={styles.filterText}>
              {intensityFilter === 'family' && ' • Family-Friendly'}
              {intensityFilter === 'thrill' && ' • Thrill Rides'}
              {parkFilter === 'magic-kingdom' && ' • Magic Kingdom'}
            </Text>
          )}
        </Text>
      </View>

      {/* Attractions List */}
      <VirtualizedList
        data={filteredByAll}
        renderItem={renderAttractionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshing={isLoading}
        onRefresh={loadAttractions}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={120}
        initialNumToRender={8}
        windowSize={5}
      />

      {/* Attraction Detail Modal */}
      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetail(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedAttraction?.name}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setShowDetail(false);
                setShowAddToTrip(true);
              }}
              style={styles.addButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#0EA5A8" />
            </TouchableOpacity>
          </View>

          {selectedAttraction && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.attractionNameLarge}>{selectedAttraction.name}</Text>
              <Text style={styles.attractionLocationLarge}>{selectedAttraction.location}</Text>
              
              <View style={styles.metaRow}>
                <View style={styles.durationBadgeLarge}>
                  <Ionicons name="time-outline" size={16} color="#64748B" />
                  <Text style={styles.durationTextLarge}>
                    {formatDuration(selectedAttraction.duration)}
                  </Text>
                </View>
                {selectedAttraction.heightRequirement && (
                  <View style={styles.heightBadgeLarge}>
                    <Ionicons name="resize-outline" size={16} color="#64748B" />
                    <Text style={styles.heightTextLarge}>
                      {selectedAttraction.heightRequirement}" minimum
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.attractionDescriptionLarge}>
                {selectedAttraction.description}
              </Text>

              {selectedAttraction.tips && selectedAttraction.tips.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Tips</Text>
                  {selectedAttraction.tips.map((tip, index) => (
                    <View key={index} style={styles.tipContainer}>
                      <Text style={styles.tipText}>• {tip.content}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Add to Trip Modal */}
      {!showDetail && (
        <Modal
          visible={showAddToTrip}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddToTrip(false)}
        >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddToTrip(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add to Trip</Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.modalContent}>
            {activeTrip ? (
              <>
                <Text style={styles.sectionTitle}>Select Day</Text>
                {activeTrip.days.map((day) => (
                  <TouchableOpacity
                    key={day.id}
                    style={styles.dayButton}
                    onPress={() => handleAddToTrip(day.id)}
                  >
                    <Text style={styles.dayButtonText}>
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.dayButtonSubtext}>
                      {day.items.length} attractions planned
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={styles.noTripContainer}>
                <Text style={styles.noTripText}>
                  Create a trip first to add attractions to your itinerary
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Attractions</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearButton}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Park Filter */}
            <Text style={styles.sectionTitle}>Park</Text>
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={[styles.filterOption, !parkFilter && styles.filterOptionActive]}
                onPress={() => setParkFilter(null)}
              >
                <Text style={[styles.filterOptionText, !parkFilter && styles.filterOptionTextActive]}>
                  All Parks
                </Text>
                {!parkFilter && <Ionicons name="checkmark" size={20} color="#0EA5A8" />}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterOption, parkFilter === 'magic-kingdom' && styles.filterOptionActive]}
                onPress={() => setParkFilter(parkFilter === 'magic-kingdom' ? null : 'magic-kingdom')}
              >
                <Text style={[styles.filterOptionText, parkFilter === 'magic-kingdom' && styles.filterOptionTextActive]}>
                  Magic Kingdom
                </Text>
                {parkFilter === 'magic-kingdom' && <Ionicons name="checkmark" size={20} color="#0EA5A8" />}
              </TouchableOpacity>
            </View>

            {/* Intensity Filter */}
            <Text style={styles.sectionTitle}>Intensity Level</Text>
            <View style={styles.filterSection}>
              <TouchableOpacity
                style={[styles.filterOption, !intensityFilter && styles.filterOptionActive]}
                onPress={() => setIntensityFilter(null)}
              >
                <Text style={[styles.filterOptionText, !intensityFilter && styles.filterOptionTextActive]}>
                  All Intensities
                </Text>
                {!intensityFilter && <Ionicons name="checkmark" size={20} color="#0EA5A8" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterOption, intensityFilter === 'family' && styles.filterOptionActive]}
                onPress={() => setIntensityFilter(intensityFilter === 'family' ? null : 'family')}
              >
                <View style={styles.filterOptionContent}>
                  <View>
                    <Text style={[styles.filterOptionText, intensityFilter === 'family' && styles.filterOptionTextActive]}>
                      Family-Friendly
                    </Text>
                    <Text style={styles.filterOptionSubtext}>Low intensity attractions</Text>
                  </View>
                  {intensityFilter === 'family' && <Ionicons name="checkmark" size={20} color="#0EA5A8" />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterOption, intensityFilter === 'thrill' && styles.filterOptionActive]}
                onPress={() => setIntensityFilter(intensityFilter === 'thrill' ? null : 'thrill')}
              >
                <View style={styles.filterOptionContent}>
                  <View>
                    <Text style={[styles.filterOptionText, intensityFilter === 'thrill' && styles.filterOptionTextActive]}>
                      Thrill Rides
                    </Text>
                    <Text style={styles.filterOptionSubtext}>High & moderate intensity attractions</Text>
                  </View>
                  {intensityFilter === 'thrill' && <Ionicons name="checkmark" size={20} color="#0EA5A8" />}
                </View>
              </TouchableOpacity>
            </View>

            {/* Apply Button */}
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#0EA5A8',
    borderColor: '#0EA5A8',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#64748B',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  attractionCard: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 16,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  attractionLocation: {
    fontSize: 14,
    color: '#0EA5A8',
    marginBottom: 6,
  },
  attractionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  attractionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#64748B',
  },
  heightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  heightText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  closeButton: {
    fontSize: 16,
    color: '#64748B',
  },
  spacer: {
    width: 24,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  attractionNameLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  attractionLocationLarge: {
    fontSize: 16,
    color: '#0EA5A8',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  durationBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  durationTextLarge: {
    fontSize: 14,
    color: '#64748B',
  },
  heightBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  heightTextLarge: {
    fontSize: 14,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 8,
  },
  attractionDescriptionLarge: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 24,
  },
  tipContainer: {
    backgroundColor: '#FEF7ED',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  dayButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
    marginBottom: 4,
  },
  dayButtonSubtext: {
    fontSize: 14,
    color: '#64748B',
  },
  noTripContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  noTripText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  filterText: {
    color: '#0EA5A8',
    fontWeight: '500',
  },
  clearButton: {
    fontSize: 16,
    color: '#0EA5A8',
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 32,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterOptionActive: {
    borderColor: '#0EA5A8',
    backgroundColor: '#F0FDFA',
  },
  filterOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  filterOptionTextActive: {
    color: '#0EA5A8',
  },
  filterOptionSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  applyButton: {
    backgroundColor: '#0EA5A8',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});