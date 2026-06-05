// src/components/LoadingOverlay.tsx
import React from 'react';
import type { FC } from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

interface LoadingOverlayProps {
  /** When true the overlay is visible */
  visible: boolean;
  /** Optional message displayed under the spinner */
  message?: string;
}

/**
 * Full‑screen semi‑transparent overlay with a spinner.
 */
const LoadingOverlay: FC<LoadingOverlayProps> = ({ visible, message }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.backdrop}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message && (
          <Text style={styles.messageText}>{message}</Text>
        )}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageText: {
    color: colors.onSurface,
    marginTop: 12,
  },
});

export default LoadingOverlay;
