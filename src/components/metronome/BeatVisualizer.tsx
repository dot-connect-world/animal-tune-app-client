import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { RWValue } from '../../utils/responsive';

interface BeatVisualizerProps {
  currentBeat: number; // 0 = 정지, 1-4 = 비트
  isPlaying: boolean;
  bpm: number; // BPM 추가
}

const ANIMAL_IMAGES = {
  stand: [
    require('../../../assets/images/dog/stand-dog.png'),
    require('../../../assets/images/cat/stand-cat.png'),
    require('../../../assets/images/turtule/stand-turtle-Photoroom.png'),
    require('../../../assets/images/hemster/stand-hemster.png'),
  ],
  drum: [
    require('../../../assets/images/dog/drum-dog.png'),
    require('../../../assets/images/cat/drum-cat.png'),
    require('../../../assets/images/turtule/drum-turtle-Photoroom.png'),
    require('../../../assets/images/hemster/drum-hemster.png'),
  ],
};

export default function BeatVisualizer({ currentBeat, isPlaying, bpm }: BeatVisualizerProps) {
  // 각 동물의 drum 상태를 State로 관리 (겹침 방지)
  const [isDrumming1, setIsDrumming1] = useState(false);
  const [isDrumming2, setIsDrumming2] = useState(false);
  const [isDrumming3, setIsDrumming3] = useState(false);
  const [isDrumming4, setIsDrumming4] = useState(false);

  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const scale4 = useSharedValue(1);

  const opacity1 = useSharedValue(0.6);
  const opacity2 = useSharedValue(0.6);
  const opacity3 = useSharedValue(0.6);
  const opacity4 = useSharedValue(0.6);

  // BPM에 따른 애니메이션 duration 계산
  // 비트 간격 = 60000ms / bpm (1분을 ms로 변환하고 bpm으로 나눔)
  // 애니메이션은 비트 간격의 70%로 설정하여 겹치지 않도록
  const beatInterval = 60000 / bpm;
  const animDuration = Math.min(beatInterval * 0.7, 250); // 최대 250ms
  const hitDuration = Math.min(animDuration * 0.4, 80); // 타격 시간
  const fadeDuration = Math.min(animDuration * 0.6, 150); // 페이드 시간

  useEffect(() => {
    if (!isPlaying || currentBeat === 0) {
      // 정지 상태 - 모두 stand 이미지로
      setIsDrumming1(false);
      setIsDrumming2(false);
      setIsDrumming3(false);
      setIsDrumming4(false);

      scale1.value = withTiming(1, { duration: 200 });
      scale2.value = withTiming(1, { duration: 200 });
      scale3.value = withTiming(1, { duration: 200 });
      scale4.value = withTiming(1, { duration: 200 });

      opacity1.value = withTiming(0.6, { duration: 200 });
      opacity2.value = withTiming(0.6, { duration: 200 });
      opacity3.value = withTiming(0.6, { duration: 200 });
      opacity4.value = withTiming(0.6, { duration: 200 });
      return;
    }

    // 새 비트 시작 시 모든 이전 애니메이션을 즉시 리셋
    const resetOthers = (except: number) => {
      if (except !== 1) {
        setIsDrumming1(false);
        scale1.value = 1;
        opacity1.value = 0.6;
      }
      if (except !== 2) {
        setIsDrumming2(false);
        scale2.value = 1;
        opacity2.value = 0.6;
      }
      if (except !== 3) {
        setIsDrumming3(false);
        scale3.value = 1;
        opacity3.value = 0.6;
      }
      if (except !== 4) {
        setIsDrumming4(false);
        scale4.value = 1;
        opacity4.value = 0.6;
      }
    };

    // 비트 애니메이션 (모두 UI 스레드에서 동기 처리)
    const animateBeat = (
      beatNum: number,
      setDrumming: (value: boolean) => void,
      scaleValue: SharedValue<number>,
      opacityValue: SharedValue<number>
    ) => {
      // 다른 동물들의 애니메이션 즉시 중단
      resetOthers(beatNum);

      // drum 이미지 즉시 표시
      setDrumming(true);

      // withSequence를 사용하여 순차적 애니메이션 보장
      scaleValue.value = withSequence(
        withTiming(1.2, { duration: hitDuration, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: fadeDuration, easing: Easing.in(Easing.quad) })
      );

      opacityValue.value = withSequence(
        withTiming(1, { duration: hitDuration }),
        withTiming(0.6, { duration: fadeDuration })
      );

      // drum 이미지를 stand로 복귀
      setTimeout(() => {
        setDrumming(false);
      }, hitDuration + fadeDuration);
    };

    // 현재 비트에 따라 애니메이션
    switch (currentBeat) {
      case 1:
        animateBeat(1, setIsDrumming1, scale1, opacity1);
        break;
      case 2:
        animateBeat(2, setIsDrumming2, scale2, opacity2);
        break;
      case 3:
        animateBeat(3, setIsDrumming3, scale3, opacity3);
        break;
      case 4:
        animateBeat(4, setIsDrumming4, scale4, opacity4);
        break;
    }
  }, [currentBeat, isPlaying, hitDuration, fadeDuration]);

  const animatedContainerStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const animatedContainerStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  const animatedContainerStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  const animatedContainerStyle4 = useAnimatedStyle(() => ({
    transform: [{ scale: scale4.value }],
    opacity: opacity4.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* 동물 1 */}
        <Animated.View style={[styles.animalContainer, animatedContainerStyle1]}>
          <Image
            source={isDrumming1 ? ANIMAL_IMAGES.drum[0] : ANIMAL_IMAGES.stand[0]}
            style={styles.animalImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 동물 2 */}
        <Animated.View style={[styles.animalContainer, animatedContainerStyle2]}>
          <Image
            source={isDrumming2 ? ANIMAL_IMAGES.drum[1] : ANIMAL_IMAGES.stand[1]}
            style={styles.animalImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 동물 3 */}
        <Animated.View style={[styles.animalContainer, animatedContainerStyle3]}>
          <Image
            source={isDrumming3 ? ANIMAL_IMAGES.drum[2] : ANIMAL_IMAGES.stand[2]}
            style={styles.animalImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 동물 4 */}
        <Animated.View style={[styles.animalContainer, animatedContainerStyle4]}>
          <Image
            source={isDrumming4 ? ANIMAL_IMAGES.drum[3] : ANIMAL_IMAGES.stand[3]}
            style={styles.animalImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: RWValue(10),
    marginBottom: RWValue(20),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: RWValue(65),
  },
  animalContainer: {
    width: RWValue(90),
    height: RWValue(90),
    marginHorizontal: RWValue(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalImage: {
    width: '100%',
    height: '100%',
  },
});
