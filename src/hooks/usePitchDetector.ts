import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import Pitchy, { PitchyConfig, PitchyEventCallback } from 'react-native-pitchy';
import { getClosestNote, resetCurrentNote, Note } from '../constants/notes';

interface PitchData {
  frequency: number | null;
  note: Note | null;
  cents: number | null;
  clarity: number | null;
  isStabilizing: boolean; // 안정화 중 여부
  isWaitingForSound: boolean; // 소리 대기 중 여부 (1초 이상 소리 필요)
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
    isStabilizing: false,
    isWaitingForSound: false,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const isInitializedRef = useRef(false);
  const isStartingRef = useRef(false); // start() 실행 중 플래그

  // 안정화를 위한 상태
  const frequencyBufferRef = useRef<number[]>([]); // 초기 안정화 기간 동안의 주파수 저장
  const startTimeRef = useRef<number>(0); // 녹음 시작 시간
  const lastFrequencyRef = useRef<number | null>(null); // 스무딩용 이전 주파수
  const recentFrequenciesRef = useRef<number[]>([]); // 급격한 튐 방지를 위한 최근 값 저장

  // 소리 지속 시간 추적
  const soundStartTimeRef = useRef<number | null>(null); // 소리가 시작된 시간
  const lastSoundTimeRef = useRef<number>(0); // 마지막으로 소리가 감지된 시간
  const isActiveRef = useRef<boolean>(false); // 현재 활성화 상태 (1초 이상 소리 지속 후 활성화)
  const silenceStartRef = useRef<number | null>(null); // 연속 침묵 시작 시각

