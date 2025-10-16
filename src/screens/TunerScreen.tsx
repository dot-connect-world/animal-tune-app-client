import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { usePitchDetector } from '../hooks/usePitchDetector';
import PitchDisplay from '../components/tuner/PitchDisplay';
import PitchNeedle from '../components/tuner/PitchNeedle';

export default function TunerScreen() {
  const {
    pitchData,
    isRecording,
    hasPermission,
    error,
    start,
    stop,
    requestPermission,
  } = usePitchDetector();

  const handleToggle = async () => {
    if (isRecording) {
      await stop();
    } else {
      if (hasPermission === false) {
        Alert.alert(
          '마이크 권한 필요',
          '기타 튜닝을 위해 마이크 권한이 필요합니다.',
          [
            { text: '취소', style: 'cancel' },
            { text: '권한 요청', onPress: requestPermission },
          ]
        );
        return;
      }
      await start();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>Tuner</Text>
      </View>

      {/* 에러 메시지 */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Pitch 표시 */}
      <PitchDisplay
        note={pitchData.note}
        frequency={pitchData.frequency}
      />

      {/* 정확도 게이지 */}
      <PitchNeedle cents={pitchData.cents} />

      {/* 시작/중지 버튼 */}
      <TouchableOpacity
        style={[
          styles.button,
          isRecording ? styles.buttonStop : styles.buttonStart,
        ]}
        onPress={handleToggle}
      >
        <Text style={styles.buttonText}>
          {isRecording ? '⏸️ 정지' : '▶️ 시작'}
        </Text>
      </TouchableOpacity>

      {/* 디버그 정보 (개발용) */}
      {__DEV__ && isRecording && (
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>
            Status: {pitchData.isStabilizing ? 'Stabilizing' : 'Active'}
          </Text>
          {pitchData.frequency && (
            <Text style={styles.debugText}>
              Freq: {pitchData.frequency.toFixed(2)} Hz
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
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
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonStart: {
    backgroundColor: '#4CAF50',
  },
  buttonStop: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
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
