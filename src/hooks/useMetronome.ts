import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

interface UseMetronomeReturn {
  bpm: number;
  isPlaying: boolean;
  currentBeat: number;
  setBpm: (bpm: number) => void;
  start: () => Promise<void>;
  stop: () => void;
  increaseBpm: () => void;
  decreaseBpm: () => void;
}

const MIN_BPM = 40;
const MAX_BPM = 240;

export function useMetronome(): UseMetronomeReturn {
  const [bpm, setBpmState] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const nextBeatTimeRef = useRef<number>(0);
  const audioContextRef = useRef<any>(null);

  // BPM 설정 (범위 체크)
  const setBpm = useCallback((newBpm: number) => {
    const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
    setBpmState(clampedBpm);
  }, []);

  // BPM 증가
  const increaseBpm = useCallback(() => {
    setBpm(bpm + 1);
  }, [bpm, setBpm]);

  // BPM 감소
  const decreaseBpm = useCallback(() => {
    setBpm(bpm - 1);
  }, [bpm, setBpm]);

  // 사운드 로드
  const loadSound = useCallback(async () => {
    if (soundRef.current) return;

    try {
      // 오디오 모드 설정
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // 간단한 클릭 사운드 생성 (실제로는 클릭 사운드 파일 사용 권장)
      // 임시로 expo-av의 기본 사운드 사용
      const { sound } = await Audio.Sound.createAsync(
        // 짧은 beep 사운드 URI (실제로는 assets/sounds/click.wav 사용)
        { uri: 'https://www.soundjay.com/mechanical/sounds/click-1.mp3' },
        { shouldPlay: false }
      );

      soundRef.current = sound;
    } catch (error) {
      console.error('사운드 로드 실패:', error);
    }
  }, []);

  // 메트로놈 시작
  const start = useCallback(async () => {
    if (isPlaying) return;

    await loadSound();

    setIsPlaying(true);
    setCurrentBeat(0);

    // 정확한 타이밍을 위해 초기 시간 설정
    nextBeatTimeRef.current = Date.now();

    // 메트로놈 루프
    const tick = async () => {
      if (!isPlaying) return;

      const now = Date.now();
      const intervalMs = (60 / bpm) * 1000;

      // 다음 비트 시간이 되었는지 확인
      if (now >= nextBeatTimeRef.current) {
        // 사운드 재생
        if (soundRef.current) {
          try {
            await soundRef.current.replayAsync();
          } catch (error) {
            console.error('사운드 재생 실패:', error);
          }
        }

        // 비트 카운터 증가 (1-4 순환)
        setCurrentBeat((prev) => (prev % 4) + 1);

        // 다음 비트 시간 계산 (누적 오차 보정)
        nextBeatTimeRef.current += intervalMs;
      }
    };

    // 짧은 간격으로 체크 (정확도 향상)
    intervalRef.current = setInterval(tick, 10);
  }, [isPlaying, bpm, loadSound]);

  // 메트로놈 중지
  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentBeat(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // BPM 변경 시 재시작
  useEffect(() => {
    if (isPlaying) {
      stop();
      start();
    }
  }, [bpm]);

  // 클린업
  useEffect(() => {
    return () => {
      stop();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return {
    bpm,
    isPlaying,
    currentBeat,
    setBpm,
    start,
    stop,
    increaseBpm,
    decreaseBpm,
  };
}
