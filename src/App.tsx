import React, { useEffect, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './navigation/RootStack';
import { useStore } from './store/useStore';
import { employeeService } from './services/employee/EmployeeService';
import { attendanceService } from './services/attendance/AttendanceService';
import { authService } from './services/ai';

/**
 * Root application component.
 *
 * Provider order (inside-out, each wraps what follows):
 *   GestureHandlerRootView  — must wrap everything for gesture-handler v2
 *   PaperProvider           — Material Design theme tokens
 *   SafeAreaProvider        — safe-area insets (notch/nav bar)
 *   NavigationContainer     — React Navigation context (exactly once)
 *   RootStack               — conditional auth/main navigator
 */
export default function App() {
  const setServices = useStore(state => state.setServices);

  // Inject mock services once on mount.
  // useCallback prevents the effect from re-running if the ref changes.
  const injectServices = useCallback(() => {
    setServices({ employeeService, attendanceService, authService });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    injectServices();
  }, [injectServices]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <PaperProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootStack />
          </NavigationContainer>
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
