// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ScreenHeader } from '../components/ScreenHeader';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const LoginScreen: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const login = useStore(state => state.login);

  const handleLogin = () => {
    if (!employeeId) return;
    // For MVP we ignore the security key and log in with a fixed name
    login({ id: employeeId, name: 'Operator' });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="SecureFace Login" />
      <AppInput
        label="Employee ID"
        value={employeeId}
        onChangeText={setEmployeeId}
        autoCapitalize="none"
      />
      <AppInput
        label="Security Key"
        value={securityKey}
        onChangeText={setSecurityKey}
        secureTextEntry
      />
      <AppButton mode="contained" onPress={handleLogin} disabled={!employeeId}>
        Log In
      </AppButton>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
    justifyContent: 'center',
  },
});
