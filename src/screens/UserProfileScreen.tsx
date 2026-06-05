// src/screens/UserProfileScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppButton } from '../components/AppButton';
import ProfileCard from '../components/ProfileCard';
import { useStore } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStack';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'UserProfileScreen'>;

const UserProfileScreen: React.FC = () => {
  const { user, logout } = useStore(state => ({
    user: state.user,
    logout: state.logout,
  }));
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="User Profile"
        onBackPress={() => navigation.goBack()}
      />
      {user && <ProfileCard user={user} />}
      <AppButton mode="contained" onPress={logout} style={styles.logoutBtn}>
        Logout
      </AppButton>
      <AppButton mode="outlined" disabled style={styles.editBtn}>
        Edit Profile (MVP disabled)
      </AppButton>
    </View>
  );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoutBtn: {
    marginHorizontal: spacing.base * 2,
    marginTop: spacing.base * 3,
  },
  editBtn: {
    marginHorizontal: spacing.base * 2,
    marginTop: spacing.base,
  },
});