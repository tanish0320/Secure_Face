// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import EmployeeEnrollmentScreen from '../screens/EmployeeEnrollmentScreen';
import FaceAuthScreen from '../screens/FaceAuthScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from 'react-native-paper';
import { Text } from 'react-native';

export type MainTabParamList = {
  Dashboard: undefined;
  Enrollment: undefined;
  Auth: undefined;
  History: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Maps tab route names to simple emoji/unicode icons.
 * Avoids the react-native-vector-icons native linking requirement at MVP.
 */
const TAB_ICONS: Record<string, string> = {
  Dashboard: '🏠',
  Enrollment: '👤',
  Auth: '🔐',
  History: '📋',
  Settings: '⚙️',
};

const MainTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Text style={{ fontSize: size, color }}>{TAB_ICONS[route.name] ?? '●'}</Text>
        ),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Enrollment" component={EmployeeEnrollmentScreen} />
      <Tab.Screen name="Auth" component={FaceAuthScreen} />
      <Tab.Screen name="History" component={AttendanceHistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
