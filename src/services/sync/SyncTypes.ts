/**
 * SecureFace Edge AI - Sync Types
 */

import { AttendanceRecord } from '../../types/attendance';
import { AuditRecord } from '../../types/audit';

export interface SyncResult {
  success: boolean;
  uploadedAttendance: number;
  uploadedAuditLogs: number;
  failedRecords: number;
}

export interface SyncPayload {
  attendance: AttendanceRecord[];
  auditLogs: AuditRecord[];
}

export interface SyncStatistics {
  pendingAttendance: number;
  syncedAttendance: number;
  totalAttendance: number;
}

export interface SyncConfigurationStatus {
  connectivityReady: boolean;
  attendanceApiReady: boolean;
  auditApiReady: boolean;
  repositoriesReady: boolean;
}
