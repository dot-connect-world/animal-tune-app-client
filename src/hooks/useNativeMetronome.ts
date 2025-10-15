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
      setCurrentBeat(event.beatNumber);
      console.log(`Beat ${event.beatNumber}, Accent: ${event.isAccent}, Time: ${event.timestamp}`);
    });

    return () => {
      subscription.remove();
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
