import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { RWValue, RHValue, isTablet } from '../../utils/responsive';

interface BeatVisualizerProps {
  currentBeat: number; // 0 = 정지
  isPlaying: boolean;
  bpm: number;
  beatsPerMeasure: number;
  beatPulse: number;
}

type AnimalImage = {
  stand: ReturnType<typeof require>;
  drum: ReturnType<typeof require>;
};

const BASE_ANIMALS: AnimalImage[] = [
  {
    stand: require('../../../assets/images/dog/stand-dog.png'),
    drum: require('../../../assets/images/dog/drum-dog.png'),
  },
  {
    stand: require('../../../assets/images/cat/stand-cat.png'),
    drum: require('../../../assets/images/cat/drum-cat.png'),
  },
  {
    stand: require('../../../assets/images/turtule/stand-turtle-Photoroom.png'),
    drum: require('../../../assets/images/turtule/drum-turtle-Photoroom.png'),
  },
  {
    stand: require('../../../assets/images/hemster/stand-hemster.png'),
    drum: require('../../../assets/images/hemster/drum-hemster.png'),
  },
];

const MAX_BEATS = 8;

export default function BeatVisualizer({
  currentBeat,
  isPlaying,
  bpm,
  beatsPerMeasure,
  beatPulse,
}: BeatVisualizerProps) {
  const [drummingStates, setDrummingStates] = useState<boolean[]>(
    () => Array(MAX_BEATS).fill(false)
  );

  // Shared values for up to 8 cells
  const scaleValue1 = useSharedValue(1);
  const scaleValue2 = useSharedValue(1);
  const scaleValue3 = useSharedValue(1);
  const scaleValue4 = useSharedValue(1);
  const scaleValue5 = useSharedValue(1);
  const scaleValue6 = useSharedValue(1);
  const scaleValue7 = useSharedValue(1);
  const scaleValue8 = useSharedValue(1);

  const opacityValue1 = useSharedValue(0.6);
  const opacityValue2 = useSharedValue(0.6);
  const opacityValue3 = useSharedValue(0.6);
  const opacityValue4 = useSharedValue(0.6);
  const opacityValue5 = useSharedValue(0.6);
  const opacityValue6 = useSharedValue(0.6);
  const opacityValue7 = useSharedValue(0.6);
  const opacityValue8 = useSharedValue(0.6);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue1.value }],
    opacity: opacityValue1.value,
  }));
  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue2.value }],
    opacity: opacityValue2.value,
  }));
  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue3.value }],
    opacity: opacityValue3.value,
  }));
  const animatedStyle4 = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue4.value }],
    opacity: opacityValue4.value,
  }));
  const animatedStyle5 = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue5.value }],
    opacity: opacityValue5.value,
  }));
  const animatedStyle6 = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue6.value }],
    opacity: opacityValue6.value,
  }));
  const animatedStyle7 = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue7.value }],
    opacity: opacityValue7.value,
  }));
  const animatedStyle8 = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue8.value }],
    opacity: opacityValue8.value,
  }));

  const scaleValues = useMemo(
    () => [
      scaleValue1,
      scaleValue2,
      scaleValue3,
      scaleValue4,
      scaleValue5,
      scaleValue6,
      scaleValue7,
      scaleValue8,
    ],
    [
      scaleValue1,
      scaleValue2,
      scaleValue3,
      scaleValue4,
      scaleValue5,
      scaleValue6,
      scaleValue7,
      scaleValue8,
    ]
  );

  const opacityValues = useMemo(
    () => [
      opacityValue1,
      opacityValue2,
      opacityValue3,
      opacityValue4,
      opacityValue5,
      opacityValue6,
      opacityValue7,
      opacityValue8,
    ],
    [
      opacityValue1,
      opacityValue2,
      opacityValue3,
      opacityValue4,
      opacityValue5,
      opacityValue6,
      opacityValue7,
      opacityValue8,
    ]
  );

  const animatedStyles = useMemo(
    () => [
      animatedStyle1,
      animatedStyle2,
      animatedStyle3,
      animatedStyle4,
      animatedStyle5,
      animatedStyle6,
      animatedStyle7,
      animatedStyle8,
    ],
    [
      animatedStyle1,
      animatedStyle2,
      animatedStyle3,
      animatedStyle4,
      animatedStyle5,
      animatedStyle6,
      animatedStyle7,
      animatedStyle8,
    ]
  );

  // BPM에 따른 duration 계산
  const beatInterval = 60000 / bpm;
  const animDuration = Math.min(beatInterval * 0.7, 250);
  const hitDuration = Math.min(animDuration * 0.4, 90);
  const fadeDuration = Math.min(animDuration * 0.6, 150);

  const resetVisuals = useCallback(() => {
    setDrummingStates((prev) => {
      if (prev.every((state) => !state)) {
        return prev;
      }
      return Array(MAX_BEATS).fill(false);
    });

    scaleValues.forEach((scale) => {
      scale.value = withTiming(1, { duration: 200 });
    });
    opacityValues.forEach((opacity) => {
      opacity.value = withTiming(0.6, { duration: 200 });
    });
  }, [opacityValues, scaleValues]);

  useEffect(() => {
    if (!isPlaying || currentBeat === 0) {
      resetVisuals();
      return;
    }

    const activeBeats = Math.max(1, Math.min(beatsPerMeasure, MAX_BEATS));
    const normalizedBeat = ((currentBeat - 1) % activeBeats + activeBeats) % activeBeats;
    const targetIndex = Math.min(normalizedBeat, MAX_BEATS - 1);

    scaleValues.forEach((scale, index) => {
      if (index === targetIndex) {
        scale.value = withSequence(
          withTiming(1.2, { duration: hitDuration, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: fadeDuration, easing: Easing.in(Easing.quad) })
        );
        opacityValues[index].value = withSequence(
          withTiming(1, { duration: hitDuration }),
          withTiming(0.6, { duration: fadeDuration })
        );
      } else {
        scale.value = withTiming(1, { duration: 120 });
        opacityValues[index].value = withTiming(0.6, { duration: 120 });
      }
    });

    setDrummingStates((prev) => {
      const next = prev.map((_, idx) => idx === targetIndex);
      return next;
    });

    const timeout = setTimeout(() => {
      setDrummingStates((prev) => {
        if (!prev[targetIndex]) {
          return prev;
        }
        const next = [...prev];
        next[targetIndex] = false;
        return next;
      });
    }, hitDuration + fadeDuration);

    return () => {
      clearTimeout(timeout);
    };
  }, [
    beatPulse,
    beatsPerMeasure,
    currentBeat,
    fadeDuration,
    hitDuration,
    isPlaying,
    opacityValues,
    scaleValues,
    resetVisuals,
  ]);

  const cellsToRender = useMemo(
    () => Math.min(Math.max(1, beatsPerMeasure), MAX_BEATS),
    [beatsPerMeasure]
  );

  const animals = useMemo(() => {
    return Array.from({ length: cellsToRender }, (_, index) => {
      const animal = BASE_ANIMALS[index % BASE_ANIMALS.length];
      return {
        ...animal,
        index,
      };
    });
  }, [cellsToRender]);

  const hasUpperRow = cellsToRender > 4;

  return (
    <View
      style={[
        styles.container,
        hasUpperRow ? styles.containerMultiRow : styles.containerSingleRow,
      ]}
    >
      <View style={[styles.grid, hasUpperRow && styles.gridMultiRow]}>
        {animals.map(({ stand, drum, index }) => (
          <Animated.View
            key={`beat-animal-${index}`}
            style={[styles.animalContainer, animatedStyles[index]]}
          >
            <Image
              source={drummingStates[index] ? drum : stand}
              style={styles.animalImage}
              resizeMode="contain"
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: RHValue(6),
    marginBottom: RHValue(4),
    height: RWValue(isTablet ? 360 : 220),
  },
  containerSingleRow: {
    justifyContent: 'center',
  },
  containerMultiRow: {
    justifyContent: 'flex-start',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: RWValue(6),
  },
  gridMultiRow: {
    paddingTop: RHValue(4),
  },
  animalContainer: {
    width: '25%',
    maxWidth: RWValue(isTablet ? 120 : 88),
    aspectRatio: 1,
    paddingHorizontal: RWValue(4),
    paddingVertical: RHValue(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalImage: {
    width: '100%',
    height: '100%',
  },
});
