/**
 * SecureFace Edge AI - Security Audit
 * Purpose: Verification of security features and logging of findings.
 */

import { EncryptionService } from './encryptionService';
import { KeyManager } from './keyManager';
import { RetentionService } from './retentionService';

export const SecurityAudit = {
  /**
   * Runs a security audit on the local system.
   */
  async runSecurityAudit(): Promise<{ passed: boolean; findings: string[] }> {
    const findings: string[] = [];
    let encryptionWorks = false;
    let keyExists = false;

    try {
      const key = await KeyManager.getEncryptionKey();
      if (KeyManager.validateKey(key)) {
        keyExists = true;
      } else {
        findings.push('Master Key validation failed or key is too weak.');
      }
    } catch (err) {
      findings.push(`KeyManager error: ${err}`);
    }

    try {
      const testData = 'AUDIT_TEST_DATA';
      const encrypted = await EncryptionService.encrypt(testData);
      const decrypted = await EncryptionService.decrypt(encrypted);
      if (decrypted === testData) {
        encryptionWorks = true;
      } else {
        findings.push('Encryption/Decryption result mismatch.');
      }
    } catch (err) {
      findings.push(`EncryptionService error: ${err}`);
    }

    // Finding 4 Fix: Audit Capability Validation for Retention
    const retentionAvailable =
      typeof RetentionService.purgeOldAttendance === 'function' &&
      typeof RetentionService.purgeOldAuditLogs === 'function';

    if (!retentionAvailable) {
      findings.push('RetentionService purge capability unavailable.');
    }

    return {
      passed: encryptionWorks && keyExists && findings.length === 0,
      findings
    };
  }
};
