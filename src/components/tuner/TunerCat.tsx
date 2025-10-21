import React, { useEffect, useMemo } from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const CAT_STAND = require('../../../assets/images/cat/stand-cat.png');
const CAT_SLIDE = require('../../../assets/images/cat/slide-cat.png');

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface TunerCatProps {
  cents: number | null;
  isActive: boolean;
  tolerance?: number;
}

const DEFAULT_TOLERANCE = 5; // ±5 cents 이내면 in-tune 으로 간주

export default function TunerCat({
  cents,
  isActive,
  tolerance = DEFAULT_TOLERANCE,
}: TunerCatProps) {
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
    if (shouldSlide) {
      translateX.value = withRepeat(
        withSequence(
          withTiming(-14, { duration: 180 }),
          withTiming(14, { duration: 180 }),
          withTiming(0, { duration: 140 })
        ),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 220 }),
          withTiming(0.95, { duration: 220 }),
          withTiming(1, { duration: 180 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(translateX);
      cancelAnimation(scale);
      translateX.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isActive, isInTune, scale, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const catSource: ImageSourcePropType = useMemo(
    () => (isInTune ? CAT_STAND : CAT_SLIDE),
    [isInTune]
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <AnimatedImage source={catSource} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
