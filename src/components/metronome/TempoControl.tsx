import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';

interface TempoControlProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
}

export default function TempoControl({
  bpm,
  onBpmChange,
  onIncrease,
  onDecrease,
  disabled = false,
}: TempoControlProps) {
  const getTempoDescription = (bpm: number): string => {
    if (bpm < 60) return 'Largo (매우 느림)';
    if (bpm < 76) return 'Adagio (느림)';
    if (bpm < 108) return 'Andante (보통 빠르기)';
    if (bpm < 120) return 'Moderato (중간)';
    if (bpm < 168) return 'Allegro (빠름)';
    if (bpm < 200) return 'Presto (매우 빠름)';
    return 'Prestissimo (최고 속도)';
  };

  return (
    <View style={styles.container}>
      {/* BPM 표시 */}
      <View style={styles.bpmDisplay}>
        <Text style={styles.bpmLabel}>템포</Text>
        <Text style={styles.bpmValue}>{bpm}</Text>
        <Text style={styles.bpmUnit}>BPM</Text>
      </View>

      {/* 템포 설명 */}
      <Text style={styles.tempoDescription}>{getTempoDescription(bpm)}</Text>

      {/* 버튼 컨트롤 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={onDecrease}
          disabled={disabled || bpm <= 40}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>

        <View style={styles.bpmValueContainer}>
          <Text style={styles.bpmMainValue}>{bpm}</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={onIncrease}
          disabled={disabled || bpm >= 240}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 슬라이더 */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>40</Text>
        <Slider
          style={styles.slider}
          minimumValue={40}
          maximumValue={240}
          step={1}
          value={bpm}
          onValueChange={onBpmChange}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#D1D1D6"
          thumbTintColor="#007AFF"
          disabled={disabled}
        />
        <Text style={styles.sliderLabel}>240</Text>
      </View>

      {/* 빠른 선택 버튼 */}
      <View style={styles.presetContainer}>
        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => onBpmChange(60)}
          disabled={disabled}
        >
          <Text style={styles.presetText}>60</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => onBpmChange(90)}
          disabled={disabled}
        >
          <Text style={styles.presetText}>90</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => onBpmChange(120)}
          disabled={disabled}
        >
          <Text style={styles.presetText}>120</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.presetButton}
          onPress={() => onBpmChange(180)}
          disabled={disabled}
        >
          <Text style={styles.presetText}>180</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bpmDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bpmLabel: {
    fontSize: 18,
    color: '#666',
    marginRight: 12,
    fontWeight: '500',
  },
  bpmValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: -2,
  },
  bpmUnit: {
    fontSize: 20,
    color: '#999',
    marginLeft: 8,
    fontWeight: '600',
  },
  tempoDescription: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#D1D1D6',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bpmValueContainer: {
    marginHorizontal: 32,
    minWidth: 80,
    alignItems: 'center',
  },
  bpmMainValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
