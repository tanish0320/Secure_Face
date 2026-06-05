import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { CameraPreview } from '../components/CameraPreview';
import LoadingOverlay from '../components/LoadingOverlay';
import { useStore } from '../store/useStore';
import type { ImageData, AuthResult } from '../types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStack';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'LivenessScreen'>;

const LivenessScreen: React.FC = () => {
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
      setError('Auth service not available');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result: AuthResult = await authService.authenticateUser(image);
      if (result.livenessPassed) {
        // Record attendance and persist to store before navigating
        if (attendanceService) {
          const payload = {
            employeeId: result.employeeId ?? '',
            gps: '0,0',
          };
          const record = await attendanceService.recordAttendance(payload);
          addRecord(record);
        }
        navigation.navigate('AttendanceConfirmationScreen', { result });
      } else {
        setError('Liveness check failed');
      }
    } catch (e) {
      setError('Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Liveness Check" />
      {error && <Text style={styles.error}>{error}</Text>}
      <CameraPreview onCapture={handleCapture} />
      {loading && <LoadingOverlay visible={true} />}
    </View>
  );
};

export default LivenessScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
    marginBottom: spacing.base,
  },
});