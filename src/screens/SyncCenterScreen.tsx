import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppButton } from '../components/AppButton';
import LoadingOverlay from '../components/LoadingOverlay';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStack';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'SyncCenterScreen'>;

/**
 * Sync Center screen – shows pending sync count, sync status and allows manual sync.
 * Pulls data from the Zustand store (syncStatus, pendingSyncCount, syncNow).
 */
const SyncCenterScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { syncStatus, pendingSyncCount, syncNow } = useStore(state => ({
    syncStatus: state.syncStatus,
    pendingSyncCount: state.pendingSyncCount,
    syncNow: state.syncNow,
  }));

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const handleSync = async () => {
    await syncNow();
    setLastSyncTime(new Date().toLocaleString());
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Sync Center" onBackPress={() => navigation.goBack()} />
      <View style={styles.section}>
        <Text style={styles.label}>Pending Sync Count</Text>
        <Text style={styles.value}>{pendingSyncCount}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Sync Status</Text>
        <Text style={styles.value}>{syncStatus}</Text>
      </View>
      {lastSyncTime && (
        <View style={styles.section}>
          <Text style={styles.label}>Last Sync Time</Text>
          <Text style={styles.value}>{lastSyncTime}</Text>
        </View>
      )}
      <AppButton
        mode="contained"
        onPress={handleSync}
        disabled={syncStatus === 'running'}
      >
        Sync Now
      </AppButton>
      {syncStatus === 'running' && <LoadingOverlay visible={true} />}
    </View>
  );
};

export default SyncCenterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },
  section: {
    marginBottom: spacing.base,
  },
  label: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  value: {
    ...typography.bodyLg,
    color: colors.onSurface,
  },
});