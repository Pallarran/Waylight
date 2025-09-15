import React from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  LiveParkData,
  LiveAttractionData,
  LiveEntertainmentData,
  ParkCrowdData,
  LiveDataError
} from '@waylight/shared';
import { liveDataService } from '@waylight/shared';

interface LiveDataState {
  // Data state
  parkData: Record<string, LiveParkData>;
  waitTimes: Record<string, LiveAttractionData[]>;
  entertainment: Record<string, LiveEntertainmentData[]>;
  crowdPredictions: Record<string, ParkCrowdData>;

  // Loading states
  loading: {
    parkData: Record<string, boolean>;
    waitTimes: Record<string, boolean>;
    entertainment: Record<string, boolean>;
    crowdPredictions: Record<string, boolean>;
  };

  // Error states
  errors: {
    parkData: Record<string, LiveDataError | null>;
    waitTimes: Record<string, LiveDataError | null>;
    entertainment: Record<string, LiveDataError | null>;
    crowdPredictions: Record<string, LiveDataError | null>;
  };

  // Auto-refresh state
  autoRefresh: {
    enabled: boolean;
    activeParkIds: string[];
  };

  // Last update timestamps
  lastUpdated: {
    parkData: Record<string, string>;
    waitTimes: Record<string, string>;
    entertainment: Record<string, string>;
    crowdPredictions: Record<string, string>;
  };

  // Actions
  fetchParkData: (parkId: string) => Promise<void>;
  fetchMultipleParkData: (parkIds: string[]) => Promise<void>;
  fetchWaitTimes: (parkId: string) => Promise<void>;
  fetchEntertainment: (parkId: string) => Promise<void>;
  fetchCrowdPredictions: (parkId: string, days?: number) => Promise<void>;

  // Auto-refresh controls
  startAutoRefresh: (parkIds: string[]) => void;
  stopAutoRefresh: () => void;

  // Cache management
  clearCache: (type?: 'all' | 'wait_times' | 'park_hours' | 'crowds') => void;

  // Error handling
  clearError: (type: keyof LiveDataState['errors'], parkId: string) => void;
  clearAllErrors: () => void;
}

