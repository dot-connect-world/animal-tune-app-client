import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import TunerScreen from '../screens/TunerScreen';
import MetronomeScreen from '../screens/MetronomeScreen';
import { RFValue, RHValue } from '../utils/responsive';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Tuner') {
            iconName = focused ? 'musical-notes' : 'musical-notes-outline';
          } else if (route.name === 'Metronome') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        // 헤더 스타일
        headerStyle: {
          backgroundColor: '#FFFFFF',
          height: RHValue(100),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
        },
        headerTitleStyle: {
          fontSize: RFValue(22),
          fontWeight: '700',
          letterSpacing: 0.5,
        },
        headerTitleAlign: 'center',
        // 탭바 스타일
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
          height: RHValue(88),
          paddingBottom: RHValue(8),
          paddingTop: RHValue(8),
        },
        tabBarLabelStyle: {
          fontSize: RFValue(12),
          fontWeight: '600',
          marginBottom: RHValue(4),
        },
      })}
    >
      <Tab.Screen
        name="Tuner"
        component={TunerScreen}
        options={{ title: t('tuner.title') }}
      />
      <Tab.Screen
        name="Metronome"
        component={MetronomeScreen}
        options={{ title: t('metronome.title') }}
      />
    </Tab.Navigator>
  );
}
