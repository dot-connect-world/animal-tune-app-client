import React, { useEffect, useMemo } from 'react';
import { Image, ImageSourcePropType, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const ANIMAL_SIZE = isTablet
  ? Math.min(width * 0.18, height * 0.16)  // iPad: 작게
  : Math.min(width * 0.24, height * 0.21); // iPhone: 기존 크기

const HAMSTER_STAND = require('../../../assets/images/hemster/stand-hemster.png');
const HAMSTER_SLIDE = require('../../../assets/images/hemster/slide-hemster.png');

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface TunerHamsterProps {
  cents: number | null;
  isActive: boolean;
  tolerance?: number;
}

const DEFAULT_TOLERANCE = 5; // ±5 cents 이내면 in-tune 으로 간주

export default function TunerHamster({
  cents,
  isActive,
  tolerance = DEFAULT_TOLERANCE,
}: TunerHamsterProps) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  const isInTune = useMemo(() => {
    if (!isActive || cents === null) {
      return true;
    }
    return Math.abs(cents) <= tolerance;
  }, [cents, isActive, tolerance]);

  useEffect(() => {
    const shouldSlide = isActive && !isInTune;
    if (shouldSlide && cents !== null) {
      // cents 값에 비례하여 이동 (최대 ±50 픽셀 정도)
      const moveDistance = Math.max(-50, Math.min(50, cents * 2));
      translateX.value = withTiming(moveDistance, { duration: 300 });
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 400 }),
          withTiming(0.95, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(translateX);
      cancelAnimation(scale);
      translateX.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isActive, isInTune, scale, translateX, cents]);

  const animatedStyle = useAnimatedStyle(() => {
    // cents가 양수면 오른쪽으로 이동 (scaleX = 1), 음수면 왼쪽으로 이동 (scaleX = -1)
    const scaleX = cents !== null && cents > 0 ? -1 : 1;
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
        { scaleX },
      ],
    };
  });

  const hamsterSource: ImageSourcePropType = useMemo(
    () => (isInTune ? HAMSTER_STAND : HAMSTER_SLIDE),
    [isInTune]
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <AnimatedImage source={hamsterSource} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ANIMAL_SIZE,
    height: ANIMAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
