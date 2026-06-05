// src/components/AppButton.tsx
import React from 'react';
import type { FC, ReactNode } from 'react';
import { Button } from 'react-native-paper';
import type { ButtonProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { typography } from '../theme/typography';

// React 19 no longer includes children in FC props by default.
// Explicitly extend ButtonProps with required children.
type AppButtonProps = ButtonProps & { children: ReactNode };

/**
 * Re‑usable primary button that follows the DESIGN.md tokens.
 */
const AppButton: FC<AppButtonProps> = props => (
  <Button
    mode="contained"
    contentStyle={styles.content}
    labelStyle={styles.label}
    {...props}
  />
);

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
  },
  label: {
    ...typography.labelLg,
    color: colors.onPrimary,
    textTransform: 'none',
  },
});

export default AppButton;
export { AppButton };
