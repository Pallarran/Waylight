import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface LoadingProps {
  size?: 'small' | 'large';
  text?: string;
  style?: any;
}

export default function Loading({ size = 'large', text, style }: LoadingProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color="#4ECDC4" />
      {text && (
        <Text style={styles.text}>{text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});