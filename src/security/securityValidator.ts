/**
 * SecureFace Edge AI - Security Validator
 * Purpose: Diagnostic tool for security subsystem state.
 */

import { EncryptionService } from './encryptionService';
import { KeyManager } from './keyManager';
import { RetentionService } from './retentionService';
import { employeeRepository } from '../repositories/employeeRepository';
import { SecurityConfigurationStatus } from './securityTypes';

export const SecurityValidator = {
  /**
   * Performs a comprehensive validation of the security subsystem.
   */
  async validateSecurityConfiguration(): Promise<SecurityConfigurationStatus> {
    let encryptionReady = false;
    let keyManagerReady = false;
    let repositoriesReady = false;

    // Finding 3 Fix: Capability Validation for Retention
    const retentionReady = 
      typeof RetentionService.purgeOldAttendance === 'function' &&
      typeof RetentionService.purgeOldAuditLogs === 'function';

    try {
      const key = await KeyManager.getEncryptionKey();
      keyManagerReady = KeyManager.validateKey(key);
      
      const testData = 'SF_TEST_STRING';
      const encrypted = await EncryptionService.encrypt(testData);
      const decrypted = await EncryptionService.decrypt(encrypted);
      encryptionReady = decrypted === testData;
    } catch (err) {
      encryptionReady = false;
      keyManagerReady = false;
    }

    try {
      await employeeRepository.countEmployees();
      repositoriesReady = true;
    } catch (err) {
      repositoriesReady = false;
    }

    return {
      encryptionReady,
      keyManagerReady,
      retentionReady,
      repositoriesReady
    };
  }
};
