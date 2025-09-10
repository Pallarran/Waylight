import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

export interface SwipeAction {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export default function SwipeableRow({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeStart,
  onSwipeEnd,
}: SwipeableRowProps) {
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const maxLeftSwipe = leftActions.length * ACTION_WIDTH;
  const maxRightSwipe = rightActions.length * ACTION_WIDTH;

  const resetPosition = () => {
    translateX.value = withSpring(0);
    isOpen.value = false;
    if (onSwipeEnd) {
      runOnJS(onSwipeEnd)();
    }
  };

  const snapToActions = (direction: 'left' | 'right') => {
    const targetValue = direction === 'left' ? maxLeftSwipe : -maxRightSwipe;
    translateX.value = withSpring(targetValue);
    isOpen.value = true;
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (onSwipeStart) {
        runOnJS(onSwipeStart)();
      }
    })
    .onUpdate((event) => {
      const newTranslateX = event.translationX;
      
      // Apply resistance when swiping beyond limits
      if (newTranslateX > maxLeftSwipe) {
        translateX.value = maxLeftSwipe + (newTranslateX - maxLeftSwipe) * 0.3;
      } else if (newTranslateX < -maxRightSwipe) {
        translateX.value = -maxRightSwipe + (newTranslateX + maxRightSwipe) * 0.3;
      } else {
        translateX.value = newTranslateX;
      }
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const translation = event.translationX;

      // Determine final position based on velocity and translation
      if (Math.abs(velocity) > 500) {
        // Fast swipe
        if (velocity > 0 && leftActions.length > 0) {
          runOnJS(snapToActions)('left');
        } else if (velocity < 0 && rightActions.length > 0) {
          runOnJS(snapToActions)('right');
        } else {
          runOnJS(resetPosition)();
        }
      } else {
        // Slow swipe - check threshold
        if (translation > SWIPE_THRESHOLD && leftActions.length > 0) {
          runOnJS(snapToActions)('left');
        } else if (translation < -SWIPE_THRESHOLD && rightActions.length > 0) {
          runOnJS(snapToActions)('right');
        } else {
          runOnJS(resetPosition)();
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionsStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? 1 : 0,
    transform: [
      {
        translateX: translateX.value > 0 ? translateX.value - maxLeftSwipe : -maxLeftSwipe,
      },
    ],
  }));

  const rightActionsStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
    transform: [
      {
        translateX: translateX.value < 0 ? translateX.value + maxRightSwipe : maxRightSwipe,
      },
    ],
  }));

  const handleActionPress = (action: SwipeAction) => {
    resetPosition();
    action.onPress();
  };

  return (
    <View style={styles.container}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <Animated.View style={[styles.actionsContainer, styles.leftActions, leftActionsStyle]}>
          {leftActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                { backgroundColor: action.backgroundColor, width: ACTION_WIDTH },
              ]}
              onPress={() => handleActionPress(action)}
            >
              {action.icon && (
                <Ionicons name={action.icon} size={20} color={action.color} />
              )}
              <Text style={[styles.actionText, { color: action.color }]} numberOfLines={1}>
                {action.text}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <Animated.View style={[styles.actionsContainer, styles.rightActions, rightActionsStyle]}>
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                { backgroundColor: action.backgroundColor, width: ACTION_WIDTH },
              ]}
              onPress={() => handleActionPress(action)}
            >
              {action.icon && (
                <Ionicons name={action.icon} size={20} color={action.color} />
              )}
              <Text style={[styles.actionText, { color: action.color }]} numberOfLines={1}>
                {action.text}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Main Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  content: {
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 0,
  },
  leftActions: {
    left: 0,
    justifyContent: 'flex-start',
  },
  rightActions: {
    right: 0,
    justifyContent: 'flex-end',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});