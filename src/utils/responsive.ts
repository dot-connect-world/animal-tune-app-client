import { Dimensions } from 'react-native';
import { RFValue as RFValueLib } from 'react-native-responsive-fontsize';

const { width, height } = Dimensions.get('window');

// 기준 화면 크기 (iPhone 11 Pro 기준)
const baseWidth = 375;
const baseHeight = 812;

/**
 * Responsive Font Value
 * react-native-responsive-fontsize 라이브러리 사용
 */
export const RFValue = (fontSize: number): number => {
  return RFValueLib(fontSize, height);
};

/**
 * Responsive Width Value
 * 화면 너비에 비례하여 값을 조정합니다.
 */
export const RWValue = (value: number): number => {
  const scale = width / baseWidth;
  return Math.round(value * scale);
};

/**
 * Responsive Height Value
 * 화면 높이에 비례하여 값을 조정합니다.
 */
export const RHValue = (value: number): number => {
  const scale = height / baseHeight;
  return Math.round(value * scale);
};

export const screenWidth = width;
export const screenHeight = height;
