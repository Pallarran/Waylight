import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  favoriteParkIds: string[];
  preferredParkingTime: number; // minutes before park opening
  includeChildFriendly: boolean;
  includeThrill: boolean;
  includeShowsAndEntertainment: boolean;
  accessibilityNeeds: {
    wheelchairAccessible: boolean;
    signLanguageInterpreted: boolean;
    audioDescription: boolean;
  };
  notificationSettings: {
    enableNotifications: boolean;
    reminderTime: string; // time like "08:00"
    dayBeforeReminder: boolean;
  };
  displaySettings: {
    compactView: boolean;
    showWaitTimes: boolean;
    showTips: boolean;
  };
}

interface UserPreferencesState extends UserPreferences {
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  toggleFavoritePark: (parkId: string) => void;
  resetToDefaults: () => void;
}

const defaultPreferences: UserPreferences = {
  favoriteParkIds: [],
  preferredParkingTime: 30,
  includeChildFriendly: true,
  includeThrill: true,
  includeShowsAndEntertainment: true,
  accessibilityNeeds: {
    wheelchairAccessible: false,
    signLanguageInterpreted: false,
    audioDescription: false,
  },
  notificationSettings: {
    enableNotifications: false,
    reminderTime: '08:00',
    dayBeforeReminder: true,
  },
  displaySettings: {
    compactView: false,
    showWaitTimes: true,
    showTips: true,
  },
};

const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      
      updatePreferences: (updates) => {
        set((state) => ({
          ...state,
          ...updates,
        }));
      },
      
      toggleFavoritePark: (parkId) => {
        set((state) => {
          const isCurrentlyFavorite = state.favoriteParkIds.includes(parkId);
          return {
            ...state,
            favoriteParkIds: isCurrentlyFavorite
              ? state.favoriteParkIds.filter(p => p !== parkId)
              : [...state.favoriteParkIds, parkId],
          };
        });
      },
      
      resetToDefaults: () => {
        set(defaultPreferences);
      },
    }),
    {
      name: 'waylight-preferences'
    }
  )
);

export default useUserPreferencesStore;