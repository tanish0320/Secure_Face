// src/screens/DashboardScreen.tsx
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { StatCard } from '../components/StatCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppButton } from '../components/AppButton';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/MainTabNavigator';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type NavProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const {
    employees,
    loadEmployees,
    records,
    loadAttendance,
    pendingSyncCount,
  } = useStore(state => ({
    employees: state.employees,
    loadEmployees: state.loadEmployees,
    records: state.records,
    loadAttendance: state.loadAttendance,
    pendingSyncCount: state.pendingSyncCount,
  }));

  useEffect(() => {
    loadEmployees();
    loadAttendance();
  }, [loadEmployees, loadAttendance]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ScreenHeader title="Dashboard" />
      <StatCard title="Employees" value={employees.length} icon="people" />
      <StatCard title="Attendance" value={records.length} icon="event" />
      <StatCard title="Pending Sync" value={pendingSyncCount} icon="sync" />
      <AppButton mode="contained" onPress={() => navigation.navigate('Auth')}>
        New Authentication
      </AppButton>
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },
});
