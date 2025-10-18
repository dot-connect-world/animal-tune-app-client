import { useState, useCallback, useEffect, useRef } from 'react';
const PreciseMetronome = require('../../modules/expo-precise-metronome/src');

interface UseNativeMetronomeReturn {
  bpm: number;
  isPlaying: boolean;
  currentBeat: number;
  setBpm: (bpm: number) => void;
  start: () => void;
  stop: () => void;
  increaseBpm: () => void;
  decreaseBpm: () => void;
}

const MIN_BPM = 40;
const MAX_BPM = 240;

export function useNativeMetronome(): UseNativeMetronomeReturn {
  const [bpm, setBpmState] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const bpmRef = useRef(120);
  const lastBeatTimeRef = useRef<number>(0);

  // BPM 설정
  const setBpm = useCallback((newBpm: number) => {
    const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
    setBpmState(clampedBpm);
    bpmRef.current = clampedBpm;

    // Update native module if playing
    if (isPlaying) {
      PreciseMetronome.setBpm(clampedBpm);
    }
  }, [isPlaying]);

  // BPM 증가
  const increaseBpm = useCallback(() => {
    setBpm(bpmRef.current + 1);
  }, [setBpm]);

  // BPM 감소
  const decreaseBpm = useCallback(() => {
    setBpm(bpmRef.current - 1);
  }, [setBpm]);

  // 메트로놈 시작
  const start = useCallback(() => {
    try {
      PreciseMetronome.start({
        bpm: bpmRef.current,
        beatsPerMeasure: 4,
        accentFirstBeat: true,
      });
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to start metronome:', error);
    }
  }, []);

  // 메트로놈 중지
  const stop = useCallback(() => {
    try {
      PreciseMetronome.stop();
      setIsPlaying(false);
      setCurrentBeat(0);
    } catch (error) {
      console.error('Failed to stop metronome:', error);
    }
  }, []);

  // Beat 이벤트 리스너
  useEffect(() => {
    const subscription = PreciseMetronome.addBeatListener((event) => {
      const now = Date.now();
      const interval = lastBeatTimeRef.current ? now - lastBeatTimeRef.current : 0;
      lastBeatTimeRef.current = now;

      setCurrentBeat(event.beatNumber);

      // 비트 간격 로그 (4→1 전환 시 특별 표시)
      const isFirstBeat = event.beatNumber === 1;
      const marker = isFirstBeat ? '🔴' : '  ';
      console.log(`${marker} Beat ${event.beatNumber} | Interval: ${interval}ms | Expected: ${60000/bpmRef.current}ms`);
    });

    return () => {
      subscription.remove();
      lastBeatTimeRef.current = 0;
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (isPlaying) {
        stop();
      }
    };
  }, [isPlaying, stop]);

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
