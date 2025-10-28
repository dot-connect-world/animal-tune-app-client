import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { usePitchDetector } from '../hooks/usePitchDetector';
import PitchDisplay from '../components/tuner/PitchDisplay';
import PitchNeedle from '../components/tuner/PitchNeedle';
import AnimalGrid from '../components/tuner/AnimalGrid';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIKE_SIZE = Math.min(SCREEN_WIDTH * 0.25, 120);

export default function TunerScreen() {
  const {
    pitchData,
    isRecording,
    permissionState,
    error,
    start,
    stop,
    requestPermission,
  } = usePitchDetector();

  const handleMicButtonPress = async () => {
    // 1. 녹음 중이면 중지
    if (isRecording) {
      await stop();
      return;
    }

    // 2. 권한 있으면 바로 시작
    if (permissionState === 'granted') {
      await start();
      return;
    }

    // 3. 권한 없으면 시스템 권한 다이얼로그 요청
    const response = await requestPermission();

    if (response?.granted === true) {
      await start();
    } else if (response && response.canAskAgain === false) {
      // 더 이상 권한 다이얼로그를 표시할 수 없는 상태
      // 설정에서만 권한 변경 가능 → 설정으로 안내
      Alert.alert(
        '마이크 권한 필요',
        '기타 튜닝을 위해 마이크 권한이 필요합니다.\n기기 설정에서 마이크 권한을 허용해주세요.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '설정 열기',
            onPress: () => {
              Linking.openSettings().catch((err) => {
                console.error('설정 열기 실패:', err);
              });
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Pitch 표시 또는 에러 메시지 */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <PitchDisplay
          note={pitchData.note}
          frequency={pitchData.frequency}
        />
      )}

      {/* 동물 그리드 */}
      <AnimalGrid
        cents={pitchData.cents}
        isActive={!pitchData.isWaitingForSound && pitchData.note !== null}
      />

      {/* 정확도 게이지 */}
      <PitchNeedle cents={pitchData.cents} />

      {/* 시작/중지 버튼 */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleMicButtonPress}
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
    padding: SCREEN_WIDTH * 0.05,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SCREEN_HEIGHT * 0.012,
    marginTop: SCREEN_HEIGHT * 0.006,
    minHeight: SCREEN_HEIGHT * 0.15, // PitchDisplay와 비슷한 높이 유지
    paddingHorizontal: SCREEN_WIDTH * 0.05,
  },
  errorText: {
    color: '#C62828',
    fontSize: RFValue(14),
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: RFValue(20),
  },
  button: {
    marginTop: SCREEN_HEIGHT * 0.006,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mikeImage: {
    width: MIKE_SIZE,
    height: MIKE_SIZE,
  },
});
