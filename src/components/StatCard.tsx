// src/components/StatCard.tsx
import React from 'react';
import type { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { typography } from '../theme/typography';

interface StatCardProps {
  /** Title displayed below the numeric value */
  title: string;
  /** Numeric value – can be string for custom formatting */
  value: string | number;
  /** Optional icon name – using Material Symbols */
  icon?: string;
  /** Optional background tint – defaults to surfaceContainerLow */
  backgroundColor?: string;
}

/**
 * Small card used in the dashboard grid to show a statistic.
 */
const StatCard: FC<StatCardProps> = ({ title, value, icon, backgroundColor }) => (
  <View style={[styles.card, { backgroundColor: backgroundColor ?? colors.surfaceContainerLow }]}>
    {icon && (
      <Text style={styles.icon}>
        {icon}
      </Text>
    )}
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  icon: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 24,
    color: colors.primary,
    marginBottom: spacing.base / 2,
  },
  value: {
    ...typography.displayLg,
    color: colors.onSurface,
  },
  title: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginTop: spacing.base / 2,
    textTransform: 'uppercase',
  },
});

export default StatCard;
export { StatCard };
