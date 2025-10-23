import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Note } from '../../constants/notes';

const { width, height } = Dimensions.get('window');
const NOTE_NAME_SIZE = Math.min(width * 0.22, height * 0.17);
const OCTAVE_SIZE = NOTE_NAME_SIZE * 0.5;
const FREQUENCY_SIZE = Math.min(width * 0.045, 17);

interface PitchDisplayProps {
  note: Note | null;
  frequency: number | null;
}

export default function PitchDisplay({ note, frequency }: PitchDisplayProps) {
  return (
    <View style={styles.container}>
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
    marginTop: 5,
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
    fontSize: NOTE_NAME_SIZE,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: -2,
  },
  octave: {
    fontSize: OCTAVE_SIZE,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  frequency: {
    fontSize: FREQUENCY_SIZE,
    color: '#999',
    fontWeight: '500',
  },
});
