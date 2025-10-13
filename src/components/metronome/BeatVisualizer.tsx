import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface BeatVisualizerProps {
  currentBeat: number; // 0 = 정지, 1-4 = 비트
  isPlaying: boolean;
}

const BEAT_COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30']; // 파랑, 초록, 주황, 빨강

export default function BeatVisualizer({ currentBeat, isPlaying }: BeatVisualizerProps) {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const scale4 = useSharedValue(1);

  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);
  const opacity4 = useSharedValue(0.3);

  useEffect(() => {
    if (!isPlaying || currentBeat === 0) {
      // 정지 상태
      scale1.value = withTiming(1, { duration: 200 });
      scale2.value = withTiming(1, { duration: 200 });
      scale3.value = withTiming(1, { duration: 200 });
      scale4.value = withTiming(1, { duration: 200 });

      opacity1.value = withTiming(0.3, { duration: 200 });
      opacity2.value = withTiming(0.3, { duration: 200 });
      opacity3.value = withTiming(0.3, { duration: 200 });
      opacity4.value = withTiming(0.3, { duration: 200 });
      return;
    }

    // 비트 애니메이션
    const animateBeat = (scaleValue: Animated.SharedValue<number>, opacityValue: Animated.SharedValue<number>) => {
      scaleValue.value = withSequence(
        withTiming(1.3, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 300, easing: Easing.in(Easing.quad) })
      );
      opacityValue.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0.3, { duration: 300 })
      );
    };

    // 현재 비트에 따라 애니메이션
    switch (currentBeat) {
      case 1:
        animateBeat(scale1, opacity1);
        break;
      case 2:
        animateBeat(scale2, opacity2);
        break;
      case 3:
        animateBeat(scale3, opacity3);
        break;
      case 4:
        animateBeat(scale4, opacity4);
        break;
    }
  }, [currentBeat, isPlaying]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  const animatedStyle4 = useAnimatedStyle(() => ({
    transform: [{ scale: scale4.value }],
    opacity: opacity4.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Animated.View style={[styles.circle, { backgroundColor: BEAT_COLORS[0] }, animatedStyle1]} />
        <Animated.View style={[styles.circle, { backgroundColor: BEAT_COLORS[1] }, animatedStyle2]} />
      </View>
      <View style={styles.row}>
        <Animated.View style={[styles.circle, { backgroundColor: BEAT_COLORS[2] }, animatedStyle3]} />
        <Animated.View style={[styles.circle, { backgroundColor: BEAT_COLORS[3] }, animatedStyle4]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  row: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
