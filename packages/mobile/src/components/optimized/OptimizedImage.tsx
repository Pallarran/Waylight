import React, { useState, useCallback, useMemo } from 'react';
import {
  Image,
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
  errorComponent?: React.ReactNode;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  blurRadius?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: 'low' | 'normal' | 'high';
  lazy?: boolean;
  cachePolicy?: 'memory' | 'disk' | 'memory-disk' | 'none';
}

export default function OptimizedImage({
  source,
  style,
  containerStyle,
  placeholder,
  errorComponent,
  resizeMode = 'cover',
  blurRadius,
  onLoad,
  onError,
  priority = 'normal',
  lazy = true,
  cachePolicy = 'memory-disk',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleLayout = useCallback(() => {
    if (lazy && !isVisible) {
      // Simple visibility check - in a production app, you'd use Intersection Observer
      setIsVisible(true);
    }
  }, [lazy, isVisible]);

  // Memoize image props to prevent unnecessary re-renders
  const imageProps = useMemo(() => {
    const props: any = {
      source,
      style: [styles.image, style],
      resizeMode,
      onLoad: handleLoad,
      onError: handleError,
    };

    if (blurRadius !== undefined) {
      props.blurRadius = blurRadius;
    }

    // Add cache policy for network images
    if (typeof source === 'object' && source.uri) {
      props.cache = cachePolicy;
      
      // Add priority hints
      if (priority === 'high') {
        props.priority = 'high';
      } else if (priority === 'low') {
        props.priority = 'low';
      }
    }

    return props;
  }, [source, style, resizeMode, blurRadius, cachePolicy, priority, handleLoad, handleError]);

  const defaultPlaceholder = useMemo(
    () => (
      <View style={styles.placeholder}>
        <ActivityIndicator size="small" color="#0EA5A8" />
      </View>
    ),
    []
  );

  const defaultErrorComponent = useMemo(
    () => (
      <View style={styles.errorContainer}>
        <Ionicons name="image-outline" size={32} color="#94A3B8" />
        <Text style={styles.errorText}>Failed to load image</Text>
      </View>
    ),
    []
  );

  const containerStyles = useMemo(
    () => [styles.container, containerStyle],
    [containerStyle]
  );

  if (!isVisible) {
    return (
      <View style={containerStyles} onLayout={handleLayout}>
        {placeholder || defaultPlaceholder}
      </View>
    );
  }

  return (
    <View style={containerStyles}>
      {isVisible && (
        <Image {...imageProps} />
      )}
      
      {isLoading && (placeholder || defaultPlaceholder)}
      
      {hasError && (errorComponent || defaultErrorComponent)}
    </View>
  );
}

// Memoized version for use in lists
export const MemoizedOptimizedImage = React.memo(OptimizedImage);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});