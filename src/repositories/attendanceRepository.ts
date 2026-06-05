/**
 * SecureFace Edge AI - Attendance Repository
 */

import { getDB } from '../database/index';
import { executeTransaction } from '../database/transaction';
import { dbLogger } from '../database/types';
import { AttendanceRecord } from '../types/attendance';
import { employeeRepository } from './employeeRepository';
import { 
  validateGPS, 
  validateScore 
} from '../validation/attendanceValidation';
import { validateEmployeeId } from '../validation/employeeValidation';
import { validateUUID, validateTimestamp } from '../validation/commonValidation';
import { 
  RepositoryError, 
  DuplicateRecordError, 
  NotFoundError,
  ValidationError
} from './errors';

export const attendanceRepository = {
  /**
   * Creates a new attendance record
   */
  async create(attendance: AttendanceRecord): Promise<void> {
    // 1. Validation (Audit Requirement)
    validateUUID(attendance.id, 'id');
    validateEmployeeId(attendance.employee_id);
    validateTimestamp(attendance.timestamp, 'timestamp');
    validateGPS(attendance.gps);
    validateScore(attendance.recognition_score, 'recognition_score');
    validateScore(attendance.liveness_score, 'liveness_score');

    try {
      const db = await getDB();

      // Check for existence of record
      const [existing] = await db.executeSql('SELECT 1 FROM attendance WHERE id = ?', [attendance.id]);
      if (existing.rows.length > 0) {
        throw new DuplicateRecordError(`Attendance record with ID ${attendance.id} already exists.`);
      }

      // Check for employee existence (Referential Integrity)
      const employeeExists = await employeeRepository.exists(attendance.employee_id);
      if (!employeeExists) {
        dbLogger('WARN', `Attendance Attempt for Missing Employee: ${attendance.employee_id}`);
        throw new ValidationError(`Cannot create attendance: Employee ${attendance.employee_id} does not exist.`);
      }

      await db.executeSql(
        `INSERT INTO attendance (
          id, employee_id, timestamp, gps, recognition_score, liveness_score, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          attendance.id, 
          attendance.employee_id, 
          attendance.timestamp, 
          attendance.gps, 
          attendance.recognition_score, 
          attendance.liveness_score, 
          attendance.sync_status
        ]
      );

      dbLogger('INFO', `Attendance Created: ${attendance.id} (Employee: ${attendance.employee_id})`);
    } catch (err) {
      if (err instanceof DuplicateRecordError || err instanceof ValidationError) throw err;
      dbLogger('ERROR', `Attendance Creation Failure: ${attendance.id}`);
      throw new RepositoryError('Failed to create attendance record', err);
    }
  },

  /**
   * Retrieves all attendance records
   */
  async getAll(): Promise<AttendanceRecord[]> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql('SELECT * FROM attendance ORDER BY timestamp DESC');
      
      const records: AttendanceRecord[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        records.push(results.rows.item(i));
      }
      
      return records;
    } catch (err) {
      dbLogger('ERROR', 'Get All Attendance Failure');
      throw new RepositoryError('Failed to retrieve all attendance records', err);
    }
  },

  /**
   * Retrieves pending (non-synced) records
   */
  async getPending(): Promise<AttendanceRecord[]> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql(
        "SELECT * FROM attendance WHERE sync_status = 'pending' ORDER BY timestamp ASC"
      );
      
      const records: AttendanceRecord[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        records.push(results.rows.item(i));
      }
      
      return records;
    } catch (err) {
      dbLogger('ERROR', 'Get Pending Attendance Failure');
      throw new RepositoryError('Failed to retrieve pending attendance records', err);
    }
  },

  /**
   * Finds an attendance record by ID
   */
  async findById(id: string): Promise<AttendanceRecord> {
    try {
      validateUUID(id, 'id');
      const db = await getDB();
      const [results] = await db.executeSql(
        'SELECT * FROM attendance WHERE id = ?',
        [id]
      );

      if (results.rows.length === 0) {
        throw new NotFoundError(`Attendance record with ID ${id} not found.`);
      }

      return results.rows.item(0);
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      dbLogger('ERROR', `Attendance Find Failure: ${id}`);
      throw new RepositoryError(`Failed to find attendance record with ID ${id}`, err);
    }
  },

  /**
   * Marks multiple attendance records as synced
   */
  async markSynced(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    try {
      const db = await getDB();
      
      await executeTransaction(db, async (tx) => {
        for (const id of ids) {
          validateUUID(id, 'id');
          await tx.executeSql(
            "UPDATE attendance SET sync_status = 'synced' WHERE id = ?",
            [id]
          );
        }
      });

      dbLogger('INFO', `Attendance Synced: ${ids.length} Records`);
    } catch (err) {
      dbLogger('ERROR', `Attendance Sync Failure: ${ids.length} Records`);
      throw new RepositoryError('Failed to mark attendance records as synced', err);
    }
  },

  /**
   * Deletes an attendance record
   */
  async delete(id: string): Promise<void> {
    try {
      validateUUID(id, 'id');
      const db = await getDB();
      const exists = await this.exists(id);
      if (!exists) {
        throw new NotFoundError(`Attendance record with ID ${id} not found.`);
      }

      await db.executeSql('DELETE FROM attendance WHERE id = ?', [id]);
      dbLogger('INFO', `Attendance Deleted: ${id}`);
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      dbLogger('ERROR', `Attendance Deletion Failure: ${id}`);
      throw new RepositoryError(`Failed to delete attendance record with ID ${id}`, err);
    }
  },

  /**
   * Checks if an attendance record exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      validateUUID(id, 'id');
      const db = await getDB();
      const [results] = await db.executeSql(
        'SELECT 1 FROM attendance WHERE id = ?',
        [id]
      );
      return results.rows.length > 0;
    } catch (err) {
      throw new RepositoryError(`Error checking existence of attendance ${id}`, err);
    }
  },

  /**
   * Counts total number of attendance records (Testing/Validation)
   */
  async countAttendance(): Promise<number> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql('SELECT COUNT(*) as count FROM attendance');
      return results.rows.item(0).count;
    } catch (err) {
      throw new RepositoryError('Failed to count attendance records', err);
    }
  },

  /**
   * Counts attendance records by sync status
   */
  async countBySyncStatus(status: 'pending' | 'synced'): Promise<number> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql(
        'SELECT COUNT(*) as count FROM attendance WHERE sync_status = ?',
        [status]
      );
      return results.rows.item(0).count;
    } catch (err) {
      throw new RepositoryError(`Failed to count ${status} attendance records`, err);
    }
  },

  /**
   * Retrieves the latest attendance record for a specific employee
   */
  async getLatestByEmployeeId(employeeId: string): Promise<AttendanceRecord | null> {
    try {
      validateEmployeeId(employeeId);
      const db = await getDB();
      const [results] = await db.executeSql(
        'SELECT * FROM attendance WHERE employee_id = ? ORDER BY timestamp DESC LIMIT 1',
        [employeeId]
      );
      
      if (results.rows.length === 0) return null;
      return results.rows.item(0);
    } catch (err) {
      throw new RepositoryError(`Failed to retrieve latest attendance for employee ${employeeId}`, err);
    }
  },

  /**
   * Retrieves all attendance records for a specific employee
   */
  async getByEmployeeId(employeeId: string): Promise<AttendanceRecord[]> {
    try {
      validateEmployeeId(employeeId);
      const db = await getDB();
      const [results] = await db.executeSql(
        'SELECT * FROM attendance WHERE employee_id = ? ORDER BY timestamp DESC',
        [employeeId]
      );
      
      const records: AttendanceRecord[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        records.push(results.rows.item(i));
      }
      return records;
    } catch (err) {
      throw new RepositoryError(`Failed to retrieve attendance history for employee ${employeeId}`, err);
    }
  },

  /**
   * Deletes synced attendance records older than a specific cutoff date.
   */
  async deleteSyncedAttendanceOlderThan(cutoffTimestamp: string): Promise<number> {
    try {
      const db = await getDB();
      const [results] = await db.executeSql(
        "DELETE FROM attendance WHERE sync_status = 'synced' AND timestamp < ?",
        [cutoffTimestamp]
      );
      return results.rowsAffected;
    } catch (err) {
      throw new RepositoryError('Failed to purge old synced attendance records', err);
    }
  }
};
