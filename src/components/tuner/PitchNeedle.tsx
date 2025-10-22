import React, { useEffect, useRef } from 'react';
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
  const NEEDLE_DEAD_ZONE = 5; // ±5 cents 이하 변화는 무시 (바늘 미세 떨림 방지)
  const STICKY_WINDOW_MS = 150; // 정중앙 근처에서는 150ms 동안 스티키 처리
  const lastMoveTimestampRef = useRef<number>(Date.now());

  useEffect(() => {
    if (cents === null) {
      lastMoveTimestampRef.current = Date.now();
      needlePosition.value = withSpring(0, {
        damping: 25,
        stiffness: 75,
        mass: 0.8,
      });
      return;
    }

    const now = Date.now();

    // cents를 -1 ~ 1 범위로 정규화
    const normalized = Math.max(-1, Math.min(1, cents / MAX_CENTS));
    const currentNormalized = needlePosition.value;
    const diff = Math.abs(normalized - currentNormalized);
    const diffInCents = diff * MAX_CENTS;

    // Dead zone: 5 cents 이하 변화는 무시 (미세한 떨림 방지)
    if (diffInCents < NEEDLE_DEAD_ZONE) {
      return;
    }

    // 정중앙 근처에서 너무 빠른 왕복 움직임을 방지
    if (
      Math.abs(cents) <= NEEDLE_DEAD_ZONE &&
      now - lastMoveTimestampRef.current < STICKY_WINDOW_MS
    ) {
      return;
    }

    lastMoveTimestampRef.current = now;

    // 스프링 애니메이션으로 부드럽게 이동
    needlePosition.value = withSpring(normalized, {
      damping: 25, // 적절한 댐핑 (너무 높으면 느림)
      stiffness: 75, // 적절한 강성 (너무 낮으면 느림)
      mass: 0.8, // 적절한 질량 (급격한 움직임 방지)
    });
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
      [0, 0.06, 0.2, 1], // 0 = 중앙, 0.06 = 3 cents, 0.2 = 10 cents, 1 = 50 cents
      ['#4CAF50', '#4CAF50', '#FFC107', '#F44336'] // 초록(완벽) -> 초록 -> 노랑(거의) -> 빨강(조정필요)
    );
    return {
      backgroundColor: color,
    };
  });

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
});
