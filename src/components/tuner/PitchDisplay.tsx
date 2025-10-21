import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Note } from '../../constants/notes';

interface PitchDisplayProps {
  note: Note | null;
  frequency: number | null;
}

export default function PitchDisplay({ note, frequency }: PitchDisplayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.noteLabel}>현재 음계</Text>

      <View style={styles.noteContainer}>
        <Text style={styles.noteName}>
          {note ? note.name : '-'}
        </Text>
        {note && (
          <Text style={styles.octave}>
            {note.octave}
          </Text>
        )}
      </View>

      <Text style={styles.frequency}>
        {frequency ? `${frequency.toFixed(2)} Hz` : '-- Hz'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  noteLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  noteName: {
    fontSize: 96,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: -2,
  },
  octave: {
    fontSize: 48,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  frequency: {
    fontSize: 18,
    color: '#999',
    fontWeight: '500',
  },
});
