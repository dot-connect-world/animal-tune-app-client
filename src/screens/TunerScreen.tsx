import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TunerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎸 Guitar Tuner</Text>
      <Text style={styles.subtitle}>Pitch detection coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
});
