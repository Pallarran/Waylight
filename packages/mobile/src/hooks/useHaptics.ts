import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType = 
  | 'light'
  | 'medium' 
  | 'heavy'
  | 'success'
  | 'warning' 
  | 'error'
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy';

export function useHaptics() {
  const triggerHaptic = useCallback((type: HapticType) => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return;
    }

    try {
      switch (type) {
        case 'light':
        case 'impactLight':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
          
        case 'medium':
        case 'impactMedium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
          
        case 'heavy':
        case 'impactHeavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
          
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
          
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
          
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
          
        case 'selection':
          Haptics.selectionAsync();
          break;
          
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      // Haptics might not be available on all devices
      console.warn('Haptic feedback not available:', error);
    }
  }, []);

  const triggerSuccess = useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const triggerError = useCallback(() => triggerHaptic('error'), [triggerHaptic]);
  const triggerWarning = useCallback(() => triggerHaptic('warning'), [triggerHaptic]);
  const triggerSelection = useCallback(() => triggerHaptic('selection'), [triggerHaptic]);
  const triggerImpact = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    triggerHaptic(intensity);
  }, [triggerHaptic]);

  return {
    triggerHaptic,
    triggerSuccess,
    triggerError,
    triggerWarning,
    triggerSelection,
    triggerImpact,
  };
}