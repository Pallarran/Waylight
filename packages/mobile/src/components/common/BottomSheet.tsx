import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.85;
const BOTTOM_SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.1;
const DRAG_THRESHOLD = 50;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
  backgroundColor?: string;
  backdropOpacity?: number;
}

export default function BottomSheet({
  visible,
  onClose,
  children,
  snapPoints = [BOTTOM_SHEET_MIN_HEIGHT, BOTTOM_SHEET_MAX_HEIGHT * 0.6, BOTTOM_SHEET_MAX_HEIGHT],
  initialSnap = 1,
  backgroundColor = '#FFFFFF',
  backdropOpacity = 0.5,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacityAnim = useRef(new Animated.Value(0)).current;
  const currentSnapIndex = useRef(initialSnap);

  // Calculate snap point heights from bottom
  const snapPointsFromBottom = snapPoints.map(point => SCREEN_HEIGHT - point - insets.bottom);

  const animateToSnapPoint = useCallback((snapIndex: number) => {
    currentSnapIndex.current = snapIndex;
    const targetY = snapPointsFromBottom[snapIndex];
    
    Animated.spring(translateY, {
      toValue: targetY,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [snapPointsFromBottom, translateY]);

  const closeBottomSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [translateY, backdropOpacityAnim, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(translateY._value);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          // Swiping up - allow with resistance
          translateY.setValue(gestureState.dy * 0.5);
        } else {
          // Swiping down - normal movement
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        
        const velocity = gestureState.vy;
        const currentY = translateY._value;
        
        // Determine which snap point to go to
        let targetSnapIndex = currentSnapIndex.current;
        
        if (velocity > 0.5 || gestureState.dy > DRAG_THRESHOLD) {
          // Fast swipe down or significant drag down
          if (currentSnapIndex.current === 0) {
            // If at first snap point, close
            closeBottomSheet();
            return;
          } else {
            // Move to lower snap point
            targetSnapIndex = Math.max(0, currentSnapIndex.current - 1);
          }
        } else if (velocity < -0.5 || gestureState.dy < -DRAG_THRESHOLD) {
          // Fast swipe up or significant drag up
          targetSnapIndex = Math.min(snapPoints.length - 1, currentSnapIndex.current + 1);
        } else {
          // Find nearest snap point
          let minDistance = Infinity;
          snapPointsFromBottom.forEach((snapY, index) => {
            const distance = Math.abs(currentY - snapY);
            if (distance < minDistance) {
              minDistance = distance;
              targetSnapIndex = index;
            }
          });
        }
        
        animateToSnapPoint(targetSnapIndex);
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Show bottom sheet
      translateY.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.timing(backdropOpacityAnim, {
          toValue: backdropOpacity,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: snapPointsFromBottom[initialSnap],
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
      currentSnapIndex.current = initialSnap;
      
      // Handle Android back button
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        closeBottomSheet();
        return true;
      });
      
      return () => backHandler.remove();
    }
  }, [visible, translateY, backdropOpacityAnim, snapPointsFromBottom, initialSnap, backdropOpacity, closeBottomSheet]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      animationType="none"
      onRequestClose={closeBottomSheet}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={closeBottomSheet}>
          <Animated.View 
            style={[
              styles.backdrop, 
              { 
                opacity: backdropOpacityAnim.interpolate({
                  inputRange: [0, backdropOpacity],
                  outputRange: [0, 1],
                }),
              }
            ]} 
          />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              backgroundColor,
              paddingBottom: insets.bottom,
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />
          
          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
});