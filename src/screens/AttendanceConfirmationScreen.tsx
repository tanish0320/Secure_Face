import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppButton } from '../components/AppButton';
import { useStore } from '../store/useStore';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStack';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type RouteProps = RouteProp<RootStackParamList, 'AttendanceConfirmationScreen'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceConfirmationScreen'>;

const AttendanceConfirmationScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { result } = route.params;
  const { employees } = useStore(state => ({
    employees: state.employees,
  }));

  const employee = employees.find(e => e.employee_id === result.employeeId);
  const employeeName = employee?.name ?? 'Unknown';
  const timestamp = new Date().toLocaleString();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Attendance Confirmation" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Success</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{employeeName}</Text>
        <Text style={styles.label}>Employee ID</Text>
        <Text style={styles.value}>{result.employeeId ?? 'N/A'}</Text>
        <Text style={styles.label}>Timestamp</Text>
        <Text style={styles.value}>{timestamp}</Text>
        {result.confidence !== undefined && (
          <>
            <Text style={styles.label}>Confidence Score</Text>
            <Text style={styles.value}>{(result.confidence * 100).toFixed(1)}%</Text>
          </>
        )}
        {result.livenessScore !== undefined && (
          <>
            <Text style={styles.label}>Liveness Score</Text>
            <Text style={styles.value}>{result.livenessScore}</Text>
          </>
        )}
      </View>
      <AppButton mode="contained" onPress={() => navigation.navigate('MainTabs')}>
        Back to Dashboard
      </AppButton>
      <AppButton mode="contained" onPress={() => navigation.navigate('LivenessScreen')} style={styles.anotherBtn}>
        Authenticate Another User
      </AppButton>
    </View>
  );
};

export default AttendanceConfirmationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.base / 2,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  badgeText: {
    ...typography.titleLg,
    color: colors.onPrimary,
  },
  info: {
    marginBottom: spacing.base * 2,
  },
  label: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  value: {
    ...typography.bodyLg,
    color: colors.onSurface,
    marginBottom: spacing.base / 2,
  },
  anotherBtn: {
    marginTop: spacing.base,
  },
});