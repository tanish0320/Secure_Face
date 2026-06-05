// src/components/ScreenHeader.tsx
import React from 'react';
import type { FC } from 'react';
import { Appbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ScreenHeaderProps {
  title: string;
  /** If provided, a back arrow is shown calling this function */
  onBackPress?: () => void;
}

/**
 * Consistent top app bar for all screens – uses React Native Paper's Appbar.
 */
const ScreenHeader: FC<ScreenHeaderProps> = ({ title, onBackPress }) => (
  <Appbar.Header style={styles.header}>
    {onBackPress && <Appbar.BackAction onPress={onBackPress} />}
    <Appbar.Content
      title={title}
      titleStyle={styles.title}
      // No subtitle for MVP screens
    />
  </Appbar.Header>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    elevation: 0,
    // Padding to align with design spec
    paddingHorizontal: spacing.base,
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
});

export default ScreenHeader;
export { ScreenHeader };
