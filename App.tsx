import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Platform, AppState } from 'react-native';
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
          // 앱이 완전히 활성화될 때까지 대기 (App Store 심사를 위한 안전장치)
          await new Promise(resolve => setTimeout(resolve, 1000));

          // 앱이 활성 상태인지 확인
          if (AppState.currentState === 'active') {
            const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
            console.log('ATT Status:', status);
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
