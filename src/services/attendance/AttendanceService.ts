/**
 * SecureFace Edge AI - Attendance Service
 * Purpose: Orchestrate attendance recording, validation, and telemetry.
 * Responsibilities: Request validation, Duplicate prevention, Persistence, and Auditing.
 */

import { attendanceRepository } from '../../repositories/attendanceRepository';
import { employeeRepository } from '../../repositories/employeeRepository';
import { auditRepository } from '../../repositories/auditRepository';
import { dbLogger } from '../../database/types';
import { AttendanceRecord } from '../../types/attendance';
import { AttendanceRequest, AttendanceResult, AttendanceStatistics } from './AttendanceTypes';
import { 
  AttendanceProcessingError, 
  DuplicateAttendanceError, 
  AttendanceValidationError 
} from './AttendanceErrors';
import { validateAttendanceRequest } from './AttendanceValidator';

/**
 * Simple UUID v4 generator for record IDs.
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class AttendanceService {
  /**
   * Records a new attendance entry.
   * Pipeline: Validate -> Employee Check -> Duplicate Check -> Create -> Audit -> Result.
   */
  async recordAttendance(request: AttendanceRequest): Promise<AttendanceResult> {
    const timestamp = new Date().toISOString();
    const attendanceId = generateUUID();
    let attendanceCreated = false;
    
    try {
      // 1. Validate request
      try {
        validateAttendanceRequest(request);
      } catch (err) {
        throw new AttendanceValidationError(err instanceof Error ? err.message : 'Validation failed');
      }

      // 2. Verify employee exists (Issue 1)
      const employeeExists = await employeeRepository.exists(request.employeeId);
      if (!employeeExists) {
        await this.logAudit(attendanceId, request.employeeId, 'ATTENDANCE', 'FAILURE', 'Employee does not exist', timestamp);
        dbLogger('ERROR', `Attendance Failed: ${request.employeeId} Reason: Employee does not exist`);
        throw new AttendanceValidationError(`Employee with ID ${request.employeeId} does not exist.`);
      }

      // 3. Check for duplicate attendance (5-minute rule + Race condition mitigation - Issue 2 & 4)
      const isDuplicate = await this.isDuplicateAttendance(request.employeeId, timestamp);
      if (isDuplicate) {
        await this.logAudit(attendanceId, request.employeeId, 'ATTENDANCE', 'DUPLICATE', 'Attendance already recorded within 5-minute window', timestamp);
        dbLogger('WARN', `Attendance Duplicate: ${request.employeeId}`);
        throw new DuplicateAttendanceError('Attendance already marked within the last 5 minutes.');
      }

      // 4. Double check duplicate immediately before create (Issue 4 Mitigation)
      const isDuplicateSecondCheck = await this.isDuplicateAttendance(request.employeeId, timestamp);
      if (isDuplicateSecondCheck) {
        throw new DuplicateAttendanceError('Attendance already marked within the last 5 minutes (Conflict detected).');
      }

      // 5. Create attendance entry
      // Note: Never log GPS or scores.
      await attendanceRepository.create({
        id: attendanceId,
        employee_id: request.employeeId,
        timestamp: timestamp,
        gps: request.gps,
        recognition_score: request.recognitionScore,
        liveness_score: request.livenessScore,
        sync_status: 'pending'
      });
      attendanceCreated = true;

      // 6. Create audit record (Success)
      try {
        await this.logAudit(attendanceId, request.employeeId, 'ATTENDANCE', 'SUCCESS', null, timestamp);
      } catch (auditErr) {
        // Issue 3: Manual Rollback if Audit Fails
        if (attendanceCreated) {
          await attendanceRepository.delete(attendanceId);
          dbLogger('WARN', `Attendance Rollback: Deleted orphaned record ${attendanceId} due to audit failure.`);
        }
        throw new AttendanceProcessingError('Failed to record mandatory audit log for attendance.', auditErr);
      }

      dbLogger('INFO', `Attendance Recorded: ${request.employeeId}`);

      return {
        success: true,
        attendanceId,
        employeeId: request.employeeId,
        timestamp
      };

    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      
      // Log Failure if not already logged in specific blocks
      if (!(err instanceof DuplicateAttendanceError) && !(err instanceof AttendanceValidationError) && !attendanceCreated) {
        await this.logAudit(attendanceId, request.employeeId, 'ATTENDANCE', 'FAILURE', reason, timestamp);
        dbLogger('ERROR', `Attendance Failed: ${request.employeeId} Reason: ${reason}`);
      }

      if (err instanceof AttendanceValidationError || err instanceof DuplicateAttendanceError || err instanceof AttendanceProcessingError) {
        throw err;
      }
      throw new AttendanceProcessingError(`Failed to process attendance for ${request.employeeId}`, err);
    }
  }

  /**
   * Helper to check if attendance was marked within the last 5 minutes.
   */
  private async isDuplicateAttendance(employeeId: string, currentTimestamp: string): Promise<boolean> {
    const latest = await attendanceRepository.getLatestByEmployeeId(employeeId);
    if (!latest) return false;

    const lastTime = new Date(latest.timestamp).getTime();
    const currentTime = new Date(currentTimestamp).getTime();
    const diffMinutes = (currentTime - lastTime) / (1000 * 60);

    return diffMinutes < 5;
  }

  /**
   * Helper to create audit logs without exposing sensitive data.
   */
  private async logAudit(
    attendanceId: string, 
    employeeId: string, 
    action: string, 
    status: string, 
    reason: string | null, 
    timestamp: string
  ): Promise<void> {
    await auditRepository.create({
      id: generateUUID(),
      employee_id: employeeId,
      action,
      status,
      reason: reason,
      timestamp
    });
  }

  /**
   * Retrieves an attendance record by ID.
   */
  async getAttendanceById(id: string): Promise<AttendanceRecord> {
    return attendanceRepository.findById(id);
  }

  /**
   * Lists all attendance records.
   */
  async listAttendance(): Promise<AttendanceRecord[]> {
    return attendanceRepository.getAll();
  }

  /**
   * Retrieves attendance records pending synchronization.
   */
  async getPendingAttendance(): Promise<AttendanceRecord[]> {
    return attendanceRepository.getPending();
  }

  /**
   * Retrieves attendance history for a specific employee.
   */
  async getEmployeeAttendance(employeeId: string): Promise<AttendanceRecord[]> {
    return attendanceRepository.getByEmployeeId(employeeId);
  }

  /**
   * Returns consolidated attendance statistics with consistency validation.
   */
  async getAttendanceStatistics(): Promise<AttendanceStatistics> {
    try {
      const [total, pending, synced] = await Promise.all([
        attendanceRepository.countAttendance(),
        attendanceRepository.countBySyncStatus('pending'),
        attendanceRepository.countBySyncStatus('synced')
      ]);

      // Issue 5: Statistics Validation
      if (pending + synced !== total) {
        dbLogger('WARN', 'Attendance Statistics Consistency Warning: Total count does not match status sum.');
      }

      return {
        totalAttendance: total,
        pendingSync: pending,
        syncedAttendance: synced
      };
    } catch (err) {
      dbLogger('ERROR', 'Failed to retrieve attendance statistics');
      throw new AttendanceServiceError('Could not retrieve attendance statistics', err);
    }
  }

  /**
   * Performs startup diagnostics for the attendance service.
   */
  async validateAttendanceServiceConfiguration(): Promise<{
    attendanceRepositoryReady: boolean;
    auditRepositoryReady: boolean;
    employeeRepositoryReady: boolean;
    statisticsReady: boolean;
  }> {
    let attendanceReady = false;
    let auditReady = false;
    let employeeReady = false;
    let statisticsReady = false;

    try {
      await attendanceRepository.countAttendance();
      attendanceReady = true;
    } catch (err) {
      attendanceReady = false;
    }

    try {
      await auditRepository.countAuditLogs();
      auditReady = true;
    } catch (err) {
      auditReady = false;
    }

    try {
      await employeeRepository.countEmployees();
      employeeReady = true;
    } catch (err) {
      employeeReady = false;
    }

    // Issue 6: Expand validation to status counts
    try {
      await Promise.all([
        attendanceRepository.countBySyncStatus('pending'),
        attendanceRepository.countBySyncStatus('synced')
      ]);
      statisticsReady = true;
    } catch (err) {
      statisticsReady = false;
    }

    return {
      attendanceRepositoryReady: attendanceReady,
      auditRepositoryReady: auditReady,
      employeeRepositoryReady: employeeReady,
      statisticsReady
    };
  }
}
