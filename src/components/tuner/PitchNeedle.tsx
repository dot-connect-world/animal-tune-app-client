import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

interface PitchNeedleProps {
  cents: number | null; // -50 ~ +50
}

const { width } = Dimensions.get('window');
const GAUGE_WIDTH = width * 0.8;
const MAX_CENTS = 50;

export default function PitchNeedle({ cents }: PitchNeedleProps) {
  const needlePosition = useSharedValue(0);

  useEffect(() => {
    if (cents !== null) {
      // cents를 -1 ~ 1 범위로 정규화
      const normalized = Math.max(-1, Math.min(1, cents / MAX_CENTS));
      needlePosition.value = withSpring(normalized, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      needlePosition.value = withSpring(0);
    }
  }, [cents]);

  // 바늘 위치 애니메이션
  const needleStyle = useAnimatedStyle(() => {
    const translateX = needlePosition.value * (GAUGE_WIDTH / 2 - 20);
    return {
      transform: [{ translateX }],
    };
  });

  // 색상 애니메이션 (정확할수록 초록색)
  const colorStyle = useAnimatedStyle(() => {
    const absValue = Math.abs(needlePosition.value);
    const color = interpolateColor(
      absValue,
      [0, 0.2, 1],
      ['#4CAF50', '#FFC107', '#F44336'] // 초록 -> 노랑 -> 빨강
    );
    return {
      backgroundColor: color,
    };
  });

  const getAccuracyText = () => {
    if (cents === null) return '대기 중...';
    const absCents = Math.abs(cents);
    if (absCents < 5) return '완벽! 🎉';
    if (absCents < 10) return '거의 맞음 👍';
    if (absCents < 20) return cents > 0 ? '조금 높음 ⬆️' : '조금 낮음 ⬇️';
    return cents > 0 ? '너무 높음 ⬆️⬆️' : '너무 낮음 ⬇️⬇️';
  };

  return (
    <View style={styles.container}>
      {/* 게이지 배경 */}
      <View style={styles.gauge}>
        {/* 중앙선 */}
        <View style={styles.centerLine} />

        {/* 눈금 표시 */}
        <View style={styles.ticksContainer}>
          <Text style={styles.tickLabel}>-50</Text>
          <Text style={styles.tickLabel}>0</Text>
          <Text style={styles.tickLabel}>+50</Text>
        </View>

        {/* 바늘 */}
        <Animated.View style={[styles.needleContainer, needleStyle]}>
          <Animated.View style={[styles.needle, colorStyle]} />
        </Animated.View>
      </View>

      {/* Cents 값 표시 */}
      <View style={styles.infoContainer}>
        <Text style={styles.centsValue}>
          {cents !== null ? `${cents > 0 ? '+' : ''}${cents.toFixed(0)} cents` : '-- cents'}
        </Text>
        <Text style={styles.accuracyText}>
          {getAccuracyText()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 30,
    width: '100%',
  },
  gauge: {
    width: GAUGE_WIDTH,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centerLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#007AFF',
    opacity: 0.3,
  },
  ticksContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    bottom: 8,
  },
  tickLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  needleContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  needle: {
    width: 8,
    height: 40,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  infoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  centsValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  accuracyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
});