  const SOUND_DURATION_THRESHOLD = 300; // 0.3초 이상 소리가 지속되어야 활성화
  const SILENCE_DURATION_THRESHOLD = 250; // 0.25초 동안 침묵 지속 시 리셋
  const STABILIZATION_TIME = 300; // 활성화 직후 0.3초 동안 초기 평균값으로 안정화
  const SMOOTHING_FACTOR = 0.25; // 스무딩 강도 (0~1, 높을수록 빠른 반응)
  const MEDIAN_WINDOW_SIZE = 5; // 중앙값 필터 창 크기
  const LARGE_JUMP_RESET_THRESHOLD = 50; // 센트 기준으로 큰 점프 감지 (약 반음)

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
          // Pitchy 초기화 (악기 튜너 최적화 설정)
          const config: PitchyConfig = {
            bufferSize: 4096, // 긴 분석 창으로 배음/노이즈를 더 잘 걸러냄
            minVolume: 30,   // 요청값: 매우 강한 신호만 감지 (감쇠는 더 빨리 끊길 수 있음)
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
      // 중복 호출 방지
      if (isStartingRef.current) {
        if (__DEV__) console.log('⚠️ start() 이미 실행 중 - 무시함');
        return;
      }

      if (!hasPermission) {
        await requestPermission();
        return;
      }

      if (!isInitializedRef.current) {
        setError('피치 감지가 아직 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      isStartingRef.current = true;
      setError(null);

      // 이전 리스너가 있다면 제거 (재시작 시 중복 방지)
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      // Pitchy를 완전히 정지
      try {
        await Pitchy.stop();
      } catch (err) {
        // 무시 (Not recording 에러 등)
      }

      // Pitchy 재초기화 (중요: stop 후 재시작을 위해 필요)
      try {
        const config: PitchyConfig = {
          bufferSize: 4096,
          minVolume: 30,
        };
        await Pitchy.init(config);
      } catch (err) {
        // 재초기화 실패 시에도 계속 진행 (이미 초기화되어 있을 수 있음)
      }

      // 안정화 상태 초기화
      frequencyBufferRef.current = [];
      startTimeRef.current = Date.now();
      lastFrequencyRef.current = null;
      recentFrequenciesRef.current = [];

      // 소리 지속 시간 추적 초기화
      soundStartTimeRef.current = null;
      lastSoundTimeRef.current = 0;
      isActiveRef.current = false;
      silenceStartRef.current = null;

      // 초기 상태 설정 (소리 대기 중)
      setPitchData({
        frequency: null,
        note: null,
        cents: null,
        clarity: null,
        isStabilizing: false,
        isWaitingForSound: true,
      });

      // 오디오 모드 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Pitchy 리스너 설정 (소리 지속 시간 기반 감지 로직)
      const handlePitch: PitchyEventCallback = (data) => {
        const now = Date.now();

        // 디버깅: pitch 값 확인
        if (data.pitch === -1) {
          if (silenceStartRef.current === null) {
            silenceStartRef.current = now;
          }

          // 침묵 감지: 연속 침묵이 일정 시간 이상 지속될 때만 리셋
          if (isActiveRef.current && silenceStartRef.current !== null) {
            const silenceDuration = now - silenceStartRef.current;
            if (silenceDuration >= SILENCE_DURATION_THRESHOLD) {
              soundStartTimeRef.current = null;
              isActiveRef.current = false;
              frequencyBufferRef.current = [];
              lastFrequencyRef.current = null;
              silenceStartRef.current = null;
              recentFrequenciesRef.current = [];
              resetCurrentNote();

              setPitchData({
                frequency: null,
                note: null,
                cents: null,
                clarity: null,
                isStabilizing: false,
                isWaitingForSound: true,
              });
              lastSoundTimeRef.current = 0;
            }
          }
          return;
        }

        if (data.pitch && data.pitch > 0) {
          const rawFrequency = data.pitch;
          silenceStartRef.current = null;

          // 큰 음정 점프 감지: 기존 주파수 대비 50 cents 이상 차이나면 즉시 버퍼 리셋
          const referenceFrequency =
            lastFrequencyRef.current ??
            (recentFrequenciesRef.current.length > 0
              ? recentFrequenciesRef.current[recentFrequenciesRef.current.length - 1]
              : frequencyBufferRef.current.length > 0
              ? frequencyBufferRef.current[frequencyBufferRef.current.length - 1]
              : null);

          if (referenceFrequency) {
            const centsFromReference = Math.abs(
              1200 * Math.log2(rawFrequency / referenceFrequency)
            );
            if (centsFromReference >= LARGE_JUMP_RESET_THRESHOLD) {
              frequencyBufferRef.current = [];
              recentFrequenciesRef.current = [];
              lastFrequencyRef.current = null;
              startTimeRef.current = now;
              resetCurrentNote();
            }
          }

          // 기타 주파수 범위 확인 (65.41Hz ~ 987.77Hz: C2 ~ B5)
          if (rawFrequency < 60 || rawFrequency > 1000) {
            return;
          }

          // 소리가 감지됨 - 마지막 소리 시간 업데이트
          lastSoundTimeRef.current = now;

          // 1단계: 소리 지속 시간 확인 (0.3초 이상 지속되어야 활성화)
          if (!isActiveRef.current) {
            // 소리 시작 시간 기록
            if (soundStartTimeRef.current === null) {
              soundStartTimeRef.current = now;
            }

            // 소리 지속 시간 확인
            const soundDuration = now - soundStartTimeRef.current;
            if (soundDuration < SOUND_DURATION_THRESHOLD) {
              // 아직 0.3초가 되지 않음 - 대기 중 (UI 업데이트 하지 않음)
              return;
            }

            // 0.3초 이상 지속됨 - 활성화!
            isActiveRef.current = true;
            startTimeRef.current = now; // 안정화 시작 시간 재설정
            frequencyBufferRef.current = [];
            lastFrequencyRef.current = null;
            recentFrequenciesRef.current = [];
          }

          // 2단계: 활성화된 상태 - 정상 피치 감지
          const elapsedTime = now - startTimeRef.current;

          let frequency: number;
          let isStabilizing = false;

          // 2-1단계: 초기 0.3초 동안 평균 계산으로 안정화
          if (elapsedTime < STABILIZATION_TIME) {
            isStabilizing = true;
            frequencyBufferRef.current.push(rawFrequency);

            // 현재까지의 평균 표시
            const sum = frequencyBufferRef.current.reduce((acc, f) => acc + f, 0);
            frequency = sum / frequencyBufferRef.current.length;
          }
          // 2-2단계: 안정화 이후 스무딩 적용
          else {
            if (lastFrequencyRef.current === null) {
              // 안정화 완료 후 첫 값
              frequency = rawFrequency;
            } else {
              // 지수 이동 평균 (Exponential Moving Average)
              frequency = lastFrequencyRef.current * (1 - SMOOTHING_FACTOR) + rawFrequency * SMOOTHING_FACTOR;
            }
          }

          // 3단계: 중앙값 필터로 마지막 급격한 튐 완화
          const window = recentFrequenciesRef.current;
          window.push(frequency);
          if (window.length > MEDIAN_WINDOW_SIZE) {
            window.shift();
          }
          const sortedWindow = [...window].sort((a, b) => a - b);
          const midIndex = Math.floor(sortedWindow.length / 2);
          const medianFrequency =
            sortedWindow.length % 2 === 0
              ? (sortedWindow[midIndex - 1] + sortedWindow[midIndex]) / 2
              : sortedWindow[midIndex];
          frequency = medianFrequency;
          if (elapsedTime >= STABILIZATION_TIME) {
            lastFrequencyRef.current = frequency;
          }

          const { note, cents } = getClosestNote(frequency);

          setPitchData({
            frequency,
            note,
            cents,
            clarity: null, // Pitchy는 clarity를 제공하지 않음 (null로 명시)
            isStabilizing,
            isWaitingForSound: false,
          });
        }
      };

      // Pitchy 시작 (리스너 등록 전에 먼저 시작)
      await Pitchy.start();

      // 리스너 등록 (Pitchy가 시작된 후에 등록)
      subscriptionRef.current = Pitchy.addListener(handlePitch);

      setIsRecording(true);

    } catch (err) {
      setError('피치 감지 시작 실패: ' + (err as Error).message);
      setIsRecording(false);

      // 에러 발생 시 리스너 정리
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    } finally {
      isStartingRef.current = false; // 실행 완료
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
      lastFrequencyRef.current = null;

      // 소리 지속 시간 추적 초기화
      soundStartTimeRef.current = null;
      lastSoundTimeRef.current = 0;
      isActiveRef.current = false;
      silenceStartRef.current = null;
      recentFrequenciesRef.current = [];

      // Dead Zone을 위한 현재 음정 초기화
      resetCurrentNote();

      setPitchData({
        frequency: null,
        note: null,
        cents: null,
        clarity: null,
        isStabilizing: false,
        isWaitingForSound: false,
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
