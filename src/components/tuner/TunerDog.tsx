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
const ANIMAL_SIZE = Math.min(width * 0.24, height * 0.21);

const DOG_STAND = require('../../../assets/images/dog/stand-dog.png');
const DOG_SLIDE = require('../../../assets/images/dog/slide-dog.png');

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface TunerDogProps {
  cents: number | null;
  isActive: boolean;
  tolerance?: number;
}

const DEFAULT_TOLERANCE = 5; // ±5 cents 이내면 in-tune 으로 간주

export default function TunerDog({
  cents,
  isActive,
  tolerance = DEFAULT_TOLERANCE,
}: TunerDogProps) {
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

  const dogSource: ImageSourcePropType = useMemo(
    () => (isInTune ? DOG_STAND : DOG_SLIDE),
    [isInTune]
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <AnimatedImage source={dogSource} style={styles.image} resizeMode="contain" />
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
