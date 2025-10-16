import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNativeMetronome } from '../hooks/useNativeMetronome';
import TempoControl from '../components/metronome/TempoControl';
import BeatVisualizer from '../components/metronome/BeatVisualizer';
import { RFValue, RWValue, RHValue } from '../utils/responsive';

export default function MetronomeScreen() {
  const {
    bpm,
    isPlaying,
    currentBeat,
    setBpm,
    start,
    stop,
    increaseBpm,
    decreaseBpm,
  } = useNativeMetronome();

  const handleToggle = () => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 비트 시각화 */}
      <BeatVisualizer currentBeat={currentBeat} isPlaying={isPlaying} />

      {/* 템포 컨트롤 */}
      <TempoControl
        bpm={bpm}
        onBpmChange={setBpm}
        onIncrease={increaseBpm}
        onDecrease={decreaseBpm}
        disabled={isPlaying}
      />

      {/* 시작/중지 버튼 */}
      <TouchableOpacity
        style={[
          styles.button,
          isPlaying ? styles.buttonStop : styles.buttonStart,
        ]}
        onPress={handleToggle}
      >
        <Text style={styles.buttonText}>
          {isPlaying ? '⏸️ 정지' : '▶️ 시작'}
        </Text>
      </TouchableOpacity>

      {/* 디버그 정보 (개발용) */}
      {__DEV__ && isPlaying && (
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>
            Debug: Beat {currentBeat}/4 | BPM {bpm}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9E6',
  },
  content: {
    padding: RWValue(20),
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: RWValue(50),
    paddingVertical: RHValue(18),
    borderRadius: RWValue(30),
    marginTop: RHValue(30),
    minWidth: RWValue(220),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonStart: {
    backgroundColor: '#34C759',
  },
  buttonStop: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: RFValue(22),
    fontWeight: 'bold',
  },
  debugBox: {
    marginTop: RHValue(20),
    padding: RWValue(10),
    backgroundColor: '#E0E0E0',
    borderRadius: RWValue(8),
  },
  debugText: {
    fontSize: RFValue(12),
    color: '#333',
    fontFamily: 'monospace',
  },
});
