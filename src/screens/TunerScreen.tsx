import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { usePitchDetector } from '../hooks/usePitchDetector';
import PitchDisplay from '../components/tuner/PitchDisplay';
import PitchNeedle from '../components/tuner/PitchNeedle';
import TunerCat from '../components/tuner/TunerCat';

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
    <View style={styles.container}>
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

      {/* Pitch 상태 고양이 */}
      <TunerCat
        cents={pitchData.cents}
        isActive={!pitchData.isWaitingForSound && pitchData.note !== null}
      />

      {/* 정확도 게이지 */}
      <PitchNeedle cents={pitchData.cents} />

      {/* 시작/중지 버튼 */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleToggle}
      >
        <Image
          source={isRecording
            ? require('../../assets/images/mike/mike-start.png')
            : require('../../assets/images/mike/mike-stop.png')
          }
          style={styles.mikeImage}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mikeImage: {
    width: 100,
    height: 100,
  },
});
