import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_ANDROID_BANNER_ID, ADMOB_IOS_BANNER_ID } from '@env';
import { RHValue } from '../utils/responsive';

// AdMob 광고 유닛 ID 설정 (환경변수 사용)
const adUnitId = Platform.select({
  ios: __DEV__ ? TestIds.BANNER : ADMOB_IOS_BANNER_ID,
  android: __DEV__ ? TestIds.BANNER : ADMOB_ANDROID_BANNER_ID,
}) || TestIds.BANNER;

interface AdBannerProps {
  size?: BannerAdSize;
}

export default function AdBanner({ size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }: AdBannerProps) {
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  // 광고가 로드되지 않았으면 아예 렌더링하지 않음
  if (!isAdLoaded) {
    return (
      <View style={styles.hiddenContainer}>
        <BannerAd
          unitId={adUnitId}
          size={size}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdLoaded={() => {
            console.log('광고 로드 성공!');
            setIsAdLoaded(true);
          }}
          onAdFailedToLoad={(error) => {
            console.log('광고 로드 실패:', error);
            // 광고 실패 시 컴포넌트 숨김 유지
          }}
        />
      </View>
    );
  }

  // 광고가 로드되면 표시
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -1000, // 화면 밖으로 숨김
    opacity: 0,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: RHValue(100), // 헤더 높이와 동일하게 설정
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    zIndex: 1000,
    elevation: 10, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
