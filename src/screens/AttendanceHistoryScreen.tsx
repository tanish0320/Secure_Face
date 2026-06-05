// src/screens/AttendanceHistoryScreen.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import AttendanceCard from '../components/AttendanceCard';
import { useStore } from '../store/useStore';
import type { AttendanceRecord } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function AttendanceHistoryScreen() {
  const { records, loadAttendance } = useStore(state => ({
    records: state.records,
    loadAttendance: state.loadAttendance,
  }));

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const renderItem = ({ item }: { item: AttendanceRecord }) => (
    <AttendanceCard record={item} />
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>No attendance records yet.</Text>
      <Text style={styles.emptyHint}>Complete a face authentication to create a record.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Attendance History" />
      <FlatList
        data={records}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.base * 2,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.base * 4,
  },
  emptyText: {
    ...typography.titleMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.base,
  },
  emptyHint: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.base * 2,
  },
});
