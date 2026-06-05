// src/components/Stepper.tsx
import React from 'react';
import type { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { typography } from '../theme/typography';

interface StepperProps {
  /** Step titles in order */
  steps: string[];
  /** Zero‑based index of the current step */
  currentStep: number;
}

/**
 * Horizontal stepper that matches the UI prototype.
 * Each step is a circle with a label underneath.
 */
const Stepper: FC<StepperProps> = ({ steps, currentStep }) => (
  <View style={styles.container}>
    {steps.map((label, idx) => (
      <View key={idx} style={styles.stepWrapper}>
        <View
          style={[
            styles.circle,
            idx <= currentStep ? styles.circleActive : styles.circleInactive,
          ]}
        >
          <Text style={styles.circleLabel}>{idx + 1}</Text>
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.base,
    paddingHorizontal: spacing.base,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base / 2,
  },
  circleActive: {
    backgroundColor: colors.primary,
  },
  circleInactive: {
    backgroundColor: colors.surfaceVariant,
  },
  circleLabel: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  label: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default Stepper;
