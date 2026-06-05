// src/screens/FaceAuthScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CameraPreview } from '../components/CameraPreview';
import LoadingOverlay from '../components/LoadingOverlay';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppButton } from '../components/AppButton';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStack';
import type { ImageData, AuthResult } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const FaceAuthScreen: React.FC = () => {
  const [result, setResult] = useState<AuthResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authService, attendanceService, addRecord } = useStore(state => ({
    authService: state.authService,
    attendanceService: state.attendanceService,
    addRecord: state.addRecord,
  }));
  const navigation = useNavigation<NavProp>();

  const handleCapture = async (image: ImageData) => {
    if (!authService) {
      setError('Auth service not ready');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await authService.authenticateUser(image);
      setResult(res);

      if (res.recognized && res.livenessPassed) {
        // Record attendance via store-injected service
        if (attendanceService) {
          const record = await attendanceService.recordAttendance({
            employeeId: res.employeeId ?? '',
            gps: '0,0',
          });
          addRecord(record);
        }
        // Navigate to confirmation modal
        navigation.navigate('AttendanceConfirmationScreen', { result: res });
      } else if (!res.livenessPassed) {
        setError('Liveness check failed. Please try again.');
      } else {
        setError('Face not recognized. Please try again.');
      }
    } catch (e) {
      setError('Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Face Authentication" />
      {error && <Text style={styles.error}>{error}</Text>}
      {!result && <CameraPreview onCapture={handleCapture} />}
      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Result</Text>
          <Text style={styles.resultRow}>
            Recognized: <Text style={styles.bold}>{result.recognized ? 'Yes' : 'No'}</Text>
          </Text>
          {result.confidence !== undefined && (
            <Text style={styles.resultRow}>
              Confidence: <Text style={styles.bold}>{(result.confidence * 100).toFixed(1)}%</Text>
            </Text>
          )}
          <Text style={styles.resultRow}>
            Liveness: <Text style={styles.bold}>{result.livenessPassed ? 'Passed ✓' : 'Failed ✗'}</Text>
          </Text>
          <AppButton mode="outlined" onPress={handleRetry} style={styles.retryBtn}>
            Try Again
          </AppButton>
        </View>
      )}
      {loading && <LoadingOverlay visible message="Authenticating…" />}
    </View>
  );
};

export default FaceAuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
    margin: spacing.base,
    textAlign: 'center',
  },
  resultBox: {
    flex: 1,
    padding: spacing.base * 2,
    justifyContent: 'center',
  },
  resultTitle: {
    ...typography.titleLg,
    color: colors.onSurface,
    marginBottom: spacing.base,
  },
  resultRow: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.base / 2,
  },
  bold: {
    color: colors.onSurface,
    fontWeight: '700',
  },
  retryBtn: {
    marginTop: spacing.base * 2,
  },
});
