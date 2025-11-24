import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import TabNavigator from './src/navigation/TabNavigator';
import './src/i18n'; // i18n 초기화
import mobileAds from 'react-native-google-mobile-ads';
import * as TrackingTransparency from 'expo-tracking-transparency';

// Debug 메시지 비활성화
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs();

export default function App() {
  useEffect(() => {
    const initializeAds = async () => {
      try {
        // iOS에서 App Tracking Transparency (ATT) 권한 요청
        if (Platform.OS === 'ios') {
          // 앱이 완전히 활성화될 때까지 대기
          await new Promise(resolve => setTimeout(resolve, 1000));

          // ATT 권한 상태 확인
          const { status: currentStatus } = await TrackingTransparency.getTrackingPermissionsAsync();
          console.log('Current ATT Status:', currentStatus);

          // 아직 권한을 물어보지 않은 경우에만 요청
          if (currentStatus === 'undetermined') {
            const { status: newStatus } = await TrackingTransparency.requestTrackingPermissionsAsync();
            console.log('ATT Request Result:', newStatus);
          }
        }

        // Google Mobile Ads SDK 초기화
        await mobileAds().initialize();
        console.log('AdMob SDK initialized successfully');
      } catch (error) {
        console.error('AdMob initialization failed:', error);
      }
    };

    initializeAds();
  }, []);

  return (
    <NavigationContainer>
      <TabNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
