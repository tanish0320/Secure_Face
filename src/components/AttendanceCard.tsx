// src/components/AttendanceCard.tsx
import React from 'react';
import type { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { typography } from '../theme/typography';
import type { AttendanceRecord } from '../types';

interface AttendanceCardProps {
  record: AttendanceRecord;
}

/**
 * Displays a single attendance record in a list.
 */
const AttendanceCard: FC<AttendanceCardProps> = ({ record }) => (
  <View style={styles.card}>
    <View style={styles.row}>
      <Text style={styles.label}>Employee ID:</Text>
      <Text style={styles.value}>{record.employee_id}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Timestamp:</Text>
      <Text style={styles.value}>{record.timestamp}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>GPS:</Text>
      <Text style={styles.value}>{record.gps}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Status:</Text>
      <Text
        style={[
          styles.value,
          record.sync_status === 'synced' ? styles.synced : styles.pending,
        ]}
      >
        {record.sync_status}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.base,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.base / 2,
  },
  label: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  value: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  pending: {
    color: colors.error,
  },
  synced: {
    color: colors.primary,
  },
});

export default AttendanceCard;