export const useLiveDataStore = create<LiveDataState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    parkData: {},
    waitTimes: {},
    entertainment: {},
    crowdPredictions: {},

    loading: {
      parkData: {},
      waitTimes: {},
      entertainment: {},
      crowdPredictions: {}
    },

    errors: {
      parkData: {},
      waitTimes: {},
      entertainment: {},
      crowdPredictions: {}
    },

    autoRefresh: {
      enabled: false,
      activeParkIds: []
    },

    lastUpdated: {
      parkData: {},
      waitTimes: {},
      entertainment: {},
      crowdPredictions: {}
    },

    // Actions
    fetchParkData: async (parkId: string) => {
      set(state => ({
        loading: {
          ...state.loading,
          parkData: { ...state.loading.parkData, [parkId]: true }
        },
        errors: {
          ...state.errors,
          parkData: { ...state.errors.parkData, [parkId]: null }
        }
      }));

      try {
        const data = await liveDataService.getParkData(parkId);
        set(state => ({
          parkData: { ...state.parkData, [parkId]: data },
          lastUpdated: {
            ...state.lastUpdated,
            parkData: { ...state.lastUpdated.parkData, [parkId]: new Date().toISOString() }
          }
        }));
      } catch (error) {
        set(state => ({
          errors: {
            ...state.errors,
            parkData: { ...state.errors.parkData, [parkId]: error as LiveDataError }
          }
        }));
      } finally {
        set(state => ({
          loading: {
            ...state.loading,
            parkData: { ...state.loading.parkData, [parkId]: false }
          }
        }));
      }
    },

    fetchMultipleParkData: async (parkIds: string[]) => {
      // Set loading state for all parks
      set(state => {
        const newLoadingState = { ...state.loading.parkData };
        const newErrorState = { ...state.errors.parkData };

        parkIds.forEach(parkId => {
          newLoadingState[parkId] = true;
          newErrorState[parkId] = null;
        });

        return {
          loading: {
            ...state.loading,
            parkData: newLoadingState
          },
          errors: {
            ...state.errors,
            parkData: newErrorState
          }
        };
      });

      try {
        const results = await liveDataService.getMultipleParkData(parkIds);

        set(state => {
          const newParkData = { ...state.parkData };
          const newLastUpdated = { ...state.lastUpdated.parkData };
          const now = new Date().toISOString();

          results.forEach(data => {
            newParkData[data.parkId] = data;
            newLastUpdated[data.parkId] = now;
          });

          return {
            parkData: newParkData,
            lastUpdated: {
              ...state.lastUpdated,
              parkData: newLastUpdated
            }
          };
        });
      } catch (error) {
        console.error('Failed to fetch multiple park data:', error);
      } finally {
        // Clear loading state for all parks
        set(state => {
          const newLoadingState = { ...state.loading.parkData };
          parkIds.forEach(parkId => {
            newLoadingState[parkId] = false;
          });

          return {
            loading: {
              ...state.loading,
              parkData: newLoadingState
            }
          };
        });
      }
    },

    fetchWaitTimes: async (parkId: string) => {
      set(state => ({
        loading: {
          ...state.loading,
          waitTimes: { ...state.loading.waitTimes, [parkId]: true }
        },
        errors: {
          ...state.errors,
          waitTimes: { ...state.errors.waitTimes, [parkId]: null }
        }
      }));

      try {
        const data = await liveDataService.getAttractionWaitTimes(parkId);
        set(state => ({
          waitTimes: { ...state.waitTimes, [parkId]: data },
          lastUpdated: {
            ...state.lastUpdated,
            waitTimes: { ...state.lastUpdated.waitTimes, [parkId]: new Date().toISOString() }
          }
        }));
      } catch (error) {
        set(state => ({
          errors: {
            ...state.errors,
            waitTimes: { ...state.errors.waitTimes, [parkId]: error as LiveDataError }
          }
        }));
      } finally {
        set(state => ({
          loading: {
            ...state.loading,
            waitTimes: { ...state.loading.waitTimes, [parkId]: false }
          }
        }));
      }
    },

    fetchEntertainment: async (parkId: string) => {
      set(state => ({
        loading: {
          ...state.loading,
          entertainment: { ...state.loading.entertainment, [parkId]: true }
        },
        errors: {
          ...state.errors,
          entertainment: { ...state.errors.entertainment, [parkId]: null }
        }
      }));

      try {
        const data = await liveDataService.getEntertainmentSchedule(parkId);
        set(state => ({
          entertainment: { ...state.entertainment, [parkId]: data },
          lastUpdated: {
            ...state.lastUpdated,
            entertainment: { ...state.lastUpdated.entertainment, [parkId]: new Date().toISOString() }
          }
        }));
      } catch (error) {
        set(state => ({
          errors: {
            ...state.errors,
            entertainment: { ...state.errors.entertainment, [parkId]: error as LiveDataError }
          }
        }));
      } finally {
        set(state => ({
          loading: {
            ...state.loading,
            entertainment: { ...state.loading.entertainment, [parkId]: false }
          }
        }));
      }
    },

    fetchCrowdPredictions: async (parkId: string, days: number = 7) => {
      set(state => ({
        loading: {
          ...state.loading,
          crowdPredictions: { ...state.loading.crowdPredictions, [parkId]: true }
        },
        errors: {
          ...state.errors,
          crowdPredictions: { ...state.errors.crowdPredictions, [parkId]: null }
        }
      }));

      try {
        const data = await liveDataService.getCrowdPredictions(parkId, days);
        set(state => ({
          crowdPredictions: { ...state.crowdPredictions, [parkId]: data },
          lastUpdated: {
            ...state.lastUpdated,
            crowdPredictions: { ...state.lastUpdated.crowdPredictions, [parkId]: new Date().toISOString() }
          }
        }));
      } catch (error) {
        set(state => ({
          errors: {
            ...state.errors,
            crowdPredictions: { ...state.errors.crowdPredictions, [parkId]: error as LiveDataError }
          }
        }));
      } finally {
        set(state => ({
          loading: {
            ...state.loading,
            crowdPredictions: { ...state.loading.crowdPredictions, [parkId]: false }
          }
        }));
      }
    },

    startAutoRefresh: (parkIds: string[]) => {
      // Stop existing auto-refresh
      liveDataService.stopAutoRefresh();

      // Start new auto-refresh
      liveDataService.startAutoRefresh(parkIds);

      set({
        autoRefresh: {
          enabled: true,
          activeParkIds: parkIds
        }
      });
    },

    stopAutoRefresh: () => {
      liveDataService.stopAutoRefresh();
      set({
        autoRefresh: {
          enabled: false,
          activeParkIds: []
        }
      });
    },

    clearCache: (type) => {
      liveDataService.clearCache(type);
    },

    clearError: (type, parkId) => {
      set(state => ({
        errors: {
          ...state.errors,
          [type]: { ...state.errors[type], [parkId]: null }
        }
      }));
    },

    clearAllErrors: () => {
      set({
        errors: {
          parkData: {},
          waitTimes: {},
          entertainment: {},
          crowdPredictions: {}
        }
      });
    }
  }))
);

