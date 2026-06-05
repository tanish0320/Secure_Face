/**
 * SecureFace Edge AI - Security Statistics
 */

import { employeeRepository } from '../repositories/employeeRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { auditRepository } from '../repositories/auditRepository';
import { KeyManager } from './keyManager';
import { SecurityStatistics } from './securityTypes';

/**
 * Returns consolidated security subsystem statistics.
 */
export async function getSecurityStatistics(): Promise<SecurityStatistics> {
  const [totalEmployees, pendingAttendance, pendingAuditLogs, key] = await Promise.all([
    employeeRepository.countEmployees(),
    attendanceRepository.countBySyncStatus('pending'),
    auditRepository.getPending().then(logs => logs.length),
    KeyManager.getEncryptionKey()
  ]);

  return {
    encryptedEmbeddings: totalEmployees,
    activeKeyAvailable: KeyManager.validateKey(key),
    pendingAttendance,
    pendingAuditLogs
  };
}
