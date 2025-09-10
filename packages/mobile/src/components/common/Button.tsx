import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useHaptics } from '../../hooks/useHaptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy' | 'success';
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticFeedback = true,
  hapticType = 'light',
}: ButtonProps) {
  const { triggerHaptic } = useHaptics();
  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`${size}Container` as keyof typeof styles],
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
    disabled && styles.disabledText,
    textStyle,
  ];

  const handlePress = () => {
    if (hapticFeedback && !disabled && !loading) {
      triggerHaptic(hapticType);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : '#0EA5A8'}
          size="small"
        />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#0EA5A8',
    shadowColor: '#0EA5A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  smContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mdContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lgContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#0F172A',
  },
  ghostText: {
    color: '#0EA5A8',
  },
  disabledText: {
    opacity: 0.7,
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
});