import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Waylight</Text>
        <Text style={styles.subtitle}>Plan smarter. Wander farther.</Text>
        <Text style={styles.description}>
          Your guide to magical theme park experiences awaits.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#0EA5A8',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
});