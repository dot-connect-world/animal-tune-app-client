import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { RFValue, RWValue, RHValue } from '../../utils/responsive';

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
      {/* BPM 표시 (통합) */}
      <View style={styles.bpmDisplay}>
        <Text style={styles.bpmValue}>{bpm}</Text>
        <Text style={styles.bpmUnit}>BPM</Text>
      </View>

      {/* 빠른 선택 버튼 (상단으로 이동) */}
      <View style={styles.presetContainer}>
        <TouchableOpacity
          style={[styles.presetButton, bpm === 60 && styles.presetButtonActive]}
          onPress={() => onBpmChange(60)}
          disabled={disabled}
        >
          <Text style={[styles.presetText, bpm === 60 && styles.presetTextActive]}>60</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.presetButton, bpm === 90 && styles.presetButtonActive]}
          onPress={() => onBpmChange(90)}
          disabled={disabled}
        >
          <Text style={[styles.presetText, bpm === 90 && styles.presetTextActive]}>90</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.presetButton, bpm === 120 && styles.presetButtonActive]}
          onPress={() => onBpmChange(120)}
          disabled={disabled}
        >
          <Text style={[styles.presetText, bpm === 120 && styles.presetTextActive]}>120</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.presetButton, bpm === 180 && styles.presetButtonActive]}
          onPress={() => onBpmChange(180)}
          disabled={disabled}
        >
          <Text style={[styles.presetText, bpm === 180 && styles.presetTextActive]}>180</Text>
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

      {/* 버튼 컨트롤 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={onDecrease}
          disabled={disabled || bpm <= 40}
        >
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={onIncrease}
          disabled={disabled || bpm >= 240}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: RWValue(16),
    paddingVertical: RHValue(12),
    backgroundColor: '#FFFFFF',
    borderRadius: RWValue(16),
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
    marginBottom: RHValue(12),
  },
  bpmValue: {
    fontSize: RFValue(56),
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: -2,
  },
  bpmUnit: {
    fontSize: RFValue(20),
    color: '#999',
    marginLeft: RWValue(6),
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RWValue(20),
    marginTop: RHValue(8),
  },
  button: {
    width: RWValue(50),
    height: RWValue(50),
    borderRadius: RWValue(25),
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
    fontSize: RFValue(30),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RHValue(8),
  },
  slider: {
    flex: 1,
    height: RHValue(40),
    marginHorizontal: RWValue(8),
  },
  sliderLabel: {
    fontSize: RFValue(12),
    color: '#999',
    fontWeight: '600',
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: RHValue(12),
  },
  presetButton: {
    flex: 1,
    paddingVertical: RHValue(10),
    marginHorizontal: RWValue(3),
    backgroundColor: '#F0F0F0',
    borderRadius: RWValue(10),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  presetText: {
    fontSize: RFValue(15),
    fontWeight: '700',
    color: '#007AFF',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
});
