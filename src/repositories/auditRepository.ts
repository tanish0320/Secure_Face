/**
 * SecureFace Edge AI - Audit Repository
 */

import { getDB } from '../database/index';
import { executeTransaction } from '../database/transaction';
import { dbLogger } from '../database/types';
import { AuditRecord } from '../types/audit';
import { validateEmployeeId } from '../validation/employeeValidation';
import { validateUUID, validateTimestamp } from '../validation/commonValidation';
import { RepositoryError } from './errors';

export const auditRepository = {
  /**
   * Creates a new audit log record
   */
  async create(audit: AuditRecord): Promise<void> {
    // 1. Validation
    validateUUID(audit.id, 'id');
    if (audit.employee_id) validateEmployeeId(audit.employee_id);
    validateTimestamp(audit.timestamp, 'timestamp');

    try {
      const db = await getDB();

      await db.executeSql(
        'INSERT INTO audit_logs (id, employee_id, action, status, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [audit.id, audit.employee_id, audit.action, audit.status, audit.reason, audit.timestamp]
      );

      dbLogger('INFO', `Audit Created: ${audit.action} (${audit.status})`);
    } catch (err) {
      dbLogger('ERROR', `Audit Creation Failure: ${audit.action}`);
      throw new RepositoryError('Failed to create audit log record', err);
    }
  },

  /**
   * Retrieves all audit logs
   */
  async getAll(): Promise<AuditRecord[]> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql('SELECT * FROM audit_logs ORDER BY timestamp DESC');
      
      const records: AuditRecord[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        records.push(results.rows.item(i));
      }
      
      return records;
    } catch (err) {
      dbLogger('ERROR', 'Get All Audits Failure');
      throw new RepositoryError('Failed to retrieve all audit logs', err);
    }
  },

  /**
   * Retrieves pending (non-synced) audit logs
   */
  async getPending(): Promise<AuditRecord[]> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql(
        "SELECT * FROM audit_logs WHERE sync_status = 'pending' ORDER BY timestamp ASC"
      );
      
      const records: AuditRecord[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        records.push(results.rows.item(i));
      }
      
      return records;
    } catch (err) {
      dbLogger('ERROR', 'Get Pending Audits Failure');
      throw new RepositoryError('Failed to retrieve pending audit logs', err);
    }
  },

  /**
   * Marks multiple audit logs as synced
   */
  async markSynced(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    try {
      const db = await getDB();
      
      await executeTransaction(db, async (tx) => {
        for (const id of ids) {
          validateUUID(id, 'id');
          await tx.executeSql(
            "UPDATE audit_logs SET sync_status = 'synced' WHERE id = ?",
            [id]
          );
        }
      });

      dbLogger('INFO', `Audit Logs Synced: ${ids.length} Records`);
    } catch (err) {
      dbLogger('ERROR', `Audit Sync Failure: ${ids.length} Records`);
      throw new RepositoryError('Failed to mark audit logs as synced', err);
    }
  },

  /**
   * Retrieves audit logs for a specific employee
   */
  async getByEmployee(employeeId: string): Promise<AuditRecord[]> {
    try {
      validateEmployeeId(employeeId);
      const db = await getDB();
      const [results] = await db.executeSql(
        'SELECT * FROM audit_logs WHERE employee_id = ? ORDER BY timestamp DESC',
        [employeeId]
      );
      
      const records: AuditRecord[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        records.push(results.rows.item(i));
      }
      
      return records;
    } catch (err) {
      dbLogger('ERROR', `Get Audits Failure for Employee: ${employeeId}`);
      throw new RepositoryError(`Failed to retrieve audit logs for employee ${employeeId}`, err);
    }
  },

  /**
   * Retrieves all failed actions
   */
  async getFailures(): Promise<AuditRecord[]> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql(
        "SELECT * FROM audit_logs WHERE status = 'failure' ORDER BY timestamp DESC"
      );
      
      const records: AuditRecord[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        records.push(results.rows.item(i));
      }
      
      return records;
    } catch (err) {
      dbLogger('ERROR', 'Get Audit Failures Failure');
      throw new RepositoryError('Failed to retrieve audit failures', err);
    }
  },

  /**
   * Deletes audit logs older than a specific number of days
   */
  async deleteOldLogs(daysToKeep: number): Promise<void> {
    try {
      const db = await getDB();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffTimestamp = cutoffDate.toISOString();

      await executeTransaction(db, async (tx) => {
        await tx.executeSql(
          'DELETE FROM audit_logs WHERE timestamp < ?',
          [cutoffTimestamp]
        );
      });

      dbLogger('INFO', `Audit Logs Purged: ${daysToKeep} Days`);
    } catch (err) {
      dbLogger('ERROR', `Audit Purge Failure: ${daysToKeep} Days`);
      throw new RepositoryError('Failed to delete old audit logs', err);
    }
  },

  /**
   * Counts total number of audit logs (Testing/Validation)
   */
  async countAuditLogs(): Promise<number> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql('SELECT COUNT(*) as count FROM audit_logs');
      return results.rows.item(0).count;
    } catch (err) {
      throw new RepositoryError('Failed to count audit logs', err);
    }
  },

  /**
   * Deletes synced audit logs older than a specific cutoff date.
   */
  async deleteSyncedAuditLogsOlderThan(cutoffTimestamp: string): Promise<number> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql(
        "DELETE FROM audit_logs WHERE sync_status = 'synced' AND timestamp < ?",
        [cutoffTimestamp]
      );
      return results.rowsAffected;
    } catch (err) {
      throw new RepositoryError('Failed to purge old synced audit logs', err);
    }
  }
};
