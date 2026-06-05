/**
 * SecureFace Edge AI - Connectivity Monitor
 * Purpose: Track network status and provide hooks for sync readiness.
 * Dependencies: @react-native-community/netinfo
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { dbLogger } from '../../database/types';

export const ConnectivityMonitor = {
  /**
   * Returns true if the device has an active internet connection.
   */
  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return !!state.isConnected && !!state.isInternetReachable;
    } catch (err) {
      dbLogger('ERROR', 'Failed to fetch network state');
      return false;
    }
  },

  /**
   * Returns current connection details.
   */
  async getConnectionInfo(): Promise<{ online: boolean; connectionType: string }> {
    const state = await NetInfo.fetch();
    return {
      online: !!state.isConnected && !!state.isInternetReachable,
      connectionType: state.type
    };
  },

  /**
   * Returns a promise that resolves when the device becomes online.
   * Useful for queuing sync when connection is restored.
   */
  async waitForConnection(): Promise<void> {
    const online = await this.isOnline();
    if (online) return;

    return new Promise((resolve) => {
      const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        if (state.isConnected && state.isInternetReachable) {
          unsubscribe();
          resolve();
        }
      });
    });
  }
};
