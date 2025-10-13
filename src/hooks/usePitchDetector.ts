import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { getClosestNote, Note } from '../constants/notes';

interface PitchData {
  frequency: number | null;
  note: Note | null;
  cents: number | null;
  clarity: number | null;
}

interface UsePitchDetectorReturn {
  pitchData: PitchData;
  isRecording: boolean;
  hasPermission: boolean | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  requestPermission: () => Promise<void>;
}

export function usePitchDetector(): UsePitchDetectorReturn {
  const [pitchData, setPitchData] = useState<PitchData>({
    frequency: null,
    note: null,
    cents: null,
    clarity: null,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // 권한 요청
  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        setError('마이크 권한이 필요합니다.');
      }
    } catch (err) {
      setError('권한 요청 실패: ' + (err as Error).message);
    }
  }, []);

  // 초기 권한 확인
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Pitch detection 시작
  const start = useCallback(async () => {
    try {
      if (!hasPermission) {
        await requestPermission();
        return;
      }

      setError(null);

      // 오디오 모드 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 녹음 시작 (임시 구현 - react-native-pitchy로 교체 예정)
      // react-native-pitchy는 네이티브 빌드 후 사용 가능
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);

      // TODO: react-native-pitchy 통합
      // 현재는 임시로 랜덤 데이터 생성 (테스트용)
      simulatePitchDetection();

    } catch (err) {
      setError('녹음 시작 실패: ' + (err as Error).message);
      setIsRecording(false);
    }
  }, [hasPermission, requestPermission]);

  // Pitch detection 중지
  const stop = useCallback(async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setIsRecording(false);
      setPitchData({
        frequency: null,
        note: null,
        cents: null,
        clarity: null,
      });
    } catch (err) {
      setError('녹음 중지 실패: ' + (err as Error).message);
    }
  }, [recording]);

  // 임시 시뮬레이션 (개발 빌드 후 react-native-pitchy로 교체)
  const simulatePitchDetection = () => {
    const interval = setInterval(() => {
      // 기타 E2 (82.41Hz) 주변 주파수 시뮬레이션
      const baseFreq = 82.41;
      const randomOffset = (Math.random() - 0.5) * 5; // ±2.5Hz
      const frequency = baseFreq + randomOffset;

      const { note, cents } = getClosestNote(frequency);
      const clarity = 0.8 + Math.random() * 0.2; // 0.8~1.0

      setPitchData({
        frequency,
        note,
        cents,
        clarity,
      });
    }, 100);

    // 컴포넌트 언마운트 시 정리
    return () => clearInterval(interval);
  };

  return {
    pitchData,
    isRecording,
    hasPermission,
    error,
    start,
    stop,
    requestPermission,
  };
}
