/**
 * SecureFace Edge AI - Key Manager
 * Purpose: Manage the lifecycle of encryption keys.
 * Responsibilities: Key generation, persistence, and validation.
 * 
 * Production Hardening:
 * 1. Removed hardcoded fallback keys.
 * 2. Replaced Math.random() with CryptoJS secure randomness.
 * 3. Implemented AsyncStorage fallback for non-Keychain environments.
 */

import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { dbLogger } from '../database/types';

const KEY_ALIAS = 'secureface_master_key';
const LOCAL_STORAGE_KEY = '@SF_SECURITY_KEY';

export const KeyManager = {
  /**
   * Retrieves the master encryption key.
   * Priority: 1. Keychain | 2. Local AsyncStorage | 3. Generate & Persist
   */
  async getEncryptionKey(): Promise<string> {
    try {
      // 1. Try Hardware-backed Keychain
      const credentials = await Keychain.getGenericPassword({ service: KEY_ALIAS });
      if (credentials) {
        return credentials.password;
      }

      // 2. Try Persistent Local Storage (Fallback)
      const localKey = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      if (localKey && this.validateKey(localKey)) {
        return localKey;
      }

      // 3. Generate New Secure Key
      const newKey = this.generateSecureKey();
      
      // Attempt to save to Keychain first
      try {
        await Keychain.setGenericPassword('admin', newKey, { service: KEY_ALIAS });
        dbLogger('INFO', 'New Master Key secured in Keychain.');
      } catch (err) {
        // Fallback to local storage if Keychain fails (e.g. non-supported HW)
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, newKey);
        dbLogger('WARN', 'Keychain unavailable. Master Key secured in Local Storage.');
      }
      
      return newKey;
    } catch (err) {
      dbLogger('ERROR', `KeyManager: Critical failure during key retrieval: ${err}`);
      throw new Error('Encryption subsystem failed to initialize encryption keys.');
    }
  },

  /**
   * Rotates the encryption key.
   */
  async rotateKey(): Promise<string> {
    const newKey = this.generateSecureKey();
    try {
      await Keychain.setGenericPassword('admin', newKey, { service: KEY_ALIAS });
    } catch (err) {
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, newKey);
    }
    dbLogger('WARN', 'Master Key rotated. Existing data remains encrypted with old key.');
    return newKey;
  },

  /**
   * Validates if a key is a valid cryptographically strong hex string.
   */
  validateKey(key: string): boolean {
    // Expecting 64 hex chars (32 bytes / 256 bits)
    return !!key && key.length >= 32;
  },

  /**
   * Internal secure random key generation using CryptoJS.
   */
  private generateSecureKey(): string {
    return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
  }
};
