import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import TunerScreen from '../screens/TunerScreen';
import MetronomeScreen from '../screens/MetronomeScreen';
import AdBanner from '../components/AdBanner';
import { RFValue, RHValue } from '../utils/responsive';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { t } = useTranslation();

  const renderHeaderTitle = (
    iconName: keyof typeof Ionicons.glyphMap,
    label: string
  ) => (
    <View style={styles.headerTitleWrapper}>
      <Ionicons
        name={iconName}
        size={RFValue(20)}
        color="#2F80ED"
        style={styles.headerTitleIcon}
      />
      <Text allowFontScaling={false} style={styles.headerTitleText}>
        {label}
      </Text>
    </View>
  );

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
                    fontSize: RFValue(15),
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
          headerStyle: {
            backgroundColor: '#FFFFFF',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: '#E5E5EA',
            shadowOpacity: 0,
            elevation: 0,
          },
          headerTitleStyle: {
            fontSize: RFValue(22),
            fontWeight: '900', // 최대 굵기로
            letterSpacing: 0.5,
            // color는 NavigationContainer의 theme.colors.text 사용
          },
          headerTitleAlign: 'center',
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
            title: t('tuner.title'),
            headerTitle: () =>
              renderHeaderTitle('musical-notes', t('tuner.title')),
          }}
        />
        <Tab.Screen
          name="Metronome"
          component={MetronomeScreen}
          options={{
            title: t('metronome.title'),
            headerTitle: () =>
              renderHeaderTitle('timer', t('metronome.title')),
          }}
        />
      </Tab.Navigator>
      {/* <AdBanner /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleIcon: {
    marginRight: RFValue(8),
  },
  headerTitleText: {
    fontSize: RFValue(22),
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
