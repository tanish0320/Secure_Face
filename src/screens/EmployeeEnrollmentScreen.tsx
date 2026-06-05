// src/screens/EmployeeEnrollmentScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { CameraPreview } from '../components/CameraPreview';
import LoadingOverlay from '../components/LoadingOverlay';
import { useStore } from '../store/useStore';
import type { ImageData, EnrollPayload } from '../types';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function EmployeeEnrollmentScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    enrollmentStep,
    employeeId,
    name,
    department,
    clearanceLevel,
    capturedImages,
    setDetails,
    addImage,
    removeImage,
    goToStep,
    resetEnrollment,
    employeeService,
    addEmployee,
  } = useStore(state => ({
    enrollmentStep: state.enrollmentStep,
    employeeId: state.employeeId,
    name: state.name,
    department: state.department,
    clearanceLevel: state.clearanceLevel,
    capturedImages: state.capturedImages,
    setDetails: state.setDetails,
    addImage: state.addImage,
    removeImage: state.removeImage,
    goToStep: state.goToStep,
    resetEnrollment: state.resetEnrollment,
    employeeService: state.employeeService,
    addEmployee: state.addEmployee,
  }));

  // ----- Step handlers -----

  const handleDetailsNext = () => {
    if (!employeeId.trim() || !name.trim()) return;
    goToStep('capture');
  };

  const handleCapture = (img: ImageData) => {
    if (capturedImages.length < 5) addImage(img);
  };

  const handleCaptureNext = () => {
    if (capturedImages.length === 5) goToStep('review');
  };

  const handleEnroll = async () => {
    if (!employeeService) {
      setError('Employee service not ready');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: EnrollPayload = {
        employeeId,
        name,
        images: capturedImages,
      };
      const employee = await employeeService.enrollEmployee(payload);
      addEmployee(employee);
      goToStep('success');
    } catch (e) {
      setError('Enrollment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    resetEnrollment();
  };

  // ----- Step renderers -----

  const renderDetails = () => (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.stepLabel}>Step 1 of 4 — Employee Details</Text>
      <AppInput
        label="Employee ID *"
        value={employeeId}
        onChangeText={id => setDetails({ employeeId: id, name, department, clearanceLevel })}
        autoCapitalize="none"
      />
      <AppInput
        label="Full Name *"
        value={name}
        onChangeText={n => setDetails({ employeeId, name: n, department, clearanceLevel })}
      />
      <AppInput
        label="Department"
        value={department}
        onChangeText={d => setDetails({ employeeId, name, department: d, clearanceLevel })}
      />
      <AppInput
        label="Clearance Level"
        value={clearanceLevel}
        onChangeText={c => setDetails({ employeeId, name, department, clearanceLevel: c })}
      />
      <AppButton
        mode="contained"
        onPress={handleDetailsNext}
        disabled={!employeeId.trim() || !name.trim()}
        style={styles.btn}
      >
        Next – Capture Images
      </AppButton>
    </ScrollView>
  );

  const renderCapture = () => (
    <View style={styles.section}>
      <Text style={styles.stepLabel}>Step 2 of 4 — Capture Face Images</Text>
      <Text style={styles.captureCount}>
        {capturedImages.length}/5 images captured
      </Text>
      {capturedImages.length < 5 && <CameraPreview onCapture={handleCapture} />}
      <ScrollView horizontal contentContainerStyle={styles.thumbContainer}>
        {capturedImages.map((img, idx) => (
          <TouchableOpacity key={idx} onPress={() => removeImage(idx)} style={styles.thumbWrapper}>
            <Image source={{ uri: img.uri }} style={styles.thumb} />
            <Text style={styles.thumbDelete}>✕</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <AppButton
        mode="outlined"
        onPress={() => goToStep('details')}
        style={styles.btn}
      >
        ← Back
      </AppButton>
      <AppButton
        mode="contained"
        onPress={handleCaptureNext}
        disabled={capturedImages.length !== 5}
        style={styles.btn}
      >
        Next – Review
      </AppButton>
    </View>
  );

  const renderReview = () => (
    <ScrollView contentContainerStyle={styles.section}>
      <Text style={styles.stepLabel}>Step 3 of 4 — Review Details</Text>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Employee ID</Text>
        <Text style={styles.reviewValue}>{employeeId}</Text>
      </View>
      <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>Name</Text>
        <Text style={styles.reviewValue}>{name}</Text>
      </View>
      {department ? (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Department</Text>
          <Text style={styles.reviewValue}>{department}</Text>
        </View>
      ) : null}
      {clearanceLevel ? (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Clearance</Text>
          <Text style={styles.reviewValue}>{clearanceLevel}</Text>
        </View>
      ) : null}
      <ScrollView horizontal contentContainerStyle={styles.thumbContainer}>
        {capturedImages.map((img, idx) => (
          <Image key={idx} source={{ uri: img.uri }} style={styles.thumb} />
        ))}
      </ScrollView>
      {error && <Text style={styles.error}>{error}</Text>}
      <AppButton
        mode="outlined"
        onPress={() => goToStep('capture')}
        style={styles.btn}
      >
        ← Back to Capture
      </AppButton>
      <AppButton mode="contained" onPress={handleEnroll} style={styles.btn}>
        Enroll Employee
      </AppButton>
    </ScrollView>
  );

  const renderSuccess = () => (
    <View style={styles.successSection}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successTitle}>Enrollment Successful!</Text>
      <Text style={styles.successSub}>
        {name} has been enrolled with ID {employeeId}.
      </Text>
      <AppButton mode="contained" onPress={handleReset} style={styles.btn}>
        Enroll Another Employee
      </AppButton>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Employee Enrollment" />
      {enrollmentStep === 'details' && renderDetails()}
      {enrollmentStep === 'capture' && renderCapture()}
      {enrollmentStep === 'review' && renderReview()}
      {enrollmentStep === 'success' && renderSuccess()}
      {loading && <LoadingOverlay visible message="Enrolling employee…" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    padding: spacing.base * 2,
    flexGrow: 1,
  },
  successSection: {
    flex: 1,
    padding: spacing.base * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.base * 2,
  },
  captureCount: {
    ...typography.titleMd,
    color: colors.primary,
    marginBottom: spacing.base,
  },
  btn: {
    marginTop: spacing.base,
  },
  thumbContainer: {
    marginTop: spacing.base,
    paddingBottom: spacing.base,
  },
  thumbWrapper: {
    position: 'relative',
    marginRight: spacing.base,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  thumbDelete: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    color: colors.onError,
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  reviewLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  reviewValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
    marginTop: spacing.base,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.base * 2,
  },
  successTitle: {
    ...typography.headlineMd,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  successSub: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.base * 3,
  },
});