// Selectors for easy data access
export const selectParkData = (parkId: string) => (state: LiveDataState) => state.parkData[parkId];
export const selectWaitTimes = (parkId: string) => (state: LiveDataState) => state.waitTimes[parkId] || [];
export const selectEntertainment = (parkId: string) => (state: LiveDataState) => state.entertainment[parkId] || [];
export const selectCrowdPredictions = (parkId: string) => (state: LiveDataState) => state.crowdPredictions[parkId];

export const selectIsLoading = (type: keyof LiveDataState['loading'], parkId: string) => (state: LiveDataState) =>
  state.loading[type][parkId] || false;

export const selectError = (type: keyof LiveDataState['errors'], parkId: string) => (state: LiveDataState) =>
  state.errors[type][parkId];

export const selectLastUpdated = (type: keyof LiveDataState['lastUpdated'], parkId: string) => (state: LiveDataState) =>
  state.lastUpdated[type][parkId];

// Hook for specific park data with automatic fetching
export const useParkLiveData = (parkId: string) => {
  const store = useLiveDataStore();

  // Auto-fetch park data when parkId changes
  React.useEffect(() => {
    if (parkId && !store.parkData[parkId]) {
      store.fetchParkData(parkId);
    }
  }, [parkId, store]);

  return {
    parkData: store.parkData[parkId],
    waitTimes: store.waitTimes[parkId] || [],
    entertainment: store.entertainment[parkId] || [],
    isLoading: {
      parkData: store.loading.parkData[parkId] || false,
      waitTimes: store.loading.waitTimes[parkId] || false,
      entertainment: store.loading.entertainment[parkId] || false
    },
    errors: {
      parkData: store.errors.parkData[parkId],
      waitTimes: store.errors.waitTimes[parkId],
      entertainment: store.errors.entertainment[parkId]
    },
    lastUpdated: {
      parkData: store.lastUpdated.parkData[parkId],
      waitTimes: store.lastUpdated.waitTimes[parkId],
      entertainment: store.lastUpdated.entertainment[parkId]
    },
    actions: {
      fetchParkData: () => store.fetchParkData(parkId),
      fetchWaitTimes: () => store.fetchWaitTimes(parkId),
      fetchEntertainment: () => store.fetchEntertainment(parkId),
      clearErrors: () => {
        store.clearError('parkData', parkId);
        store.clearError('waitTimes', parkId);
        store.clearError('entertainment', parkId);
      }
    }
  };
};