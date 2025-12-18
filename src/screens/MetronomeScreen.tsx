import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNativeMetronome } from '../hooks/useNativeMetronome';
import TempoControl from '../components/metronome/TempoControl';
import BeatVisualizer from '../components/metronome/BeatVisualizer';
import BeatCountSelector from '../components/metronome/BeatCountSelector';
import { RWValue, RHValue, isTablet } from '../utils/responsive';

export default function MetronomeScreen() {
  const {
    bpm,
    isPlaying,
    currentBeat,
    beatPulse,
    beatsPerMeasure,
    setBpm,
    start,
    stop,
    increaseBpm,
    decreaseBpm,
    setBeatsPerMeasure,
  } = useNativeMetronome();

  const handleToggle = () => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 비트 시각화 */}
        <BeatVisualizer
          currentBeat={currentBeat}
          isPlaying={isPlaying}
          bpm={bpm}
          beatsPerMeasure={beatsPerMeasure}
          beatPulse={beatPulse}
        />

        {/* 템포 컨트롤 */}
        <TempoControl
          bpm={bpm}
          onBpmChange={setBpm}
          onIncrease={increaseBpm}
          onDecrease={decreaseBpm}
          disabled={isPlaying}
        />

        <BeatCountSelector
          value={beatsPerMeasure}
          onChange={setBeatsPerMeasure}
        />

        {/* 시작/중지 버튼 */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <Image
            source={
              isPlaying
                ? require('../../assets/images/drum/run-drum.png')
                : require('../../assets/images/drum/stop-drum.png')
            }
            style={isPlaying ? styles.drumImagePlaying : styles.drumImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: RWValue(14),
    paddingTop: RHValue(isTablet ? 22 : 18),
    paddingBottom: RHValue(8),
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: RHValue(6),
  },
  button: {
    width: RWValue(isTablet ? 160 : 104),
    height: RWValue(isTablet ? 160 : 104),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: RHValue(isTablet ? 16 : 12),
    marginBottom: RHValue(4),
  },
  drumImage: {
    width: RWValue(isTablet ? 160 : 104),
    height: RWValue(isTablet ? 160 : 104),
  },
  drumImagePlaying: {
    width: RWValue(isTablet ? 160 : 104),
    height: RWValue(isTablet ? 160 : 104),
    marginTop: RHValue(isTablet ? -16 : -10),
  },
});
