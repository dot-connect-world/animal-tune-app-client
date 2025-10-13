import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useMetronome } from '../hooks/useMetronome';
import TempoControl from '../components/metronome/TempoControl';
import BeatVisualizer from '../components/metronome/BeatVisualizer';

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
  } = useMetronome();

  const handleToggle = async () => {
    if (isPlaying) {
      stop();
    } else {
      await start();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>🎵 메트로놈</Text>
        <Text style={styles.subtitle}>
          {isPlaying ? '재생 중...' : '시작 버튼을 눌러주세요'}
        </Text>
      </View>

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

      {/* 안내 텍스트 */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 사용 방법</Text>
        <Text style={styles.infoText}>
          1. 슬라이더로 원하는 템포를 설정하세요{'\n'}
          2. 빠른 선택 버튼으로 자주 쓰는 템포를 바로 선택하세요{'\n'}
          3. 시작 버튼을 누르면 메트로놈이 작동합니다{'\n'}
          4. 4박자마다 색상이 바뀝니다
        </Text>
      </View>

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
    backgroundColor: '#fff5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 30,
    minWidth: 200,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    marginTop: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  debugBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
});
