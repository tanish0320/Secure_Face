// src/components/AppInput.tsx
import React from 'react';
import type { FC } from 'react';
import { TextInput, TextInputProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/borderRadius';
import { typography } from '../theme/typography';

/**
 * Re‑usable input that matches the design system.
 */
const AppInput: FC<TextInputProps> = props => (
  <TextInput
    mode="outlined"
    style={styles.container}
    theme={{
      colors: {
        primary: '#4b53bc', // secondary color from design tokens (used for focus)
        text: '#1a1c1e',
        background: '#ffffff',
      },
    }}
    {...props}
  />
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
    borderRadius: borderRadius.lg,
    // The Paper component applies its own padding; we keep margin only.
  },
});

export default AppInput;
export { AppInput };
