import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import Pitchy, { PitchyConfig, PitchyEventCallback } from 'react-native-pitchy';
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
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const isInitializedRef = useRef(false);

  // 안정화를 위한 상태
  const frequencyBufferRef = useRef<number[]>([]); // 초기 1초 동안의 주파수 저장
  const startTimeRef = useRef<number>(0); // 녹음 시작 시간
  const STABILIZATION_TIME = 1000; // 1초 동안 안정화
  const SMOOTHING_FACTOR = 0.3; // 스무딩 강도 (0~1, 낮을수록 부드러움)

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

  // Pitchy 초기화 (권한 획득 후)
  useEffect(() => {
    const initPitchy = async () => {
      if (hasPermission && !isInitializedRef.current) {
        try {
          // Pitchy 초기화 (최적화된 설정)
          const config: PitchyConfig = {
            bufferSize: 4096, // 더 큰 버퍼로 정확도 향상
            minVolume: -50,   // 최소 볼륨 임계값 (dB)
          };

          await Pitchy.init(config);
          isInitializedRef.current = true;
          console.log('Pitchy 초기화 완료');
        } catch (err) {
          console.error('Pitchy 초기화 실패:', err);
          setError('피치 감지 초기화 실패: ' + (err as Error).message);
        }
      }
    };

    initPitchy();

    // 클린업
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [hasPermission]);

  // Pitch detection 시작
  const start = useCallback(async () => {
    try {
      if (!hasPermission) {
        await requestPermission();
        return;
      }

      if (!isInitializedRef.current) {
        setError('피치 감지가 아직 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      setError(null);

      // 안정화 상태 초기화
      frequencyBufferRef.current = [];
      startTimeRef.current = Date.now();

      // 오디오 모드 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 이전 주파수 저장 (스무딩용)
      let lastFrequency: number | null = null;

      // Pitchy 리스너 설정 (안정화 로직 포함)
      const handlePitch: PitchyEventCallback = (data) => {
        // 디버깅: 실제 데이터 구조 확인
        if (__DEV__) {
          console.log('Pitchy data:', JSON.stringify(data, null, 2));
        }

        if (data.pitch && data.pitch > 0) {
          const rawFrequency = data.pitch;

          // 기타 주파수 범위 확인 (82Hz ~ 1046Hz: E2 ~ C6)
          if (rawFrequency < 60 || rawFrequency > 1200) {
            console.warn('주파수가 기타 범위를 벗어남:', rawFrequency);
            return;
          }

          const now = Date.now();
          const elapsedTime = now - startTimeRef.current;

          let frequency: number;

          // 1단계: 초기 1초 동안 평균 계산
          if (elapsedTime < STABILIZATION_TIME) {
            frequencyBufferRef.current.push(rawFrequency);

            // 현재까지의 평균 표시
            const sum = frequencyBufferRef.current.reduce((acc, f) => acc + f, 0);
            frequency = sum / frequencyBufferRef.current.length;

            if (__DEV__) {
              console.log(`안정화 중... (${frequencyBufferRef.current.length}개 샘플, 평균: ${frequency.toFixed(2)}Hz)`);
            }
          }
          // 2단계: 1초 이후 스무딩 적용
          else {
            if (lastFrequency === null) {
              // 안정화 완료 후 첫 값
              frequency = rawFrequency;
            } else {
              // 지수 이동 평균 (Exponential Moving Average)
              frequency = lastFrequency * (1 - SMOOTHING_FACTOR) + rawFrequency * SMOOTHING_FACTOR;
            }
            lastFrequency = frequency;
          }

          const { note, cents } = getClosestNote(frequency);

          setPitchData({
            frequency,
            note,
            cents,
            clarity: 0.9, // Pitchy는 clarity 제공하지 않음
          });
        }
      };

      // 리스너 등록
      subscriptionRef.current = Pitchy.addListener(handlePitch);

      // Pitchy 시작
      await Pitchy.start();
      setIsRecording(true);

    } catch (err) {
      setError('피치 감지 시작 실패: ' + (err as Error).message);
      setIsRecording(false);

      // 에러 발생 시 리스너 정리
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    }
  }, [hasPermission, requestPermission]);

  // Pitch detection 중지
  const stop = useCallback(async () => {
    try {
      // Pitchy 중지
      await Pitchy.stop();

      // 리스너 제거
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setIsRecording(false);

      // 안정화 버퍼 초기화
      frequencyBufferRef.current = [];

      setPitchData({
        frequency: null,
        note: null,
        cents: null,
        clarity: null,
      });
    } catch (err) {
      setError('피치 감지 중지 실패: ' + (err as Error).message);
    }
  }, []);

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
