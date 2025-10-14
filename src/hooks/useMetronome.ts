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

  const normalSoundRef = useRef<Audio.Sound | null>(null); // 일반 박자 (click.mp3)
  const accentSoundRef = useRef<Audio.Sound | null>(null); // 첫 박자 (metronome-wood.mp3)
  const bpmRef = useRef<number>(120);
  const isPlayingRef = useRef<boolean>(false);

  // Look-Ahead 스케줄러
  const schedulerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextBeatTimeRef = useRef<number>(0);
  const beatCountRef = useRef<number>(0);
  const scheduledTimersRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Look-Ahead 설정
  const SCHEDULE_AHEAD_TIME = 100; // 100ms 미리 예약
  const SCHEDULER_INTERVAL = 25; // 25ms마다 체크

  // BPM 설정 (범위 체크)
  const setBpm = useCallback((newBpm: number) => {
    const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
    setBpmState(clampedBpm);
    bpmRef.current = clampedBpm;
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
    if (normalSoundRef.current && accentSoundRef.current) return;

    try {
      // 오디오 모드 설정 (안드로이드에서도 작동하도록)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // 일반 박자 사운드 (rate 1.0)
      const { sound: normalSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/click.mp3'),
        {
          shouldPlay: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        }
      );
      await normalSound.setRateAsync(1.0, true); // rate 고정
      normalSoundRef.current = normalSound;

      // 첫 박자 사운드 (편집된 우드블록 - 짧은 딸깍)
      const { sound: accentSound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/metronome-wood.mp3'),
        {
          shouldPlay: false,
          volume: 1.0, // 풀 볼륨
        }
      );
      accentSoundRef.current = accentSound;

      console.log('메트로놈 사운드 로드 완료 (2개 인스턴스)');
    } catch (error) {
      console.error('사운드 로드 실패:', error);
    }
  }, []);

  // 사운드 재생 (비차단 방식)
  const playSound = useCallback((isAccent: boolean = false) => {
    // 적절한 사운드 인스턴스 선택
    const targetSound = isAccent ? accentSoundRef.current : normalSoundRef.current;

    if (!targetSound) return;

    // 비동기 작업을 비차단 방식으로 실행 (타이밍 정확도 유지)
    (async () => {
      try {
        // 사운드 상태 확인
        const status = await targetSound.getStatusAsync();

        if (!status.isLoaded) {
          console.warn('사운드가 아직 로드되지 않았습니다.');
          return;
        }

        // 재생 중이면 중지
        if (status.isPlaying) {
          await targetSound.stopAsync();
        }

        await targetSound.setPositionAsync(0);
        await targetSound.playAsync();
      } catch (error) {
        console.error('사운드 재생 실패:', error);
      }
    })();
  }, []);

  // Look-Ahead 스케줄러: 미리 여러 박자를 예약
  const scheduler = useCallback(() => {
    if (!isPlayingRef.current) return;

    const now = Date.now();
    const beatDuration = (60 / bpmRef.current) * 1000;

    // 현재 시간 + 100ms 안에 재생할 박자들을 모두 예약
    while (nextBeatTimeRef.current < now + SCHEDULE_AHEAD_TIME) {
      const beatTime = nextBeatTimeRef.current;
      const currentBeatNumber = (beatCountRef.current % 4) + 1;
      const delay = Math.max(0, beatTime - now);
      const isFirstBeat = currentBeatNumber === 1; // 첫 번째 박자 여부

      // 박자 예약
      const timer = setTimeout(() => {
        if (!isPlayingRef.current) return;

        // 첫 번째 박자는 강조
        playSound(isFirstBeat);
        setCurrentBeat(currentBeatNumber as 1 | 2 | 3 | 4);

        // 타이머 세트에서 제거
        scheduledTimersRef.current.delete(timer);
      }, delay);

      // 예약된 타이머 추적
      scheduledTimersRef.current.add(timer);

      // 다음 박자 시간 계산
      nextBeatTimeRef.current += beatDuration;
      beatCountRef.current++;
    }
  }, [playSound]);

  // 메트로놈 시작
  const start = useCallback(async () => {
    if (isPlayingRef.current) return;

    await loadSound();

    isPlayingRef.current = true;
    setIsPlaying(true);

    // 초기화
    nextBeatTimeRef.current = Date.now();
    beatCountRef.current = 0;

    // 첫 스케줄링 실행 (즉시 여러 박자 예약)
    scheduler();

    // 25ms마다 스케줄러 실행하여 계속 박자 추가
    schedulerIntervalRef.current = setInterval(scheduler, SCHEDULER_INTERVAL);
  }, [loadSound, scheduler]);

  // 메트로놈 중지
  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentBeat(0);

    // 스케줄러 중지
    if (schedulerIntervalRef.current) {
      clearInterval(schedulerIntervalRef.current);
      schedulerIntervalRef.current = null;
    }

    // 예약된 모든 타이머 취소
    scheduledTimersRef.current.forEach((timer) => {
      clearTimeout(timer);
    });
    scheduledTimersRef.current.clear();
  }, []);

  // 클린업
  useEffect(() => {
    return () => {
      stop();
      if (normalSoundRef.current) {
        normalSoundRef.current.unloadAsync();
      }
      if (accentSoundRef.current) {
        accentSoundRef.current.unloadAsync();
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
