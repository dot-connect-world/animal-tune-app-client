import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import TabNavigator from './src/navigation/TabNavigator';
import './src/i18n'; // i18n 초기화
import mobileAds from 'react-native-google-mobile-ads';

// Debug 메시지 비활성화
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs();

export default function App() {
  useEffect(() => {
    // Google Mobile Ads SDK 초기화
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob SDK initialized successfully');
      })
      .catch(error => {
        console.error('AdMob SDK initialization failed:', error);
      });
  }, []);

  return (
    <NavigationContainer>
      <TabNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
