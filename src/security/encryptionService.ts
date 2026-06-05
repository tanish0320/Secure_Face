/**
 * SecureFace Edge AI - Encryption Service
 * Purpose: Provide cryptographic protection for sensitive data.
 * Responsibilities: AES encryption/decryption and payload signing.
 * 
 * Dependencies: crypto-js
 */

import CryptoJS from 'crypto-js';
import { KeyManager } from './keyManager';
import { EncryptedData } from './securityTypes';
import { EmbeddingEncryptionError } from '../services/employee/EmployeeErrors';

export const EncryptionService = {
  /**
   * Encrypts a string using AES.
   */
  async encrypt(data: string): Promise<EncryptedData> {
    try {
      const key = await KeyManager.getEncryptionKey();
      const encrypted = CryptoJS.AES.encrypt(data, key).toString();
      
      return {
        encryptedData: encrypted,
        algorithm: 'AES'
      };
    } catch (err) {
      throw new EmbeddingEncryptionError('AES Encryption failed', err);
    }
  },

  /**
   * Decrypts an EncryptedData object.
   */
  async decrypt(payload: EncryptedData): Promise<string> {
    try {
      const key = await KeyManager.getEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(payload.encryptedData, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption resulted in empty payload or invalid key.');
      }
      
      return decrypted;
    } catch (err) {
      throw new EmbeddingEncryptionError('AES Decryption failed', err);
    }
  },

  /**
   * Signs a sync payload using HMAC-SHA-256.
   * Purpose: Ensures data integrity during transmission.
   */
  async signPayload(payload: any): Promise<string> {
    const key = await KeyManager.getEncryptionKey();
    const dataToSign = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return CryptoJS.HmacSHA256(dataToSign, key).toString();
  },

  /**
   * Verifies the signature of a payload.
   */
  async verifyPayload(payload: any, signature: string): Promise<boolean> {
    const expectedSignature = await this.signPayload(payload);
    return expectedSignature === signature;
  }
};
