import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import TunerScreen from '../screens/TunerScreen';
import MetronomeScreen from '../screens/MetronomeScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
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
      })}
    >
      <Tab.Screen
        name="Tuner"
        component={TunerScreen}
        options={{ title: '🎸 Tuner' }}
      />
      <Tab.Screen
        name="Metronome"
        component={MetronomeScreen}
        options={{ title: '🎵 Metronome' }}
      />
    </Tab.Navigator>
  );
}
