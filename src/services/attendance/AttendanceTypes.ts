/**
 * SecureFace Edge AI - Attendance Types
 */

export interface AttendanceRequest {
  employeeId: string;
  gps: string;
  recognitionScore: number;
  livenessScore: number;
}

export interface AttendanceResult {
  success: boolean;
  attendanceId: string;
  employeeId: string;
  timestamp: string;
}

export interface AttendanceStatistics {
  totalAttendance: number;
  pendingSync: number;
  syncedAttendance: number;
}
