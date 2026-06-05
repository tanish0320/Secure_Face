// src/theme/typography.ts
/**
 * Typography tokens extracted from DESIGN.md.
 * Types are aligned with React Native's `TextStyle`.
 */
import type { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  bodyLg: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as any,
  },
  bodySm: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as any,
  },
  bodyMd: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as any,
  },
  labelLg: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.05,
    fontWeight: '600' as any,
  },
  titleSm: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as any,
  },
  titleMd: {
    fontFamily: 'Inter',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as any,
  },
  titleLg: {
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as any,
  },
  headlineMd: {
    fontFamily: 'Inter',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as any,
  },
  headlineLg: {
    fontFamily: 'Inter',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600' as any,
  },
  headlineLgMobile: {
    fontFamily: 'Inter',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as any,
  },
  displayLg: {
    fontFamily: 'Inter',
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700' as any,
  },
};
