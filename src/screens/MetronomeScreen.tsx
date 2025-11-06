import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNativeMetronome } from '../hooks/useNativeMetronome';
import TempoControl from '../components/metronome/TempoControl';
import BeatVisualizer from '../components/metronome/BeatVisualizer';
import { RFValue, RWValue, RHValue, isTablet } from '../utils/responsive';

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
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 비트 시각화 */}
        <BeatVisualizer currentBeat={currentBeat} isPlaying={isPlaying} bpm={bpm} />

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
    paddingHorizontal: RWValue(16),
    paddingTop: RHValue(isTablet ? 28 : 24),
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: RHValue(isTablet ? 0 : 0),
  },
  button: {
    width: RWValue(isTablet ? 180 : 120),
    height: RWValue(isTablet ? 180 : 120),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: RHValue(isTablet ? 20 : 14),
    marginBottom: 0,
  },
  drumImage: {
    width: RWValue(isTablet ? 180 : 120),
    height: RWValue(isTablet ? 180 : 120),
  },
  drumImagePlaying: {
    width: RWValue(isTablet ? 180 : 120),
    height: RWValue(isTablet ? 180 : 120),
    marginTop: RHValue(isTablet ? -18 : -14),
  },
});
