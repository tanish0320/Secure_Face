/**
 * SecureFace Edge AI - Retention Service
 * Purpose: Manage data lifecycle by purging old records.
 * Responsibilities: Enforce data retention policies for attendance and audit logs.
 */

import { attendanceRepository } from '../repositories/attendanceRepository';
import { auditRepository } from '../repositories/auditRepository';
import { dbLogger } from '../database/types';

const ATTENDANCE_RETENTION_DAYS = 90;
const AUDIT_LOG_RETENTION_DAYS = 180;

export const RetentionService = {
  /**
   * Purges attendance records older than 90 days.
   * Requirement: Delete only 'synced' records.
   */
  async purgeOldAttendance(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ATTENDANCE_RETENTION_DAYS);
      const cutoffTimestamp = cutoffDate.toISOString();

      const deletedCount = await attendanceRepository.deleteSyncedAttendanceOlderThan(cutoffTimestamp);
      
      if (deletedCount > 0) {
        dbLogger('INFO', `Retention Policy: Purged ${deletedCount} synced attendance records older than ${ATTENDANCE_RETENTION_DAYS} days.`);
      }
      
      return deletedCount;
    } catch (err) {
      dbLogger('ERROR', `Retention Policy: Failed to purge old attendance records. Reason: ${err}`);
      return 0;
    }
  },

  /**
   * Purges audit logs older than 180 days.
   * Requirement: Delete only 'synced' records.
   */
  async purgeOldAuditLogs(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - AUDIT_LOG_RETENTION_DAYS);
      const cutoffTimestamp = cutoffDate.toISOString();

      const deletedCount = await auditRepository.deleteSyncedAuditLogsOlderThan(cutoffTimestamp);
      
      if (deletedCount > 0) {
        dbLogger('INFO', `Retention Policy: Purged ${deletedCount} synced audit logs older than ${AUDIT_LOG_RETENTION_DAYS} days.`);
      }
      
      return deletedCount;
    } catch (err) {
      dbLogger('ERROR', `Retention Policy: Failed to purge old audit logs. Reason: ${err}`);
      return 0;
    }
  }
};
