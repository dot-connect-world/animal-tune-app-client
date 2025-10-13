import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MetronomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Metronome</Text>
      <Text style={styles.subtitle}>Tempo control coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
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
