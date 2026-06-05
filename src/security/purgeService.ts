/**
 * SecureFace Edge AI - Purge Service
 * Purpose: Orchestrate data retention policies.
 * Responsibilities: Run periodic purges and report results.
 */

import { RetentionService } from './retentionService';
import { dbLogger } from '../database/types';

export const PurgeService = {
  /**
   * Executes the full data retention policy.
   */
  async runRetentionPolicy(): Promise<{ attendanceDeleted: number; auditDeleted: number }> {
    dbLogger('INFO', 'Data Retention Policy execution started...');
    
    try {
      const attendanceDeleted = await RetentionService.purgeOldAttendance();
      const auditDeleted = await RetentionService.purgeOldAuditLogs();

      dbLogger('INFO', `Data Retention Policy completed: ${attendanceDeleted} Attendance, ${auditDeleted} Audit logs purged.`);

      return {
        attendanceDeleted,
        auditDeleted
      };
    } catch (err) {
      dbLogger('ERROR', `Data Retention Policy execution failed: ${err}`);
      return {
        attendanceDeleted: 0,
        auditDeleted: 0
      };
    }
  }
};
