// src/screens/AuditLogsScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStack';
import type { AttendanceRecord } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'AuditLogsScreen'>;

const AuditLogsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { records, employees, loadAttendance } = useStore(state => ({
    records: state.records,
    employees: state.employees,
    loadAttendance: state.loadAttendance,
  }));

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.employee_id === employeeId);
    return emp?.name ?? employeeId;
  };

  const renderItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.event}>Attendance</Text>
        <Text
          style={[
            styles.statusBadge,
            item.sync_status === 'synced' ? styles.badgeSynced : styles.badgePending,
          ]}
        >
          {item.sync_status.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.detail}>Employee: {getEmployeeName(item.employee_id)}</Text>
      <Text style={styles.detail}>ID: {item.employee_id}</Text>
      <Text style={styles.detail}>Time: {new Date(item.timestamp).toLocaleString()}</Text>
      <Text style={styles.detail}>GPS: {item.gps}</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No audit logs yet.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Audit Logs"
        onBackPress={() => navigation.goBack()}
      />
      <FlatList
        data={records}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};

export default AuditLogsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.base * 2,
    flexGrow: 1,
  },
  item: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.base * 1.5,
    marginBottom: spacing.base,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base / 2,
  },
  event: {
    ...typography.titleLg,
    color: colors.onSurface,
  },
  statusBadge: {
    ...typography.bodySm,
    paddingHorizontal: spacing.base,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '700',
  },
  badgeSynced: {
    backgroundColor: colors.tertiaryContainer,
    color: colors.onTertiaryContainer,
  },
  badgePending: {
    backgroundColor: colors.errorContainer,
    color: colors.error,
  },
  detail: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.base * 4,
  },
  emptyText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
  },
});