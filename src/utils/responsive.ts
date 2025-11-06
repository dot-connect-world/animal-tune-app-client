import { Dimensions, Platform } from 'react-native';
import { RFValue as RFValueLib } from 'react-native-responsive-fontsize';

const { width, height } = Dimensions.get('window');

// 기준 화면 크기 (iPhone 11 Pro 기준)
const baseWidth = 375;
const baseHeight = 812;

// iPad 판별 (너비가 768 이상이면 iPad로 간주)
const isTablet = width >= 768;

// 태블릿용 최대 스케일 제한
const MAX_TABLET_SCALE = 1.5;

/**
 * Responsive Font Value
 * react-native-responsive-fontsize 라이브러리 사용
 * 태블릿에서는 최대 스케일 제한
 */
export const RFValue = (fontSize: number): number => {
  const calculatedSize = RFValueLib(fontSize, height);
  if (isTablet) {
    const scale = Math.min(width / baseWidth, MAX_TABLET_SCALE);
    return Math.round(fontSize * scale);
  }
  return calculatedSize;
};

/**
 * Responsive Width Value
 * 화면 너비에 비례하여 값을 조정합니다.
 * 태블릿에서는 최대 스케일 제한
 */
export const RWValue = (value: number): number => {
  let scale = width / baseWidth;
  if (isTablet) {
    scale = Math.min(scale, MAX_TABLET_SCALE);
  }
  return Math.round(value * scale);
};

/**
 * Responsive Height Value
 * 화면 높이에 비례하여 값을 조정합니다.
 * 태블릿에서는 최대 스케일 제한
 */
export const RHValue = (value: number): number => {
  let scale = height / baseHeight;
  if (isTablet) {
    scale = Math.min(scale, MAX_TABLET_SCALE);
  }
  return Math.round(value * scale);
};

export const screenWidth = width;
export const screenHeight = height;
export { isTablet };
