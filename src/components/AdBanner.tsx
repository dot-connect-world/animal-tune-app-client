import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_ANDROID_BANNER_ID, ADMOB_IOS_BANNER_ID } from '@env';

// AdMob 광고 유닛 ID 설정 (환경변수 사용)
const adUnitId = Platform.select({
  ios: __DEV__ ? TestIds.BANNER : ADMOB_IOS_BANNER_ID,
  android: __DEV__ ? TestIds.BANNER : ADMOB_ANDROID_BANNER_ID,
}) || TestIds.BANNER;

interface AdBannerProps {
  size?: BannerAdSize;
}

export default function AdBanner({ size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }: AdBannerProps) {
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
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
  },
});
