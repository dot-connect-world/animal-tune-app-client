import * as React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { RHValue } from '../utils/responsive';

type AdMobExtra = {
  androidBannerId?: string;
  iosBannerId?: string;
};

type ConstantsWithManifest2 = typeof Constants & {
  manifest2?: { extra?: Record<string, unknown> };
};

const getAdMobExtra = (): AdMobExtra => {
  const constantsWithManifest2 = Constants as ConstantsWithManifest2;
  const extra =
    Constants.expoConfig?.extra ??
    Constants.manifest?.extra ??
    constantsWithManifest2.manifest2?.extra ??
    {};

  return (extra?.admob as AdMobExtra) ?? {};
};

const { androidBannerId: manifestAndroidBannerId, iosBannerId: manifestIosBannerId } = getAdMobExtra();

// expo-constants에서만 Banner ID 가져오기 (app.config.js에서 주입됨)
const resolvedIosBannerId = manifestIosBannerId || '';
const resolvedAndroidBannerId = manifestAndroidBannerId || '';

const adUnitId =
  Platform.select({
    ios: __DEV__ ? TestIds.BANNER : (resolvedIosBannerId || TestIds.BANNER),
    android: __DEV__ ? TestIds.BANNER : (resolvedAndroidBannerId || TestIds.BANNER),
  }) || TestIds.BANNER;

// 로그 추가 - 배너 ID 확인
console.log('🎯 AdBanner Config:', {
  platform: Platform.OS,
  isDev: __DEV__,
  iosBannerId: resolvedIosBannerId,
  androidBannerId: resolvedAndroidBannerId,
  selectedAdUnitId: adUnitId,
});

// 배너 ID가 없으면 경고
if (!adUnitId || adUnitId === TestIds.BANNER) {
  console.warn('⚠️ Using Test Ad Unit ID. Check if production banner IDs are properly configured.');
}

interface AdBannerProps {
  size?: BannerAdSize;
}

export default function AdBanner({ size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }: AdBannerProps) {
  const [isAdLoaded, setIsAdLoaded] = React.useState(false);

  React.useEffect(() => {
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('🔥 AdBanner Component Mounted!');
    console.warn('Platform:', Platform.OS);
    console.warn('__DEV__:', __DEV__);
    console.warn('manifestIosBannerId (from expo-constants):', manifestIosBannerId);
    console.warn('manifestAndroidBannerId (from expo-constants):', manifestAndroidBannerId);
    console.warn('resolvedIosBannerId:', resolvedIosBannerId);
    console.warn('resolvedAndroidBannerId:', resolvedAndroidBannerId);
    console.warn('selectedAdUnitId:', adUnitId);
    console.warn('isTestId:', adUnitId === TestIds.BANNER);
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }, []);

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
            console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.warn('✅✅✅ 광고 로드 성공! ✅✅✅');
            console.warn('AdUnitId:', adUnitId);
            console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            setIsAdLoaded(true);
          }}
          onAdFailedToLoad={(error) => {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌❌❌ 광고 로드 실패! ❌❌❌');
            console.error('AdUnitId:', adUnitId);
            console.error('Error:', error);
            console.error('Error Message:', error?.message);
            console.error('Error Code:', (error as any)?.code);
            console.error('Error Domain:', (error as any)?.domain);
            console.error('Full Error Object:', JSON.stringify(error, null, 2));
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
    top: Platform.OS === 'android' ? StatusBar.currentHeight || RHValue(18) : RHValue(36), // Status bar 높이만큼 아래로 (반응형)
    left: 0,
    right: 0,
    height: RHValue(60),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    zIndex: 1000,
  },
});
