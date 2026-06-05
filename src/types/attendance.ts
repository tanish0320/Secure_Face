/**
 * SecureFace Edge AI - Attendance Types
 */

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  timestamp: string;
  gps: string;
  recognition_score: number | null;
  liveness_score: number | null;
  sync_status: 'pending' | 'synced';
}
