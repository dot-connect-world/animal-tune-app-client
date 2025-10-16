import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';
import { RWValue } from '../../utils/responsive';

interface BeatVisualizerProps {
  currentBeat: number; // 0 = 정지, 1-4 = 비트
  isPlaying: boolean;
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

export default function BeatVisualizer({ currentBeat, isPlaying }: BeatVisualizerProps) {
  const [activeImages, setActiveImages] = useState([false, false, false, false]);

  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const scale4 = useSharedValue(1);

  const opacity1 = useSharedValue(0.6);
  const opacity2 = useSharedValue(0.6);
  const opacity3 = useSharedValue(0.6);
  const opacity4 = useSharedValue(0.6);

  useEffect(() => {
    if (!isPlaying || currentBeat === 0) {
      // 정지 상태
      scale1.value = withTiming(1, { duration: 200 });
      scale2.value = withTiming(1, { duration: 200 });
      scale3.value = withTiming(1, { duration: 200 });
      scale4.value = withTiming(1, { duration: 200 });

      opacity1.value = withTiming(0.6, { duration: 200 });
      opacity2.value = withTiming(0.6, { duration: 200 });
      opacity3.value = withTiming(0.6, { duration: 200 });
      opacity4.value = withTiming(0.6, { duration: 200 });

      setActiveImages([false, false, false, false]);
      return;
    }

    // 비트 애니메이션 (스프링으로 더 부드럽게)
    const animateBeat = (
      index: number,
      scaleValue: SharedValue<number>,
      opacityValue: SharedValue<number>
    ) => {
      // 이미지를 drum으로 변경
      setActiveImages(prev => {
        const newActive = [...prev];
        newActive[index] = true;
        return newActive;
      });

      // 스프링 애니메이션으로 더 자연스러운 움직임
      scaleValue.value = withSpring(1.15, {
        damping: 10,
        stiffness: 150,
        mass: 0.5,
      });

      opacityValue.value = withTiming(1, { duration: 80 });

      // 250ms 후 복귀 애니메이션
      setTimeout(() => {
        scaleValue.value = withSpring(1, {
          damping: 12,
          stiffness: 120,
          mass: 0.8,
        });
        opacityValue.value = withTiming(0.6, { duration: 200 });
      }, 120);

      // 350ms 후 이미지를 stand로 복귀
      setTimeout(() => {
        setActiveImages(prev => {
          const newActive = [...prev];
          newActive[index] = false;
          return newActive;
        });
      }, 350);
    };

    // 현재 비트에 따라 애니메이션
    switch (currentBeat) {
      case 1:
        animateBeat(0, scale1, opacity1);
        break;
      case 2:
        animateBeat(1, scale2, opacity2);
        break;
      case 3:
        animateBeat(2, scale3, opacity3);
        break;
      case 4:
        animateBeat(3, scale4, opacity4);
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
        <Animated.View style={[styles.animalContainer, animatedStyle1]}>
          <Image
            source={activeImages[0] ? ANIMAL_IMAGES.drum[0] : ANIMAL_IMAGES.stand[0]}
            style={styles.animalImage}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View style={[styles.animalContainer, animatedStyle2]}>
          <Image
            source={activeImages[1] ? ANIMAL_IMAGES.drum[1] : ANIMAL_IMAGES.stand[1]}
            style={styles.animalImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      <View style={styles.row}>
        <Animated.View style={[styles.animalContainer, animatedStyle3]}>
          <Image
            source={activeImages[2] ? ANIMAL_IMAGES.drum[2] : ANIMAL_IMAGES.stand[2]}
            style={styles.animalImage}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View style={[styles.animalContainer, animatedStyle4]}>
          <Image
            source={activeImages[3] ? ANIMAL_IMAGES.drum[3] : ANIMAL_IMAGES.stand[3]}
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
    paddingVertical: RWValue(40),
  },
  row: {
    flexDirection: 'row',
    marginVertical: RWValue(12),
  },
  animalContainer: {
    width: RWValue(100),
    height: RWValue(100),
    marginHorizontal: RWValue(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalImage: {
    width: '100%',
    height: '100%',
  },
});
