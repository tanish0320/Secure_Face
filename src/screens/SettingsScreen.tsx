// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppButton } from '../components/AppButton';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStack';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface NavRowProps {
  label: string;
  onPress: () => void;
}

const NavRow: React.FC<NavRowProps> = ({ label, onPress }) => (
  <TouchableOpacity style={styles.navRow} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.navRowText}>{label}</Text>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const logout = useStore(state => state.logout);
  const navigation = useNavigation<NavProp>();
  const version = '1.0.0';
  const buildNumber = '100';

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />

      {/* Navigation rows */}
      <View style={styles.section}>
        <NavRow
          label="User Profile"
          onPress={() => navigation.navigate('UserProfileScreen')}
        />
        <NavRow
          label="Sync Center"
          onPress={() => navigation.navigate('SyncCenterScreen')}
        />
        <NavRow
          label="Audit Logs"
          onPress={() => navigation.navigate('AuditLogsScreen')}
        />
      </View>

      {/* App info */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{version}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Build Number</Text>
          <Text style={styles.value}>{buildNumber}</Text>
        </View>
      </View>

      <AppButton mode="contained" onPress={logout} style={styles.logoutBtn}>
        Logout
      </AppButton>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    backgroundColor: colors.surfaceContainerLow,
    marginTop: spacing.base * 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.outlineVariant,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base * 2,
    paddingVertical: spacing.base * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  navRowText: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  chevron: {
    ...typography.titleLg,
    color: colors.onSurfaceVariant,
  },
  infoSection: {
    padding: spacing.base * 2,
  },
  infoBox: {
    marginBottom: spacing.base,
  },
  label: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    ...typography.bodyLg,
    color: colors.onSurface,
    marginTop: 2,
  },
  logoutBtn: {
    marginHorizontal: spacing.base * 2,
    marginTop: spacing.base * 2,
  },
});
