import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@react-navigation/native';

import TunerScreen from '../screens/TunerScreen';
import MetronomeScreen from '../screens/MetronomeScreen';
import AdBanner from '../components/AdBanner';
import { RFValue, RHValue } from '../utils/responsive';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { t } = useTranslation();
  const theme = useTheme();

  // 실제 적용된 theme 값 확인
  console.log('🎨 Current theme colors:', theme.colors);
  console.log('🎨 Text color from theme:', theme.colors.text);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: '#808080',
          tabBarActiveBackgroundColor: '#FFFFFF',
          tabBarInactiveBackgroundColor: '#FFFFFF',
          tabBarIcon: ({ focused, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Tuner') {
              iconName = focused ? 'musical-notes' : 'musical-notes-outline';
            } else if (route.name === 'Metronome') {
              iconName = focused ? 'timer' : 'timer-outline';
            } else {
              iconName = 'help-outline';
            }

            const tintColor = focused ? '#2F80ED' : '#808080';

            return <Ionicons name={iconName} size={size} color={tintColor} />;
          },
          tabBarLabel: ({ focused, children }) => {
            return (
              <Text
                allowFontScaling={false}
                style={[
                  {
                    backgroundColor: '#FFFFFF',
                    color: focused ? '#000000' : '#808080',
                    fontSize: RFValue(13),
                    fontWeight: focused ? '900' : '600',
                    marginBottom: RHValue(4),
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  },
                  Platform.OS === 'ios' && {
                    textShadowColor: 'transparent',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 0,
                  },
                ]}>
                {children}
              </Text>
            );
          },
          headerShown: true,
          // 헤더 스타일
          headerStyle: {
            backgroundColor: '#FFFFFF',
            height: RHValue(100),
            shadowOpacity: 0, // shadow 제거
            elevation: 0, // Android elevation 제거
          },
          headerTitleStyle: {
            fontSize: RFValue(22),
            fontWeight: '900', // 최대 굵기로
            letterSpacing: 0.5,
            // color는 NavigationContainer의 theme.colors.text 사용
          },
          headerTitleAlign: 'center',
          // 탭바 스타일
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            shadowOpacity: 0,
            elevation: 0,
            height: RHValue(88),
            paddingBottom: RHValue(8),
            paddingTop: RHValue(8),
          },
        })}
      >
        <Tab.Screen
          name="Tuner"
          component={TunerScreen}
          options={{
            headerTitle: () => (
              <View>
                <Text style={{
                  fontSize: RFValue(22),
                  fontWeight: '900',
                  color: '#000000',
                  backgroundColor: '#FFFF00', // 노란색 배경으로 테스트
                }}>
                  {t('tuner.title')}
                </Text>
                <Text style={{ fontSize: 10, color: '#FF0000' }}>
                  DEBUG: #000000 black
                </Text>
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Metronome"
          component={MetronomeScreen}
          options={{
            headerTitle: () => (
              <View>
                <Text style={{
                  fontSize: RFValue(22),
                  fontWeight: '900',
                  color: '#000000',
                  backgroundColor: '#FFFF00', // 노란색 배경으로 테스트
                }}>
                  {t('metronome.title')}
                </Text>
                <Text style={{ fontSize: 10, color: '#FF0000' }}>
                  DEBUG: #000000 black
                </Text>
              </View>
            ),
          }}
        />
      </Tab.Navigator>
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
