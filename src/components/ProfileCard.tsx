// src/components/ProfileCard.tsx
import React from 'react';
import type { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { typography } from '../theme/typography';

interface ProfileCardProps {
  user: { id: string; name: string };
}

/**
 * Simple card showing the logged‑in user's profile information.
 */
const ProfileCard: FC<ProfileCardProps> = ({ user }) => (
  <View style={styles.card}>
    <Text style={styles.name}>{user.name}</Text>
    <Text style={styles.id}>ID: {user.id}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.base * 1.5,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  name: {
    ...typography.headlineLg,
    color: colors.onSurface,
  },
  id: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.base / 2,
  },
});

export default ProfileCard;
