/**
 * SecureFace Edge AI - Security Types
 * Purpose: Centralized type definitions for the security subsystem.
 */

export interface EncryptedData {
  encryptedData: string;
  algorithm: 'AES'; // Updated to match actual CryptoJS implementation
}

/**
 * For backward compatibility with Dev2 during Phase 6 migration
 */
export type EncryptedEmbedding = EncryptedData;

export interface SecurityStatistics {
  encryptedEmbeddings: number;
  activeKeyAvailable: boolean;
  pendingAttendance: number;
  pendingAuditLogs: number;
}

export interface SecurityConfigurationStatus {
  encryptionReady: boolean;
  keyManagerReady: boolean;
  retentionReady: boolean;
  repositoriesReady: boolean;
}
