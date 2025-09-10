import React, { useMemo, useCallback } from 'react';
import {
  FlatList,
  VirtualizedList as RNVirtualizedList,
  StyleSheet,
  View,
  RefreshControl,
} from 'react-native';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  estimatedItemSize?: number;
  windowSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  removeClippedSubviews?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  contentContainerStyle?: any;
  style?: any;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  showsVerticalScrollIndicator?: boolean;
}

export default function VirtualizedList<T>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize = 80,
  windowSize = 10,
  initialNumToRender = 10,
  maxToRenderPerBatch = 5,
  removeClippedSubviews = true,
  refreshing,
  onRefresh,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  contentContainerStyle,
  style,
  onEndReached,
  onEndReachedThreshold = 0.1,
  showsVerticalScrollIndicator = false,
}: VirtualizedListProps<T>) {
  // Memoize the render item to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      return renderItem({ item, index });
    },
    [renderItem]
  );

  // Memoize the key extractor
  const memoizedKeyExtractor = useCallback(
    (item: T, index: number) => keyExtractor(item, index),
    [keyExtractor]
  );

  // Use FlatList for better performance with large datasets
  const optimizedProps = useMemo(
    () => ({
      // Performance optimizations
      windowSize,
      initialNumToRender,
      maxToRenderPerBatch,
      removeClippedSubviews,
      
      // Memory optimizations
      updateCellsBatchingPeriod: 50,
      getItemLayout: undefined, // Let FlatList calculate dynamically
      
      // Scroll optimizations
      scrollEventThrottle: 16,
      legacyImplementation: false,
      
      // Prevent unnecessary re-renders
      keyboardShouldPersistTaps: 'handled' as const,
      keyboardDismissMode: 'on-drag' as const,
    }),
    [windowSize, initialNumToRender, maxToRenderPerBatch, removeClippedSubviews]
  );

  const refreshControl = useMemo(() => {
    if (onRefresh) {
      return (
        <RefreshControl
          refreshing={refreshing || false}
          onRefresh={onRefresh}
          colors={['#0EA5A8']} // Android
          tintColor="#0EA5A8" // iOS
        />
      );
    }
    return undefined;
  }, [refreshing, onRefresh]);

  return (
    <FlatList
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      refreshControl={refreshControl}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={contentContainerStyle}
      style={style}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      {...optimizedProps}
    />
  );
}

// Memoized item wrapper for additional performance gains
export const MemoizedItem = React.memo(
  ({ children }: { children: React.ReactNode }) => {
    return <View style={styles.itemWrapper}>{children}</View>;
  }
);

const styles = StyleSheet.create({
  itemWrapper: {
    // Minimal styling to avoid layout recalculations
  },
});