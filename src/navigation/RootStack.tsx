// src/navigation/RootStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SyncCenterScreen from '../screens/SyncCenterScreen';
import AuditLogsScreen from '../screens/AuditLogsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import LivenessScreen from '../screens/LivenessScreen';
import AttendanceConfirmationScreen from '../screens/AttendanceConfirmationScreen';
import { useStore } from '../store/useStore';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';

// Placeholder component for screens that are not yet implemented (modals / extra screens)
import { AuthResult } from '../types';

export type RootStackParamList = {
  AuthStack: undefined;          // authentication flow (login etc.)
  MainTabs: undefined;           // tab navigator for the logged‑in experience
  LivenessScreen: undefined;    // modal shown from FaceAuth flow
  AttendanceConfirmationScreen: { result: AuthResult }; // modal after successful auth
  AuditLogsScreen: undefined;    // screen reachable from Settings or Dashboard
  UserProfileScreen: undefined; // profile screen reachable from Settings
  SyncCenterScreen: undefined;   // sync screen reachable from Settings
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStack = () => {
  const { isLoggedIn } = useStore();

  // Unauthenticated – present the AuthStack (login flow)
  if (!isLoggedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthStack" component={AuthStack} />
      </Stack.Navigator>
    );
  }

  // Authenticated – main app navigation (tabs + stack screens)
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      {/* Modal screens – presented over any tab */}
      <Stack.Screen
        name="LivenessScreen"
        component={LivenessScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AttendanceConfirmationScreen"
        component={AttendanceConfirmationScreen}
        options={{ presentation: 'modal' }}
      />
      {/* Regular stack screens */}
      <Stack.Screen name="AuditLogsScreen" component={AuditLogsScreen} />
      <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} />
      <Stack.Screen name="SyncCenterScreen" component={SyncCenterScreen} />
    </Stack.Navigator>
  );
};

export default RootStack;
