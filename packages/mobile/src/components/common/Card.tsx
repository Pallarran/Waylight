import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  pressable?: boolean;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'bordered';
}

export default function Card({
  children,
  style,
  pressable = false,
  onPress,
  variant = 'default',
}: CardProps) {
  const containerStyle = [
    styles.base,
    styles[variant],
    style,
  ];

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    padding: 16,
  },
  default: {
    backgroundColor: '#FFFFFF',
  },
  elevated: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bordered: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});