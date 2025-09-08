// Types
export * from './types';

// Utils
export * from './utils/date';
export * from './utils/export';

// Storage
export * from './storage/interface';

// Constants
export const APP_NAME = 'Waylight';
export const APP_VERSION = '1.0.0';
export const APP_TAGLINE = 'Plan smarter. Wander farther.';

// Color palette
export const colors = {
  ink: '#0F172A',
  surface: '#F8FAFC',
  sea: '#0EA5A8',
  glow: '#FBBF24',
  // Extended palette
  inkLight: '#475569',
  surfaceDark: '#E2E8F0',
  seaLight: '#22D3EE',
  seaDark: '#0891B2',
  glowLight: '#FCD34D',
  glowDark: '#F59E0B',
} as const;

// Default settings
export const defaultSettings = {
  showTips: true,
  tipCategories: [
    'best_time' as const,
    'strategy' as const,
    'general' as const,
  ],
  viewMode: 'list' as const,
  theme: 'system' as const,
  notifications: {
    enabled: false,
    reminderTime: 15,
    dailyPlanReminder: false,
  },
};