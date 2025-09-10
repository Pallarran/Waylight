import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Icons } from './Icons';
import { useHaptics } from '../../hooks/useHaptics';

interface SuccessFeedbackProps {
  message?: string;
  show?: boolean;
  onHide?: () => void;
  variant?: 'sparkle' | 'check' | 'glow';
  duration?: number;
}

export default function SuccessFeedback({ 
  message = "Plan updated — you're glowing.", 
  show = false,
  onHide,
  variant = 'sparkle',
  duration = 3000
}: SuccessFeedbackProps) {
  const [visible, setVisible] = useState(show);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(-50);
  const { success } = useHaptics();

  useEffect(() => {
    if (show) {
      setVisible(true);
      success(); // Haptic feedback
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setVisible(false);
          onHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onHide]);

  if (!visible) return null;

  const getIcon = (variant: string, color: string) => {
    switch (variant) {
      case 'sparkle':
        return <Icons.Sparkles size={20} color={color} strokeWidth={2} />;
      case 'check':
        return <Icons.Check size={20} color={color} strokeWidth={2} />;
      case 'glow':
        return <Icons.Star size={20} color={color} strokeWidth={2} />;
      default:
        return <Icons.Sparkles size={20} color={color} strokeWidth={2} />;
    }
  };

  const variants = {
    sparkle: {
      color: '#FBBF24',
      bgColor: 'rgba(251, 191, 36, 0.1)'
    },
    check: {
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    glow: {
      color: '#FBBF24',
      bgColor: 'rgba(251, 191, 36, 0.1)'
    }
  };

  const currentVariant = variants[variant];

  return (
    <Animated.View 
      style={[
        styles.container,
        { backgroundColor: currentVariant.bgColor },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {getIcon(variant, currentVariant.color)}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  message: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    flex: 1,
  },
});